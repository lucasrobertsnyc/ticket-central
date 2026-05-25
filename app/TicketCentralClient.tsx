"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
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

  const [, startTransition] = useTransition();

  const toggleSectionType = useCallback((type: (typeof filters.sectionTypes)[number]) => {
    startTransition(() => {
      setFilters((f) => ({
        ...f,
        sectionTypes: f.sectionTypes.includes(type)
          ? f.sectionTypes.filter((t) => t !== type)
          : [...f.sectionTypes, type],
      }));
    });
  }, []);

  const handleFilterChange = useCallback((next: FilterState) => {
    startTransition(() => setFilters(next));
  }, []);

  const handleSortChange = useCallback((f: SortField, d: SortDir) => {
    startTransition(() => { setSortField(f); setSortDir(d); });
  }, []);

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

  const mapTitle = event.genre === "NFL" ? "Stadium Map"
    : event.genre === "MLB" ? "Ballpark Map"
    : (event.genre === "NBA" || event.genre === "NHL") ? "Arena Map"
    : "Seat Map";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 z-30 flex-shrink-0">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-4">
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

          <div className="ml-auto w-64 sm:w-72 flex-shrink-0">
            <SearchBar
              value={filters.search}
              onChange={(search) => setFilters((f) => ({ ...f, search }))}
              resultCount={filtered.length}
            />
          </div>
        </div>
      </header>

      {/* ── Split layout ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Left: scrollable listings panel ── */}
        <div className="w-full lg:w-[58%] xl:w-[56%] flex flex-col overflow-hidden border-r border-gray-200 bg-white">

          {/* Event header — scrolls naturally */}
          <EventHeader event={event} totalListings={filtered.length} />

          {/* Sort bar — sticks once event header scrolls off */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-3 z-10">
            <SortBar
              field={sortField}
              dir={sortDir}
              count={filtered.length}
              onChange={handleSortChange}
            />
          </div>

          {/* Scrollable content: filter sidebar + ticket list */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4 p-4 items-start">
              <FilterSidebar
                filters={filters}
                onChange={handleFilterChange}
                absoluteMin={absoluteMin}
                absoluteMax={absoluteMax}
              />
              <div className="flex-1 min-w-0">
                <TicketList listings={filtered} cheapestId={cheapestId} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: seat map panel ── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-hidden bg-white">
          {/* Panel header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-gray-800 font-semibold text-sm">{mapTitle}</span>
            <span className="text-gray-400 text-xs">Click a zone to filter listings</span>
          </div>
          {/* Map fills remaining height */}
          <div className="flex-1 overflow-hidden p-4">
            <VenueMap
              listings={initialListings}
              activeSectionTypes={filters.sectionTypes}
              onSectionTypeToggle={toggleSectionType}
              onClearSectionTypes={() => startTransition(() => setFilters((f) => ({ ...f, sectionTypes: [] })))}
              genre={event.genre}
              venue={event.venue}
              mode="panel"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
