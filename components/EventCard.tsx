"use client";

import { memo } from "react";
import Link from "next/link";
import type { Event } from "@/types/ticket";
import { SPORT_GENRES, parseMatchup, getTeam, logoUrl } from "@/lib/teams";

const GENRE_FALLBACK_BG: Record<string, string> = {
  // Concerts
  "R&B / Pop":         "#0f0a1a",
  "Pop / R&B":         "#150e05",
  "Pop / Country":     "#060d1c",
  "Hip-Hop":           "#0d0d0d",
  "Latin / Reggaeton": "#061410",
  "Rock / Pop":        "#070e18",
  "Music":             "#0a0618",
  "Jazz / Blues":      "#06100a",
  "Alternative":       "#0c0818",
  "Country":           "#120a04",
  // Theatre / Shows
  "Theater":           "#1a0608",
  "Shows":             "#0a0618",
  "Comedy":            "#12100a",
  "Family":            "#060a1a",
  // Major pro sports
  "NFL":    "#060f08",
  "NBA":    "#160800",
  "MLB":    "#060a18",
  "NHL":    "#060c18",
  "MLS":    "#070f0a",
  // Minor / women's leagues
  "WNBA":      "#160800",
  "MiLB":      "#060a18",
  "AHL":       "#060c18",
  "ECHL":      "#060c18",
  "NWSL":      "#070f0a",
  "G-League":  "#160800",
  "AFL":       "#060f08",
  "CFL":       "#060f08",
  "Soccer":    "#070f0a",
  "Golf":      "#061208",
  "Tennis":    "#0a1206",
  "Fighting":  "#120608",
  "Motorsports": "#100a04",
};

// SVG icon paths for genre categories (viewBox 0 0 24 24)
const GENRE_ICON: Record<string, React.ReactNode> = {
  Music:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
  "Jazz / Blues": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
  Alternative: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
  Country:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
  Theater: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </>
  ),
  Comedy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
  Shows: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </>
  ),
  Family: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  Golf: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3m4-3v3m4-3v3" />,
  Fighting: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
  Motorsports: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
};

// Gradient overlays per genre group for no-image cards
const GENRE_GRADIENT: Record<string, string> = {
  Music:       "from-purple-900/80 via-purple-800/40",
  "Jazz / Blues": "from-green-900/80 via-green-800/40",
  Alternative: "from-violet-900/80 via-violet-800/40",
  Country:     "from-amber-900/80 via-amber-800/40",
  Theater:     "from-red-900/80 via-red-800/40",
  Comedy:      "from-yellow-900/80 via-yellow-800/40",
  Shows:       "from-blue-900/80 via-blue-800/40",
  Family:      "from-sky-900/80 via-sky-800/40",
  Golf:        "from-green-900/80 via-green-800/40",
  Fighting:    "from-red-900/80 via-red-800/40",
  Motorsports: "from-orange-900/80 via-orange-800/40",
};

function GenreHero({ event }: { event: Event }) {
  const bg = GENRE_FALLBACK_BG[event.genre] ?? "#111";
  const gradient = GENRE_GRADIENT[event.genre] ?? "from-gray-900/80 via-gray-800/40";
  const icon = GENRE_ICON[event.genre];

  return (
    <div className="relative h-40 overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: bg }}>
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      {/* Colored glow */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradient} to-transparent`} />
      {/* Icon */}
      {icon && (
        <div className="relative z-10 mb-2 opacity-60">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </div>
      )}
      {/* Genre badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-block bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
          {event.genre}
        </span>
      </div>
      {/* Event name */}
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-6 z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <h3 className="relative text-white font-extrabold text-base leading-tight drop-shadow line-clamp-2">
          {event.artist}
        </h3>
      </div>
    </div>
  );
}

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
  /** When set, card links here (new tab) instead of the internal event detail page. */
  externalHref?: string;
  /** Override the CTA button label. Defaults to "Compare prices". */
  ctaLabel?: string;
}

export default memo(function EventCard({ event, externalHref, ctaLabel = "Compare prices" }: Props) {
  const isSport = SPORT_GENRES.has(event.genre);
  const hasImage = !!event.imageUrl;

  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">

      {isSport ? (
        <SportHero event={event} />
      ) : hasImage ? (
        <div className="relative h-40 overflow-hidden" style={{ backgroundColor: GENRE_FALLBACK_BG[event.genre] ?? "#111" }}>
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
      ) : (
        <GenreHero event={event} />
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
              {event.listingCount > 0 ? `${event.listingCount} tickets` : ""}
            </p>
            <span className="inline-block bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors">
              {ctaLabel}
            </span>
          </div>
        </div>
      </div>

    </div>
  );

  if (externalHref) {
    return (
      <a href={externalHref} target="_blank" rel="noopener noreferrer" className="group block">
        {inner}
      </a>
    );
  }
  return (
    <Link href={`/events/${event.id}`} className="group block">
      {inner}
    </Link>
  );
});
