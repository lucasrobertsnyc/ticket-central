"use client";

import Link from "next/link";
import type { Event } from "@/types/ticket";
import { SPORT_GENRES, parseMatchup, getTeam, logoUrl } from "@/lib/teams";

const GENRE_ACCENT: Record<string, string> = {
  "R&B / Pop":         "#7c3aed",
  "Pop / R&B":         "#d97706",
  "Pop / Country":     "#2563eb",
  "Hip-Hop":           "#374151",
  "Latin / Reggaeton": "#059669",
  "Rock / Pop":        "#0284c7",
  "NFL":               "#15803d",
  "NBA":               "#c2410c",
  "MLB":               "#1d4ed8",
  "NHL":               "#0369a1",
  "MLS":               "#166534",
};

// ── Shared event info block ────────────────────────────────────────────────────
function EventInfo({ event }: { event: Event }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {event.genre}
      </p>
      <h1 className="text-gray-900 font-extrabold text-3xl sm:text-4xl leading-tight">
        {event.artist}
      </h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-gray-500 text-sm">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-700 font-medium">{event.venue}</span>
          <span>&middot; {event.city}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {event.date} &middot; {event.time}
        </span>
      </div>
    </div>
  );
}

// ── CONCERT HEADER ────────────────────────────────────────────────────────────
function ConcertHeader({ event, totalListings }: { event: Event; totalListings: number }) {
  const accent = GENRE_ACCENT[event.genre] ?? "#374151";

  return (
    <div className="relative overflow-hidden bg-white border-b border-gray-200">

      {/* Artist image panel — right 45% on desktop */}
      <div className="absolute inset-y-0 right-0 w-[45%] hidden sm:block">
        <img
          src={event.imageUrl}
          alt={event.artist}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.9 }}
        />
        {/* Fade image into white on the left */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, white 0%, transparent 40%)" }} />
        {/* Subtle bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
      </div>

      {/* Mobile: faint blurred bg image */}
      <div className="absolute inset-0 sm:hidden">
        <img
          src={event.imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.08, filter: "blur(4px)", transform: "scale(1.06)" }}
        />
      </div>

      {/* Accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.5 }} />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <Link href="/" className="hover:text-gray-700 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/?category=concerts" className="hover:text-gray-700 transition">Concerts</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-500">{event.artist}</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="sm:max-w-[55%]">
            <EventInfo event={event} />
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Available</p>
            <p className="text-gray-900 font-extrabold text-2xl tabular-nums leading-tight">
              {totalListings}
              <span className="text-base font-medium text-gray-400 ml-1">listings</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SPORTS HEADER ─────────────────────────────────────────────────────────────
function SportsHeader({ event, totalListings }: { event: Event; totalListings: number }) {
  const matchup = parseMatchup(event.artist);
  const team1   = matchup ? getTeam(matchup[0]) : null;
  const team2   = matchup ? getTeam(matchup[1]) : null;
  const logo1   = team1 ? logoUrl(team1) : "";
  const logo2   = team2 ? logoUrl(team2) : "";
  const accent  = GENRE_ACCENT[event.genre] ?? "#374151";

  return (
    <div className="relative overflow-hidden bg-white border-b border-gray-200">

      {/* Subtle team-colour halves */}
      {team1 && team2 && (
        <>
          <div className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: team1.primary, opacity: 0.08 }} />
          <div className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: team2.primary, opacity: 0.08 }} />
        </>
      )}

      {/* Watermark logos */}
      {logo1 && team1 && (
        <div className="absolute left-[4%] top-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none" style={{ opacity: 0.1 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team1.primary }}>
            <img src={logo1} alt="" aria-hidden className="w-36 h-36 object-contain" />
          </div>
        </div>
      )}
      {logo2 && team2 && (
        <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none" style={{ opacity: 0.1 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team2.primary }}>
            <img src={logo2} alt="" aria-hidden className="w-36 h-36 object-contain" />
          </div>
        </div>
      )}

      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.5 }} />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <Link href="/" className="hover:text-gray-700 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/?category=sports" className="hover:text-gray-700 transition">Sports</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-500">{event.artist}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Team logo squares */}
          {team1 && team2 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-gray-200"
                style={{ backgroundColor: team1.primary }}
              >
                {logo1
                  ? <img src={logo1} alt={matchup?.[0] ?? ""} className="w-11 h-11 sm:w-14 sm:h-14 object-contain" />
                  : <span className="text-white font-black text-xl">{team1.abbr}</span>
                }
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <span className="text-gray-300 font-black text-lg leading-none">VS</span>
                <div className="w-px h-4 bg-gray-200" />
              </div>

              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-gray-200"
                style={{ backgroundColor: team2.primary }}
              >
                {logo2
                  ? <img src={logo2} alt={matchup?.[1] ?? ""} className="w-11 h-11 sm:w-14 sm:h-14 object-contain" />
                  : <span className="text-white font-black text-xl">{team2.abbr}</span>
                }
              </div>
            </div>
          )}

          <EventInfo event={event} />

          <div className="flex-shrink-0 sm:text-right mt-2 sm:mt-0">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Available</p>
            <p className="text-gray-900 font-extrabold text-2xl tabular-nums leading-tight">
              {totalListings}
              <span className="text-base font-medium text-gray-400 ml-1">listings</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  event: Event;
  totalListings: number;
}

export default function EventHeader({ event, totalListings }: Props) {
  return SPORT_GENRES.has(event.genre)
    ? <SportsHeader event={event} totalListings={totalListings} />
    : <ConcertHeader event={event} totalListings={totalListings} />;
}
