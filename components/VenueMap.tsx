"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { TicketListing, SectionType, Platform } from "@/types/ticket";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  listings: TicketListing[];
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (type: SectionType) => void;
  onClearSectionTypes: () => void;
  genre?: string;
  venue?: string;
  /** "card" = compact widget with border (default); "panel" = fills parent div, no card chrome */
  mode?: "card" | "panel";
}

interface MapProps {
  activeSectionTypes: SectionType[];
  hoveredZone: SectionType | null;
  onSectionTypeToggle: (t: SectionType) => void;
  onZoneHover: (t: SectionType | null) => void;
  genre?: string;
  venue?: string;
  showBadges?: boolean;
  minByType?: Record<SectionType, number | null>;
  countByType?: Record<SectionType, number>;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const CLR: Record<SectionType, { base: string; act: string; dim: string }> = {
  floor: { base: "#22c55e", act: "#16a34a", dim: "rgba(34,197,94,0.25)"   },
  lower: { base: "#3b82f6", act: "#2563eb", dim: "rgba(59,130,246,0.25)"  },
  club:  { base: "#06b6d4", act: "#0891b2", dim: "rgba(6,182,212,0.25)"   },
  upper: { base: "#8b5cf6", act: "#7c3aed", dim: "rgba(139,92,246,0.25)"  },
  suite: { base: "#f59e0b", act: "#d97706", dim: "rgba(245,158,11,0.25)"  },
};

const MAP_BG = "#ffffff";
const SECTION_STROKE = "#ffffff";
const INK = "rgba(15,23,42,0.72)";
const INK_DIM = "rgba(15,23,42,0.28)";

const GRS = { base: "#22c55e", act: "#16a34a", dim: "rgba(34,197,94,0.25)" };

function fieldFill(hov: SectionType | null, active: SectionType[]): string {
  if (hov === "floor") return GRS.act;
  if (active.length > 0 && !active.includes("floor")) return GRS.dim;
  if (active.includes("floor")) return GRS.act;
  return GRS.base;
}

function zoneFill(type: SectionType, hov: SectionType | null, active: SectionType[]): string {
  if (hov === type) return CLR[type].act;
  if (active.length > 0 && !active.includes(type)) return CLR[type].dim;
  if (active.includes(type)) return CLR[type].act;
  return CLR[type].base;
}

/** Build a curved trapezoid SVG path for a section between two elliptic rings */
function sectionPolygonPath(
  cx: number, cy: number,
  iRx: number, iRy: number,
  oRx: number, oRy: number,
  startRad: number, endRad: number
): string {
  const ix1 = cx + iRx * Math.sin(startRad), iy1 = cy - iRy * Math.cos(startRad);
  const ix2 = cx + iRx * Math.sin(endRad),   iy2 = cy - iRy * Math.cos(endRad);
  const ox1 = cx + oRx * Math.sin(startRad), oy1 = cy - oRy * Math.cos(startRad);
  const ox2 = cx + oRx * Math.sin(endRad),   oy2 = cy - oRy * Math.cos(endRad);
  // Large arc flag — always 0 for sections < 180°
  return [
    `M ${ix1} ${iy1}`,
    `L ${ox1} ${oy1}`,
    `A ${oRx} ${oRy} 0 0 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${iRx} ${iRy} 0 0 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

// ── Data helpers ──────────────────────────────────────────────────────────────

const ALL_ZONES: SectionType[] = ["floor", "lower", "club", "upper", "suite"];

function useZoneData(listings: TicketListing[]) {
  return useMemo(() => ({
    minByType: Object.fromEntries(ALL_ZONES.map((t) => {
      const g = listings.filter(l => l.sectionType === t);
      return [t, g.length > 0 ? Math.min(...g.map(l => l.allInTotal)) : null];
    })) as Record<SectionType, number | null>,
    countByType: Object.fromEntries(ALL_ZONES.map((t) => [
      t, listings.filter(l => l.sectionType === t).length,
    ])) as Record<SectionType, number>,
  }), [listings]);
}

function getZoneLabel(type: SectionType, genre: string): string {
  if (type === "floor") {
    if (genre === "NBA") return "Courtside";
    if (genre === "NHL") return "Rinkside";
    if (genre === "MLB" || genre === "NFL") return "Field Level";
    return "GA Floor";
  }
  if (type === "club" && genre === "MLB") return "Mezzanine";
  const labels: Record<SectionType, string> = {
    floor: "GA Floor", lower: "Lower Bowl",
    club: "Club Level", upper: "Upper Deck", suite: "Suites",
  };
  return labels[type];
}

const PLAT_COLORS: Record<Platform, string> = {
  SeatGeek:      "#10b981",
  StubHub:       "#3b82f6",
  "Vivid Seats": "#7c3aed",
  TickPick:      "#f59e0b",
  GameTime:      "#f97316",
  Ticketmaster:  "#0ea5e9",
  AXS:           "#ef4444",
};

const fmt = (n: number) => `$${n}`;
const toRad = (d: number) => (d * Math.PI) / 180;

// ── Price badge ───────────────────────────────────────────────────────────────

function PriceBadge({ x, y, count, min, active }: {
  x: number; y: number; count: number; min: number | null; active: boolean;
}) {
  if (count === 0 || min === null) return null;
  const text = `${count} · ${fmt(min)}`;
  const w = Math.max(44, text.length * 4.6 + 12);
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x - w / 2} y={y - 10} width={w} height={14} rx={3}
        fill={active ? "rgba(37,99,235,0.92)" : "rgba(15,23,42,0.82)"}
        stroke={active ? "rgba(147,197,253,0.7)" : "rgba(255,255,255,0.18)"}
        strokeWidth="0.6"
      />
      <text x={x} y={y + 1} textAnchor="middle" fontSize="6.5"
        fill="rgba(255,255,255,0.97)" fontFamily="system-ui" fontWeight="700"
        style={{ userSelect: "none" }}
      >{text}</text>
    </g>
  );
}

// ─────────────────────────────── ARENA MAP ───────────────────────────────────

const AR = { W: 580, H: 310, CX: 290, CY: 155 };

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy - ry} Z`;
}
function ringPath(cx: number, cy: number, iRx: number, iRy: number, oRx: number, oRy: number) {
  return [
    `M ${cx} ${cy - oRy} A ${oRx} ${oRy} 0 0 1 ${cx} ${cy + oRy} A ${oRx} ${oRy} 0 0 1 ${cx} ${cy - oRy} Z`,
    `M ${cx} ${cy - iRy} A ${iRx} ${iRy} 0 0 0 ${cx} ${cy + iRy} A ${iRx} ${iRy} 0 0 0 ${cx} ${cy - iRy} Z`,
  ].join(" ");
}

const SB = { w: 14, h: 9, gap: 3, count: 5 };
const sbTotalH = SB.count * SB.h + (SB.count - 1) * SB.gap;

// ── Per-venue arena configs (real section counts from official seating charts) ─
interface ArenaCfg { lowerDivs: number; clubDivs: number; upperDivs: number; upperSecBase: number; lowerSecBase: number }
const ARENA_VENUE: Record<string, ArenaCfg> = {
  // lower / club / upper divider counts match official section totals
  "Madison Square Garden": { lowerDivs: 19, clubDivs: 14, upperDivs: 27, upperSecBase: 201, lowerSecBase: 101 },
  "TD Garden":             { lowerDivs: 22, clubDivs: 10, upperDivs: 30, upperSecBase: 301, lowerSecBase: 1   },
  "Capital One Arena":     { lowerDivs: 22, clubDivs: 30, upperDivs: 34, upperSecBase: 400, lowerSecBase: 100 },
  "Ball Arena":            { lowerDivs: 24, clubDivs: 30, upperDivs: 40, upperSecBase: 301, lowerSecBase: 102 },
  "United Center":         { lowerDivs: 22, clubDivs: 34, upperDivs: 34, upperSecBase: 301, lowerSecBase: 101 },
  "Barclays Center":       { lowerDivs: 31, clubDivs: 12, upperDivs: 31, upperSecBase: 201, lowerSecBase: 1   },
  "Crypto.com Arena":      { lowerDivs: 26, clubDivs: 16, upperDivs: 32, upperSecBase: 301, lowerSecBase: 101 },
  "Chase Center":          { lowerDivs: 22, clubDivs: 16, upperDivs: 26, upperSecBase: 201, lowerSecBase: 101 },
  "Kia Forum":             { lowerDivs: 28, clubDivs: 12, upperDivs: 26, upperSecBase: 201, lowerSecBase: 101 },
  "T-Mobile Arena":        { lowerDivs: 22, clubDivs: 14, upperDivs: 28, upperSecBase: 201, lowerSecBase: 101 },
  "Spectrum Center":       { lowerDivs: 22, clubDivs: 12, upperDivs: 30, upperSecBase: 201, lowerSecBase: 101 },
};
const DEFAULT_ARENA_CFG: ArenaCfg = { lowerDivs: 40, clubDivs: 14, upperDivs: 30, upperSecBase: 301, lowerSecBase: 101 };

function ArenaMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, genre = "", venue = "", showBadges, minByType, countByType }: MapProps) {
  const isNBA = genre === "NBA", isNHL = genre === "NHL";
  const isMSG = venue === "Madison Square Garden";

  // ── Venue-specific ring geometry — uses real section counts per venue ─────────
  const vCfg      = ARENA_VENUE[venue] ?? DEFAULT_ARENA_CFG;
  const lowerDivs = vCfg.lowerDivs;
  const clubDivs  = vCfg.clubDivs;
  const upperDivs = vCfg.upperDivs;
  const upperSecBase  = vCfg.upperSecBase;
  const lowerSecBase  = vCfg.lowerSecBase;

  const ARENA_RINGS = isMSG ? [
    { type: "lower" as SectionType, label: "LOWER ARENA", iRx: 78,  iRy: 60,  oRx: 128, oRy: 98,  divs: lowerDivs },
    { type: "club"  as SectionType, label: "SUITE LEVEL", iRx: 136, iRy: 106, oRx: 156, oRy: 122, divs: clubDivs  },
    { type: "upper" as SectionType, label: "BALCONY",     iRx: 164, iRy: 130, oRx: 208, oRy: 142, divs: upperDivs },
  ] : [
    { type: "lower" as SectionType, label: "LOWER BOWL",  iRx: 88,  iRy: 44,  oRx: 150, oRy: 92,  divs: lowerDivs },
    { type: "club"  as SectionType, label: "CLUB",        iRx: 158, iRy: 99,  oRx: 182, oRy: 115, divs: clubDivs  },
    { type: "upper" as SectionType, label: "UPPER DECK",  iRx: 190, iRy: 122, oRx: 248, oRy: 146, divs: upperDivs },
  ];

  const outerRx   = isMSG ? 214 : 254;
  const outerRy   = isMSG ? 144 : 149;
  const floorRx   = isMSG ? 70  : 80;
  const floorRy   = isMSG ? 44  : 36;
  const sbTop     = AR.CY - sbTotalH / 2;
  const suiteX1   = AR.CX - outerRx - SB.w - 2;
  const suiteX2   = AR.CX + outerRx + 2;

  const floorLabel = isNBA ? "COURT" : isNHL ? "ICE" : "STAGE";
  const floorSub   = isNBA ? "COURTSIDE" : isNHL ? "RINKSIDE" : "GA / FLOOR";

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const baseColor   = isNBA ? "#d4a96a" : isNHL ? "#cce8f8" : "#1e293b";
  const activeColor = isNBA ? "#b8883a" : isNHL ? "#99cef0" : CLR.floor.act;
  const dimColor    = isNBA ? "rgba(212,169,106,0.3)" : isNHL ? "rgba(204,232,248,0.3)" : CLR.floor.dim;
  const floorColor  = hoveredZone === "floor" ? activeColor : floorDimmed ? dimColor : floorActive ? activeColor : baseColor;
  const floorInk    = isNHL ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.92)";
  const floorStroke = hoveredZone === "floor" || floorActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)";

  return (
    <svg viewBox={`0 0 ${AR.W} ${AR.H}`} className="w-full" style={{ background: MAP_BG }}>

      {/* Outer stadium silhouette */}
      <ellipse cx={AR.CX} cy={AR.CY} rx={outerRx + 14} ry={outerRy + 10}
        fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

      {/* Seating rings — each section is its own polygon */}
      {[...ARENA_RINGS].reverse().map((ring) => {
        const fill     = zoneFill(ring.type, hoveredZone, activeSectionTypes);
        const isActive = activeSectionTypes.includes(ring.type) || hoveredZone === ring.type;
        const midRy    = (ring.iRy + ring.oRy) / 2;
        const midRx    = (ring.iRx + ring.oRx) / 2;
        const step     = (2 * Math.PI) / ring.divs;
        // Section number: lower uses lowerSecBase, upper uses upperSecBase
        const secBase  = ring.type === "upper" ? upperSecBase : lowerSecBase;
        // Show section labels: lower every-other, upper every-other, club none (too narrow)
        const showLabels = ring.type !== "club";
        const labelSkip  = ring.type === "lower" && ring.divs > 24 ? 2 : ring.type === "upper" && ring.divs > 32 ? 2 : 1;

        return (
          <g key={ring.type}>
            {/* Individual section polygons */}
            {Array.from({ length: ring.divs }, (_, i) => {
              const startRad = i * step;
              const endRad   = (i + 1) * step;
              const d = sectionPolygonPath(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy, startRad, endRad);
              return (
                <path
                  key={i}
                  d={d}
                  fill={fill}
                  stroke={SECTION_STROKE}
                  strokeWidth="1"
                  strokeLinejoin="round"
                  style={{ cursor: "pointer", transition: "fill 0.12s, filter 0.12s",
                    filter: isActive ? "brightness(1.15)" : "none" }}
                  onClick={() => onSectionTypeToggle(ring.type)}
                  onMouseEnter={() => onZoneHover(ring.type)}
                  onMouseLeave={() => onZoneHover(null)}
                />
              );
            })}
            {/* Active zone glow ring */}
            {isActive && (
              <path
                d={ringPath(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy)}
                fill="none" fillRule="evenodd"
                stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"
                style={{ pointerEvents: "none" }}
              />
            )}
            {/* Section number labels centered inside each polygon */}
            {showLabels && Array.from({ length: ring.divs }, (_, i) => {
              if (i % labelSkip !== 0) return null;
              const midAngle = (i + 0.5) * step;
              const x = AR.CX + midRx * Math.sin(midAngle);
              const y = AR.CY - midRy * Math.cos(midAngle);
              const isDimmed = activeSectionTypes.length > 0 && !activeSectionTypes.includes(ring.type) && hoveredZone !== ring.type;
              return (
                <text key={i} x={x} y={y + 2.5} textAnchor="middle"
                  fontSize={ring.type === "lower" ? "5.5" : "4.8"}
                  fill={isDimmed ? INK_DIM : INK}
                  fontFamily="system-ui" fontWeight="700"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >{secBase + i}</text>
              );
            })}
          </g>
        );
      })}

      {/* Floor (court / ice / stage) */}
      <path
        d={ellipsePath(AR.CX, AR.CY, floorRx, floorRy)}
        fill={floorColor} stroke={floorStroke} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s",
          filter: (floorActive || hoveredZone === "floor") ? "brightness(1.12)" : "none" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* ── NBA court markings — court runs HORIZONTALLY, baskets at left & right ── */}
      {isNBA && (() => {
        const L      = AR.CX - floorRx;   // left baseline
        const R      = AR.CX + floorRx;   // right baseline
        const laneD  = floorRx * 0.38;    // lane depth from each baseline
        const laneHW = floorRy * 0.58;    // lane half-width
        const bOff   = floorRx * 0.06;    // basket distance from baseline
        const rstRad = laneHW * 0.30;     // restricted-area arc radius
        const ftRx   = laneD  * 0.28;     // free-throw circle x-radius
        const ftRy   = laneHW * 0.90;     // free-throw circle y-radius
        const tpCorY = floorRy * 0.88;    // corner-3 distance from center (y)
        const tpCEnd = floorRx * 0.26;    // corner-3 straight segment length
        const tpRx   = floorRx * 0.58;    // 3-pt arc x-radius (ellipse)
        const tpRy   = floorRy * 0.98;    // 3-pt arc y-radius (ellipse)
        const clr    = "rgba(180,120,40,0.9)";
        const sw     = "0.8";
        const clipId = "court-clip";
        return (
          <g style={{ pointerEvents: "none" }}>
            <defs>
              <clipPath id={clipId}>
                <ellipse cx={AR.CX} cy={AR.CY} rx={floorRx - 0.5} ry={floorRy - 0.5} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              {/* Vertical center line */}
              <line x1={AR.CX} y1={AR.CY - floorRy} x2={AR.CX} y2={AR.CY + floorRy}
                stroke={clr} strokeWidth={sw} />
              {/* Center circle */}
              <ellipse cx={AR.CX} cy={AR.CY} rx={ftRx} ry={floorRy * 0.30}
                fill="none" stroke={clr} strokeWidth={sw} />
              <circle cx={AR.CX} cy={AR.CY} r={2} fill={clr} />

              {/* ── LEFT basket ── */}
              <rect x={L} y={AR.CY - laneHW} width={laneD} height={laneHW * 2}
                fill="rgba(180,120,40,0.12)" stroke={clr} strokeWidth={sw} />
              <path d={`M ${L+bOff} ${AR.CY-rstRad} A ${rstRad} ${rstRad*0.6} 0 0 1 ${L+bOff} ${AR.CY+rstRad}`}
                fill="none" stroke={clr} strokeWidth={sw} />
              <circle cx={L+bOff} cy={AR.CY} r={2.2} fill="none" stroke={clr} strokeWidth="1" />
              <line x1={L+bOff-0.5} y1={AR.CY-3.5} x2={L+bOff-0.5} y2={AR.CY+3.5}
                stroke={clr} strokeWidth="1.2" />
              <ellipse cx={L+laneD} cy={AR.CY} rx={ftRx} ry={ftRy}
                fill="none" stroke={clr} strokeWidth={sw} strokeDasharray="3,2" />
              <line x1={L} y1={AR.CY-tpCorY} x2={L+tpCEnd} y2={AR.CY-tpCorY} stroke={clr} strokeWidth={sw} />
              <line x1={L} y1={AR.CY+tpCorY} x2={L+tpCEnd} y2={AR.CY+tpCorY} stroke={clr} strokeWidth={sw} />
              <path d={`M ${L+tpCEnd} ${AR.CY-tpCorY} A ${tpRx} ${tpRy} 0 0 1 ${L+tpCEnd} ${AR.CY+tpCorY}`}
                fill="none" stroke={clr} strokeWidth={sw} />

              {/* ── RIGHT basket ── */}
              <rect x={R-laneD} y={AR.CY - laneHW} width={laneD} height={laneHW * 2}
                fill="rgba(180,120,40,0.12)" stroke={clr} strokeWidth={sw} />
              <path d={`M ${R-bOff} ${AR.CY-rstRad} A ${rstRad} ${rstRad*0.6} 0 0 0 ${R-bOff} ${AR.CY+rstRad}`}
                fill="none" stroke={clr} strokeWidth={sw} />
              <circle cx={R-bOff} cy={AR.CY} r={2.2} fill="none" stroke={clr} strokeWidth="1" />
              <line x1={R-bOff+0.5} y1={AR.CY-3.5} x2={R-bOff+0.5} y2={AR.CY+3.5}
                stroke={clr} strokeWidth="1.2" />
              <ellipse cx={R-laneD} cy={AR.CY} rx={ftRx} ry={ftRy}
                fill="none" stroke={clr} strokeWidth={sw} strokeDasharray="3,2" />
              <line x1={R} y1={AR.CY-tpCorY} x2={R-tpCEnd} y2={AR.CY-tpCorY} stroke={clr} strokeWidth={sw} />
              <line x1={R} y1={AR.CY+tpCorY} x2={R-tpCEnd} y2={AR.CY+tpCorY} stroke={clr} strokeWidth={sw} />
              <path d={`M ${R-tpCEnd} ${AR.CY-tpCorY} A ${tpRx} ${tpRy} 0 0 0 ${R-tpCEnd} ${AR.CY+tpCorY}`}
                fill="none" stroke={clr} strokeWidth={sw} />
            </g>
          </g>
        );
      })()}

      {/* ── NHL ice markings — rink runs HORIZONTALLY, goals at left & right ── */}
      {isNHL && (() => {
        const redSW = "1.2", blueSW = "0.9";
        const clipId = "ice-clip";
        // Blue zone lines (vertical) at ±30% from center
        const zoneOff  = floorRx * 0.30;
        // Goal lines (vertical) near each end
        const goalOff  = floorRx * 0.86;
        const goalL    = AR.CX - goalOff;
        const goalR    = AR.CX + goalOff;
        // Goal net & crease dimensions
        const goalHW   = floorRy * 0.38;  // half-height of goal opening
        const netD     = floorRx * 0.07;  // depth of net behind goal line
        const creaseD  = floorRx * 0.14;  // depth of crease toward center
        const creaseHW = floorRy * 0.38;  // half-height of crease
        // Face-off circle radii
        const fcRx = floorRx * 0.20, fcRy = floorRy * 0.28;
        return (
          <g style={{ pointerEvents: "none" }}>
            <defs>
              <clipPath id={clipId}>
                <ellipse cx={AR.CX} cy={AR.CY} rx={floorRx - 0.5} ry={floorRy - 0.5} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              {/* Red center line — VERTICAL */}
              <line x1={AR.CX} y1={AR.CY - floorRy} x2={AR.CX} y2={AR.CY + floorRy}
                stroke="#cc0000" strokeWidth={redSW} />
              {/* Blue zone lines — VERTICAL at ±zoneOff */}
              {([-1, 1] as number[]).map((side, i) => (
                <line key={i}
                  x1={AR.CX + side * zoneOff} y1={AR.CY - floorRy}
                  x2={AR.CX + side * zoneOff} y2={AR.CY + floorRy}
                  stroke="#0055cc" strokeWidth={blueSW} />
              ))}
              {/* Center ice circle */}
              <ellipse cx={AR.CX} cy={AR.CY} rx={floorRx * 0.20} ry={floorRy * 0.26}
                fill="none" stroke="#cc0000" strokeWidth="0.9" />
              <circle cx={AR.CX} cy={AR.CY} r={2} fill="#cc0000" />
              {/* Face-off circles — 4 spots in left & right zones */}
              {([-0.55, 0.55] as number[]).flatMap((dx) =>
                ([-0.52, 0.52] as number[]).map((dy) => {
                  const fx = AR.CX + floorRx * dx;
                  const fy = AR.CY + floorRy * dy;
                  return (
                    <g key={`${dx}${dy}`}>
                      <ellipse cx={fx} cy={fy} rx={fcRx} ry={fcRy}
                        fill="none" stroke="#cc0000" strokeWidth="0.7" />
                      <circle cx={fx} cy={fy} r={1.5} fill="#cc0000" />
                      {/* Hash marks — VERTICAL on left & right sides of circle */}
                      <line x1={fx - fcRx * 1.1} y1={fy - fcRy * 0.3} x2={fx - fcRx * 1.1} y2={fy + fcRy * 0.3}
                        stroke="#cc0000" strokeWidth="0.6" />
                      <line x1={fx + fcRx * 1.1} y1={fy - fcRy * 0.3} x2={fx + fcRx * 1.1} y2={fy + fcRy * 0.3}
                        stroke="#cc0000" strokeWidth="0.6" />
                    </g>
                  );
                })
              )}
              {/* Goals — goal lines VERTICAL at left & right ends */}
              {([{ gx: goalL, side: -1 }, { gx: goalR, side: 1 }]).map(({ gx, side }) => (
                <g key={side}>
                  {/* Goal line */}
                  <line x1={gx} y1={AR.CY - floorRy * 0.9} x2={gx} y2={AR.CY + floorRy * 0.9}
                    stroke="#cc0000" strokeWidth="0.8" />
                  {/* Net behind goal line (away from center) */}
                  <rect
                    x={side === -1 ? gx - netD : gx}
                    y={AR.CY - goalHW}
                    width={netD} height={goalHW * 2}
                    fill="rgba(0,0,0,0.10)" stroke="#666" strokeWidth="0.5" rx="0.5" />
                  {/* Crease — D-shape opening toward center */}
                  <path
                    d={`M ${gx} ${AR.CY - creaseHW} A ${creaseD} ${creaseHW} 0 0 ${side === -1 ? 1 : 0} ${gx} ${AR.CY + creaseHW} Z`}
                    fill="rgba(0,85,204,0.18)" stroke="#0055cc" strokeWidth="0.7" />
                </g>
              ))}
            </g>
          </g>
        );
      })()}

      {/* ── Concert stage ── */}
      {!isNBA && !isNHL && (
        <g style={{ pointerEvents: "none" }}>
          <rect x={AR.CX - 38} y={AR.CY + 8} width={76} height={22} rx={3}
            fill="#0f172a" stroke="rgba(255,255,255,0.2)" strokeWidth="0.9" />
          <rect x={AR.CX - 32} y={AR.CY + 7} width={64} height={4} rx={1} fill="#1e293b" />
          <text x={AR.CX} y={AR.CY + 22} textAnchor="middle" fontSize="6"
            fill="rgba(255,255,255,0.5)" fontFamily="system-ui" letterSpacing="2">STAGE</text>
          <rect x={AR.CX - 42} y={AR.CY + 12} width={5} height={12} rx={1} fill="rgba(255,255,255,0.1)" />
          <rect x={AR.CX + 37} y={AR.CY + 12} width={5} height={12} rx={1} fill="rgba(255,255,255,0.1)" />
        </g>
      )}

      {/* Floor labels — hidden for NBA/NHL where court/ice markings make it obvious */}
      {!isNBA && !isNHL && (
        <>
          <text x={AR.CX} y={AR.CY - 3} textAnchor="middle" fontSize="8"
            fill={floorInk} fontFamily="system-ui,sans-serif" fontWeight="800" letterSpacing="0.5"
            style={{ pointerEvents: "none", userSelect: "none" }}>{floorLabel}</text>
          <text x={AR.CX} y={AR.CY + 7} textAnchor="middle" fontSize="5.5"
            fill={floorInk} fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing="0.3"
            style={{ pointerEvents: "none", userSelect: "none" }} opacity={0.65}>{floorSub}</text>
        </>
      )}

      {/* Suite boxes */}
      {[{ x: suiteX1 }, { x: suiteX2 }].map((set, si) => {
        const suiteActive = activeSectionTypes.includes("suite") || hoveredZone === "suite";
        const suiteFill = zoneFill("suite", hoveredZone, activeSectionTypes);
        return (
          <g key={si} style={{ cursor: "pointer" }}
            onClick={() => onSectionTypeToggle("suite")}
            onMouseEnter={() => onZoneHover("suite")}
            onMouseLeave={() => onZoneHover(null)}
          >
            {Array.from({ length: SB.count }, (_, i) => (
              <rect key={i} x={set.x} y={sbTop + i * (SB.h + SB.gap)}
                width={SB.w} height={SB.h} rx={2}
                fill={suiteFill}
                stroke={SECTION_STROKE} strokeWidth="1"
                style={{ transition: "fill 0.12s",
                  filter: suiteActive ? "brightness(1.15)" : "none" }}
              />
            ))}
            <text x={set.x + SB.w / 2} y={sbTop - 5}
              textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.6)"
              fontFamily="system-ui" fontWeight="600"
              style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>
          </g>
        );
      })}

      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={AR.CX} y={AR.CY - 6} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={AR.CX + (isMSG ? 104 : 120)} y={AR.CY} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={AR.CX + (isMSG ? 146 : 168)} y={AR.CY + 20} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={AR.CX} y={AR.CY + (isMSG ? 134 : 139)} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={suiteX1 + SB.w / 2} y={sbTop - 16} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}
    </svg>
  );
}

// ─────────────────────────────── NFL MAP ─────────────────────────────────────

const NF = { W: 540, H: 320, CX: 270, CY: 162 };
const NFL_FIELD = { w: 230, h: 96 };
const NFX = NF.CX - NFL_FIELD.w / 2;
const NFY = NF.CY - NFL_FIELD.h / 2;
const EZ_W = 20;
const playW = NFL_FIELD.w - 2 * EZ_W;

const NFL_BANDS = [
  { type: "lower" as SectionType, pad: 28,  rx: 10,  label: "LOWER"      },
  { type: "club"  as SectionType, pad: 46,  rx: 14,  label: "CLUB"       },
  { type: "upper" as SectionType, pad: 82,  rx: 20,  label: "UPPER DECK" },
];

const yardLines = Array.from({ length: 9 }, (_, i) => NFX + EZ_W + playW * ((i + 1) / 10));
const yardNums  = [10, 20, 30, 40, 50, 40, 30, 20, 10];

function GoalPost({ x, flip }: { x: number; flip?: boolean }) {
  const crossY = NFY + NFL_FIELD.h * 0.26;
  const d = flip ? -1 : 1;
  return (
    <g style={{ pointerEvents: "none" }}>
      <line x1={x} y1={NFY + NFL_FIELD.h * 0.74} x2={x} y2={crossY} stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
      <line x1={x - 11 * d} y1={crossY} x2={x + 11 * d} y2={crossY} stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
      <line x1={x - 11 * d} y1={crossY} x2={x - 11 * d} y2={crossY - 15} stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
      <line x1={x + 11 * d} y1={crossY} x2={x + 11 * d} y2={crossY - 15} stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
    </g>
  );
}

// ── Per-stadium NFL section numbers (top sideline / bottom sideline labels) ───
const NFL_VENUE: Record<string, { top: number[]; bot: number[]; openEndLeft?: boolean }> = {
  "AT&T Stadium":    { top: [102, 108, 114, 119, 125], bot: [220, 226, 232, 238, 244] },
  "MetLife Stadium": { top: [109, 115, 121, 127, 133], bot: [310, 318, 326, 334, 342] },
  "Lumen Field":     { top: [105, 111, 116, 122, 128], bot: [305, 313, 321, 329, 337], openEndLeft: true },
  "M&T Bank Stadium":{ top: [106, 112, 118, 124, 130], bot: [201, 207, 213, 219, 225] },
  "SoFi Stadium":    { top: [107, 113, 119, 125, 131], bot: [215, 221, 227, 233, 239] },
  "Nissan Stadium":  { top: [103, 109, 115, 121, 127], bot: [215, 221, 227, 233, 239] },
  "Rose Bowl":       { top: [10,  15,  20,  25,  30 ], bot: [60,  65,  70,  75,  80 ] },
};
const DEFAULT_NFL = { top: [103, 110, 118, 126, 133], bot: [310, 318, 326, 334, 342] };

function NFLMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, venue = "", showBadges, minByType, countByType }: MapProps) {
  const nflCfg = NFL_VENUE[venue] ?? DEFAULT_NFL;
  const topSecNums = nflCfg.top;
  const botSecNums = nflCfg.bot;
  const isOpenEndLeft = nflCfg.openEndLeft ?? false;   // Lumen Field open north end

  // Section block gap (creates visual separation between sections)
  const SEC_GAP = 1.5;

  return (
    <svg viewBox={`0 0 ${NF.W} ${NF.H}`} className="w-full" style={{ background: MAP_BG }}>

      {/* Outer stadium silhouette */}
      <rect x={NFX - 90} y={NFY - 90} width={NFL_FIELD.w + 180} height={NFL_FIELD.h + 180} rx={22}
        fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />

      {/* Individual section blocks for each band — top sideline, bottom sideline, end zones */}
      {[...NFL_BANDS].reverse().map((band) => {
        const fill    = zoneFill(band.type, hoveredZone, activeSectionTypes);
        const isAct   = activeSectionTypes.includes(band.type) || hoveredZone === band.type;
        const bx = NFX - band.pad, by = NFY - band.pad;
        const bw = NFL_FIELD.w + band.pad * 2, bh = NFL_FIELD.h + band.pad * 2;
        // How thick the band is on each side
        const prevPad = band.pad === 28 ? 0 : band.pad === 46 ? 28 : 46;
        const thickness = band.pad - prevPad;
        // Number of sections along each sideline
        const numSide = band.type === "lower" ? 12 : band.type === "club" ? 8 : 10;
        // Number of sections along each end zone
        const numEnd  = band.type === "lower" ? 4  : band.type === "club" ? 3 : 4;
        const sectionProps = {
          fill, stroke: SECTION_STROKE, strokeWidth: "1",
          style: { cursor: "pointer" as const, transition: "fill 0.12s",
            filter: isAct ? "brightness(1.15)" : "none" },
          onClick: () => onSectionTypeToggle(band.type),
          onMouseEnter: () => onZoneHover(band.type),
          onMouseLeave: () => onZoneHover(null),
        };

        // Top sideline sections
        const topSections = Array.from({ length: numSide }, (_, i) => {
          const secW = (bw - 2 * thickness) / numSide;
          const sx = bx + thickness + i * secW + SEC_GAP / 2;
          const sy = by;
          const sw = secW - SEC_GAP;
          const sh = thickness;
          return <rect key={`top-${i}`} x={sx} y={sy} width={sw} height={sh} rx={1} {...sectionProps} />;
        });

        // Bottom sideline sections
        const botSections = Array.from({ length: numSide }, (_, i) => {
          const secW = (bw - 2 * thickness) / numSide;
          const sx = bx + thickness + i * secW + SEC_GAP / 2;
          const sy = by + bh - thickness;
          const sw = secW - SEC_GAP;
          const sh = thickness;
          return <rect key={`bot-${i}`} x={sx} y={sy} width={sw} height={sh} rx={1} {...sectionProps} />;
        });

        // Left end zone sections
        const leftSections = Array.from({ length: numEnd }, (_, i) => {
          const secH = bh / numEnd;
          const sx = bx;
          const sy = by + i * secH + SEC_GAP / 2;
          const sw = thickness;
          const sh = secH - SEC_GAP;
          return <rect key={`lft-${i}`} x={sx} y={sy} width={sw} height={sh} rx={1} {...sectionProps} />;
        });

        // Right end zone sections
        const rightSections = Array.from({ length: numEnd }, (_, i) => {
          const secH = bh / numEnd;
          const sx = bx + bw - thickness;
          const sy = by + i * secH + SEC_GAP / 2;
          const sw = thickness;
          const sh = secH - SEC_GAP;
          return <rect key={`rgt-${i}`} x={sx} y={sy} width={sw} height={sh} rx={1} {...sectionProps} />;
        });

        return (
          <g key={band.type}>
            {topSections}{botSections}{leftSections}{rightSections}
          </g>
        );
      })}

      {/* Section number labels on lower sideline sections */}
      {topSecNums.map((num, i) => {
        const band = NFL_BANDS[0]; // lower
        const bx = NFX - band.pad;
        const bw = NFL_FIELD.w + band.pad * 2;
        const numSide = 12;
        const secW = (bw - 2 * band.pad) / numSide;
        const sx = bx + band.pad + i * secW + secW / 2;
        const sy = NFY - band.pad + band.pad / 2;
        const isDimmed = activeSectionTypes.length > 0 && !activeSectionTypes.includes("lower") && hoveredZone !== "lower";
        return (
          <text key={i} x={sx} y={sy + 2} textAnchor="middle" fontSize="5.5"
            fill={isDimmed ? INK_DIM : INK} fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{num}</text>
        );
      })}
      {botSecNums.map((num, i) => {
        const band = NFL_BANDS[0]; // lower
        const bx = NFX - band.pad;
        const bw = NFL_FIELD.w + band.pad * 2;
        const numSide = 12;
        const secW = (bw - 2 * band.pad) / numSide;
        const sx = bx + band.pad + i * secW + secW / 2;
        const sy = NFY + NFL_FIELD.h + band.pad + band.pad / 2;
        const isDimmed = activeSectionTypes.length > 0 && !activeSectionTypes.includes("lower") && hoveredZone !== "lower";
        return (
          <text key={i} x={sx} y={sy + 2} textAnchor="middle" fontSize="5.5"
            fill={isDimmed ? INK_DIM : INK} fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{num}</text>
        );
      })}

      {/* Suite strips — two thin horizontal strips between lower and club */}
      {(() => {
        const suiteFill = zoneFill("suite", hoveredZone, activeSectionTypes);
        const suiteActive = activeSectionTypes.includes("suite") || hoveredZone === "suite";
        const numSuiteSecs = 14;
        const stripW = NFL_FIELD.w + 56 + 2;
        const secW = stripW / numSuiteSecs;
        return [
          { y: NFY - 28 - 9 },
          { y: NFY + NFL_FIELD.h + 28 },
        ].map((s, si) => (
          <g key={si}>
            {Array.from({ length: numSuiteSecs }, (_, i) => (
              <rect key={i}
                x={NFX - 28 + i * secW + SEC_GAP / 2}
                y={s.y} width={secW - SEC_GAP} height={9} rx={1}
                fill={suiteFill} stroke={SECTION_STROKE} strokeWidth="1"
                style={{ cursor: "pointer", transition: "fill 0.12s",
                  filter: suiteActive ? "brightness(1.15)" : "none" }}
                onClick={() => onSectionTypeToggle("suite")}
                onMouseEnter={() => onZoneHover("suite")}
                onMouseLeave={() => onZoneHover(null)}
              />
            ))}
          </g>
        ));
      })()}
      <text x={NF.CX} y={NFY - 28 - 13} textAnchor="middle" fontSize="5.5"
        fill="rgba(255,255,255,0.5)" fontFamily="system-ui" fontWeight="600"
        style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>

      {/* Field */}
      <rect x={NFX} y={NFY} width={NFL_FIELD.w} height={NFL_FIELD.h} rx={2}
        fill={fieldFill(hoveredZone, activeSectionTypes)}
        stroke={hoveredZone === "floor" ? "#16a34a" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />
      {Array.from({ length: 10 }, (_, i) => i % 2 === 0 ? null : (
        <rect key={i} x={NFX + EZ_W + i * playW / 10} y={NFY}
          width={playW / 10} height={NFL_FIELD.h}
          fill="rgba(255,255,255,0.05)" style={{ pointerEvents: "none" }} />
      ))}
      <rect x={NFX} y={NFY} width={EZ_W} height={NFL_FIELD.h} rx={2} fill="#16a34a" style={{ pointerEvents: "none" }} />
      <rect x={NFX + NFL_FIELD.w - EZ_W} y={NFY} width={EZ_W} height={NFL_FIELD.h} rx={2} fill="#16a34a" style={{ pointerEvents: "none" }} />
      <text x={NFX + EZ_W / 2} y={NF.CY + 2} textAnchor="middle" fontSize="5"
        fill="rgba(255,255,255,0.55)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        transform={`rotate(-90, ${NFX + EZ_W / 2}, ${NF.CY})`}
        style={{ pointerEvents: "none", userSelect: "none" }}>END ZONE</text>
      <text x={NFX + NFL_FIELD.w - EZ_W / 2} y={NF.CY + 2} textAnchor="middle" fontSize="5"
        fill="rgba(255,255,255,0.55)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        transform={`rotate(90, ${NFX + NFL_FIELD.w - EZ_W / 2}, ${NF.CY})`}
        style={{ pointerEvents: "none", userSelect: "none" }}>END ZONE</text>
      <line x1={NFX + EZ_W} y1={NFY} x2={NFX + EZ_W} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.5)" strokeWidth="1" style={{ pointerEvents: "none" }} />
      <line x1={NFX + NFL_FIELD.w - EZ_W} y1={NFY} x2={NFX + NFL_FIELD.w - EZ_W} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.5)" strokeWidth="1" style={{ pointerEvents: "none" }} />
      {yardLines.map((x, i) => (
        <g key={i} style={{ pointerEvents: "none" }}>
          <line x1={x} y1={NFY + 2} x2={x} y2={NFY + NFL_FIELD.h - 2} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <text x={x} y={NF.CY + 4} textAnchor="middle" fontSize="6.5"
            fill="rgba(255,255,255,0.6)" fontFamily="system-ui" fontWeight="700">{yardNums[i]}</text>
        </g>
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const x = NFX + EZ_W + (i + 0.5) * playW / 10;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <line x1={x} y1={NFY + NFL_FIELD.h * 0.30} x2={x} y2={NFY + NFL_FIELD.h * 0.38} stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
            <line x1={x} y1={NFY + NFL_FIELD.h * 0.62} x2={x} y2={NFY + NFL_FIELD.h * 0.70} stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
          </g>
        );
      })}
      <line x1={NFX} y1={NFY} x2={NFX + NFL_FIELD.w} y2={NFY} stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <line x1={NFX} y1={NFY + NFL_FIELD.h} x2={NFX + NFL_FIELD.w} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <GoalPost x={NFX + EZ_W * 0.5} />
      <GoalPost x={NFX + NFL_FIELD.w - EZ_W * 0.5} flip />
      <text x={NF.CX} y={NF.CY - 10} textAnchor="middle" fontSize="8"
        fill="rgba(255,255,255,0.75)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>FIELD LEVEL</text>

      {/* Lumen Field: open north end — overlay hatched zone on left endzone seating */}
      {isOpenEndLeft && (() => {
        const maxPad = 82; // upper band pad
        const bx = NFX - maxPad, by = NFY - maxPad, bh = NFL_FIELD.h + maxPad * 2;
        const openW = maxPad + EZ_W;
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Wash out the left endzone seating bands with dark overlay */}
            <rect x={bx} y={by} width={openW} height={bh} rx={4}
              fill={MAP_BG} opacity={0.85} />
            {/* Diagonal hatch marks to indicate "no seating" */}
            {Array.from({ length: 8 }, (_, i) => {
              const yy = by + (bh * i) / 7;
              return <line key={i} x1={bx} y1={yy} x2={bx + openW} y2={yy - 28}
                stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" opacity={0.5} />;
            })}
            {/* Label */}
            <text x={bx + openW / 2} y={NF.CY} textAnchor="middle" fontSize="5.5"
              fill="rgba(255,255,255,0.35)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5"
              transform={`rotate(-90, ${bx + openW / 2}, ${NF.CY})`}
              style={{ userSelect: "none" }}>OPEN END</text>
          </g>
        );
      })()}

      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={NF.CX} y={NF.CY} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={NF.CX} y={NFY - 20} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={NF.CX} y={NFY - 38} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={NF.CX} y={NFY - 66} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={NF.CX} y={NFY - 7} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}
    </svg>
  );
}

// ─────────────────────────────── MLB MAP ─────────────────────────────────────

const BL = { W: 480, H: 370, HX: 240, HY: 350 };
const FAN_S = -155;
const FAN_E  = -25;

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = toRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcBandPath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s  = arcPoint(cx, cy, r1, startDeg);
  const e  = arcPoint(cx, cy, r1, endDeg);
  const s2 = arcPoint(cx, cy, r2, startDeg);
  const e2 = arcPoint(cx, cy, r2, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r1} ${r1} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${e2.x} ${e2.y}`,
    `A ${r2} ${r2} 0 ${large} 0 ${s2.x} ${s2.y}`,
    "Z",
  ].join(" ");
}

function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = arcPoint(cx, cy, r, startDeg);
  const e = arcPoint(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

const MLB_R = {
  fieldIn:  55,  fieldOut: 112,
  lowerIn: 115,  lowerOut: 165,
  suiteIn: 168,  suiteOut: 178,
  clubIn:  180,  clubOut:  204,
  upperIn: 206,  upperOut: 248,
  trackIn: 248,  trackOut: 256,
  wall:    260,
};

// ── Per-ballpark data (real field dimensions + unique features) ───────────────
interface BallparkCfg {
  lf: string; lcf: string; cf: string; rcf: string; rf: string;
  secCount: number;         // lower-bowl section count
  showMonumentPark: boolean;
  hasGreenMonster: boolean; // Fenway — 37-ft left-field wall
  hasIvyWall: boolean;      // Wrigley — ivy-covered brick outfield wall
}
const BALLPARK_DATA: Record<string, BallparkCfg> = {
  "Yankee Stadium": { lf: "318′", lcf: "399′", cf: "408′", rcf: "385′", rf: "314′", secCount: 25, showMonumentPark: true,  hasGreenMonster: false, hasIvyWall: false },
  "Fenway Park":    { lf: "310′", lcf: "379′", cf: "390′", rcf: "380′", rf: "302′", secCount: 20, showMonumentPark: false, hasGreenMonster: true,  hasIvyWall: false },
  "Wrigley Field":  { lf: "355′", lcf: "368′", cf: "400′", rcf: "368′", rf: "353′", secCount: 22, showMonumentPark: false, hasGreenMonster: false, hasIvyWall: true  },
  "Citi Field":     { lf: "335′", lcf: "379′", cf: "408′", rcf: "383′", rf: "330′", secCount: 23, showMonumentPark: false, hasGreenMonster: false, hasIvyWall: false },
};
const DEFAULT_BALLPARK: BallparkCfg = { lf: "—", lcf: "—", cf: "—", rcf: "—", rf: "—", secCount: 25, showMonumentPark: false, hasGreenMonster: false, hasIvyWall: false };


function MLBMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, venue = "", showBadges, minByType, countByType }: MapProps) {
  const cx = BL.HX, cy = BL.HY;
  const d = 32;
  const hp = { x: cx,     y: cy };
  const b1 = { x: cx + d, y: cy - d };
  const b2 = { x: cx,     y: cy - 2 * d };
  const b3 = { x: cx - d, y: cy - d };
  const pm = { x: cx,     y: cy - 38 };

  const bp = BALLPARK_DATA[venue] ?? DEFAULT_BALLPARK;

  // Helper: build a single MLB fan-wedge section path (circular arc band, not ellipse)
  function mlbSectionPath(r1: number, r2: number, startDeg: number, endDeg: number): string {
    // Add tiny inset gap on each side to create visual separation
    const GAP_DEG = 0.8;
    const s  = arcPoint(cx, cy, r1, startDeg + GAP_DEG);
    const e  = arcPoint(cx, cy, r1, endDeg   - GAP_DEG);
    const s2 = arcPoint(cx, cy, r2, startDeg + GAP_DEG);
    const e2 = arcPoint(cx, cy, r2, endDeg   - GAP_DEG);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return [
      `M ${s.x} ${s.y}`,
      `A ${r1} ${r1} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${e2.x} ${e2.y}`,
      `A ${r2} ${r2} 0 ${large} 0 ${s2.x} ${s2.y}`,
      "Z",
    ].join(" ");
  }

  // Section counts per ring
  const lowerCount = bp.secCount;
  const clubCount  = Math.round(bp.secCount * 0.6);
  const upperCount = bp.secCount;
  // Suite is a thin continuous band — split into a few blocks
  const suiteCount = Math.round(bp.secCount * 0.4);

  const TOTAL_ARC = FAN_E - FAN_S; // total degrees of arc (typically 130°)

  function renderZone(
    type: SectionType,
    r1: number, r2: number,
    count: number
  ) {
    const fill    = zoneFill(type, hoveredZone, activeSectionTypes);
    const isAct   = activeSectionTypes.includes(type) || hoveredZone === type;
    const isInact = activeSectionTypes.length > 0 && !activeSectionTypes.includes(type) && hoveredZone !== type;
    const secStep = TOTAL_ARC / count;
    return (
      <g key={type}>
        {Array.from({ length: count }, (_, i) => {
          const startDeg = FAN_S + i * secStep;
          const endDeg   = FAN_S + (i + 1) * secStep;
          return (
            <path
              key={i}
              d={mlbSectionPath(r1, r2, startDeg, endDeg)}
              fill={fill}
              stroke="none"
              style={{ cursor: "pointer", transition: "fill 0.12s",
                filter: isAct ? "brightness(1.18)" : "none" }}
              onClick={() => onSectionTypeToggle(type)}
              onMouseEnter={() => onZoneHover(type)}
              onMouseLeave={() => onZoneHover(null)}
            />
          );
        })}
        {/* Active glow border */}
        {isAct && (
          <path
            d={arcBandPath(cx, cy, r1, r2, FAN_S, FAN_E)}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            style={{ pointerEvents: "none" }}
          />
        )}
        {/* Section number labels — lower and upper only, every other */}
        {(type === "lower" || type === "upper") && Array.from({ length: count }, (_, i) => {
          if (i % 2 !== 0) return null;
          const midDeg = FAN_S + (i + 0.5) * secStep;
          const midR = (r1 + r2) / 2;
          const pt = arcPoint(cx, cy, midR, midDeg);
          const secNum = type === "lower" ? 100 + i + 1 : 200 + i + 1;
          return (
            <text key={i} x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="5.5"
              fill={isInact ? INK_DIM : INK} fontFamily="system-ui" fontWeight="700"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >{secNum}</text>
          );
        })}
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${BL.W} ${BL.H}`} className="w-full" style={{ background: MAP_BG }}>

      {/* Outer ballpark silhouette */}
      <path d={sectorPath(cx, cy, MLB_R.upperOut + 16, FAN_S - 4, FAN_E + 4)}
        fill="#e2e8f0" style={{ pointerEvents: "none" }} />

      {/* ── Individual section polygons — outer to inner ── */}
      {renderZone("upper", MLB_R.upperIn, MLB_R.upperOut, upperCount)}
      {renderZone("club",  MLB_R.clubIn,  MLB_R.clubOut,  clubCount)}
      {renderZone("suite", MLB_R.suiteIn, MLB_R.suiteOut, suiteCount)}
      {renderZone("lower", MLB_R.lowerIn, MLB_R.lowerOut, lowerCount)}

      {/* ── Playing field ── */}
      <path d={arcBandPath(cx, cy, MLB_R.trackIn, MLB_R.trackOut, FAN_S, FAN_E)}
        fill="#b8935a" stroke="none" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <path d={sectorPath(cx, cy, MLB_R.wall + 2, FAN_S, FAN_E)}
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" style={{ pointerEvents: "none" }} />

      {/* Foul poles */}
      {([-135, -45] as number[]).map((deg, i) => {
        const pt = arcPoint(cx, cy, MLB_R.wall + 4, deg);
        return <circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill="#f59e0b" style={{ pointerEvents: "none" }} />;
      })}

      {/* Foul lines */}
      <line x1={cx} y1={cy} x2={arcPoint(cx, cy, MLB_R.wall + 8, -135).x} y2={arcPoint(cx, cy, MLB_R.wall + 8, -135).y}
        stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <line x1={cx} y1={cy} x2={arcPoint(cx, cy, MLB_R.wall + 8, -45).x} y2={arcPoint(cx, cy, MLB_R.wall + 8, -45).y}
        stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />

      {/* Outfield grass (clickable) */}
      <path d={arcBandPath(cx, cy, MLB_R.fieldIn, MLB_R.fieldOut, FAN_S, FAN_E)}
        fill={fieldFill(hoveredZone, activeSectionTypes)}
        stroke={hoveredZone === "floor" ? "#16a34a" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* ── Fenway Park: Green Monster (37-ft left field wall at 310 ft) ── */}
      {bp.hasGreenMonster && (() => {
        // The Monster runs ~from LF foul line into left-center (FAN_S to FAN_S+28°)
        // At 310 ft vs 390 ft CF → ~79% of wall radius
        const gmR  = MLB_R.wall * 0.79;
        const gmS  = FAN_S;
        const gmE  = FAN_S + 28;
        const mid  = (gmS + gmE) / 2;
        const lbl  = arcPoint(cx, cy, gmR - 2, mid);
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Thick wall strip */}
            <path d={arcBandPath(cx, cy, gmR - 4, gmR + 7, gmS, gmE)}
              fill="#15803d" stroke="#166534" strokeWidth="1" opacity={0.92} />
            {/* Manual scoreboard panel on Monster */}
            {(() => {
              const sp = arcPoint(cx, cy, gmR + 1, gmS + 12);
              return <rect x={sp.x - 5} y={sp.y - 3} width={10} height={7} rx={1}
                fill="#1e293b" stroke="#374151" strokeWidth="0.5" />;
            })()}
            {/* Label */}
            <text x={lbl.x - 4} y={lbl.y + 2} textAnchor="middle" fontSize="4.5"
              fill="rgba(255,255,255,0.85)" fontFamily="system-ui" fontWeight="800"
              transform={`rotate(-52, ${lbl.x - 4}, ${lbl.y + 2})`}
              style={{ userSelect: "none" }}>GREEN MONSTER 37′</text>
          </g>
        );
      })()}

      {/* ── Wrigley Field: ivy-covered brick outfield wall + manual scoreboard ── */}
      {bp.hasIvyWall && (() => {
        const cfPt = arcPoint(cx, cy, MLB_R.wall - 10, (FAN_S + FAN_E) / 2);
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Ivy wall — thick green arc along full outfield perimeter */}
            <path d={arcBandPath(cx, cy, MLB_R.wall - 6, MLB_R.wall + 8, FAN_S, FAN_E)}
              fill="#15803d" stroke="#166534" strokeWidth="0.8" opacity={0.80} />
            {/* Manual scoreboard in CF */}
            <rect x={cfPt.x - 9} y={cfPt.y - 5} width={18} height={11} rx={1.5}
              fill="#1e293b" stroke="#374151" strokeWidth="0.6" />
            <text x={cfPt.x} y={cfPt.y + 2} textAnchor="middle" fontSize="3.8"
              fill="rgba(255,255,255,0.65)" fontFamily="system-ui" fontWeight="700"
              style={{ userSelect: "none" }}>SCOREBOARD</text>
          </g>
        );
      })()}

      {/* Distance markers — real per-venue dimensions */}
      {bp.cf !== "—" && [
        { deg: (FAN_S + FAN_E) / 2, r: MLB_R.wall - 12, text: bp.cf  },
        { deg: FAN_S + 20,          r: MLB_R.wall - 12, text: bp.lf  },
        { deg: FAN_E - 16,          r: MLB_R.wall - 12, text: bp.rf  },
      ].map(({ deg, r, text }) => {
        const pt = arcPoint(cx, cy, r, deg);
        return (
          <text key={text} x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="6.5"
            fill={INK} fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}>{text}</text>
        );
      })}

      {/* Monument Park (Yankee Stadium only) */}
      {bp.showMonumentPark && (() => {
        const pt = arcPoint(BL.HX, BL.HY, MLB_R.wall - 20, (FAN_S + FAN_E) / 2);
        return (
          <g style={{ pointerEvents: "none" }}>
            <rect x={pt.x - 14} y={pt.y - 6} width={28} height={12} rx={2}
              fill="#166534" stroke="#15803d" strokeWidth="0.7" />
            <text x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="4"
              fill="rgba(255,255,255,0.75)" fontFamily="system-ui" fontWeight="700"
              letterSpacing="0.3">MONUMENT PARK</text>
          </g>
        );
      })()}

      {/* Bullpens */}
      {[FAN_S + 10, FAN_E - 10].map((deg, i) => {
        const pt = arcPoint(cx, cy, MLB_R.upperOut - 18, deg);
        return (
          <rect key={i} x={pt.x - 9} y={pt.y - 6} width={18} height={12} rx={2}
            fill="#166534" stroke="#15803d" strokeWidth="0.7" style={{ pointerEvents: "none" }} />
        );
      })}

      {/* Infield dirt */}
      <path d={sectorPath(cx, cy, MLB_R.fieldIn - 1, -160, -20)}
        fill="#c49a4a" style={{ pointerEvents: "none" }} />

      {/* Infield grass */}
      <polygon
        points={`${hp.x},${hp.y} ${b1.x},${b1.y} ${b2.x},${b2.y} ${b3.x},${b3.y}`}
        fill="#22c55e" style={{ pointerEvents: "none" }}
      />

      {/* ── Diamond markings ── */}
      <g style={{ pointerEvents: "none" }}>
        <line x1={hp.x} y1={hp.y} x2={b1.x} y2={b1.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <line x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <line x1={b2.x} y1={b2.y} x2={b3.x} y2={b3.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <line x1={b3.x} y1={b3.y} x2={hp.x} y2={hp.y} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        {/* Dugouts */}
        <rect x={b3.x - 18} y={cy - 10} width={14} height={8} rx={1.5}
          fill="#94a3b8" stroke="#64748b" strokeWidth="0.6" opacity={0.7} />
        <rect x={b1.x + 4} y={cy - 10} width={14} height={8} rx={1.5}
          fill="#94a3b8" stroke="#64748b" strokeWidth="0.6" opacity={0.7} />
        <circle cx={pm.x} cy={pm.y} r={6} fill="#c49a4a" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
        <rect x={pm.x - 2.5} y={pm.y - 1} width={5} height={2} rx={0.5} fill="rgba(255,255,255,0.8)" />
        {[b1, b2, b3].map((b, i) => (
          <rect key={i} x={b.x - 3} y={b.y - 3} width={6} height={6}
            fill="white" opacity={0.9} transform={`rotate(45, ${b.x}, ${b.y})`} />
        ))}
        <polygon
          points={`${hp.x},${hp.y - 4} ${hp.x + 4},${hp.y} ${hp.x + 4},${hp.y + 3} ${hp.x - 4},${hp.y + 3} ${hp.x - 4},${hp.y}`}
          fill="white" opacity={0.9}
        />
      </g>

      {/* Zone labels */}
      {[
        { r: (MLB_R.lowerIn + MLB_R.lowerOut) / 2 + 4, text: "LOWER BOWL", deg: -90 },
        { r: (MLB_R.clubIn  + MLB_R.clubOut)  / 2,     text: "CLUB",        deg: -115 },
        { r: (MLB_R.upperIn + MLB_R.upperOut) / 2,     text: "UPPER DECK",  deg: -90 },
      ].map(({ r, text, deg }) => {
        const pt = arcPoint(cx, cy, r, deg);
        return (
          <text key={text} x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="6.5"
            fill={INK} fontFamily="system-ui" fontWeight="700" letterSpacing="0.5"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{text}</text>
        );
      })}

      <text x={arcPoint(cx, cy, 82, -90).x} y={arcPoint(cx, cy, 82, -90).y + 2.5}
        textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.8)"
        fontFamily="system-ui" fontWeight="700" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>FIELD</text>

      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="5"
        fill={INK} fontFamily="system-ui" opacity={0.5}
        style={{ pointerEvents: "none", userSelect: "none" }}>HOME PLATE</text>

      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={arcPoint(cx,cy,82,-110).x} y={arcPoint(cx,cy,82,-110).y - 6} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={arcPoint(cx,cy,140,-55).x + 8} y={arcPoint(cx,cy,140,-55).y} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={arcPoint(cx,cy,192,-55).x + 8} y={arcPoint(cx,cy,192,-55).y} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={arcPoint(cx,cy,228,-55).x + 8} y={arcPoint(cx,cy,228,-55).y} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={arcPoint(cx,cy,174,-55).x + 8} y={arcPoint(cx,cy,174,-55).y} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}
    </svg>
  );
}

// ── Listing row ───────────────────────────────────────────────────────────────

function MapListingRow({ listing, cheapest }: { listing: TicketListing; cheapest: boolean }) {
  const color = PLAT_COLORS[listing.platform] ?? "#6b7280";
  return (
    <div className={`px-4 py-3 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors ${cheapest ? "bg-green-900/20 border-l-2 border-l-green-500" : ""}`}>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{listing.section} · {listing.row}</div>
        <div className="text-gray-400 text-xs">{listing.platform} · {listing.quantity} ticket{listing.quantity !== 1 ? "s" : ""}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-bold text-sm ${cheapest ? "text-green-400" : "text-white"}`}>${listing.allInTotal}</div>
        <div className="text-gray-500 text-xs">all-in</div>
      </div>
      <button className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
        Buy
      </button>
    </div>
  );
}

// ── Expanded modal ────────────────────────────────────────────────────────────

function ExpandedModal({
  listings, activeSectionTypes, hoveredZone, onSectionTypeToggle, onClearSectionTypes,
  onZoneHover, onClose, genre, venue, minByType, countByType,
}: {
  listings: TicketListing[];
  activeSectionTypes: SectionType[];
  hoveredZone: SectionType | null;
  onSectionTypeToggle: (t: SectionType) => void;
  onClearSectionTypes: () => void;
  onZoneHover: (t: SectionType | null) => void;
  onClose: () => void;
  genre: string;
  venue: string;
  minByType: Record<SectionType, number | null>;
  countByType: Record<SectionType, number>;
}) {
  const panelListings = useMemo(() => {
    let result: TicketListing[];
    if (hoveredZone) result = listings.filter(l => l.sectionType === hoveredZone);
    else if (activeSectionTypes.length > 0) result = listings.filter(l => activeSectionTypes.includes(l.sectionType));
    else result = [...listings];
    return result.sort((a, b) => a.allInTotal - b.allInTotal);
  }, [listings, hoveredZone, activeSectionTypes]);

  const displayZone = hoveredZone ?? (activeSectionTypes.length === 1 ? activeSectionTypes[0] : null);
  const panelTitle = displayZone
    ? getZoneLabel(displayZone, genre)
    : activeSectionTypes.length > 1 ? "Selected Zones" : "All Listings";
  const panelCount = panelListings.length;
  const panelMin = panelListings.length > 0 ? panelListings[0].allInTotal : null;

  const isNFL = genre === "NFL", isMLB = genre === "MLB";
  const mapTitle = isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : (genre === "NBA" || genre === "NHL") ? "Arena Map" : "Seat Map";
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-bold text-base">{mapTitle}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_ZONES.map((t) => {
                const isAct = activeSectionTypes.includes(t);
                if (!countByType[t]) return null;
                return (
                  <button key={t} onClick={() => onSectionTypeToggle(t)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all border ${
                      isAct ? "border-transparent text-white" : "border-white/15 text-gray-400 hover:text-white hover:border-white/30"
                    }`}
                    style={isAct ? { backgroundColor: CLR[t].act } : {}}
                  >{getZoneLabel(t, genre)}</button>
                );
              })}
              {activeSectionTypes.length > 0 && (
                <button onClick={onClearSectionTypes} className="text-xs text-gray-400 hover:text-gray-200 transition">Clear</button>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition flex-shrink-0 ml-4"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6">
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full max-w-2xl rounded-xl overflow-hidden border border-white/10 shadow-lg">
                {isNFL ? (
                  <NFLMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType} />
                ) : isMLB ? (
                  <MLBMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType} />
                ) : (
                  <ArenaMap genre={genre} venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType} />
                )}
              </div>
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">Click a zone to filter · Hover to preview listings</p>
          </div>

          <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">{panelTitle}</span>
                <span className="text-gray-500 text-xs">{panelCount} listing{panelCount !== 1 ? "s" : ""}</span>
              </div>
              {panelMin !== null && (
                <p className="text-gray-400 text-xs mt-0.5">from <span className="text-white font-semibold">${panelMin}</span> all-in</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {panelListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <p className="text-gray-500 text-sm font-medium">No listings</p>
                  <p className="text-gray-600 text-xs mt-1">for this zone</p>
                </div>
              ) : panelListings.map((l, i) => (
                <MapListingRow key={l.id} listing={l} cheapest={i === 0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Legend panel ──────────────────────────────────────────────────────────────

function LegendPanel({ genre, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes, minByType, countByType }: {
  genre: string;
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  onClearSectionTypes: () => void;
  minByType: Record<SectionType, number | null>;
  countByType: Record<SectionType, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
      {(["floor", "lower", "suite", "club", "upper"] as SectionType[]).map((type) => {
        const label = getZoneLabel(type, genre);
        const min = minByType[type];
        const count = countByType[type];
        const active = activeSectionTypes.includes(type);
        const dimmed = activeSectionTypes.length > 0 && !active;
        if (count === 0) return null;
        return (
          <button key={type} onClick={() => onSectionTypeToggle(type)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
              active   ? "border-gray-300 bg-gray-100 text-gray-900"
              : dimmed ? "border-transparent opacity-40 text-gray-500"
              :          "border-gray-200 hover:bg-gray-50 text-gray-600"
            }`}
          >
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CLR[type].act }} />
            <span className="font-semibold">{label}</span>
            {min !== null && (
              <span className={`tabular-nums ${active ? "text-gray-700" : "text-gray-400"}`}>
                from {fmt(min)}
              </span>
            )}
          </button>
        );
      })}
      {activeSectionTypes.length > 0 && (
        <button onClick={onClearSectionTypes}
          className="px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 font-medium transition">
          Clear
        </button>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function VenueMap({
  listings, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes,
  genre = "", venue = "", mode = "card",
}: Props) {
  const { minByType, countByType } = useZoneData(listings);
  const [expanded, setExpanded] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<SectionType | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const onZoneHover = useCallback((t: SectionType | null) => {
    setHoveredZone(t);
    if (tooltipRef.current) {
      tooltipRef.current.style.visibility = (t && countByType[t] > 0) ? "visible" : "hidden";
    }
  }, [countByType]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = svgContainerRef.current?.getBoundingClientRect();
    if (!rect || !tooltipRef.current) return;
    tooltipRef.current.style.left = `${Math.min(e.clientX - rect.left + 14, 180)}px`;
    tooltipRef.current.style.top  = `${Math.max(e.clientY - rect.top - 52, 4)}px`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredZone(null);
    if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden";
  }, []);

  const isNFL = genre === "NFL", isMLB = genre === "MLB";

  const mapSVG = (
    <div
      ref={svgContainerRef}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {isNFL ? (
        <NFLMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
          onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
      ) : isMLB ? (
        <MLBMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
          onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
      ) : (
        <ArenaMap genre={genre} venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
          onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{ position: "absolute", pointerEvents: "none", zIndex: 10, visibility: "hidden" }}
        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
      >
        {hoveredZone && (
          <>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: CLR[hoveredZone].act }} />
              <span className="text-white font-semibold text-sm">{getZoneLabel(hoveredZone, genre)}</span>
            </div>
            <div className="text-gray-400 text-xs">
              {countByType[hoveredZone]} listings · from {fmt(minByType[hoveredZone] ?? 0)}
            </div>
            <div className="text-gray-600 text-xs mt-0.5">Click to filter</div>
          </>
        )}
      </div>
    </div>
  );

  // ── Panel mode (right-side panel in split layout) ──────────────────────────
  if (mode === "panel") {
    return (
      <>
        <div className="h-full flex flex-col">
          {/* Map SVG — fills available space */}
          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-[#0f172a] rounded-xl border border-white/10">
            <div className="w-full" ref={svgContainerRef}
              onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
              style={{ position: "relative" }}
            >
              {isNFL ? (
                <NFLMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                  onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
              ) : isMLB ? (
                <MLBMap venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                  onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
              ) : (
                <ArenaMap genre={genre} venue={venue} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                  onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
              )}
              {/* Tooltip */}
              <div ref={tooltipRef}
                style={{ position: "absolute", pointerEvents: "none", zIndex: 10, visibility: "hidden" }}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
              >
                {hoveredZone && (
                  <>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: CLR[hoveredZone].act }} />
                      <span className="text-white font-semibold text-sm">{getZoneLabel(hoveredZone, genre)}</span>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {countByType[hoveredZone]} listings · from {fmt(minByType[hoveredZone] ?? 0)}
                    </div>
                    <div className="text-gray-600 text-xs mt-0.5">Click to filter</div>
                  </>
                )}
              </div>
              {/* Expand button — floating bottom-right */}
              <button
                onClick={() => setExpanded(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Expand
              </button>
            </div>
          </div>

          {/* Zone legend — compact horizontal chips */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white rounded-b-xl">
            <LegendPanel
              genre={genre}
              activeSectionTypes={activeSectionTypes}
              onSectionTypeToggle={onSectionTypeToggle}
              onClearSectionTypes={onClearSectionTypes}
              minByType={minByType}
              countByType={countByType}
            />
          </div>
        </div>

        {expanded && (
          <ExpandedModal
            listings={listings} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
            onSectionTypeToggle={onSectionTypeToggle} onClearSectionTypes={onClearSectionTypes}
            onZoneHover={onZoneHover} onClose={() => setExpanded(false)}
            genre={genre} venue={venue} minByType={minByType} countByType={countByType}
          />
        )}
      </>
    );
  }

  // ── Card mode (default — compact widget) ──────────────────────────────────
  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-gray-700 text-sm font-semibold">
            {isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : (genre === "NBA" || genre === "NHL") ? "Arena Map" : "Seat Map"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs hidden sm:block">Click a zone to filter</span>
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs font-semibold transition px-2 py-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Expand
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-72 flex-shrink-0" ref={svgContainerRef}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ position: "relative" }}>
            {mapSVG}
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center gap-0.5">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Zones</p>
            {(["floor", "lower", "suite", "club", "upper"] as SectionType[]).map((type) => {
              const label = getZoneLabel(type, genre);
              const min = minByType[type];
              const count = countByType[type];
              const active = activeSectionTypes.includes(type);
              const dimmed = activeSectionTypes.length > 0 && !active;
              return (
                <button key={type} onClick={() => onSectionTypeToggle(type)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left transition-all ${
                    active   ? "bg-gray-100 border border-gray-200"
                    : dimmed ? "border border-transparent opacity-40"
                    :          "border border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: CLR[type].act }} />
                    <span className={`text-sm font-medium ${active ? "text-gray-900" : dimmed ? "text-gray-400" : "text-gray-700"}`}>
                      {label}
                    </span>
                    {count > 0 && <span className={`text-xs ${active ? "text-gray-600" : "text-gray-400"}`}>{count}</span>}
                  </div>
                  {min !== null ? (
                    <span className={`text-xs font-semibold tabular-nums ${active ? "text-gray-900" : dimmed ? "text-gray-300" : "text-gray-500"}`}>
                      from {fmt(min)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </button>
              );
            })}
            {activeSectionTypes.length > 0 && (
              <button onClick={onClearSectionTypes} className="mt-2 text-xs text-gray-500 hover:text-gray-700 font-medium transition text-left px-3">
                Clear zone filter
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <ExpandedModal
          listings={listings} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
          onSectionTypeToggle={onSectionTypeToggle} onClearSectionTypes={onClearSectionTypes}
          onZoneHover={onZoneHover} onClose={() => setExpanded(false)}
          genre={genre} venue={venue} minByType={minByType} countByType={countByType}
        />
      )}
    </>
  );
}
