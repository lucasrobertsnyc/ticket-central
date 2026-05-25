"use client";

import { useState, useMemo, useTransition } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

function parseEventDate(dateStr: string): Date {
  // "Sunday, June 14, 2026" → strip weekday → "June 14, 2026"
  const clean = dateStr.replace(/^[A-Za-z]+,\s*/, "");
  return new Date(clean);
}

interface Props {
  events: Event[];
}

function extractLocations(events: Event[]): { label: string; match: string }[] {
  const seen = new Set<string>();
  const locs: { label: string; match: string }[] = [];
  const stateNames: Record<string, string> = {
    CA: "California", CO: "Colorado", DC: "Washington D.C.", FL: "Florida",
    GA: "Georgia",    IL: "Illinois", MA: "Massachusetts",   MD: "Maryland",
    MO: "Missouri",   NC: "North Carolina", NJ: "New Jersey", NV: "Nevada",
    NY: "New York",   PA: "Pennsylvania",   TN: "Tennessee",  TX: "Texas",
    WA: "Washington",
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
const LEAGUES = ["NFL", "NBA", "MLB", "NHL"] as const;
type League = (typeof LEAGUES)[number];

type Category = "all" | "concerts" | "sports";
type SortBy   = "date" | "price" | "location";

export default function HomepageClient({ events }: Props) {
  const [isPending, startTransition] = useTransition();
  const [artist, setArtist]     = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [league, setLeague]     = useState<League | "">("");
  const [genre, setGenre]       = useState<string>("");
  const [sortBy, setSortBy]     = useState<SortBy>("date");

  const locationOptions = useMemo(() => extractLocations(events), [events]);

  // Which leagues actually have events in the data?
  const availableLeagues = useMemo(
    () => LEAGUES.filter((lg) => events.some((e) => e.genre === lg)),
    [events]
  );

  // Which concert genres actually have events in the data?
  const availableGenres = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of events) {
      if (!SPORT_GENRES.has(e.genre) && !seen.has(e.genre)) {
        seen.add(e.genre);
        result.push(e.genre);
      }
    }
    return result;
  }, [events]);

  const filtered = useMemo(() => {
    const a = artist.toLowerCase().trim();
    const l = location;
    const result = events.filter((e) => {
      if (category === "concerts" && SPORT_GENRES.has(e.genre)) return false;
      if (category === "sports"   && !SPORT_GENRES.has(e.genre)) return false;
      if (category === "sports"   && league && e.genre !== league) return false;
      if (category === "concerts" && genre  && e.genre !== genre)  return false;
      if (l && !e.city.includes(l)) return false;
      if (!a) return true;
      return (
        e.artist.toLowerCase().includes(a) ||
        e.venue.toLowerCase().includes(a) ||
        e.city.toLowerCase().includes(a) ||
        e.genre.toLowerCase().includes(a)
      );
    });

    result.sort((a, b) => {
      if (sortBy === "date")     return parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime();
      if (sortBy === "price")    return a.lowestAllInPrice - b.lowestAllInPrice;
      if (sortBy === "location") return a.city.localeCompare(b.city);
      return 0;
    });

    return result;
  }, [events, artist, location, category, league, genre, sortBy]);

  const hasSearchFilter = !!artist || !!location;
  const hasFilter = hasSearchFilter || category !== "all" || !!league || !!genre;

  // Heading computed outside JSX so TypeScript doesn't narrow category away
  const sectionTitle = hasSearchFilter
    ? `${filtered.length} event${filtered.length !== 1 ? "s" : ""} found`
    : category === "sports"   && league ? `Upcoming ${league} Games`
    : category === "sports"             ? "Upcoming Games"
    : category === "concerts" && genre  ? `Upcoming ${genre} Concerts`
    : category === "concerts"           ? "Upcoming Concerts"
    : "Upcoming Events";

  function clearAll() {
    startTransition(() => {
      setArtist("");
      setLocation("");
      setCategory("all");
      setLeague("");
      setGenre("");
      setSortBy("date");
    });
  }

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

          {/* Two-part search */}
          <div className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-0 shadow-sm rounded-xl overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
            <div className="flex-1 flex items-center bg-white px-4 py-3 gap-2 border-b sm:border-b-0 sm:border-r border-gray-200">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist, team, or venue"
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
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 mt-6 text-xs font-semibold text-gray-400">
            <span>Comparing:</span>
            {[
              { name: "SeatGeek",    url: "https://seatgeek.com",              color: "#059669", bg: "rgba(5,150,105,0.08)",   hover: "rgba(5,150,105,0.16)"   },
              { name: "StubHub",     url: "https://www.stubhub.com",           color: "#CC2828", bg: "rgba(204,40,40,0.08)",   hover: "rgba(204,40,40,0.16)"   },
              { name: "TickPick",    url: "https://www.tickpick.com",          color: "#0284C7", bg: "rgba(2,132,199,0.08)",   hover: "rgba(2,132,199,0.16)"   },
              { name: "Vivid Seats", url: "https://www.vividseats.com",        color: "#6D28D9", bg: "rgba(109,40,217,0.08)",  hover: "rgba(109,40,217,0.16)"  },
              { name: "GameTime",    url: "https://gametime.co",               color: "#EA580C", bg: "rgba(234,88,12,0.08)",   hover: "rgba(234,88,12,0.16)"   },
              { name: "Ticketmaster",url: "https://www.ticketmaster.com",      color: "#026CDF", bg: "rgba(2,108,223,0.08)",   hover: "rgba(2,108,223,0.16)"   },
              { name: "AXS",         url: "https://www.axs.com",               color: "#1d4ed8", bg: "rgba(29,78,216,0.08)",   hover: "rgba(29,78,216,0.16)"   },
            ].map(({ name, url, color, bg }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full font-semibold transition-all duration-150 border whitespace-nowrap"
                style={{
                  color,
                  backgroundColor: bg,
                  borderColor: `${color}30`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${color}18`;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}55`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = bg;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}30`;
                }}
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Events grid ─────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-7">

        {/* Category tabs */}
        <div className="flex items-center gap-1 mb-0 border-b border-gray-200">
          {(["all", "concerts", "sports"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => startTransition(() => { setCategory(cat); setLeague(""); setGenre(""); })}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                category === cat
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {cat === "all" ? "All Events" : cat === "concerts" ? "Concerts" : "Sports"}
            </button>
          ))}
        </div>

        {/* League sub-filter pills — only visible when Sports tab is active */}
        {category === "sports" && availableLeagues.length > 0 && (
          <div className="flex items-center gap-2 py-3 border-b border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">League:</span>
            <button
              onClick={() => startTransition(() => setLeague(""))}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                league === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {availableLeagues.map((lg) => (
              <button
                key={lg}
                onClick={() => startTransition(() => setLeague(league === lg ? "" : lg))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  league === lg
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lg}
              </button>
            ))}
          </div>
        )}

        {/* Genre sub-filter pills — only visible when Concerts tab is active */}
        {category === "concerts" && availableGenres.length > 0 && (
          <div className="flex items-center gap-2 py-3 border-b border-gray-100 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">Genre:</span>
            <button
              onClick={() => startTransition(() => setGenre(""))}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                genre === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {availableGenres.map((g) => (
              <button
                key={g}
                onClick={() => startTransition(() => setGenre(genre === g ? "" : g))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  genre === g
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 mb-4 gap-3 flex-wrap">
          <h2 className="text-gray-900 font-bold text-base">{sectionTitle}</h2>
          <div className="flex items-center gap-2">
            {/* Sort pills */}
            <span className="text-xs text-gray-400 font-medium hidden sm:block">Sort:</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              {([
                { value: "date",  label: "Date"  },
                { value: "price", label: "Price" },
              ] as { value: SortBy; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => startTransition(() => setSortBy(value))}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    sortBy === value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {hasFilter && (
              <button
                onClick={clearAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold mb-1">No events found</p>
            <p className="text-gray-400 text-sm">Try a different artist, team, or location.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150 ${isPending ? "opacity-50" : "opacity-100"}`}>
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
        <p className="text-center text-gray-300 text-xs mt-3">Impact-Site-Verification: 6e2fdb0a-6a37-4a7e-bc52-8c57a3f3445f</p>
      </footer>
    </div>
  );
}
