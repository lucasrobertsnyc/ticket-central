/**
 * Ticketmaster Discovery API v2 client.
 *
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 *
 * Required env var (add to .env.local):
 *   TICKETMASTER_API_KEY=your_consumer_key
 *
 * Free tier: 5,000 calls/day · 5 req/sec.
 * All fetches are cached 1 hour via Next.js data cache (next: { revalidate: 3600 }).
 *
 * Note: The Discovery API provides event metadata only.  Seat-level inventory
 * (listings by section/row/price) requires the Commerce API, a separate
 * paid partnership tier.  For the detail page we generate plausible demo
 * listings with generateListingsForEvent().
 */

import type { Event, TicketListing, SectionType, Platform } from "@/types/ticket";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";

// ── Raw TM API shapes (only the fields we actually read) ──────────────────────

interface TmImage {
  url: string;
  width?: number;
  height?: number;
  ratio?: string;   // "16_9" | "3_2" | "4_3"
}

interface TmClassification {
  primary?: boolean;
  segment?:  { id?: string; name?: string };
  genre?:    { id?: string; name?: string };
  subGenre?: { id?: string; name?: string };
}

interface TmEvent {
  id: string;
  name: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;   // "2026-06-14"
      localTime?: string;   // "20:00:00"
      dateTBD?: boolean;
      timeTBD?: boolean;
    };
  };
  images?: TmImage[];
  priceRanges?: { type?: string; currency?: string; min?: number; max?: number }[];
  classifications?: TmClassification[];
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?:  { name?: string };
      state?: { name?: string; stateCode?: string };
    }>;
    attractions?: Array<{
      name?: string;
      images?: TmImage[];
    }>;
  };
}

interface TmEventsResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { size?: number; totalElements?: number; totalPages?: number; number?: number };
}

// ── Genre mapping ─────────────────────────────────────────────────────────────

const GENRE_MAP: Record<string, string> = {
  // Music
  "hip-hop/rap":       "Hip-Hop",
  "hip-hop":           "Hip-Hop",
  "rap":               "Hip-Hop",
  "r&b":               "R&B",
  "soul":              "R&B",
  "pop":               "Pop",
  "rock":              "Rock",
  "alternative":       "Alternative",
  "alternative/indie": "Alternative",
  "country":           "Country",
  "latin":             "Latin",
  "latin pop":         "Latin",
  "electronic":        "Electronic",
  "dance/electronic":  "Electronic",
  "edm":               "Electronic",
  "jazz":              "Jazz",
  "blues":             "Blues",
  "classical":         "Classical",
  "metal":             "Metal",
  "reggae":            "Reggae",
  "folk":              "Folk",
  // Sports
  "football":          "NFL",
  "basketball":        "NBA",
  "hockey":            "NHL",
  "baseball":          "MLB",
  "soccer":            "Soccer",
};

function mapGenre(tm: TmEvent): string {
  const cls = (tm.classifications ?? []).find(c => c.primary) ?? tm.classifications?.[0];
  const segment  = (cls?.segment?.name  ?? "").toLowerCase();
  const genre    = (cls?.genre?.name    ?? "").toLowerCase();
  const subGenre = (cls?.subGenre?.name ?? "").toLowerCase();

  if (segment === "sports") {
    return GENRE_MAP[genre] ?? GENRE_MAP[subGenre] ?? "Sports";
  }
  return GENRE_MAP[genre] ?? GENRE_MAP[subGenre] ?? "Music";
}

// ── Image helper ──────────────────────────────────────────────────────────────

/** Prefer 16:9 wide images; fall back to widest available. */
function pickImage(images?: TmImage[]): string {
  if (!images?.length) return "";
  const pool = images.filter(i => i.ratio === "16_9").length
    ? images.filter(i => i.ratio === "16_9")
    : images;
  return pool.reduce(
    (best, img) => ((img.width ?? 0) > (best.width ?? 0) ? img : best),
    pool[0]
  ).url;
}

// ── Date / time formatters ────────────────────────────────────────────────────

function formatDate(localDate?: string, tbd?: boolean): string {
  if (tbd || !localDate) return "Date TBA";
  const [y, m, d] = localDate.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(localTime?: string, tbd?: boolean): string {
  if (tbd || !localTime) return "TBA";
  const [hStr, mStr] = localTime.split(":");
  const h = parseInt(hStr, 10);
  return `${h % 12 || 12}:${mStr} ${h >= 12 ? "PM" : "AM"}`;
}

// ── TM event → our Event type ─────────────────────────────────────────────────

function tmToEvent(tm: TmEvent): Event | null {
  try {
    const venue      = tm._embedded?.venues?.[0];
    const attraction = tm._embedded?.attractions?.[0];

    // For matchup events ("Team A vs. Team B"), use the event name so both
    // teams are visible. Strip any promotional suffix after ":" or " - ".
    // For concerts, use the attraction (artist) name which is cleaner.
    const isVsMatchup = / vs\.? /i.test(tm.name);
    const artist      = isVsMatchup
      ? tm.name.replace(/\s*[:|]\s*.+$/, "").replace(/\s+[-–]\s+[A-Z].+$/, "").trim()
      : (attraction?.name ?? tm.name);
    const venueName = venue?.name ?? "Venue TBA";
    const city      = [venue?.city?.name, venue?.state?.stateCode]
      .filter(Boolean).join(", ");

    const priceRange = tm.priceRanges?.find(p => p.type === "standard")
                    ?? tm.priceRanges?.[0];
    const lowestAllInPrice = priceRange?.min ? Math.round(priceRange.min) : 0;

    // Prefer attraction press photo; fall back to event image
    const imageUrl = pickImage(attraction?.images) || pickImage(tm.images);

    // Deterministic listing count estimate (stable across re-renders)
    const idSum = tm.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const listingCount = lowestAllInPrice > 0 ? 10 + (idSum % 21) : 0;

    return {
      id:    `tm-${tm.id}`,
      artist,
      venue:  venueName,
      city,
      date:   formatDate(tm.dates?.start?.localDate,  tm.dates?.start?.dateTBD),
      time:   formatTime(tm.dates?.start?.localTime,  tm.dates?.start?.timeTBD),
      genre:  mapGenre(tm),
      lowestAllInPrice,
      listingCount,
      imageUrl,
      url:   tm.url,
    };
  } catch {
    return null;
  }
}

// ── Synthetic listing generator ───────────────────────────────────────────────
//
// The Discovery API does not expose per-seat inventory.  We generate stable,
// deterministic demo listings so the event detail page is fully interactive.

function makePrng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return (min: number, max: number): number => {
    s = ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return min + (s % (max - min + 1));
  };
}

const ALL_PLATFORMS: Platform[] = [
  "SeatGeek", "StubHub", "Vivid Seats", "TickPick", "GameTime", "Ticketmaster", "AXS",
];

// The TM Discovery API provides one real checkout URL per event (event.url).
// Per-seat per-platform URLs require the Commerce/Exchange APIs (paid tiers).
// All Buy buttons use the direct event checkout URL so users reach a real
// purchase flow instead of a generic search page.
function platformBuyUrl(_platform: Platform, event: Event): string {
  return event.url ?? "";
}

/** Genre-based floor prices used when Ticketmaster hasn't published pricing yet. */
const GENRE_BASE: Record<string, number> = {
  NFL: 89, NBA: 69, NHL: 59, MLB: 29, MLS: 25,
  "Hip-Hop": 65, Pop: 65, Rock: 55, "R&B": 55,
  Latin: 55, Electronic: 45, Country: 50, Alternative: 40,
};

/** Returns 20-35 deterministic ticket listings for any event.
 *  Each listing's buyUrl points to that platform's search page for the event. */
export function generateListingsForEvent(event: Event): TicketListing[] {
  const seed = event.id.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const rand = makePrng(seed);

  const base = Math.max(
    event.lowestAllInPrice || GENRE_BASE[event.genre] || 55,
    25,
  );
  const isField = event.genre === "NFL" || event.genre === "MLB";
  const isCourt = event.genre === "NBA" || event.genre === "NHL";

  const zones: Array<{ type: SectionType; mult: number; prefix: string; maxRow: number }> = [
    { type: "floor",  mult: 0.95, prefix: isCourt ? "Courtside"   : isField ? "Field Level" : "Floor GA", maxRow: 5  },
    { type: "lower",  mult: 1.35, prefix: isField ? "100"          : isCourt ? "100"         : "Orch",     maxRow: 30 },
    { type: "club",   mult: 2.10, prefix: "Club",                                                           maxRow: 15 },
    { type: "upper",  mult: 0.70, prefix: isField ? "300"          : "200",                                 maxRow: 25 },
    { type: "suite",  mult: 3.20, prefix: "Suite",                                                          maxRow: 1  },
  ];

  const listings: TicketListing[] = [];
  let n = 0;

  for (const z of zones) {
    for (let i = 0; i < rand(4, 8); i++) {
      n++;
      const qty      = rand(1, 4);
      const row      = rand(1, z.maxRow);
      const secNum   = rand(1, 30);
      const platform = ALL_PLATFORMS[rand(0, ALL_PLATFORMS.length - 1)];
      const spread   = 1 + (rand(0, 70) - 35) / 100;
      const baseP    = Math.round(base * z.mult * spread);
      const fees     = Math.round(baseP * (0.18 + rand(0, 8) / 100));
      const tax      = Math.round(baseP * 0.08);

      listings.push({
        id:          `${event.id}-l${n}`,
        platform,
        section:     `${z.prefix} ${secNum}`,
        sectionType: z.type,
        row:         `Row ${row}`,
        quantity:    qty,
        basePrice:   baseP,
        fees,
        tax,
        allInTotal:  baseP + fees + tax,
        buyUrl:      platformBuyUrl(platform, event),
      });
    }
  }

  return listings.sort((a, b) => a.allInTotal - b.allInTotal);
}

/**
 * For events where Ticketmaster hasn't published a price yet (lowestAllInPrice === 0),
 * compute the realistic starting price by generating the listings and taking the minimum.
 * This keeps the homepage card consistent with what's shown on the detail page.
 */
export function inferStartingPrice(event: Event): number {
  if (event.lowestAllInPrice > 0) return event.lowestAllInPrice;
  const listings = generateListingsForEvent(event);
  return listings.length > 0 ? listings[0].allInTotal : 0;
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

interface FetchOpts {
  classificationName?: string;
  latlong?: string;
  size?: number;
}

async function fetchEvents(opts: FetchOpts): Promise<TmEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];

  const now   = new Date();
  const start = now.toISOString().slice(0, 16) + ":00Z";
  const end   = new Date(now.getTime() + 180 * 86_400_000)
                  .toISOString().slice(0, 16) + ":00Z";

  const params = new URLSearchParams({
    apikey:        apiKey,
    countryCode:   "US",
    sort:          "date,asc",
    size:          String(opts.size ?? 20),
    startDateTime: start,
    endDateTime:   end,
  });
  if (opts.classificationName) params.set("classificationName", opts.classificationName);
  if (opts.latlong) {
    params.set("latlong", opts.latlong);
    params.set("radius", "50");
    params.set("unit", "miles");
  }

  try {
    const res = await fetch(`${TM_BASE}/events.json?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error("[Ticketmaster] fetch failed:", res.status, await res.text().then(t => t.slice(0, 200)));
      return [];
    }
    const data: TmEventsResponse = await res.json();
    return data._embedded?.events ?? [];
  } catch (err) {
    console.error("[Ticketmaster] fetch threw:", err);
    return [];
  }
}

// Major US cities — coordinates for 50-mile radius search
const CITIES = [
  "40.7128,-74.0060",    // New York
  "34.0522,-118.2437",   // Los Angeles
  "41.8781,-87.6298",    // Chicago
  "25.7617,-80.1918",    // Miami
  "36.1699,-115.1398",   // Las Vegas
  "33.7490,-84.3880",    // Atlanta
  "32.7767,-96.7970",    // Dallas
  "47.6062,-122.3321",   // Seattle
  "42.3601,-71.0589",    // Boston
  "36.1627,-86.7816",    // Nashville
];

// ── Event quality filters ─────────────────────────────────────────────────────

// Titles matching these patterns are stadium tours / experiences / non-games
const TOUR_RE = /\b(tours?|pregame|ballpark\s+tour|stadium\s+tour|vip\s+tour|batting\s+practice|field\s+experience|wrestling|midget|showcase|comedy\s+night)\b/i;

// All sport genres — every sport event must have an identifiable opponent
const PRO_SPORT_GENRES = new Set(["NFL", "NBA", "MLB", "NHL", "MLS", "Sports"]);

/**
 * Returns true if the event is a real, bookable game/show — not a stadium
 * tour, experience package, or a pro-sport listing without an opponent.
 */
function isRealEvent(event: Event): boolean {
  // Remove tour / experience / non-game events
  if (TOUR_RE.test(event.artist)) return false;

  // For pro sports, require a matchup ("Team A vs Team B" / "Team A at Team B")
  // Single-team listings like "New York Yankees" are season packages, not games
  if (PRO_SPORT_GENRES.has(event.genre)) {
    return / vs\.? | at /i.test(event.artist);
  }

  return true;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches ~100 upcoming events from 10 major US cities (music + sports).
 * Returns [] when TICKETMASTER_API_KEY is not set or the API is unreachable.
 */
export async function getTicketmasterEvents(): Promise<Event[]> {
  if (!process.env.TICKETMASTER_API_KEY) {
    console.info("[Ticketmaster] API key not set — falling back to mock data.");
    return [];
  }

  // Parallel: music from top 5 cities + sports from all 10 cities
  const [musicBatches, sportsBatches] = await Promise.all([
    Promise.all(CITIES.slice(0, 5).map(ll =>
      fetchEvents({ latlong: ll, classificationName: "music", size: 12 })
    )),
    Promise.all(CITIES.map(ll =>
      fetchEvents({ latlong: ll, classificationName: "sports", size: 15 })
    )),
  ]);

  // Flatten + deduplicate by TM id
  const all  = [...musicBatches.flat(), ...sportsBatches.flat()];
  const seen = new Set<string>();
  const unique = all.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const events = unique
    .map(tmToEvent)
    .filter((e): e is Event => e !== null)
    .filter(isRealEvent)
    // Fill in missing prices so the homepage never shows "Check tickets"
    .map(e => e.lowestAllInPrice > 0 ? e : { ...e, lowestAllInPrice: inferStartingPrice(e) });

  // Sort chronologically (Date TBA goes last)
  events.sort((a, b) => {
    if (a.date === "Date TBA") return 1;
    if (b.date === "Date TBA") return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return events;
}

/**
 * Fetches a single event by its app id (format: "tm-{ticketmasterId}").
 * Returns null when not found or when the API key is absent.
 */
export async function getTicketmasterEvent(appId: string): Promise<Event | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || !appId.startsWith("tm-")) return null;

  const tmId = appId.slice(3);
  try {
    const params = new URLSearchParams({ apikey: apiKey });
    const res = await fetch(`${TM_BASE}/events/${tmId}.json?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const tm: TmEvent = await res.json();
    return tmToEvent(tm);
  } catch {
    return null;
  }
}
