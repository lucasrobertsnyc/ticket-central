"use client";

import type { Event } from "@/types/ticket";

const GENRE_COLORS: Record<string, string> = {
  "R&B / Pop":        "from-purple-900/60 to-transparent",
  "Pop / R&B":        "from-amber-900/60 to-transparent",
  "Pop / Country":    "from-blue-900/60 to-transparent",
  "Hip-Hop":          "from-slate-800/60 to-transparent",
  "Latin / Reggaeton":"from-green-900/60 to-transparent",
  "Rock / Pop":       "from-sky-900/60 to-transparent",
};

const GENRE_INITIALS: Record<string, string> = {
  "R&B / Pop":        "W",
  "Pop / R&B":        "B",
  "Pop / Country":    "TS",
  "Hip-Hop":          "KL",
  "Latin / Reggaeton":"BB",
  "Rock / Pop":       "CP",
};

const GENRE_ACCENT: Record<string, string> = {
  "R&B / Pop":        "bg-purple-800",
  "Pop / R&B":        "bg-amber-700",
  "Pop / Country":    "bg-blue-800",
  "Hip-Hop":          "bg-slate-700",
  "Latin / Reggaeton":"bg-green-800",
  "Rock / Pop":       "bg-sky-800",
};

interface Props {
  event: Event;
  totalListings: number;
}

export default function EventHeader({ event, totalListings }: Props) {
  const gradient = GENRE_COLORS[event.genre] ?? "from-slate-900/60 to-transparent";
  const initials = GENRE_INITIALS[event.genre] ?? event.artist[0];
  const accent = GENRE_ACCENT[event.genre] ?? "bg-slate-700";

  return (
    <div className={`bg-gradient-to-r ${gradient} border-b border-slate-800`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-xl ${accent} flex items-center justify-center text-white text-xl font-black flex-shrink-0`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-0.5">
              {event.genre}
            </p>
            <h1 className="text-slate-50 text-2xl sm:text-3xl font-black leading-tight truncate">
              {event.artist}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.venue} &middot; {event.city}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.date} &middot; {event.time}
              </span>
            </div>
          </div>

          <div className="sm:text-right flex-shrink-0">
            <p className="text-slate-600 text-xs uppercase tracking-wider">Listings</p>
            <p className="text-slate-100 text-3xl font-black tabular-nums">{totalListings}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
