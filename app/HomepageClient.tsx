"use client";

import { useState, useMemo } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

interface Props {
  events: Event[];
}

function extractLocations(events: Event[]): { label: string; match: string }[] {
  const seen = new Set<string>();
  const locs: { label: string; match: string }[] = [];
  const stateNames: Record<string, string> = {
    NY: "New York", CA: "California", TX: "Texas", FL: "Florida",
  };
  for (const e of events) {
    const state = e.city.split(", ")[1];
    if (state && !seen.has(state)) {
      seen.add(state);
      locs.push({ label: stateNames[state] ?? state, match: state });
    }
  }
  return locs;
}

const SPORT_GENRES = new Set(["NFL", "NBA", "MLB", "NHL", "MLS"]);

type Category = "all" | "concerts" | "sports";

export default function HomepageClient({ events }: Props) {
  const [artist, setArtist]       = useState("");
  const [location, setLocation]   = useState("");
  const [category, setCategory]   = useState<Category>("all");

  const locationOptions = useMemo(() => extractLocations(events), [events]);

  const filtered = useMemo(() => {
    const a = artist.toLowerCase().trim();
    const l = location;
    return events.filter((e) => {
      if (category === "concerts" && SPORT_GENRES.has(e.genre)) return false;
      if (category === "sports"   && !SPORT_GENRES.has(e.genre)) return false;
      if (l && !e.city.includes(l)) return false;
      if (!a) return true;
      return (
        e.artist.toLowerCase().includes(a) ||
        e.venue.toLowerCase().includes(a) ||
        e.city.toLowerCase().includes(a) ||
        e.genre.toLowerCase().includes(a)
      );
    });
  }, [events, artist, location, category]);

  const hasFilter = !!artist || !!location || category !== "all";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <a href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span className="text-gray-900 font-extrabold text-lg tracking-tight leading-none">
              Ticket<span className="text-blue-600">Central</span>
            </span>
          </a>
          <span className="hidden sm:block text-gray-300 text-sm">
            Compare prices across SeatGeek, StubHub, TickPick &amp; more
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden md:block">All-in prices. No surprises.</span>
          </div>
        </div>
      </header>

      {/* ── Hero / Search ───────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center">
          <h1 className="text-gray-900 text-3xl sm:text-4xl font-extrabold leading-tight mb-2">
            Find tickets. Compare every platform.
          </h1>
          <p className="text-gray-500 text-base mb-7">
            We show the real all-in price across SeatGeek, StubHub, TickPick, Vivid Seats, and more.
          </p>

          {/* Two-part search — SeatGeek style */}
          <div className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-0 shadow-sm rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
            <div className="flex-1 flex items-center bg-white px-4 py-3 gap-2 border-b sm:border-b-0 sm:border-r border-gray-200">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist, band, or venue"
                autoFocus
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none"
              />
              {artist && (
                <button onClick={() => setArtist("")} className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center bg-white px-4 py-3 gap-2 sm:w-48">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none appearance-none cursor-pointer"
              >
                <option value="">All locations</option>
                {locationOptions.map(({ label, match }) => (
                  <option key={match} value={match}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform logos row */}
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 mt-6 text-xs font-semibold text-gray-400">
            <span>Comparing:</span>
            {["SeatGeek", "StubHub", "TickPick", "Vivid Seats", "GameTime", "Ticketmaster", "AXS"].map((p) => (
              <span key={p} className="text-gray-500">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Events grid ─────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-7">

        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-gray-200">
          {(["all", "concerts", "sports"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize ${
                category === cat
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {cat === "all" ? "All Events" : cat === "concerts" ? "Concerts" : "Sports"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 font-bold text-base">
            {hasFilter ? (
              <>{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</>
            ) : (
              category === "sports" ? "Upcoming Games" : category === "concerts" ? "Upcoming Concerts" : "Upcoming Events"
            )}
          </h2>
          {hasFilter && (
            <button
              onClick={() => { setArtist(""); setLocation(""); setCategory("all"); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold mb-1">No events found</p>
            <p className="text-gray-400 text-sm">Try a different artist or location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-8 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-gray-900 font-bold text-sm">Ticket<span className="text-blue-600">Central</span></span>
          <p className="text-gray-400 text-xs">
            All prices include fees and taxes &middot; Not affiliated with any ticketing platform
          </p>
        </div>
      </footer>
    </div>
  );
}
