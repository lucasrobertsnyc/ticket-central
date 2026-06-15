import { NextResponse } from "next/server";
import type { Event } from "@/types/ticket";

const TN_API = "https://www.tn-apis.com/catalog/v2/events/search";
const TN_CONSUMER_KEY = "fuTwxN_M6RKMaobcsfJ5qSvcVAUa";
const TN_WEBSITE_CONFIG = "12498";
const TN_AFFILIATE_BASE = "http://TicketNetwork.7eer.net/c/7341108/133430/2322?u=";

function mapGenre(categoryName: string): string {
  const c = categoryName.toUpperCase();
  if (c.includes("WNBA"))                             return "WNBA";
  if (c.includes("NBA") || c.includes("BASKETBALL"))  return "NBA";
  if (c.includes("NFL") || (c.includes("FOOTBALL") && !c.includes("COLLEGE"))) return "NFL";
  if (c.includes("MLB") || (c.includes("BASEBALL") && !c.includes("MINOR")))   return "MLB";
  if (c.includes("MINOR LEAGUE") || c.includes("MILB")) return "MiLB";
  if (c.includes("NHL") || (c.includes("HOCKEY") && !c.includes("AHL")))       return "NHL";
  if (c.includes("AHL"))                              return "AHL";
  if (c.includes("MLS") || c.includes("SOCCER"))     return "Soccer";
  if (c.includes("COLLEGE FOOTBALL"))                 return "NCAAF";
  if (c.includes("COLLEGE BASKETBALL"))               return "NCAAB";
  if (c.includes("CONCERT") || c.includes("TOUR"))   return "Music";
  if (c.includes("ROCK"))                             return "Rock";
  if (c.includes("POP"))                              return "Pop";
  if (c.includes("HIP HOP") || c.includes("RAP"))    return "Hip-Hop";
  if (c.includes("COUNTRY"))                          return "Country";
  if (c.includes("R&B"))                              return "R&B";
  if (c.includes("COMEDY"))                           return "Comedy";
  if (c.includes("THEATER") || c.includes("BROADWAY")) return "Theater";
  if (c.includes("FAMILY"))                           return "Family";
  if (c.includes("GOLF"))                             return "Golf";
  if (c.includes("TENNIS"))                           return "Tennis";
  if (c.includes("BOXING") || c.includes("UFC") || c.includes("MMA")) return "Fighting";
  if (c.includes("MOTOR") || c.includes("NASCAR"))   return "Motorsports";
  return categoryName; // preserve original label for anything else
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
  defaultCategory?: { text: { name: string } };
  _metadata?: { ticketCount: number };
  uriComponent?: string;
}

function tnToEvent(ev: TnEvent): Event {
  const headliner = ev.performers?.find((p) => p.role === "Headliner") ?? ev.performers?.[0];
  const artist = headliner?.name ?? ev.text.name.split(" (")[0].trim();
  const city = ev.city?.text?.name ?? "";
  const state = ev.stateProvince?.text?.abbr ?? "";
  const genre = mapGenre(ev.defaultCategory?.text?.name ?? "Other");
  const lowPrice = ev.pricingInfo?.lowPrice?.value ?? 0;
  const tnUrl = `https://www.ticketnetwork.com/tickets/${ev.uriComponent ?? ev.id}`;
  const buyUrl = TN_AFFILIATE_BASE + encodeURIComponent(tnUrl);

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
    url: buyUrl,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";

  const url = new URL(TN_API);
  url.searchParams.set("q", "*");
  url.searchParams.set("filter", "_metadata/hasTickets eq true and date/date le 2028-06-15");
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

  return NextResponse.json({
    events,
    totalCount: data.totalCount as number,
    page: data.page as number,
  });
}
