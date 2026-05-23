"use client";

import { useState, useMemo } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

interface Props {
  events: Event[];
}

// Derive unique cities from the event list for the location chips
function extractLocations(events: Event[]): { label: string; match: string }[] {
  const seen = new Set<string>();
  const locs: { label: string; match: string }[] = [];
  for (const e of events) {
    // e.city is like "New York, NY" or "Inglewood, CA"
    const state = e.city.split(", ")[1];
    if (state && !seen.has(state)) {
      seen.add(state);
      const stateNames: Record<string, string> = {
        NY: "New York",
        CA: "California",
        TX: "Texas",
        FL: "Florida",
      };
      locs.push({ label: stateNames[state] ?? state, match: state });
    }
  }
  return locs;
}

export default function HomepageClient({ events }: Props) {
  const [query, setQuery]       = useState("");
  const [location, setLocation] = useState("");

  const locationOptions = useMemo(() => extractLocations(events), [events]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return events.filter((e) => {
      if (location && !e.city.includes(location)) return false;
      if (!q) return true;
      return (
        e.artist.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.genre.toLowerCase().includes(q)
      );
    });
  }, [events, query, location]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-[#070b14] border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="text-slate-100 font-black text-lg tracking-tight">
            Ticket<span className="text-blue-500">Central</span>
          </span>
        </div>
        <span className="ml-auto text-slate-600 text-xs hidden sm:block">
          Compare prices across SeatGeek, StubHub, TickPick &amp; more
        </span>
      </nav>

      {/* Hero */}
      <div className="bg-[#070b14] border-b border-slate-800/60 px-4 sm:px-6 pt-14 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            All-in prices &mdash; no hidden fees
          </div>

          <h1 className="text-slate-50 text-3xl sm:text-4xl font-black leading-tight mb-3">
            Find the best ticket prices,{" "}
            <span className="text-blue-400">across every platform</span>
          </h1>
          <p className="text-slate-400 text-base mb-8">
            We compare every major resale site so you always pay the lowest all-in price.
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by artist, venue, or city…"
              autoFocus
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-xl pl-10 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Location chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 text-xs font-medium">Location:</span>
            <button
              onClick={() => setLocation("")}
              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                location === ""
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              All cities
            </button>
            {locationOptions.map(({ label, match }) => (
              <button
                key={match}
                onClick={() => setLocation(location === match ? "" : match)}
                className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                  location === match
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-slate-200 font-semibold text-base">
            {query || location ? (
              <>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {query && (
                  <> for <span className="text-blue-400">&ldquo;{query}&rdquo;</span></>
                )}
                {location && !query && (
                  <> in <span className="text-blue-400">{locationOptions.find(l => l.match === location)?.label ?? location}</span></>
                )}
              </>
            ) : (
              <>Upcoming events <span className="text-slate-600 font-normal text-sm ml-1">({events.length})</span></>
            )}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-slate-200 font-semibold mb-1">No events found</h3>
            <p className="text-slate-500 text-sm mb-4">Try a different artist, city, or remove your location filter.</p>
            <button
              onClick={() => { setQuery(""); setLocation(""); }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 px-6 py-4 text-center text-slate-700 text-xs">
        TicketCentral &middot; All prices include fees and taxes &middot; Not affiliated with any ticketing platform
      </footer>
    </div>
  );
}
