"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

const GENRE_COLORS: Record<string, { bar: string; text: string }> = {
  "R&B / Pop":        { bar: "bg-gradient-to-r from-purple-700 to-pink-600",  text: "text-purple-300" },
  "Pop / R&B":        { bar: "bg-gradient-to-r from-amber-600 to-orange-500", text: "text-amber-300"  },
  "Pop / Country":    { bar: "bg-gradient-to-r from-blue-700 to-indigo-600",  text: "text-blue-300"   },
  "Hip-Hop":          { bar: "bg-gradient-to-r from-slate-700 to-zinc-600",   text: "text-slate-300"  },
  "Latin / Reggaeton":{ bar: "bg-gradient-to-r from-green-700 to-teal-600",   text: "text-green-300"  },
  "Rock / Pop":       { bar: "bg-gradient-to-r from-sky-700 to-blue-600",     text: "text-sky-300"    },
};

const INITIALS: Record<string, string> = {
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
  const colors = GENRE_COLORS[event.genre] ?? { bar: "bg-gradient-to-r from-slate-700 to-slate-600", text: "text-slate-300" };
  const initials = INITIALS[event.genre] ?? event.artist[0];

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all duration-150 group-hover:border-slate-600 group-hover:shadow-lg group-hover:shadow-black/30">
        {/* Color bar + initials */}
        <div className={`h-1.5 ${colors.bar}`} />
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg ${colors.bar} flex items-center justify-center flex-shrink-0 text-white text-sm font-black`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-100 font-bold text-base leading-tight group-hover:text-white transition-colors truncate">
                {event.artist}
              </h3>
              <span className={`text-xs font-medium ${colors.text}`}>{event.genre}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-sm mb-4">
            <p className="text-slate-400 flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.venue} · {event.city}
            </p>
            <p className="text-slate-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {event.date} · {event.time}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <p className="text-slate-600 text-xs">From</p>
              <p className="text-slate-100 font-bold text-lg tabular-nums leading-tight">
                ${event.lowestAllInPrice}
                <span className="text-slate-600 text-xs font-normal ml-1">all-in</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-600 text-xs mb-1">{event.listingCount} listings</p>
              <span className="inline-block bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                Compare prices
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
