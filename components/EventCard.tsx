"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

const GENRE_GRADIENTS: Record<string, string> = {
  "R&B / Pop":        "from-purple-600 via-pink-500 to-rose-400",
  "Pop / R&B":        "from-yellow-500 via-orange-500 to-pink-500",
  "Pop / Country":    "from-blue-500 via-purple-500 to-pink-400",
  "Hip-Hop":          "from-zinc-700 via-zinc-600 to-stone-500",
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
}

export default function EventCard({ event }: Props) {
  const gradient = GENRE_GRADIENTS[event.genre] ?? "from-zinc-600 via-zinc-500 to-zinc-400";
  const initials = GENRE_INITIALS[event.genre] ?? event.artist[0];

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden transition-all duration-200 group-hover:border-zinc-500 group-hover:shadow-xl group-hover:shadow-black/40 group-hover:-translate-y-1">
        {/* Artist avatar banner */}
        <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
          <span className="text-white text-4xl font-black tracking-tight drop-shadow-md">
            {initials}
          </span>
          {/* decorative blobs */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10" />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-white font-black text-lg leading-tight group-hover:text-pink-300 transition-colors">
              {event.artist}
            </h3>
            <span className="flex-shrink-0 text-xs font-semibold bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
              {event.genre}
            </span>
          </div>

          <div className="space-y-1 text-zinc-400 text-sm mb-4">
            <p className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{event.venue} · {event.city}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {event.date} · {event.time}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-700">
            <div>
              <p className="text-zinc-500 text-xs">From</p>
              <p className="text-white font-black text-xl">
                ${event.lowestAllInPrice}
                <span className="text-zinc-500 text-xs font-normal ml-1">all-in</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs">{event.listingCount} listings</p>
              <span className="inline-block mt-1 bg-pink-600 group-hover:bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                View deals →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
