"use client";

import { memo } from "react";
import Link from "next/link";
import type { Event } from "@/types/ticket";
import { SPORT_GENRES, TEAM_INFO, parseMatchup, getTeam, logoUrl, type TeamInfo } from "@/lib/teams";

// Dark fallback shown behind the image while it loads / if it 404s
const GENRE_FALLBACK_BG: Record<string, string> = {
  // Concerts
  "R&B / Pop":         "#0f0a1a",
  "Pop / R&B":         "#150e05",
  "Pop / Country":     "#060d1c",
  "Hip-Hop":           "#0d0d0d",
  "Latin / Reggaeton": "#061410",
  "Rock / Pop":        "#070e18",
  // Major pro sports
  "NFL":               "#060f08",
  "NBA":               "#160800",
  "MLB":               "#060a18",
  "NHL":               "#060c18",
  "MLS":               "#070f0a",
  // Minor / women's leagues
  "WNBA":              "#160800",
  "MiLB":              "#060a18",
  "AHL":               "#060c18",
  "ECHL":              "#060c18",
  "NWSL":              "#070f0a",
  "G-League":          "#160800",
  "AFL":               "#060f08",
  "CFL":               "#060f08",
  "Soccer":            "#070f0a",
};

function TeamPanel({
  name, team, side,
}: {
  name: string | null;
  team: ReturnType<typeof getTeam>;
  side: "left" | "right" | "center";
}) {
  const logo = team.espnId ? logoUrl(team) : null;
  const gradient = side === "left"
    ? "repeating-linear-gradient(135deg,rgba(0,0,0,0.06) 0,rgba(0,0,0,0.06) 1px,transparent 0,transparent 8px)"
    : "repeating-linear-gradient(-135deg,rgba(0,0,0,0.06) 0,rgba(0,0,0,0.06) 1px,transparent 0,transparent 8px)";

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: team.primary }}>
      <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
      {logo ? (
        <img src={logo} alt={name ?? ""} loading="lazy"
          className={`relative object-contain drop-shadow-lg ${side === "center" ? "w-20 h-20" : "w-16 h-16"}`}
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
      ) : (
        <span className={`relative font-black ${side === "center" ? "text-4xl" : "text-3xl"}`}
          style={{ color: team.secondary }}>{team.abbr}</span>
      )}
      {name && (
        <span className="relative text-[9px] font-bold uppercase tracking-wider mt-1.5 opacity-80"
          style={{ color: team.secondary }}>{name}</span>
      )}
    </div>
  );
}

function SportHero({ event }: { event: Event }) {
  const matchup = parseMatchup(event.artist);

  // Matchup event (Team A vs Team B)
  if (matchup) {
    const team1 = getTeam(matchup[0], event.genre);
    const team2 = getTeam(matchup[1], event.genre);
    return (
      <div className="relative h-40 overflow-hidden flex">
        <TeamPanel name={matchup[0]} team={team1} side="left" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
            <span className="text-white text-[9px] font-black tracking-tight">VS</span>
          </div>
        </div>
        <TeamPanel name={matchup[1]} team={team2} side="right" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-block bg-black/55 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{event.genre}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-2.5 pointer-events-none">
          <h3 className="text-white font-extrabold text-base leading-tight drop-shadow">{event.artist}</h3>
        </div>
      </div>
    );
  }

  // Single-team event — look up the team from the full artist name and show one centered logo
  const team = getTeam(event.artist, event.genre);
  return (
    <div className="relative h-40 overflow-hidden flex">
      <TeamPanel name={null} team={team} side="center" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-block bg-black/55 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{event.genre}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-2.5 pointer-events-none">
        <h3 className="text-white font-extrabold text-base leading-tight drop-shadow">{event.artist}</h3>
      </div>
    </div>
  );
}

interface Props {
  event: Event;
}

export default memo(function EventCard({ event }: Props) {
  const fallback = GENRE_FALLBACK_BG[event.genre] ?? "#111";
  const isSport = SPORT_GENRES.has(event.genre);

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">

        {isSport ? (
          <SportHero event={event} />
        ) : (
          /* ── Concert image ─────────────────────────── */
          <div className="relative h-40 overflow-hidden" style={{ backgroundColor: fallback }}>
            <img
              src={event.imageUrl}
              alt={event.artist}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <span className="inline-block bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                {event.genre}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-6">
              <h3 className="text-white font-extrabold text-xl leading-tight drop-shadow">
                {event.artist}
              </h3>
            </div>
          </div>
        )}

        {/* ── Event details ────────────────────────── */}
        <div className="px-3.5 pt-3 pb-3.5">
          <div className="space-y-1 mb-3">
            <p className="text-sm flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-gray-900 truncate">{event.venue}</span>
              <span className="text-gray-400 flex-shrink-0">&middot; {event.city}</span>
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
              {event.lowestAllInPrice > 0 ? (
                <>
                  <p className="text-gray-400 text-xs">Tickets from</p>
                  <p className="text-gray-900 font-extrabold text-xl tabular-nums leading-tight">
                    ${event.lowestAllInPrice}
                    <span className="text-gray-400 text-xs font-normal ml-1">all-in</span>
                  </p>
                </>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1.5">
                {event.listingCount > 0 ? `${event.listingCount} listings` : ""}
              </p>
              <span className="inline-block bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors">
                Compare prices
              </span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
});
