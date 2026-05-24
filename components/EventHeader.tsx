"use client";

import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/types/ticket";
import { SPORT_GENRES, parseMatchup, getTeam, logoUrl } from "@/lib/teams";

// ── Dark base colours per genre ───────────────────────────────────────────────
const GENRE_DARK_BG: Record<string, string> = {
  "R&B / Pop":         "#0f0a1a",
  "Pop / R&B":         "#150e05",
  "Pop / Country":     "#060d1c",
  "Hip-Hop":           "#0d0d0d",
  "Latin / Reggaeton": "#061410",
  "Rock / Pop":        "#070e18",
  "NFL":               "#060f08",
  "NBA":               "#160800",
  "MLB":               "#060a18",
  "NHL":               "#060c18",
  "MLS":               "#070f0a",
};

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

function breadcrumbCategory(genre: string) {
  return SPORT_GENRES.has(genre) ? "Sports" : "Concerts";
}

// ── Shared event info block ────────────────────────────────────────────────────
function EventInfo({ event }: { event: Event }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
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
  );
}

// ── CONCERT HEADER ────────────────────────────────────────────────────────────
// Image shown as a featured panel on the RIGHT at full opacity (same as the
// EventCard on the home page), rather than a heavily cropped full-bleed bg.
// A gradient bleeds the dark bg colour into the left edge of the image.

function ConcertHeader({ event, totalListings }: { event: Event; totalListings: number }) {
  const bg     = GENRE_DARK_BG[event.genre] ?? "#0d0d0d";
  const accent = GENRE_ACCENT[event.genre]  ?? "#374151";

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: bg }}>

      {/* ── Right: artist image panel ────────────────────────────────────────
          Shown at real size/opacity — matches how EventCard displays it.
          Width: 45% on sm+, hidden on mobile (image would be tiny).         */}
      <div className="absolute inset-y-0 right-0 w-[45%] hidden sm:block">
        <img
          src={event.imageUrl}
          alt={event.artist}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.85 }}
        />
        {/* Gradient: bg colour bleeds from left into the image */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${bg} 0%, transparent 45%)` }}
        />
        {/* Top + bottom darkening */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* ── Full-bleed dim copy for mobile (fills entire bg at low opacity) ── */}
      <div className="absolute inset-0 sm:hidden">
        <img
          src={event.imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.18, filter: "blur(4px)", transform: "scale(1.06)" }}
        />
      </div>

      {/* ── Global overlays ──────────────────────────────────────────────────── */}
      {/* Left-side readability gradient (covers text area) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      {/* Bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.65 }} />

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
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

        <div className="flex items-end justify-between gap-6">
          {/* Left: all text info — constrained to left 55% so it doesn't bleed into the image */}
          <div className="sm:max-w-[55%]">
            <EventInfo event={event} />
          </div>

          {/* Listing count — bottom-right */}
          <div className="flex-shrink-0 text-right">
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

// ── SPORTS HEADER ─────────────────────────────────────────────────────────────
// Split team-colour bands + large ESPN logos visible in both background and
// foreground. Background logos are bigger and at higher opacity than before.

function SportsHeader({ event, totalListings }: { event: Event; totalListings: number }) {
  const matchup = parseMatchup(event.artist);
  const team1   = matchup ? getTeam(matchup[0]) : null;
  const team2   = matchup ? getTeam(matchup[1]) : null;
  const logo1   = team1 ? logoUrl(team1) : "";
  const logo2   = team2 ? logoUrl(team2) : "";
  const accent  = GENRE_ACCENT[event.genre] ?? "#374151";
  const bg      = GENRE_DARK_BG[event.genre] ?? "#0d0d0d";

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: bg }}>

      {/* ── Split team-colour halves ─── */}
      {team1 && team2 && (
        <>
          <div className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: team1.primary, opacity: 0.55 }} />
          <div className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: team2.primary, opacity: 0.55 }} />
        </>
      )}

      {/* ── Background logo watermarks ─────────────────────────────────────────
          Each logo sits inside a solid team-colour circle. mix-blend-mode:multiply
          on the <img> makes white pixels invisible (white × color = color), so
          only the logo mark shows. The outer div at opacity:0.25 fades the whole
          thing into the background without a bright white box.               */}
      {logo1 && team1 && (
        <div className="absolute left-[4%] top-1/2 -translate-y-1/2 w-56 h-56 pointer-events-none" style={{ opacity: 0.25 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team1.primary }}>
            <img src={logo1} alt="" aria-hidden className="w-44 h-44 object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>
      )}
      {logo2 && team2 && (
        <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-56 h-56 pointer-events-none" style={{ opacity: 0.25 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team2.primary }}>
            <img src={logo2} alt="" aria-hidden className="w-44 h-44 object-contain" style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>
      )}

      {/* ── Centre shadow + diagonal texture ─── */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent 25%, rgba(0,0,0,0.65) 50%, transparent 75%)" }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(135deg,rgba(0,0,0,0.05) 0,rgba(0,0,0,0.05) 1px,transparent 0,transparent 10px)" }}
      />

      {/* ── Readability overlays ─── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* ── Accent line ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.6 }} />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-white/30 text-xs mb-4">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/" className="hover:text-white/60 transition">Sports</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white/50">{event.artist}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">

          {/* Team logo squares — larger than before */}
          {team1 && team2 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Team 1 */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10"
                style={{ backgroundColor: team1.primary }}
              >
                {logo1
                  ? <img src={logo1} alt={matchup?.[0] ?? ""} className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow-xl" />
                  : <span className="text-white font-black text-xl">{team1.abbr}</span>
                }
              </div>

              {/* VS badge */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white/20 font-black text-lg leading-none">VS</span>
                <div className="w-px h-4 bg-white/10" />
              </div>

              {/* Team 2 */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10"
                style={{ backgroundColor: team2.primary }}
              >
                {logo2
                  ? <img src={logo2} alt={matchup?.[1] ?? ""} className="w-11 h-11 sm:w-14 sm:h-14 object-contain drop-shadow-xl" />
                  : <span className="text-white font-black text-xl">{team2.abbr}</span>
                }
              </div>
            </div>
          )}

          {/* Text info */}
          <EventInfo event={event} />

          {/* Listing count */}
          <div className="flex-shrink-0 sm:text-right mt-2 sm:mt-0">
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
