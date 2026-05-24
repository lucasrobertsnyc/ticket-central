"use client";

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

// ── Accent line colour per genre ─────────────────────────────────────────────
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

// ── Breadcrumb category label ─────────────────────────────────────────────────
function categoryLabel(genre: string) {
  if (genre === "NFL" || genre === "NBA" || genre === "MLB" || genre === "NHL" || genre === "MLS")
    return "Sports";
  return "Concerts";
}

// ── Sports header — split team-colour background with ESPN logos ──────────────
function SportsHeader({ event }: { event: Event }) {
  const matchup = parseMatchup(event.artist);
  const team1 = matchup ? getTeam(matchup[0]) : null;
  const team2 = matchup ? getTeam(matchup[1]) : null;
  const logo1 = team1 ? logoUrl(team1) : "";
  const logo2 = team2 ? logoUrl(team2) : "";

  const accent = GENRE_ACCENT[event.genre] ?? "#374151";

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: GENRE_DARK_BG[event.genre] ?? "#0d0d0d" }}>
      {/* ── Split team-colour bands ─────────────────────────── */}
      {team1 && team2 && (
        <>
          {/* Left half — team 1 colour */}
          <div
            className="absolute inset-y-0 left-0 w-1/2"
            style={{ backgroundColor: team1.primary, opacity: 0.35 }}
          />
          {/* Right half — team 2 colour */}
          <div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{ backgroundColor: team2.primary, opacity: 0.35 }}
          />
          {/* Subtle centre blend */}
          <div className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 35%, rgba(0,0,0,0.55) 50%, transparent 65%)`,
            }}
          />
        </>
      )}

      {/* ── Team logos — large, blurred, dimmed in background ── */}
      {logo1 && (
        <img
          src={logo1}
          alt=""
          aria-hidden="true"
          className="absolute left-[5%] top-1/2 -translate-y-1/2 w-36 h-36 object-contain pointer-events-none select-none"
          style={{ opacity: 0.12, filter: "blur(1px) saturate(0.7)" }}
        />
      )}
      {logo2 && (
        <img
          src={logo2}
          alt=""
          aria-hidden="true"
          className="absolute right-[5%] top-1/2 -translate-y-1/2 w-36 h-36 object-contain pointer-events-none select-none"
          style={{ opacity: 0.12, filter: "blur(1px) saturate(0.7)" }}
        />
      )}

      {/* ── Diagonal texture ───────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg,rgba(0,0,0,0.06) 0,rgba(0,0,0,0.06) 1px,transparent 0,transparent 10px)",
        }}
      />

      {/* ── Gradient overlays for text readability ──────────────── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* ── Accent line ──────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.6 }} />

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-7">
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

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Team logo pair */}
          {team1 && team2 && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: team1.primary }}>
                {logo1
                  ? <img src={logo1} alt={matchup?.[0] ?? ""} className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
                  : <span className="text-white font-black text-lg">{team1.abbr}</span>
                }
              </div>
              <div className="text-white/30 font-bold text-xs">VS</div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: team2.primary }}>
                {logo2
                  ? <img src={logo2} alt={matchup?.[1] ?? ""} className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
                  : <span className="text-white font-black text-lg">{team2.abbr}</span>
                }
              </div>
            </div>
          )}

          {/* Text info */}
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

          {/* Listing count */}
          <div className="flex-shrink-0 sm:text-right">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Available</p>
            <p className="text-white font-extrabold text-2xl tabular-nums leading-tight">
              {/* passed as prop below */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Concert header — artist photo blurred in background ───────────────────────
function ConcertHeader({ event }: { event: Event }) {
  const bg     = GENRE_DARK_BG[event.genre] ?? "#0d0d0d";
  const accent = GENRE_ACCENT[event.genre]  ?? "#374151";

  return (
    <div style={{ backgroundColor: bg }} className="relative overflow-hidden">
      {/* Blurred artist photo */}
      <img
        src={event.imageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 0.22, filter: "blur(2px) saturate(0.6)", transform: "scale(1.05)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: accent, opacity: 0.6 }} />

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
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  event: Event;
  totalListings: number;
}

// ── Wrapper — chooses sports vs concert layout, injects listing count ─────────

export default function EventHeader({ event, totalListings }: Props) {
  const isSport = SPORT_GENRES.has(event.genre);
  const accent  = GENRE_ACCENT[event.genre] ?? "#374151";

  if (isSport) {
    // Render the sports header, then bolt the listing-count badge on top via a
    // wrapper so we don't need to thread the prop through both sub-components.
    return (
      <div className="relative">
        <SportsHeader event={event} />
        {/* Listing count — absolutely positioned top-right of the header */}
        <div className="absolute right-4 sm:right-6 bottom-7 text-right">
          <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Available</p>
          <p className="text-white font-extrabold text-2xl tabular-nums leading-tight">
            {totalListings}
            <span className="text-base font-medium text-white/40 ml-1">listings</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ConcertHeader event={event} />
      <div className="absolute right-4 sm:right-6 bottom-7 text-right">
        <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Available</p>
        <p className="text-white font-extrabold text-2xl tabular-nums leading-tight">
          {totalListings}
          <span className="text-base font-medium text-white/40 ml-1">listings</span>
        </p>
      </div>
    </div>
  );
}
