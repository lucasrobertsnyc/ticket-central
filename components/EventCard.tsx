"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

// Dark fallback shown behind the image while it loads / if it 404s
const GENRE_FALLBACK_BG: Record<string, string> = {
  // Concerts
  "R&B / Pop":         "#0f0a1a",
  "Pop / R&B":         "#150e05",
  "Pop / Country":     "#060d1c",
  "Hip-Hop":           "#0d0d0d",
  "Latin / Reggaeton": "#061410",
  "Rock / Pop":        "#070e18",
  // Sports
  "NFL":               "#060f08",
  "NBA":               "#160800",
  "MLB":               "#060a18",
  "NHL":               "#060c18",
  "MLS":               "#070f0a",
};

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const fallback = GENRE_FALLBACK_BG[event.genre] ?? "#111";

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">

        {/* ── Artist image ─────────────────────────── */}
        <div className="relative h-40 overflow-hidden" style={{ backgroundColor: fallback }}>
          <img
            src={event.imageUrl}
            alt={event.artist}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
          />
          {/* Bottom-fade gradient so text is always legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Genre tag — top left */}
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
              {event.genre}
            </span>
          </div>

          {/* Artist name — anchored to bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-6">
            <h3 className="text-white font-extrabold text-xl leading-tight drop-shadow">
              {event.artist}
            </h3>
          </div>
        </div>

        {/* ── Event details ────────────────────────── */}
        <div className="px-3.5 pt-3 pb-3.5">
          <div className="space-y-1 mb-3">
            <p className="text-sm flex items-center gap-1.5 truncate">
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
