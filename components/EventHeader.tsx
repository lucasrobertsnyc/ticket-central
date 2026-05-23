"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";

// Very dark single-color backgrounds — used as the base colour so the header
// looks great even before the image loads or when no image is available.
const GENRE_DARK_BG: Record<string, string> = {
  "R&B / Pop":         "#0f0a1a",
  "Pop / R&B":         "#150e05",
  "Pop / Country":     "#060d1c",
  "Hip-Hop":           "#0d0d0d",
  "Latin / Reggaeton": "#061410",
  "Rock / Pop":        "#070e18",
};

// Accent line at the bottom edge of the header
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
  totalListings: number;
}

export default function EventHeader({ event, totalListings }: Props) {
  const bg   = GENRE_DARK_BG[event.genre] ?? "#0d0d0d";
  const line = GENRE_ACCENT[event.genre]  ?? "#374151";

  return (
    <div style={{ backgroundColor: bg }} className="relative overflow-hidden">

      {/* ── Artist photo (blurred, dimmed) ────────── */}
      <img
        src={event.imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 0.18, filter: "blur(2px) saturate(0.6)", transform: "scale(1.05)" }}
      />

      {/* Dark gradient overlay — keeps text readable regardless of photo content */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Thin accent line at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ backgroundColor: line, opacity: 0.6 }}
      />

      {/* ── Content ───────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-7">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-white/30 text-xs mb-4">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/" className="hover:text-white/60 transition">Concerts</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white/50">{event.artist}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5">
              {event.genre}
            </p>
            <h1 className="text-white font-extrabold text-3xl sm:text-4xl leading-tight">
              {event.artist}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-white/50 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white/80 font-medium">{event.venue}</span>
                <span>&middot; {event.city}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.date} &middot; {event.time}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 sm:text-right">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Available</p>
            <p className="text-white font-extrabold text-2xl tabular-nums leading-tight">
              {totalListings}
              <span className="text-base font-medium text-white/40 ml-1">listings</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
