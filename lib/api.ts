/**
 * Data-access layer for events and ticket listings.
 *
 * Live data sources (when API keys are present in .env.local):
 *   - Ticketmaster Discovery API  → TICKETMASTER_API_KEY
 *   - SeatGeek Platform API       → SEATGEEK_CLIENT_ID (+ optional SEATGEEK_CLIENT_SECRET)
 *
 * Artist images are automatically upgraded to real Spotify photos when
 * SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are present in .env.local.
 *
 * Fallback:
 *   When no API keys are set, or when all live fetches return empty, the app
 *   falls back to MOCK_EVENTS / MOCK_LISTINGS from data/tickets.ts so the UI
 *   always has data to render.
 */

import { MOCK_EVENTS, MOCK_LISTINGS } from "@/data/tickets";
import type { Event, TicketListing } from "@/types/ticket";
import { getSpotifyArtistImage } from "@/lib/spotify";
import { getTicketmasterEvents, getTicketmasterEvent } from "@/lib/ticketmaster";
import { getSeatGeekEvents, getSeatGeekEvent } from "@/lib/seatgeek";

// ─── Image enrichment ─────────────────────────────────────────────────────────

/** Enrich a single event with a Spotify artist image if available. */
async function withImage(event: Event): Promise<Event> {
  const spotifyUrl = await getSpotifyArtistImage(event.artist);
  if (!spotifyUrl) return event;
  return { ...event, imageUrl: spotifyUrl };
}

// ─── Event merging helpers ────────────────────────────────────────────────────

/**
 * Merge events from multiple sources, removing exact title+date duplicates.
 * Events that appear in multiple sources keep whichever entry came first.
 */
function deduplicateEvents(events: Event[]): Event[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    // Normalize key: lowercase artist + date
    const key = `${e.artist.toLowerCase()}|${e.date.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return ~20–40 upcoming events (mix of concerts + sports) from live APIs,
 * falling back to mock data when no API keys are configured or all calls fail.
 */
export async function getEvents(): Promise<Event[]> {
  // Attempt live data from both sources in parallel
  const [tmEvents, sgEvents] = await Promise.all([
    getTicketmasterEvents().catch((err) => {
      console.error("[api] Ticketmaster fetch error:", err);
      return [] as Event[];
    }),
    getSeatGeekEvents().catch((err) => {
      console.error("[api] SeatGeek fetch error:", err);
      return [] as Event[];
    }),
  ]);

  const liveEvents = deduplicateEvents([...tmEvents, ...sgEvents]);

  // If both sources returned nothing (no keys or both failed), use mock data
  const events = liveEvents.length > 0 ? liveEvents : MOCK_EVENTS;

  // Enrich with Spotify images in parallel
  return Promise.all(events.map(withImage));
}

/**
 * Search events by query string (artist, venue, city, genre).
 */
export async function searchEvents(query: string): Promise<Event[]> {
  const events = await getEvents();
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.artist.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.genre.toLowerCase().includes(q)
  );
}

/**
 * Return a single event by ID.
 * Supports IDs from Ticketmaster ("tm-…"), SeatGeek ("sg-…"), and mock ("evt-…").
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  // Route to the correct live source based on the id prefix
  if (eventId.startsWith("tm-")) {
    const event = await getTicketmasterEvent(eventId).catch(() => null);
    if (event) return withImage(event);
  }

  if (eventId.startsWith("sg-")) {
    const event = await getSeatGeekEvent(eventId).catch(() => null);
    if (event) return withImage(event);
  }

  // Fall through to mock data (for "evt-…" ids or if live fetch returned null)
  const mockEvent = MOCK_EVENTS.find((e) => e.id === eventId) ?? null;
  if (!mockEvent) return null;
  return withImage(mockEvent);
}

/**
 * Return ticket listings for an event.
 *
 * Neither Ticketmaster Discovery nor the SeatGeek public API exposes per-listing
 * ticket data, so listings remain mock data keyed by event ID.
 *
 * For live event IDs ("tm-…" / "sg-…") we return listings from a randomly-chosen
 * mock event so the detail page always has sample listings to display.
 */
export async function getListings(eventId: string): Promise<TicketListing[]> {
  await Promise.resolve();

  // Exact match first
  if (MOCK_LISTINGS[eventId]) return MOCK_LISTINGS[eventId];

  // For live IDs, fall back to a random mock event's listings
  if (eventId.startsWith("tm-") || eventId.startsWith("sg-")) {
    const mockIds = Object.keys(MOCK_LISTINGS);
    if (mockIds.length === 0) return [];
    // Use the numeric tail of the id to pick a consistent mock listing set
    const tail = eventId.replace(/^(tm-|sg-)/, "");
    // Hash the tail into an index
    let hash = 0;
    for (let i = 0; i < tail.length; i++) {
      hash = (hash * 31 + tail.charCodeAt(i)) & 0x7fffffff;
    }
    const idx = hash % mockIds.length;
    return MOCK_LISTINGS[mockIds[idx]] ?? [];
  }

  return [];
}
