/**
 * Data-access layer for events and ticket listings.
 *
 * Today this returns mock data. To wire up a real API, replace the
 * body of each function — the call sites and types stay the same.
 *
 * Artist images are automatically upgraded to real Spotify photos when
 * SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are present in .env.local.
 * Without those vars the stock photos from data/tickets.ts are used instead.
 */

import { MOCK_EVENTS, MOCK_LISTINGS } from "@/data/tickets";
import type { Event, TicketListing } from "@/types/ticket";
import { getSpotifyArtistImage } from "@/lib/spotify";

/** Enrich a single event with a Spotify artist image if available. */
async function withImage(event: Event): Promise<Event> {
  const spotifyUrl = await getSpotifyArtistImage(event.artist);
  if (!spotifyUrl) return event;          // fall back to imageUrl from data
  return { ...event, imageUrl: spotifyUrl };
}

export async function getEvents(): Promise<Event[]> {
  // Fetch all Spotify images in parallel
  return Promise.all(MOCK_EVENTS.map(withImage));
}

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

export async function getEvent(eventId: string): Promise<Event | null> {
  const event = MOCK_EVENTS.find((e) => e.id === eventId) ?? null;
  if (!event) return null;
  return withImage(event);
}

export async function getListings(eventId: string): Promise<TicketListing[]> {
  await Promise.resolve();
  return MOCK_LISTINGS[eventId] ?? [];
}
