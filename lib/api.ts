/**
 * Data-access layer for events and ticket listings.
 *
 * Today this returns mock data. To wire up a real API, replace the
 * body of each function — the call sites and types stay the same.
 *
 * Example real implementation:
 *   const res = await fetch(`https://api.seatgeek.com/2/events/${eventId}/listings`, {
 *     headers: { Authorization: `Bearer ${process.env.SEATGEEK_API_KEY}` },
 *   });
 *   const json = await res.json();
 *   return json.listings.map(normalizeListing);
 */

import { MOCK_EVENTS, MOCK_LISTINGS } from "@/data/tickets";
import type { Event, TicketListing } from "@/types/ticket";

export async function getEvents(): Promise<Event[]> {
  await Promise.resolve();
  return MOCK_EVENTS;
}

export async function searchEvents(query: string): Promise<Event[]> {
  await Promise.resolve();
  if (!query.trim()) return MOCK_EVENTS;
  const q = query.toLowerCase();
  return MOCK_EVENTS.filter(
    (e) =>
      e.artist.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.genre.toLowerCase().includes(q)
  );
}

export async function getEvent(eventId: string): Promise<Event | null> {
  await Promise.resolve();
  return MOCK_EVENTS.find((e) => e.id === eventId) ?? null;
}

export async function getListings(eventId: string): Promise<TicketListing[]> {
  await Promise.resolve();
  return MOCK_LISTINGS[eventId] ?? [];
}
