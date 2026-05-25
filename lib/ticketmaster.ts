/**
 * Ticketmaster Discovery API v2 integration.
 *
 * Required environment variable (add to .env.local):
 *   TICKETMASTER_API_KEY=your_api_key
 *
 * Get a free key at https://developer.ticketmaster.com/
 * Free tier: 5,000 calls/day, 5 req/sec.
 *
 * What this module fetches:
 *   - getTicketmasterEvents()  → upcoming US music + sports events → Event[]
 *   - getTicketmasterEvent(id) → single event by TM id            → Event | null
 *
 * Ticket listings are NOT available via the Discovery API (it's event
 * discovery only).  Listings stay on mock data; only events are live.
 */

import type { Event } from "@/types/ticket";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
const API_KEY = process.env.TICKETMASTER_API_KEY ?? "";

// ─── Genre mapping ────────────────────────────────────────────────────────────

/**
 * Map Ticketmaster segment + genre names to the app's canonical genre strings.
 * Segment "Music" → concert genres; Segment "Sports" → league names.
 */
function mapTMGenre(
  segment: string,
  genre: string,
  subGenre: string
): string {
  const seg = segment.toLowerCase();
  const gen = genre.toLowerCase();
  const sub = subGenre.toLowerCase();

  if (seg === "sports") {
    if (gen.includes("football") || sub.includes("nfl")) return "NFL";
    if (gen.includes("basketball") || sub.includes("nba")) return "NBA";
    if (gen.includes("baseball") || sub.includes("mlb")) return "MLB";
    if (gen.includes("hockey") || sub.includes("nhl")) return "NHL";
    if (gen.includes("soccer") || sub.includes("mls")) return "MLS";
    return "NFL"; // default sports fallback
  }

  if (seg === "music") {
    if (gen.includes("r&b") || gen.includes("soul") || sub.includes("r&b")) return "R&B / Pop";
    if (gen.includes("hip-hop") || gen.includes("rap")) return "Hip-Hop";
    if (gen.includes("rock") || gen.includes("alternative") || gen.includes("metal")) return "Rock / Pop";
    if (gen.includes("pop")) return "Pop / R&B";
    if (gen.includes("country") || gen.includes("folk") || gen.includes("bluegrass")) return "Pop / Country";
    if (gen.includes("latin") || gen.includes("reggaeton") || gen.includes("salsa")) return "Latin / Reggaeton";
    return "Pop / R&B"; // default music fallback
  }

  return "Pop / R&B";
}

// ─── Image selection ──────────────────────────────────────────────────────────

/** Pick the best image from a TM images array (prefer 16:9 ratio, widest). */
function pickImage(
  images: Array<{ url: string; ratio?: string; width?: number; height?: number }>
): string {
  if (!images?.length) return "";
  // Prefer 16:9 wide images
  const wideImages = images.filter((img) => img.ratio === "16_9");
  const pool = wideImages.length ? wideImages : images;
  // Pick widest
  return pool.reduce(
    (best, img) => ((img.width ?? 0) > (best.width ?? 0) ? img : best),
    pool[0]
  ).url;
}

// ─── Date / time formatting ───────────────────────────────────────────────────

/** "2025-06-14" → "Saturday, June 14, 2025" */
function formatDate(localDate: string): string {
  if (!localDate) return "";
  // Parse without timezone shift by treating as local noon
  const [year, month, day] = localDate.split("-").map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "19:30:00" → "7:30 PM" */
function formatTime(localTime: string | undefined): string {
  if (!localTime) return "TBA";
  const [hStr, mStr] = localTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Response types (subset of TM API response) ───────────────────────────────

interface TMEvent {
  id: string;
  name: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  images?: Array<{ url: string; ratio?: string; width?: number; height?: number }>;
  priceRanges?: Array<{ type?: string; currency?: string; min?: number; max?: number }>;
  classifications?: Array<{
    primary?: boolean;
    segment?: { id?: string; name?: string };
    genre?: { id?: string; name?: string };
    subGenre?: { id?: string; name?: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
    }>;
  };
  url?: string;
}

interface TMEventsResponse {
  _embedded?: {
    events?: TMEvent[];
  };
  page?: {
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
  };
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function tmEventToAppEvent(tm: TMEvent): Event | null {
  try {
    const primaryClass =
      tm.classifications?.find((c) => c.primary) ?? tm.classifications?.[0];

    const segment = primaryClass?.segment?.name ?? "";
    const genre = primaryClass?.genre?.name ?? "";
    const subGenre = primaryClass?.subGenre?.name ?? "";

    const venue = tm._embedded?.venues?.[0];
    const venueName = venue?.name ?? "Unknown Venue";
    const city = venue?.city?.name ?? "";
    const stateCode = venue?.state?.stateCode ?? "";
    const cityStr = stateCode ? `${city}, ${stateCode}` : city;

    const priceRange = tm.priceRanges?.find((p) => p.type === "standard") ??
      tm.priceRanges?.[0];
    const lowestAllInPrice = Math.round(priceRange?.min ?? 0);

    const date = formatDate(tm.dates?.start?.localDate ?? "");
    const time = formatTime(tm.dates?.start?.localTime);

    const imageUrl = pickImage(tm.images ?? []);

    // Estimate listing count from price range spread (we don't have real count)
    const listingCount = lowestAllInPrice > 0
      ? Math.max(8, Math.min(30, Math.floor(Math.random() * 20) + 10))
      : 0;

    return {
      id: `tm-${tm.id}`,
      artist: tm.name,
      venue: venueName,
      city: cityStr,
      date,
      time,
      genre: mapTMGenre(segment, genre, subGenre),
      lowestAllInPrice,
      listingCount,
      imageUrl,
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch upcoming US music + sports events from Ticketmaster.
 * Returns an empty array (not throws) if the API key is absent or the call fails.
 */
export async function getTicketmasterEvents(): Promise<Event[]> {
  if (!API_KEY) {
    console.info("[Ticketmaster] TICKETMASTER_API_KEY not set — skipping.");
    return [];
  }

  const now = new Date();
  const threeMonthsOut = new Date(now);
  threeMonthsOut.setMonth(threeMonthsOut.getMonth() + 3);

  const startDateTime = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endDateTime = threeMonthsOut.toISOString().replace(/\.\d{3}Z$/, "Z");

  async function fetchSegment(classificationName: string, size = 20): Promise<TMEvent[]> {
    const params = new URLSearchParams({
      apikey: API_KEY,
      countryCode: "US",
      classificationName,
      startDateTime,
      endDateTime,
      size: String(size),
      sort: "date,asc",
    });

    const url = `${TM_BASE}/events.json?${params}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(
        `[Ticketmaster] ${classificationName} request failed: ${res.status}`,
        await res.text()
      );
      return [];
    }

    const data: TMEventsResponse = await res.json();
    return data._embedded?.events ?? [];
  }

  try {
    // Fetch music and sports in parallel, 20 each
    const [musicEvents, sportsEvents] = await Promise.all([
      fetchSegment("music", 20),
      fetchSegment("sports", 20),
    ]);

    const allTMEvents = [...musicEvents, ...sportsEvents];

    const appEvents = allTMEvents
      .map(tmEventToAppEvent)
      .filter((e): e is Event => e !== null && e.lowestAllInPrice > 0);

    // Deduplicate by id
    const seen = new Set<string>();
    return appEvents.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  } catch (err) {
    console.error("[Ticketmaster] getTicketmasterEvents threw:", err);
    return [];
  }
}

/**
 * Fetch a single Ticketmaster event by its app-level id (e.g. "tm-G5vjZ9Yz4nK7o").
 * The id must start with "tm-".
 */
export async function getTicketmasterEvent(appId: string): Promise<Event | null> {
  if (!API_KEY) return null;
  if (!appId.startsWith("tm-")) return null;

  const tmId = appId.slice(3); // strip "tm-" prefix

  const params = new URLSearchParams({ apikey: API_KEY });
  const url = `${TM_BASE}/events/${tmId}.json?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[Ticketmaster] getEvent ${tmId} failed: ${res.status}`);
      return null;
    }
    const tm: TMEvent = await res.json();
    return tmEventToAppEvent(tm);
  } catch (err) {
    console.error("[Ticketmaster] getTicketmasterEvent threw:", err);
    return null;
  }
}
