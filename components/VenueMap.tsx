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
  floor: { base: "#4ade80", act: "#16a34a", dim: "#dcfce7" },
  lower: { base: "#93c5fd", act: "#2563eb", dim: "#dbeafe" },
  club:  { base: "#5eead4", act: "#0d9488", dim: "#ccfbf1" },
  upper: { base: "#cbd5e1", act: "#475569", dim: "#f1f5f9" },
  suite: { base: "#fcd34d", act: "#d97706", dim: "#fef3c7" },
};

const INK = "rgba(15,23,42,0.72)";
const GRS = { base: "#4ade80", act: "#16a34a", dim: "#dcfce7" };

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
function divLine(cx: number, cy: number, iRx: number, iRy: number, oRx: number, oRy: number, deg: number) {
  const r = toRad(deg);
  return {
    x1: cx + iRx * Math.sin(r), y1: cy - iRy * Math.cos(r),
    x2: cx + oRx * Math.sin(r), y2: cy - oRy * Math.cos(r),
  };
}

const SB = { w: 14, h: 9, gap: 3, count: 5 };
const sbTotalH = SB.count * SB.h + (SB.count - 1) * SB.gap;

function ArenaMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, genre = "", venue = "", showBadges, minByType, countByType }: MapProps) {
  const isNBA = genre === "NBA", isNHL = genre === "NHL";
  const isMSG = venue === "Madison Square Garden";

  // ── Venue-specific ring geometry ──────────────────────────────────────────
  // MSG is nearly circular; Crypto.com is a standard elongated oval.
  // Lower ring uses 40 dividers; upper uses 30 — matches real venue section density.
  const ARENA_RINGS = isMSG ? [
    { type: "lower" as SectionType, label: "LOWER ARENA", iRx: 78,  iRy: 60,  oRx: 128, oRy: 98,  divs: 40 },
    { type: "club"  as SectionType, label: "SUITE LEVEL", iRx: 136, iRy: 106, oRx: 156, oRy: 122, divs: 14 },
    { type: "upper" as SectionType, label: "BALCONY",     iRx: 164, iRy: 130, oRx: 208, oRy: 142, divs: 30 },
  ] : [
    { type: "lower" as SectionType, label: "LOWER BOWL",  iRx: 88,  iRy: 44,  oRx: 150, oRy: 92,  divs: 40 },
    { type: "club"  as SectionType, label: "CLUB",        iRx: 158, iRy: 99,  oRx: 182, oRy: 115, divs: 14 },
    { type: "upper" as SectionType, label: "UPPER DECK",  iRx: 190, iRy: 122, oRx: 248, oRy: 146, divs: 30 },
  ];

  const outerRx   = isMSG ? 214 : 254;
  const outerRy   = isMSG ? 144 : 149;
  const floorRx   = isMSG ? 70  : 80;
  const floorRy   = isMSG ? 44  : 36;
  const sbTop     = AR.CY - sbTotalH / 2;
  const suiteX1   = AR.CX - outerRx - SB.w - 2;
  const suiteX2   = AR.CX + outerRx + 2;
  const upperSecBase = isMSG ? 201 : 301;

  const floorLabel = isNBA ? "COURT" : isNHL ? "ICE" : "STAGE";
  const floorSub   = isNBA ? "COURTSIDE" : isNHL ? "RINKSIDE" : "GA / FLOOR";

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const baseColor   = isNBA ? "#d4a96a" : isNHL ? "#cce8f8" : "#1e293b";
  const activeColor = isNBA ? "#b8883a" : isNHL ? "#99cef0" : CLR.floor.act;
  const dimColor    = isNBA ? "#ede8d8" : isNHL ? "#e8f5fd" : CLR.floor.dim;
  const floorColor  = hoveredZone === "floor" ? activeColor : floorDimmed ? dimColor : floorActive ? activeColor : baseColor;
  const floorInk    = isNHL ? INK : "rgba(255,255,255,0.92)";
  const floorStroke = hoveredZone === "floor" || floorActive ? "#2563eb" : "#e2e8f0";

  return (
    <svg viewBox={`0 0 ${AR.W} ${AR.H}`} className="w-full" style={{ background: "#f8fafc" }}>

      {/* Subtle background circle */}
      <ellipse cx={AR.CX} cy={AR.CY} rx={outerRx + 18} ry={outerRy + 14}
        fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />

      {/* Seating rings — outer to inner */}
      {[...ARENA_RINGS].reverse().map((ring) => {
        const f = zoneFill(ring.type, hoveredZone, activeSectionTypes);
        const midRy = (ring.iRy + ring.oRy) / 2;
        const midRx = (ring.iRx + ring.oRx) / 2;
        const isAct = activeSectionTypes.includes(ring.type) || hoveredZone === ring.type;
        // Aisle dividers every 4th line; thinner lines between
        const aisleMod = ring.divs <= 14 ? 2 : 4;
        return (
          <g key={ring.type}>
            <path
              d={ringPath(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy)}
              fill={f} fillRule="evenodd"
              stroke={isAct ? CLR[ring.type].act : "#d1d5db"} strokeWidth={ring.type === "lower" ? "1.2" : "0.8"}
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(ring.type)}
              onMouseEnter={() => onZoneHover(ring.type)}
              onMouseLeave={() => onZoneHover(null)}
            />
            {/* Section dividers */}
            {Array.from({ length: ring.divs }, (_, i) => {
              const l = divLine(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy, i * (360 / ring.divs));
              const isAisle = i % aisleMod === 0;
              return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={isAisle ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)"}
                strokeWidth={isAisle ? "1.1" : "0.45"}
                style={{ pointerEvents: "none" }} />;
            })}
            {/* Section numbers — lower bowl (every other section to avoid crowding) */}
            {ring.type === "lower" && Array.from({ length: ring.divs }, (_, i) => {
              if (i % 2 !== 0) return null;
              const angle = (i + 0.5) * (360 / ring.divs);
              const rad = toRad(angle);
              const x = AR.CX + midRx * Math.sin(rad);
              const y = AR.CY - midRy * Math.cos(rad);
              return (
                <text key={i} x={x} y={y + 2.5} textAnchor="middle" fontSize="5.5"
                  fill={INK} fontFamily="system-ui" fontWeight="700"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >{101 + i}</text>
              );
            })}
            {/* Section numbers — upper ring (every other) */}
            {ring.type === "upper" && Array.from({ length: ring.divs }, (_, i) => {
              if (i % 2 !== 0) return null;
              const angle = (i + 0.5) * (360 / ring.divs);
              const rad = toRad(angle);
              const x = AR.CX + midRx * Math.sin(rad);
              const y = AR.CY - midRy * Math.cos(rad);
              return (
                <text key={i} x={x} y={y + 2.5} textAnchor="middle" fontSize="5"
                  fill={INK} fontFamily="system-ui" fontWeight="600"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >{upperSecBase + i}</text>
              );
            })}
            {/* Zone label */}
            <text x={AR.CX} y={AR.CY + midRy + 5} textAnchor="middle" fontSize="6"
              fill={INK} fontFamily="system-ui,sans-serif"
              fontWeight="700" letterSpacing="0.8"
              style={{ pointerEvents: "none", userSelect: "none" }}>{ring.label}</text>
          </g>
        );
      })}

      {/* Floor (court / ice / stage) */}
      <path
        d={ellipsePath(AR.CX, AR.CY, floorRx, floorRy)}
        fill={floorColor} stroke={floorStroke} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
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
            fill="#1e293b" stroke="#334155" strokeWidth="0.9" />
          <rect x={AR.CX - 32} y={AR.CY + 7} width={64} height={4} rx={1} fill="#0f172a" />
          <text x={AR.CX} y={AR.CY + 22} textAnchor="middle" fontSize="6"
            fill="rgba(255,255,255,0.5)" fontFamily="system-ui" letterSpacing="2">STAGE</text>
          <rect x={AR.CX - 42} y={AR.CY + 12} width={5} height={12} rx={1} fill="#334155" />
          <rect x={AR.CX + 37} y={AR.CY + 12} width={5} height={12} rx={1} fill="#334155" />
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
      {[{ x: suiteX1 }, { x: suiteX2 }].map((set, si) => (
        <g key={si} style={{ cursor: "pointer" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => onZoneHover("suite")}
          onMouseLeave={() => onZoneHover(null)}
        >
          {Array.from({ length: SB.count }, (_, i) => (
            <rect key={i} x={set.x} y={sbTop + i * (SB.h + SB.gap)}
              width={SB.w} height={SB.h} rx={2}
              fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
              stroke="#e2e8f0" strokeWidth="0.7"
              style={{ transition: "fill 0.12s" }}
            />
          ))}
          <text x={set.x + SB.w / 2} y={sbTop - 5}
            textAnchor="middle" fontSize="4.5" fill={INK}
            fontFamily="system-ui" fontWeight="600"
            style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>
        </g>
      ))}

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

function NFLMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, venue = "", showBadges, minByType, countByType }: MapProps) {
  const lowerMidY_top = NFY - 14;
  const lowerMidY_bot = NFY + NFL_FIELD.h + 14;
  const isATT = venue === "AT&T Stadium";
  const topSecNums = isATT ? [102, 108, 114, 119, 125] : [103, 110, 118, 126, 133];
  const botSecNums = isATT ? [220, 226, 232, 238, 244] : [310, 318, 326, 334, 342];
  const sideSecX = topSecNums.map((_, i) => NFX + EZ_W + playW * (i + 1) / (topSecNums.length + 1));

  return (
    <svg viewBox={`0 0 ${NF.W} ${NF.H}`} className="w-full" style={{ background: "#f8fafc" }}>

      {/* Seating bands — outer to inner */}
      {[...NFL_BANDS].reverse().map((band) => {
        const bx = NFX - band.pad, by = NFY - band.pad;
        const bw = NFL_FIELD.w + band.pad * 2, bh = NFL_FIELD.h + band.pad * 2;
        const f = zoneFill(band.type, hoveredZone, activeSectionTypes);
        const isAct = activeSectionTypes.includes(band.type) || hoveredZone === band.type;

        // Section dividers along the sidelines
        const numDivs = band.type === "lower" ? 12 : band.type === "club" ? 8 : 10;
        return (
          <g key={band.type}>
            <rect x={bx} y={by} width={bw} height={bh} rx={band.rx}
              fill={f}
              stroke={isAct ? CLR[band.type].act : "#d1d5db"} strokeWidth="1.2"
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(band.type)}
              onMouseEnter={() => onZoneHover(band.type)}
              onMouseLeave={() => onZoneHover(null)}
            />
            {/* Sideline section dividers */}
            {Array.from({ length: numDivs - 1 }, (_, i) => {
              const x = bx + (bw * (i + 1)) / numDivs;
              // Only draw dividers along the long sides, not through the field
              return (
                <g key={i} style={{ pointerEvents: "none" }}>
                  <line x1={x} y1={by} x2={x} y2={by + (band.pad - (i === 0 ? 0 : 0))}
                    stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
                  <line x1={x} y1={by + bh} x2={x} y2={by + bh - band.pad}
                    stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Zone labels */}
      {NFL_BANDS.map((band) => {
        const prevPad = band.pad === 28 ? 0 : band.pad === 46 ? 28 : 46;
        const labelY = NFY - prevPad - (band.pad - prevPad) / 2 + 3;
        return (
          <text key={band.type} x={NF.CX} y={labelY}
            textAnchor="middle" fontSize="6.5" fill={INK}
            fontFamily="system-ui" fontWeight="700" letterSpacing="0.7"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{band.label}</text>
        );
      })}

      {/* Section numbers */}
      {topSecNums.map((num, i) => (
        <text key={i} x={sideSecX[i]} y={lowerMidY_top + 3}
          textAnchor="middle" fontSize="6" fill={INK}
          fontFamily="system-ui" fontWeight="700"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >{num}</text>
      ))}
      {botSecNums.map((num, i) => (
        <text key={i} x={sideSecX[i]} y={lowerMidY_bot + 3}
          textAnchor="middle" fontSize="6" fill={INK}
          fontFamily="system-ui" fontWeight="700"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >{num}</text>
      ))}

      {/* Suite strips */}
      {[
        { x: NFX - 28, y: NFY - 10, w: NFL_FIELD.w + 56, h: 9 },
        { x: NFX - 28, y: NFY + NFL_FIELD.h + 1, w: NFL_FIELD.w + 56, h: 9 },
      ].map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={2}
          fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
          stroke="#e2e8f0" strokeWidth="0.8"
          style={{ cursor: "pointer", transition: "fill 0.12s" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => onZoneHover("suite")}
          onMouseLeave={() => onZoneHover(null)}
        />
      ))}
      <text x={NF.CX} y={NFY - 14} textAnchor="middle" fontSize="5.5"
        fill={INK} fontFamily="system-ui" fontWeight="600"
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

// 25 sections — matches real Yankee Stadium lower deck count
const MLB_SEC_COUNT = 25;
const MLB_DIVS = Array.from({ length: MLB_SEC_COUNT + 1 }, (_, i) => FAN_S + i * (FAN_E - FAN_S) / MLB_SEC_COUNT);

function MLBMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, venue = "", showBadges, minByType, countByType }: MapProps) {
  const cx = BL.HX, cy = BL.HY;
  const d = 32;
  const hp = { x: cx,     y: cy };
  const b1 = { x: cx + d, y: cy - d };
  const b2 = { x: cx,     y: cy - 2 * d };
  const b3 = { x: cx - d, y: cy - d };
  const pm = { x: cx,     y: cy - 38 };

  const mkZoneStroke = (t: SectionType) =>
    activeSectionTypes.includes(t) || hoveredZone === t ? CLR[t].act : "#d1d5db";

  return (
    <svg viewBox={`0 0 ${BL.W} ${BL.H}`} className="w-full" style={{ background: "#f8fafc" }}>

      {/* ── Seating zones ── */}
      <path d={arcBandPath(cx, cy, MLB_R.upperIn, MLB_R.upperOut, FAN_S, FAN_E)}
        fill={zoneFill("upper", hoveredZone, activeSectionTypes)}
        stroke={mkZoneStroke("upper")} strokeWidth="1.2"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("upper")}
        onMouseEnter={() => onZoneHover("upper")}
        onMouseLeave={() => onZoneHover(null)}
      />
      <path d={arcBandPath(cx, cy, MLB_R.clubIn, MLB_R.clubOut, FAN_S, FAN_E)}
        fill={zoneFill("club", hoveredZone, activeSectionTypes)}
        stroke={mkZoneStroke("club")} strokeWidth="1.2"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("club")}
        onMouseEnter={() => onZoneHover("club")}
        onMouseLeave={() => onZoneHover(null)}
      />
      <path d={arcBandPath(cx, cy, MLB_R.suiteIn, MLB_R.suiteOut, FAN_S, FAN_E)}
        fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
        stroke={mkZoneStroke("suite")} strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => onZoneHover("suite")}
        onMouseLeave={() => onZoneHover(null)}
      />
      <path d={arcBandPath(cx, cy, MLB_R.lowerIn, MLB_R.lowerOut, FAN_S, FAN_E)}
        fill={zoneFill("lower", hoveredZone, activeSectionTypes)}
        stroke={mkZoneStroke("lower")} strokeWidth="1.2"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("lower")}
        onMouseEnter={() => onZoneHover("lower")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Section dividers — all zones */}
      {MLB_DIVS.map((deg, i) => {
        const isle = i % 5 === 0;
        const lIn  = arcPoint(cx, cy, MLB_R.lowerIn,  deg);
        const lOut = arcPoint(cx, cy, MLB_R.lowerOut, deg);
        const cIn  = arcPoint(cx, cy, MLB_R.clubIn,   deg);
        const cOut = arcPoint(cx, cy, MLB_R.clubOut,  deg);
        const uIn  = arcPoint(cx, cy, MLB_R.upperIn,  deg);
        const uOut = arcPoint(cx, cy, MLB_R.upperOut, deg);
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <line x1={lIn.x} y1={lIn.y} x2={lOut.x} y2={lOut.y}
              stroke={isle ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"} strokeWidth={isle ? "1.1" : "0.55"} />
            <line x1={cIn.x} y1={cIn.y} x2={cOut.x} y2={cOut.y}
              stroke={isle ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"} strokeWidth={isle ? "1.1" : "0.55"} />
            <line x1={uIn.x} y1={uIn.y} x2={uOut.x} y2={uOut.y}
              stroke={isle ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"} strokeWidth={isle ? "1.1" : "0.55"} />
          </g>
        );
      })}

      {/* Section numbers — lower bowl, every other */}
      {Array.from({ length: MLB_SEC_COUNT }, (_, i) => {
        if (i % 2 !== 0) return null;
        const deg = FAN_S + (i + 0.5) * (FAN_E - FAN_S) / MLB_SEC_COUNT;
        const midR = (MLB_R.lowerIn + MLB_R.lowerOut) / 2;
        const pt = arcPoint(cx, cy, midR, deg);
        return (
          <text key={i} x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="5.5"
            fill={INK} fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{100 + i + 1}</text>
        );
      })}

      {/* ── Playing field ── */}
      <path d={arcBandPath(cx, cy, MLB_R.trackIn, MLB_R.trackOut, FAN_S, FAN_E)}
        fill="#c4a96d" stroke="#e5e7eb" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <path d={sectorPath(cx, cy, MLB_R.wall + 2, FAN_S, FAN_E)}
        fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ pointerEvents: "none" }} />

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

      {/* Distance markers — Yankee Stadium */}
      {[
        { deg: (FAN_S + FAN_E) / 2, r: MLB_R.wall - 10, text: "408′" },
        { deg: FAN_S + 22,           r: MLB_R.wall - 10, text: "318′" },
        { deg: FAN_E - 18,           r: MLB_R.wall - 10, text: "314′" },
      ].map(({ deg, r, text }) => {
        const pt = arcPoint(cx, cy, r, deg);
        return (
          <text key={text} x={pt.x} y={pt.y + 2.5} textAnchor="middle" fontSize="6.5"
            fill={INK} fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}>{text}</text>
        );
      })}

      {/* Monument Park */}
      {(() => {
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
      <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
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
                <button onClick={onClearSectionTypes} className="text-xs text-blue-400 hover:text-blue-300 transition">Clear</button>
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
              active   ? "border-blue-200 bg-blue-50 text-blue-700"
              : dimmed ? "border-transparent opacity-40 text-gray-500"
              :          "border-gray-200 hover:bg-gray-50 text-gray-600"
            }`}
          >
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CLR[type].act }} />
            <span className="font-semibold">{label}</span>
            {min !== null && (
              <span className={`tabular-nums ${active ? "text-blue-500" : "text-gray-400"}`}>
                from {fmt(min)}
              </span>
            )}
          </button>
        );
      })}
      {activeSectionTypes.length > 0 && (
        <button onClick={onClearSectionTypes}
          className="px-2.5 py-1.5 rounded-lg text-xs text-blue-600 hover:text-blue-700 font-medium transition">
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
          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-[#f8fafc] rounded-xl border border-gray-100">
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
                className="absolute bottom-3 right-3 flex items-center gap-1 bg-white border border-gray-200 text-blue-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition"
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
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold transition px-2 py-1 rounded-md hover:bg-blue-50"
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
                    active   ? "bg-blue-50 border border-blue-200"
                    : dimmed ? "border border-transparent opacity-40"
                    :          "border border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: CLR[type].act }} />
                    <span className={`text-sm font-medium ${active ? "text-blue-700" : dimmed ? "text-gray-400" : "text-gray-700"}`}>
                      {label}
                    </span>
                    {count > 0 && <span className={`text-xs ${active ? "text-blue-500" : "text-gray-400"}`}>{count}</span>}
                  </div>
                  {min !== null ? (
                    <span className={`text-xs font-semibold tabular-nums ${active ? "text-blue-600" : dimmed ? "text-gray-300" : "text-gray-500"}`}>
                      from {fmt(min)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </button>
              );
            })}
            {activeSectionTypes.length > 0 && (
              <button onClick={onClearSectionTypes} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition text-left px-3">
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
