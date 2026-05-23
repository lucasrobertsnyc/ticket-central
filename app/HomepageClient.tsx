"use client";

import { useState, useMemo } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

interface Props {
  events: Event[];
}

const POPULAR_SEARCHES = ["The Weeknd", "Beyoncé", "Taylor Swift", "Los Angeles", "New York"];

export default function HomepageClient({ events }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.artist.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.genre.toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎟️</span>
          <span className="text-white font-black text-lg tracking-tight">
            Ticket<span className="text-pink-500">Central</span>
          </span>
        </div>
        <span className="ml-auto text-zinc-600 text-xs">Compare prices across every platform</span>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-b from-zinc-900 to-[#0f0f11] px-4 sm:px-6 pt-16 pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-pink-600/20 border border-pink-500/30 text-pink-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            All-in prices — no hidden fees
          </div>

          <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight mb-4">
            Find the cheapest tickets,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">
              all in one place
            </span>
          </h1>
          <p className="text-zinc-400 text-lg mb-10">
            We compare SeatGeek, StubHub, TickPick, Vivid Seats, and more — so you don&apos;t have to.
          </p>

          {/* Big search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artist, venue, or city…"
              className="w-full bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-600 rounded-2xl pl-14 pr-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition shadow-lg shadow-black/30"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-500 hover:text-zinc-300 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Popular searches */}
          {!query && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="text-zinc-600 text-sm self-center">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="text-zinc-400 hover:text-pink-300 text-sm bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full transition"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">
            {query ? (
              <>
                Results for{" "}
                <span className="text-pink-400">&ldquo;{query}&rdquo;</span>
              </>
            ) : (
              "Upcoming Events"
            )}
          </h2>
          <span className="text-zinc-500 text-sm">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-white text-xl font-bold mb-2">No events found</h3>
            <p className="text-zinc-400 text-sm max-w-xs">
              Try a different artist, city, or venue.
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 text-pink-400 hover:text-pink-300 text-sm font-medium transition"
            >
              Show all events
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

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-zinc-600 text-xs">
        Ticket Central · Prices include all fees and taxes · Not affiliated with any ticketing platform
      </footer>
    </div>
  );
}
