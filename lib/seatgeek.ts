/**
 * SeatGeek Platform API v2 integration.
 *
 * Required environment variable (add to .env.local):
 *   SEATGEEK_CLIENT_ID=your_client_id
 *
 * Optional (increases rate limits when present):
 *   SEATGEEK_CLIENT_SECRET=your_client_secret
 *
 * Get free credentials at https://seatgeek.com/build (platform.seatgeek.com)
 *
 * What this module fetches:
 *   - getSeatGeekEvents()  → upcoming US music + sports events → Event[]
 *   - getSeatGeekEvent(id) → single event by SG id            → Event | null
 *
 * NOTE: The SeatGeek API does NOT expose individual ticket listings.
 *       stats.lowest_price and stats.listing_count are summary stats only.
 *       Detailed per-listing data stays on mock data.
 */

import type { Event } from "@/types/ticket";

const SG_BASE = "https://api.seatgeek.com/2";
const CLIENT_ID = process.env.SEATGEEK_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SEATGEEK_CLIENT_SECRET ?? "";

// ─── Genre mapping ────────────────────────────────────────────────────────────

/**
 * Map SeatGeek taxonomy slug/name to the app's canonical genre strings.
 * SeatGeek taxonomies: "concert", "sports", and sub-types like "nfl", "nba", etc.
 */
function mapSGGenre(taxonomies: SGTaxonomy[], type: string): string {
  // Check taxonomy names/slugs first (most specific)
  for (const tax of taxonomies) {
    const name = (tax.name ?? "").toLowerCase();
    const slug = (tax.slug ?? "").toLowerCase();

    if (name === "nfl" || slug === "nfl" || name.includes("american football")) return "NFL";
    if (name === "nba" || slug === "nba" || name.includes("basketball")) return "NBA";
    if (name === "mlb" || slug === "mlb" || name.includes("baseball")) return "MLB";
    if (name === "nhl" || slug === "nhl" || name.includes("hockey")) return "NHL";
    if (name === "mls" || slug === "mls" || name.includes("soccer")) return "MLS";

    if (name.includes("r&b") || name.includes("soul")) return "R&B / Pop";
    if (name.includes("hip hop") || name.includes("hip-hop") || name.includes("rap")) return "Hip-Hop";
    if (name.includes("rock") || name.includes("alternative") || name.includes("metal")) return "Rock / Pop";
    if (name.includes("country") || name.includes("folk")) return "Pop / Country";
    if (name.includes("latin") || name.includes("reggaeton")) return "Latin / Reggaeton";
    if (name.includes("pop")) return "Pop / R&B";
  }

  // Fall back to the top-level event type
  const t = type.toLowerCase();
  if (t === "nfl") return "NFL";
  if (t === "nba") return "NBA";
  if (t === "mlb") return "MLB";
  if (t === "nhl") return "NHL";
  if (t === "mls") return "MLS";
  if (t === "concert") return "Pop / R&B";

  return "Pop / R&B";
}

// ─── Date / time formatting ───────────────────────────────────────────────────

/** "2025-06-14T19:30:00" → "Saturday, June 14, 2025" */
function formatDate(datetimeLocal: string): string {
  if (!datetimeLocal) return "";
  // datetimeLocal is already in venue-local time; parse only the date part
  const datePart = datetimeLocal.slice(0, 10); // "YYYY-MM-DD"
  const [year, month, day] = datePart.split("-").map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "2025-06-14T19:30:00" → "7:30 PM" */
function formatTime(datetimeLocal: string): string {
  if (!datetimeLocal) return "TBA";
  const timePart = datetimeLocal.slice(11, 16); // "HH:MM"
  if (!timePart || timePart === "00:00") return "TBA";
  const [hStr, mStr] = timePart.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Response types (subset of SeatGeek API response) ────────────────────────

interface SGTaxonomy {
  id?: number;
  name?: string;
  slug?: string;
  parent_id?: number | null;
}

interface SGPerformer {
  id?: number;
  name?: string;
  slug?: string;
  type?: string;
  image?: string;
  images?: { huge?: string; large?: string; [key: string]: string | undefined };
  taxonomies?: SGTaxonomy[];
}

interface SGVenue {
  id?: number;
  name?: string;
  city?: string;
  state?: string;
  state_prov?: string;
  country?: string;
}

interface SGEvent {
  id: number;
  title: string;
  short_title?: string;
  datetime_local?: string;
  datetime_utc?: string;
  type?: string;
  url?: string;
  taxonomies?: SGTaxonomy[];
  performers?: SGPerformer[];
  venue?: SGVenue;
  stats?: {
    lowest_price?: number | null;
    average_price?: number | null;
    listing_count?: number | null;
  };
  score?: number;
}

interface SGEventsResponse {
  events: SGEvent[];
  meta: {
    total: number;
    took: number;
    page: number;
    per_page: number;
    geolocation?: unknown;
  };
}

// ─── Performer image ──────────────────────────────────────────────────────────

function getPerformerImage(performers: SGPerformer[]): string {
  if (!performers?.length) return "";
  const p = performers[0];
  return (
    p.images?.huge ??
    p.images?.large ??
    p.image ??
    ""
  );
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function sgEventToAppEvent(sg: SGEvent): Event | null {
  try {
    const lowestPrice = sg.stats?.lowest_price ?? 0;
    if (lowestPrice <= 0) return null;

    const venue = sg.venue;
    const venueName = venue?.name ?? "Unknown Venue";
    const city = venue?.city ?? "";
    const stateCode = venue?.state ?? venue?.state_prov ?? "";
    const cityStr = stateCode ? `${city}, ${stateCode}` : city;

    const date = formatDate(sg.datetime_local ?? "");
    const time = formatTime(sg.datetime_local ?? "");

    const genre = mapSGGenre(sg.taxonomies ?? [], sg.type ?? "");
    const imageUrl = getPerformerImage(sg.performers ?? []);

    const listingCount = sg.stats?.listing_count ?? 0;

    return {
      id: `sg-${sg.id}`,
      artist: sg.short_title ?? sg.title,
      venue: venueName,
      city: cityStr,
      date,
      time,
      genre,
      lowestAllInPrice: Math.round(lowestPrice),
      listingCount,
      imageUrl,
      url: sg.url,
    };
  } catch {
    return null;
  }
}

// ─── Auth params helper ───────────────────────────────────────────────────────

function authParams(): Record<string, string> {
  const p: Record<string, string> = { client_id: CLIENT_ID };
  if (CLIENT_SECRET) p.client_secret = CLIENT_SECRET;
  return p;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch upcoming US music + sports events from SeatGeek.
 * Returns an empty array (not throws) if the API key is absent or call fails.
 */
export async function getSeatGeekEvents(): Promise<Event[]> {
  if (!CLIENT_ID) {
    console.info("[SeatGeek] SEATGEEK_CLIENT_ID not set — skipping.");
    return [];
  }

  const now = new Date();
  const threeMonthsOut = new Date(now);
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  // Format as "YYYY-MM-DDTHH:MM:SS" (SeatGeek uses this format without Z)
  const dateFrom = now.toISOString().slice(0, 19);
  const dateTo = threeMonthsOut.toISOString().slice(0, 19);

  async function fetchType(type: string, perPage = 20): Promise<SGEvent[]> {
    const params = new URLSearchParams({
      ...authParams(),
      type,
      "venue.country": "US",
      datetime_local_gte: dateFrom,
      datetime_local_lte: dateTo,
      per_page: String(perPage),
      sort: "datetime_local.asc",
    });

    const url = `${SG_BASE}/events?${params}`;

    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      console.error(
        `[SeatGeek] type=${type} request failed: ${res.status}`,
        await res.text()
      );
      return [];
    }

    const data: SGEventsResponse = await res.json();
    return data.events ?? [];
  }

  try {
    // Fetch concerts and sports in parallel
    const [concertEvents, sportsEvents] = await Promise.all([
      fetchType("concert", 20),
      fetchType("sports", 20),
    ]);

    const all = [...concertEvents, ...sportsEvents];

    const appEvents = all
      .map(sgEventToAppEvent)
      .filter((e): e is Event => e !== null);

    // Deduplicate by id
    const seen = new Set<string>();
    return appEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  } catch (err) {
    console.error("[SeatGeek] getSeatGeekEvents threw:", err);
    return [];
  }
}

/**
 * Fetch a single SeatGeek event by its app-level id (e.g. "sg-5555555").
 * The id must start with "sg-".
 */
export async function getSeatGeekEvent(appId: string): Promise<Event | null> {
  if (!CLIENT_ID) return null;
  if (!appId.startsWith("sg-")) return null;

  const sgId = appId.slice(3); // strip "sg-" prefix

  const params = new URLSearchParams(authParams());
  const url = `${SG_BASE}/events/${sgId}?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[SeatGeek] getEvent ${sgId} failed: ${res.status}`);
      return null;
    }
    const sg: SGEvent = await res.json();
    return sgEventToAppEvent(sg);
  } catch (err) {
    console.error("[SeatGeek] getSeatGeekEvent threw:", err);
    return null;
  }
}
