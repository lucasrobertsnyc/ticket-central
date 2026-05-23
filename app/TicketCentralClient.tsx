"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Event, TicketListing, FilterState, SortField, SortDir } from "@/types/ticket";
import EventHeader from "@/components/EventHeader";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import TicketList from "@/components/TicketList";
import SortBar from "@/components/SortBar";
import VenueMap from "@/components/VenueMap";

interface Props {
  event: Event;
  initialListings: TicketListing[];
}

export default function TicketCentralClient({ event, initialListings }: Props) {
  const absoluteMin = Math.min(...initialListings.map((l) => l.allInTotal));
  const absoluteMax = Math.max(...initialListings.map((l) => l.allInTotal));

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minPrice: absoluteMin,
    maxPrice: absoluteMax,
    minQuantity: 1,
    sectionTypes: [],
  });

  const [sortField, setSortField] = useState<SortField>("price");
  const [sortDir, setSortDir]     = useState<SortDir>("asc");
  const [showMap, setShowMap]     = useState(true);

  function toggleSectionType(type: (typeof filters.sectionTypes)[number]) {
    setFilters((f) => ({
      ...f,
      sectionTypes: f.sectionTypes.includes(type)
        ? f.sectionTypes.filter((t) => t !== type)
        : [...f.sectionTypes, type],
    }));
  }

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    const result = initialListings.filter((l) => {
      if (l.allInTotal < filters.minPrice || l.allInTotal > filters.maxPrice) return false;
      if (l.quantity < filters.minQuantity) return false;
      if (filters.sectionTypes.length > 0 && !filters.sectionTypes.includes(l.sectionType)) return false;
      if (q && !`${l.section} ${l.row} ${l.platform}`.toLowerCase().includes(q)) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "price":    cmp = a.allInTotal - b.allInTotal; break;
        case "section":  cmp = a.section.localeCompare(b.section); break;
        case "row":      cmp = a.row.localeCompare(b.row); break;
        case "quantity": cmp = a.quantity - b.quantity; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [initialListings, filters, sortField, sortDir]);

  const cheapestId = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, l) =>
      l.allInTotal < best.allInTotal ? l : best
    ).id;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span className="text-gray-900 font-extrabold text-lg tracking-tight leading-none">
              Ticket<span className="text-blue-600">Central</span>
            </span>
          </Link>

          <span className="text-gray-200 hidden sm:block">|</span>

          <Link
            href="/"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition hidden sm:flex"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All events
          </Link>

          <div className="ml-auto">
            <SearchBar
              value={filters.search}
              onChange={(search) => setFilters((f) => ({ ...f, search }))}
              resultCount={filtered.length}
            />
          </div>
        </div>
      </header>

      {/* ── Event header ────────────────────────────────────── */}
      <EventHeader event={event} totalListings={filtered.length} />

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5">

        {/* Seat map toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMap ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showMap ? "Hide" : "Show"} Seat Map
          </button>

          {showMap && (
            <div className="mt-3">
              <VenueMap
                listings={initialListings}
                activeSectionTypes={filters.sectionTypes}
                onSectionTypeToggle={toggleSectionType}
                onClearSectionTypes={() => setFilters((f) => ({ ...f, sectionTypes: [] }))}
              />
            </div>
          )}
        </div>

        {/* Sidebar + listings */}
        <div className="flex flex-col lg:flex-row gap-5">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            absoluteMin={absoluteMin}
            absoluteMax={absoluteMax}
          />

          <div className="flex-1 min-w-0">
            <SortBar
              field={sortField}
              dir={sortDir}
              count={filtered.length}
              onChange={(f, d) => { setSortField(f); setSortDir(d); }}
            />
            <TicketList listings={filtered} cheapestId={cheapestId} />
          </div>
        </div>
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
