"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

const GENRE_BG: Record<string, string> = {
  "R&B / Pop":         "from-violet-900 via-purple-800 to-rose-900",
  "Pop / R&B":         "from-amber-900 via-orange-800 to-yellow-900",
  "Pop / Country":     "from-blue-900 via-indigo-800 to-slate-900",
  "Hip-Hop":           "from-gray-900 via-zinc-800 to-neutral-900",
  "Latin / Reggaeton": "from-emerald-900 via-teal-800 to-cyan-900",
  "Rock / Pop":        "from-sky-900 via-blue-800 to-indigo-900",
};

interface Props {
  event: Event;
  totalListings: number;
}

export default function EventHeader({ event, totalListings }: Props) {
  const bg = GENRE_BG[event.genre] ?? "from-gray-900 via-gray-800 to-gray-900";

  return (
    <div className={`bg-gradient-to-r ${bg} relative`}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-white/50 text-xs mb-4">
          <Link href="/" className="hover:text-white/80 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/" className="hover:text-white/80 transition">Concerts</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white/70">{event.artist}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-sm font-medium mb-1">{event.genre}</p>
            <h1 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight">
              {event.artist}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white font-medium">{event.venue}</span>
                <span>&middot; {event.city}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.date} &middot; {event.time}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:text-right flex-shrink-0">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Available</p>
              <p className="text-white font-extrabold text-2xl tabular-nums">{totalListings} <span className="text-base font-medium text-white/60">listings</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
