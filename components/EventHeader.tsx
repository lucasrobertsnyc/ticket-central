"use client";

import type { Event } from "@/types/ticket";

const GENRE_GRADIENTS: Record<string, string> = {
  "R&B / Pop":        "from-purple-600 via-pink-500 to-rose-400",
  "Pop / R&B":        "from-yellow-500 via-orange-500 to-pink-500",
  "Pop / Country":    "from-blue-500 via-purple-500 to-pink-400",
  "Hip-Hop":          "from-zinc-600 via-zinc-500 to-stone-400",
  "Latin / Reggaeton":"from-green-500 via-teal-500 to-cyan-400",
  "Rock / Pop":       "from-sky-600 via-blue-500 to-indigo-500",
};

const GENRE_INITIALS: Record<string, string> = {
  "R&B / Pop":        "W",
  "Pop / R&B":        "B",
  "Pop / Country":    "TS",
  "Hip-Hop":          "KL",
  "Latin / Reggaeton":"BB",
  "Rock / Pop":       "CP",
};

interface Props {
  event: Event;
  totalListings: number;
}

export default function EventHeader({ event, totalListings }: Props) {
  const gradient = GENRE_GRADIENTS[event.genre] ?? "from-purple-600 via-pink-500 to-rose-400";
  const initials = GENRE_INITIALS[event.genre] ?? event.artist[0];

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Artist avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-1">
              {event.genre}
            </p>
            <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight truncate">
              {event.artist}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-zinc-300 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.venue} · {event.city}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.date}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {event.time}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">Listings found</p>
            <p className="text-white text-3xl font-black">{totalListings}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
