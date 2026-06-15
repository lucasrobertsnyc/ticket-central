import { NextResponse } from "next/server";
import type { Event } from "@/types/ticket";

const TN_API = "https://www.tn-apis.com/catalog/v2/events/search";
const TN_CONSUMER_KEY = "fuTwxN_M6RKMaobcsfJ5qSvcVAUa";
const TN_WEBSITE_CONFIG = "12498";
const TN_AFFILIATE_BASE = "http://TicketNetwork.7eer.net/c/7341108/133430/2322?u=";

// TN category path prefixes (discovered from API responses)
// defaultCategory/path is filterable via startswith(); ancestor names are not.
const CATEGORY_PATH_MAP: Record<string, string> = {
  concerts: ".1859.1986.",      // CONCERTS root (music + comedy)
  sports:   ".1859.1988.",      // SPORTS root
  theatre:  ".1859.1989.",      // THEATRE root (includes family theatre)
  comedy:   ".1859.1986.1872.", // COMEDY sub-category under CONCERTS
  other:    ".1859.1987.",      // OTHER root (shows, Las Vegas, circus, exhibits)
};

function sanitizeString(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, "")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
}

function buildTnEventUrl(ev: TnEvent): string {
  const dateParts = (ev.date.text.date ?? "").replace(/,/g, "").split(" ");
  const dow3 = (dateParts[0] ?? "").substring(0, 3);
  const mon3 = (dateParts[1] ?? "").substring(0, 3);
  const day  = dateParts[2] ?? "";
  const year = dateParts[3] ?? "";
  const slug = sanitizeString(
    `${ev.text.name}-tickets-${dow3}-${mon3}-${day}-${year}-${ev.venue?.text?.name ?? ""}`
  );
  return `https://www.ticketnetwork.com/tickets/${ev.id}/${slug}`;
}

function mapGenre(ev: TnEvent): string {
  const leafName = ev.defaultCategory?.text?.name ?? "";
  const rootName = ev.defaultCategory?.ancestors?.[0]?.text?.name ?? "";
  const c = (rootName + " " + leafName).toUpperCase();

  if (c.includes("WNBA"))                                         return "WNBA";
  if (c.includes("NBA") || (c.includes("BASKETBALL") && !c.includes("COLLEGE"))) return "NBA";
  if (c.includes("NFL") || (c.includes("FOOTBALL") && !c.includes("COLLEGE")))   return "NFL";
  if (c.includes("MLB") || (c.includes("BASEBALL") && !c.includes("MINOR")))     return "MLB";
  if (c.includes("MINOR LEAGUE") || c.includes("MILB"))           return "MiLB";
  if (c.includes("NHL") || (c.includes("HOCKEY") && !c.includes("AHL")))         return "NHL";
  if (c.includes("AHL"))                                          return "AHL";
  if (c.includes("MLS") || c.includes("SOCCER"))                  return "Soccer";
  if (c.includes("COLLEGE FOOTBALL"))                             return "NCAAF";
  if (c.includes("COLLEGE BASKETBALL"))                           return "NCAAB";
  if (c.includes("GOLF"))                                         return "Golf";
  if (c.includes("TENNIS"))                                       return "Tennis";
  if (c.includes("BOXING") || c.includes("UFC") || c.includes("MMA")) return "Fighting";
  if (c.includes("MOTOR") || c.includes("NASCAR"))               return "Motorsports";
  if (c.includes("COMEDY"))                                       return "Comedy";
  if (c.includes("JAZZ") || c.includes("BLUES"))                 return "Jazz / Blues";
  if (c.includes("ALTERNATIVE"))                                  return "Alternative";
  if (c.includes("HIP HOP") || c.includes("RAP"))                return "Hip-Hop";
  if (c.includes("COUNTRY"))                                      return "Country";
  if (c.includes("R&B"))                                          return "R&B";
  if (c.includes("THEATRE") || c.includes("BROADWAY"))           return "Theater";
  if (c.includes("CONCERTS") || c.includes("CONCERT") || c.includes("TOUR")) return "Music";
  if (c.includes("FAMILY"))                                       return "Family";
  if (c.includes("LAS VEGAS") || c.includes("CIRCUS") || c.includes("CIRQUE")) return "Shows";
  return leafName || rootName || "Other";
}

interface TnEvent {
  id: number;
  text: { name: string };
  date: { text: { date: string; time: string } };
  venue?: { text: { name: string } };
  city?: { text: { name: string } };
  stateProvince?: { text: { abbr: string } };
  performers?: { name: string; role: string }[];
  pricingInfo?: { lowPrice?: { value: number } };
  defaultCategory?: {
    text: { name: string };
    ancestors?: { text: { name: string } }[];
  };
  _metadata?: { ticketCount: number };
}

function tnToEvent(ev: TnEvent): Event {
  const headliner = ev.performers?.find((p) => p.role === "Headliner") ?? ev.performers?.[0];
  const artist = headliner?.name ?? ev.text.name.split(" (")[0].trim();
  const city  = ev.city?.text?.name ?? "";
  const state = ev.stateProvince?.text?.abbr ?? "";
  const genre = mapGenre(ev);
  const lowPrice = ev.pricingInfo?.lowPrice?.value ?? 0;
  const tnUrl = buildTnEventUrl(ev);

  return {
    id: `tn-${ev.id}`,
    artist,
    venue: ev.venue?.text?.name ?? "",
    city: state ? `${city}, ${state}` : city,
    date: ev.date.text.date,
    time: ev.date.text.time,
    genre,
    imageUrl: "",
    lowestAllInPrice: Math.round(lowPrice),
    listingCount: ev._metadata?.ticketCount ?? 0,
    url: TN_AFFILIATE_BASE + encodeURIComponent(tnUrl),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page     = searchParams.get("page") ?? "1";
  const category = searchParams.get("category") ?? "";   // "concerts" | "sports" | "theatre" | "comedy" | "other"
  const city     = searchParams.get("city") ?? "";       // e.g. "New York"
  const q        = searchParams.get("q") ?? "*";

  // Build OData filter clauses
  const clauses: string[] = ["_metadata/hasTickets eq true", "date/date le 2028-06-15"];

  if (category && CATEGORY_PATH_MAP[category]) {
    clauses.push(`startswith(defaultCategory/path, '${CATEGORY_PATH_MAP[category]}')`);
  }

  if (city) {
    const [cityName] = city.split(",");
    clauses.push(`city/text/name eq '${cityName.trim()}'`);
  }

  const url = new URL(TN_API);
  url.searchParams.set("q", q === "*" ? "*" : q);
  url.searchParams.set("filter", clauses.join(" and "));
  url.searchParams.set("includeFacets", "true");
  url.searchParams.set("consumerKey", TN_CONSUMER_KEY);
  url.searchParams.set("websiteConfigId", TN_WEBSITE_CONFIG);
  url.searchParams.set("perPage", "20");
  url.searchParams.set("page", page);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    return NextResponse.json({ error: "TN API unavailable" }, { status: 502 });
  }

  const data = await res.json();
  const events: Event[] = (data.results as TnEvent[]).map(tnToEvent);

  // Extract top cities from facets for the city filter dropdown
  const cityFacet = (data.facets as { fieldName: string; values: { value: string; count: number }[] }[])
    ?.find((f) => f.fieldName === "city_and_state");
  const topCities = cityFacet?.values.slice(0, 15).map((v) => v.value) ?? [];

  return NextResponse.json({
    events,
    totalCount: data.totalCount as number,
    page: data.page as number,
    topCities,
  });
}
