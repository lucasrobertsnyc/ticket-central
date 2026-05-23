"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

// Single accent color per genre — used only as a 4px top border stripe.
// Everything else is neutral so the card looks designed, not generated.
const GENRE_ACCENT: Record<string, string> = {
  "R&B / Pop":         "#7c3aed",
  "Pop / R&B":         "#d97706",
  "Pop / Country":     "#2563eb",
  "Hip-Hop":           "#374151",
  "Latin / Reggaeton": "#059669",
  "Rock / Pop":        "#0284c7",
};

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const accent = GENRE_ACCENT[event.genre] ?? "#6b7280";

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-150 hover:shadow-md hover:border-gray-300">
        {/* Thin genre accent stripe — the only color on the card */}
        <div className="h-1" style={{ backgroundColor: accent }} />

        <div className="p-4">
          {/* Artist + genre */}
          <div className="mb-3">
            <h3 className="text-gray-900 font-bold text-lg leading-snug group-hover:text-blue-600 transition-colors">
              {event.artist}
            </h3>
            <span className="text-xs text-gray-400 font-medium">{event.genre}</span>
          </div>

          {/* Venue + date */}
          <div className="space-y-1.5 mb-4">
            <p className="text-gray-600 text-sm flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-900 truncate">{event.venue}</span>
              <span className="text-gray-400 flex-shrink-0">&middot; {event.city}</span>
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {event.date} &middot; {event.time}
            </p>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-gray-400 text-xs">Tickets from</p>
              <p className="text-gray-900 font-extrabold text-xl tabular-nums leading-tight">
                ${event.lowestAllInPrice}
                <span className="text-gray-400 text-xs font-normal ml-1">all-in</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1.5">{event.listingCount} listings</p>
              <span className="inline-block bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors">
                Compare prices
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
