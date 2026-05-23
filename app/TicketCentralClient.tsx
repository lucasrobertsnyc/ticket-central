"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Event, TicketListing, FilterState } from "@/types/ticket";
import EventHeader from "@/components/EventHeader";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import TicketList from "@/components/TicketList";

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

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();

    return initialListings
      .filter((l) => {
        if (l.allInTotal < filters.minPrice || l.allInTotal > filters.maxPrice) return false;
        if (l.quantity < filters.minQuantity) return false;
        if (filters.sectionTypes.length > 0 && !filters.sectionTypes.includes(l.sectionType)) return false;
        if (q && !`${l.section} ${l.row} ${l.platform}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.allInTotal - b.allInTotal);
  }, [initialListings, filters]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">🎟️</span>
          <span className="text-white font-black text-lg tracking-tight">
            Ticket<span className="text-pink-500">Central</span>
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All events
        </Link>
        <span className="ml-auto text-zinc-600 text-xs">Compare prices across every platform</span>
      </nav>

      {/* Event header */}
      <EventHeader event={event} totalListings={filtered.length} />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <SearchBar
            value={filters.search}
            onChange={(search) => setFilters((f) => ({ ...f, search }))}
            resultCount={filtered.length}
          />
        </div>

        {/* Layout: sidebar + results */}
        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            absoluteMin={absoluteMin}
            absoluteMax={absoluteMax}
          />

          <div className="flex-1 min-w-0">
            <TicketList listings={filtered} />
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center text-zinc-600 text-xs">
        Ticket Central · Prices include all fees and taxes · Not affiliated with any ticketing platform
      </footer>
    </div>
  );
}
