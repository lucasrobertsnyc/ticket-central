"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

type Category = "all" | "concerts" | "sports" | "theatre" | "comedy" | "other";

const CATEGORY_LABELS: { value: Category; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "concerts", label: "Concerts" },
  { value: "sports",   label: "Sports"   },
  { value: "theatre",  label: "Theatre"  },
  { value: "comedy",   label: "Comedy"   },
  { value: "other",    label: "Shows"    },
];

interface TnResponse {
  events: Event[];
  totalCount: number;
  page: number;
  topCities: string[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-40 bg-gray-100 animate-pulse" />
      <div className="px-3.5 pt-3 pb-3.5 space-y-2">
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-16" />
          <div className="h-7 bg-gray-100 rounded-lg animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

export default function TicketNetworkWidget() {
  const [events, setEvents]         = useState<Event[]>([]);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [topCities, setTopCities]   = useState<string[]>([]);

  const [category, setCategory]     = useState<Category>("all");
  const [city, setCity]             = useState("");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback((p: number, cat: Category, c: string, q: string) => {
    const params = new URLSearchParams({ page: String(p) });
    if (cat !== "all") params.set("category", cat);
    if (c)             params.set("city", c);
    if (q)             params.set("q", q);
    return `/api/tn-events?${params}`;
  }, []);

  async function fetchPage(p: number, cat: Category, c: string, q: string, append = false) {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(p, cat, c, q));
      const data: TnResponse = await res.json();
      const evs: Event[] = data.events ?? [];
      setEvents((prev) => append ? [...prev, ...evs] : evs);
      if (data.totalCount != null) setTotalCount(data.totalCount);
      if (data.page != null) setPage(data.page);
      if (data.topCities?.length) setTopCities(data.topCities);
    } catch {
      // silently fail — keeps whatever was already shown
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Initial load
  useEffect(() => { fetchPage(1, category, city, search); }, []); // eslint-disable-line

  // Re-fetch when filters change (reset to page 1)
  function applyFilter(newCat: Category, newCity: string, newSearch: string) {
    setEvents([]);
    fetchPage(1, newCat, newCity, newSearch);
  }

  function handleCategory(cat: Category) {
    setCategory(cat);
    applyFilter(cat, city, search);
  }

  function handleCity(c: string) {
    setCity(c);
    applyFilter(category, c, search);
  }

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      applyFilter(category, city, val);
    }, 400);
  }

  function handleLoadMore() {
    fetchPage(page + 1, category, city, search, true);
  }

  const hasMore = events.length < totalCount;

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search artist, event, or venue…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchInput && (
            <button onClick={() => handleSearchChange("")} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORY_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleCategory(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* City filter */}
        {topCities.length > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <select
              value={city}
              onChange={(e) => handleCity(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option value="">All cities</option>
              {topCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {city && (
              <button onClick={() => handleCity("")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results count ──────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{totalCount.toLocaleString()}</span> events available
          </p>
          <a
            href="https://www.ticketnetwork.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by TicketNetwork ↗
          </a>
        </div>
      )}

      {/* ── Event grid ─────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">No events found</p>
          <p className="text-gray-400 text-sm">Try a different category or city.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                externalHref={event.url}
                ctaLabel="Get Tickets →"
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading…
                  </span>
                ) : (
                  `Load more · ${(totalCount - events.length).toLocaleString()} remaining`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
