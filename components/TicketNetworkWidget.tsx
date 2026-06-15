"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/types/ticket";
import EventCard from "@/components/EventCard";

export default function TicketNetworkWidget() {
  const [events, setEvents] = useState<Event[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  async function loadPage(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/tn-events?page=${p}`);
      const data = await res.json();
      setEvents((prev) => (p === 1 ? data.events : [...prev, ...data.events]));
      setHasMore(p * 20 < data.totalCount);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPage(1); }, []);

  if (loading && events.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} externalHref={event.url} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadPage(page + 1)}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Load more events"}
          </button>
        </div>
      )}
    </>
  );
}
