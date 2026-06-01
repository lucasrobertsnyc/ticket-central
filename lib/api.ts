/**
 * Data-access layer for events and ticket listings.
 *
 * When TICKETMASTER_API_KEY is set in .env.local, getEvents() / getEvent()
 * return live data from the Ticketmaster Discovery API.
 * Without the key the app falls back to the mock data in data/tickets.ts so
 * development and testing always work offline.
 *
 * Ticket listings (per-seat inventory) are NOT available from the Discovery
 * API — that requires the Commerce API, a separate partnership tier.  For
 * Ticketmaster events we generate deterministic demo listings via
 * generateListingsForEvent() so the detail page is fully interactive.
 *
 * Artist images are automatically upgraded to real Spotify photos when
 * SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are present in .env.local.
 */

import { MOCK_EVENTS, MOCK_LISTINGS } from "@/data/tickets";
import type { Event, TicketListing } from "@/types/ticket";
import { getSpotifyArtistImage } from "@/lib/spotify";
import {
  getTicketmasterEvents,
  getTicketmasterEvent,
  generateListingsForEvent,
} from "@/lib/ticketmaster";

// ── Spotify image enrichment ──────────────────────────────────────────────────

/** Upgrade an event's imageUrl to the artist's Spotify press photo if available. */
async function withSpotifyImage(event: Event): Promise<Event> {
  const url = await getSpotifyArtistImage(event.artist);
  return url ? { ...event, imageUrl: url } : event;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all upcoming events, enriched with Spotify artist images. */
export async function getEvents(): Promise<Event[]> {
  const hasTM = Boolean(process.env.TICKETMASTER_API_KEY);

  const raw = hasTM
    ? await getTicketmasterEvents()   // live data
    : MOCK_EVENTS;                    // offline fallback

  // Enrich with Spotify images in parallel (no-ops if Spotify creds aren't set)
  return Promise.all(raw.map(withSpotifyImage));
}

/** Client-side search — filters already-loaded events by query string. */
export async function searchEvents(query: string): Promise<Event[]> {
  const events = await getEvents();
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(
    e =>
      e.artist.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)  ||
      e.city.toLowerCase().includes(q)   ||
      e.genre.toLowerCase().includes(q)
  );
}

/** Returns a single event by id, or null if not found. */
export async function getEvent(eventId: string): Promise<Event | null> {
  let event: Event | null = null;

  if (eventId.startsWith("tm-")) {
    // Live Ticketmaster event
    event = await getTicketmasterEvent(eventId);
  } else {
    // Mock event
    event = MOCK_EVENTS.find(e => e.id === eventId) ?? null;
  }

  if (!event) return null;
  return withSpotifyImage(event);
}

/** Returns ticket listings for an event. */
export async function getListings(eventId: string): Promise<TicketListing[]> {
  if (eventId.startsWith("tm-")) {
    // Ticketmaster events: generate deterministic demo listings
    const event = await getTicketmasterEvent(eventId);
    if (!event) return [];
    return generateListingsForEvent(event);
  }

  // Mock events: return pre-built mock listings
  return MOCK_LISTINGS[eventId] ?? [];
}
