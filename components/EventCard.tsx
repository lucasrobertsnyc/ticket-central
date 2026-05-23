"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

// Photo-style gradient backgrounds — dark enough for white text overlay
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
}

export default function EventCard({ event }: Props) {
  const bg = GENRE_BG[event.genre] ?? "from-gray-900 via-gray-800 to-gray-900";

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-150 hover:shadow-md hover:border-gray-300">
        {/* Photo-style header */}
        <div className={`h-32 bg-gradient-to-br ${bg} relative overflow-hidden flex flex-col justify-end p-4`}>
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider block mb-1">
              {event.genre}
            </span>
            <h3 className="text-white font-extrabold text-xl leading-tight drop-shadow">
              {event.artist}
            </h3>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="space-y-1.5 mb-4">
            <p className="text-gray-700 text-sm flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-900">{event.venue}</span>
              <span className="text-gray-400">&middot; {event.city}</span>
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
