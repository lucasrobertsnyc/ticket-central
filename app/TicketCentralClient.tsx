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
  const [sortDir, setSortDir]   = useState<SortDir>("asc");
  const [showMap, setShowMap]   = useState(true);

  // Toggle a section type — shared between sidebar and venue map
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

  // Best deal = cheapest all-in regardless of current sort order
  const cheapestId = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, l) =>
      l.allInTotal < best.allInTotal ? l : best
    ).id;
  }, [filtered]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-[#070b14] border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="text-slate-100 font-black text-lg tracking-tight">
            Ticket<span className="text-blue-500">Central</span>
          </span>
        </Link>

        <span className="text-slate-700">|</span>

        <Link
          href="/"
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All events
        </Link>

        <span className="ml-auto text-slate-700 text-xs hidden sm:block">
          Prices updated in real time
        </span>
      </nav>

      {/* Event header */}
      <EventHeader event={event} totalListings={filtered.length} />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5">
        {/* Search */}
        <div className="mb-5">
          <SearchBar
            value={filters.search}
            onChange={(search) => setFilters((f) => ({ ...f, search }))}
            resultCount={filtered.length}
          />
        </div>

        {/* Seat map toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
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
                onClearSectionTypes={() =>
                  setFilters((f) => ({ ...f, sectionTypes: [] }))
                }
              />
            </div>
          )}
        </div>

        {/* Sidebar + listings */}
        <div className="flex flex-col lg:flex-row gap-5">
          <FilterSidebar
            filters={filters}
            onChange={(f) => setFilters({ ...f, sectionTypes: f.sectionTypes })}
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

      <footer className="border-t border-slate-800 mt-8 px-6 py-4 text-center text-slate-700 text-xs">
        Ticket Central &middot; All prices include fees and taxes &middot; Not affiliated with any ticketing platform
      </footer>
    </div>
  );
}
