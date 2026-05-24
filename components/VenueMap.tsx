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
}

interface MapProps {
  activeSectionTypes: SectionType[];
  hoveredZone: SectionType | null;
  onSectionTypeToggle: (t: SectionType) => void;
  onZoneHover: (t: SectionType | null) => void;
  genre?: string;
  showBadges?: boolean;
  minByType?: Record<SectionType, number | null>;
  countByType?: Record<SectionType, number>;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const CLR: Record<SectionType, { base: string; act: string; dim: string }> = {
  floor: { base: "#15803d", act: "#22c55e", dim: "#052e16" },
  lower: { base: "#1d4ed8", act: "#3b82f6", dim: "#0c1d5e" },
  club:  { base: "#0f766e", act: "#14b8a6", dim: "#042f2b" },
  upper: { base: "#334155", act: "#64748b", dim: "#0f172a" },
  suite: { base: "#92400e", act: "#f59e0b", dim: "#3d1a06" },
};

const GRS = { base: "#15803d", act: "#22c55e", dim: "#052e16" };

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
        fill={active ? "rgba(59,130,246,0.85)" : "rgba(0,0,0,0.75)"}
        stroke={active ? "rgba(147,197,253,0.6)" : "rgba(255,255,255,0.14)"}
        strokeWidth="0.6"
      />
      <text x={x} y={y + 1} textAnchor="middle" fontSize="6.5"
        fill="rgba(255,255,255,0.95)" fontFamily="system-ui" fontWeight="700"
        style={{ userSelect: "none" }}
      >{text}</text>
    </g>
  );
}

// ─────────────────────────────── ARENA MAP ───────────────────────────────────
// Wide oval (1.70 aspect), viewBox 580×300, center (290,150).
// Lower bowl: 16 sections (101-116) with visible numbers.
// Club: 10 sections.  Upper: 20 sections.
// Suite boxes on both long sides.

const AR = { W: 580, H: 300, CX: 290, CY: 150 };

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

const ARENA_RINGS = [
  { type: "lower" as SectionType, label: "LOWER BOWL", iRx: 90,  iRy: 46,  oRx: 152, oRy: 94,  divs: 16 },
  { type: "club"  as SectionType, label: "CLUB",        iRx: 160, iRy: 101, oRx: 184, oRy: 117, divs: 10 },
  { type: "upper" as SectionType, label: "UPPER DECK",  iRx: 192, iRy: 124, oRx: 250, oRy: 148, divs: 20 },
];

const SB = { w: 14, h: 10, gap: 3, count: 5 };
const sbTotalH = SB.count * SB.h + (SB.count - 1) * SB.gap;
const sbTop = AR.CY - sbTotalH / 2;
const SUITE_SETS = [{ x: AR.CX - 250 - SB.w - 6 }, { x: AR.CX + 250 + 6 }];

function ArenaMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, genre = "", showBadges, minByType, countByType }: MapProps) {
  const isNBA = genre === "NBA", isNHL = genre === "NHL";
  const floorLabel = isNBA ? "COURT" : isNHL ? "ICE" : "FLOOR";
  const floorSub   = isNBA ? "COURTSIDE" : isNHL ? "RINKSIDE" : "GA / STAGE";

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const baseColor   = isNBA ? "#7c4a18" : isNHL ? "#bdd3e8" : "#0f2d4a";
  const activeColor = isNBA ? "#b5722a" : isNHL ? "#ddf0fc" : "#1a4a72";
  const dimColor    = isNBA ? "#2a1608" : isNHL ? "#4a6070" : "#040d18";
  const floorColor  = hoveredZone === "floor" ? activeColor : floorDimmed ? dimColor : floorActive ? activeColor : baseColor;
  const strokeC     = hoveredZone === "floor" || floorActive ? "rgba(255,255,255,0.3)" : "#050810";

  return (
    <svg viewBox={`0 0 ${AR.W} ${AR.H}`} className="w-full" style={{ background: "#050810" }}>
      {/* Outer glow ring */}
      <ellipse cx={AR.CX} cy={AR.CY} rx={256} ry={151} fill="none" stroke="#1a3050" strokeWidth="1.5" opacity="0.6" />

      {/* Seating rings — outer to inner so inner sits on top */}
      {[...ARENA_RINGS].reverse().map((ring) => {
        const f = zoneFill(ring.type, hoveredZone, activeSectionTypes);
        const isActive = activeSectionTypes.includes(ring.type);
        const midRy = (ring.iRy + ring.oRy) / 2;
        const midRx = (ring.iRx + ring.oRx) / 2;
        const glowColor = ring.type === "lower"
          ? (isActive || hoveredZone === "lower" ? "rgba(59,130,246,0.6)" : "rgba(29,78,216,0.35)")
          : "#050810";

        return (
          <g key={ring.type}>
            <path
              d={ringPath(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy)}
              fill={f} fillRule="evenodd"
              stroke={glowColor} strokeWidth={ring.type === "lower" ? "1.5" : "1"}
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(ring.type)}
              onMouseEnter={() => onZoneHover(ring.type)}
              onMouseLeave={() => onZoneHover(null)}
            />
            {/* Section dividers */}
            {Array.from({ length: ring.divs }, (_, i) => {
              const l = divLine(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy, i * (360 / ring.divs));
              const isAisle = i % 4 === 0;
              return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={isAisle ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.38)"}
                strokeWidth={isAisle ? "1.2" : "0.6"}
                style={{ pointerEvents: "none" }} />;
            })}
            {/* Section numbers — lower bowl only */}
            {ring.type === "lower" && Array.from({ length: ring.divs }, (_, i) => {
              const angle = (i + 0.5) * (360 / ring.divs);
              const rad = toRad(angle);
              const x = AR.CX + midRx * Math.sin(rad);
              const y = AR.CY - (ring.iRy + ring.oRy) / 2 * Math.cos(rad);
              return (
                <text key={i} x={x} y={y + 2.5} textAnchor="middle" fontSize="6"
                  fill="rgba(255,255,255,0.5)" fontFamily="system-ui" fontWeight="700"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >{100 + i + 1}</text>
              );
            })}
            {/* Zone label at bottom of ring */}
            <text x={AR.CX} y={AR.CY + midRy + 5} textAnchor="middle" fontSize="6.5"
              fill="rgba(255,255,255,0.55)" fontFamily="system-ui,sans-serif"
              fontWeight="700" letterSpacing="0.8"
              style={{ pointerEvents: "none", userSelect: "none" }}>{ring.label}</text>
          </g>
        );
      })}

      {/* Floor ellipse */}
      <path
        d={ellipsePath(AR.CX, AR.CY, 82, 38)}
        fill={floorColor} stroke={strokeC} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* NBA court */}
      {isNBA && (
        <g style={{ pointerEvents: "none" }} opacity="0.8">
          <line x1={AR.CX} y1={AR.CY - 38} x2={AR.CX} y2={AR.CY + 38} stroke="#c8871c" strokeWidth="0.7" />
          <ellipse cx={AR.CX} cy={AR.CY} rx={9} ry={6} fill="none" stroke="#c8871c" strokeWidth="0.8" />
          <circle cx={AR.CX} cy={AR.CY} r={1.5} fill="#c8871c" />
          {/* Paint boxes */}
          <rect x={AR.CX - 10} y={AR.CY - 38} width={20} height={18} fill="rgba(180,100,20,0.2)" stroke="#c8871c" strokeWidth="0.7" />
          <rect x={AR.CX - 10} y={AR.CY + 20} width={20} height={18} fill="rgba(180,100,20,0.2)" stroke="#c8871c" strokeWidth="0.7" />
          {/* Free-throw circles */}
          <ellipse cx={AR.CX} cy={AR.CY - 20} rx={10} ry={7} fill="none" stroke="#c8871c" strokeWidth="0.7" strokeDasharray="2,1.5" />
          <ellipse cx={AR.CX} cy={AR.CY + 20} rx={10} ry={7} fill="none" stroke="#c8871c" strokeWidth="0.7" strokeDasharray="2,1.5" />
          {/* 3-point arcs */}
          <path d={`M ${AR.CX - 10} ${AR.CY - 38} A 24 21 0 0 0 ${AR.CX + 10} ${AR.CY - 38}`} fill="none" stroke="#c8871c" strokeWidth="0.7" />
          <path d={`M ${AR.CX - 10} ${AR.CY + 38} A 24 21 0 0 1 ${AR.CX + 10} ${AR.CY + 38}`} fill="none" stroke="#c8871c" strokeWidth="0.7" />
          {/* Basket rings */}
          <circle cx={AR.CX} cy={AR.CY - 31} r={2.5} fill="none" stroke="#c8871c" strokeWidth="0.8" />
          <circle cx={AR.CX} cy={AR.CY + 31} r={2.5} fill="none" stroke="#c8871c" strokeWidth="0.8" />
          {/* Restricted area arcs */}
          <path d={`M ${AR.CX - 5} ${AR.CY - 31} A 5 4 0 0 0 ${AR.CX + 5} ${AR.CY - 31}`} fill="none" stroke="#c8871c" strokeWidth="0.6" />
          <path d={`M ${AR.CX - 5} ${AR.CY + 31} A 5 4 0 0 1 ${AR.CX + 5} ${AR.CY + 31}`} fill="none" stroke="#c8871c" strokeWidth="0.6" />
        </g>
      )}

      {/* NHL ice */}
      {isNHL && (
        <g style={{ pointerEvents: "none" }} opacity="0.85">
          <line x1={AR.CX} y1={AR.CY - 38} x2={AR.CX} y2={AR.CY + 38} stroke="#cc0000" strokeWidth="1.2" />
          <line x1={AR.CX - 24} y1={AR.CY - 38} x2={AR.CX - 24} y2={AR.CY + 38} stroke="#0055cc" strokeWidth="0.9" />
          <line x1={AR.CX + 24} y1={AR.CY - 38} x2={AR.CX + 24} y2={AR.CY + 38} stroke="#0055cc" strokeWidth="0.9" />
          <ellipse cx={AR.CX} cy={AR.CY} rx={14} ry={9} fill="none" stroke="#cc0000" strokeWidth="0.9" />
          <circle cx={AR.CX} cy={AR.CY} r={1.5} fill="#cc0000" />
          {/* Corner faceoff circles */}
          {([-32, 32] as number[]).flatMap(dx =>
            ([-18, 18] as number[]).map(dy => (
              <g key={`${dx}${dy}`}>
                <ellipse cx={AR.CX + dx} cy={AR.CY + dy} rx={7} ry={5} fill="none" stroke="#cc0000" strokeWidth="0.7" />
                <circle cx={AR.CX + dx} cy={AR.CY + dy} r={1} fill="#cc0000" />
                {/* Hash marks */}
                <line x1={AR.CX + dx - 2} y1={AR.CY + dy - 5} x2={AR.CX + dx - 2} y2={AR.CY + dy - 8} stroke="#cc0000" strokeWidth="0.5" />
                <line x1={AR.CX + dx + 2} y1={AR.CY + dy - 5} x2={AR.CX + dx + 2} y2={AR.CY + dy - 8} stroke="#cc0000" strokeWidth="0.5" />
              </g>
            ))
          )}
          {/* Goal creases */}
          <path d={`M ${AR.CX - 6} ${AR.CY - 36} A 6 4 0 0 1 ${AR.CX + 6} ${AR.CY - 36}`} fill="rgba(100,150,255,0.3)" stroke="#cc0000" strokeWidth="0.7" />
          <path d={`M ${AR.CX - 6} ${AR.CY + 36} A 6 4 0 0 0 ${AR.CX + 6} ${AR.CY + 36}`} fill="rgba(100,150,255,0.3)" stroke="#cc0000" strokeWidth="0.7" />
          {/* Nets */}
          <rect x={AR.CX - 5} y={AR.CY - 38} width={10} height={3} rx={1} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          <rect x={AR.CX - 5} y={AR.CY + 35} width={10} height={3} rx={1} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
        </g>
      )}

      {/* Concert stage */}
      {!isNBA && !isNHL && (
        <g style={{ pointerEvents: "none" }}>
          <rect x={AR.CX - 40} y={AR.CY + 10} width={80} height={22} rx={3} fill="#081828" stroke="#14375e" strokeWidth="0.9" />
          <rect x={AR.CX - 34} y={AR.CY + 9} width={68} height={4} rx={1} fill="#0a1f34" />
          <text x={AR.CX} y={AR.CY + 23} textAnchor="middle" fontSize="6.5"
            fill="rgba(255,255,255,0.28)" fontFamily="system-ui" letterSpacing="2">STAGE</text>
          {/* Speaker stacks */}
          <rect x={AR.CX - 44} y={AR.CY + 14} width={5} height={12} rx={1} fill="#0a1c2e" stroke="#1a3a5e" strokeWidth="0.5" />
          <rect x={AR.CX + 39} y={AR.CY + 14} width={5} height={12} rx={1} fill="#0a1c2e" stroke="#1a3a5e" strokeWidth="0.5" />
        </g>
      )}

      {/* Floor labels */}
      <text x={AR.CX} y={AR.CY - 3} textAnchor="middle" fontSize="8.5"
        fill="rgba(255,255,255,0.85)" fontFamily="system-ui,sans-serif"
        fontWeight="800" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>{floorLabel}</text>
      <text x={AR.CX} y={AR.CY + 9} textAnchor="middle" fontSize="6"
        fill="rgba(255,255,255,0.4)" fontFamily="system-ui,sans-serif"
        fontWeight="600" letterSpacing="0.3"
        style={{ pointerEvents: "none", userSelect: "none" }}>{floorSub}</text>

      {/* Suite boxes */}
      {SUITE_SETS.map((set, si) => (
        <g key={si} style={{ cursor: "pointer" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => onZoneHover("suite")}
          onMouseLeave={() => onZoneHover(null)}
        >
          {Array.from({ length: SB.count }, (_, i) => (
            <rect key={i} x={set.x} y={sbTop + i * (SB.h + SB.gap)}
              width={SB.w} height={SB.h} rx={2}
              fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
              stroke="#050810" strokeWidth="0.8"
              style={{ transition: "fill 0.12s" }}
            />
          ))}
          <text x={set.x + SB.w / 2} y={sbTop - 5}
            textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.3)"
            fontFamily="system-ui" fontWeight="600"
            style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>
        </g>
      ))}

      {/* Price badges */}
      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={AR.CX} y={AR.CY - 6} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={AR.CX + 122} y={AR.CY} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={AR.CX + 170} y={AR.CY + 22} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={AR.CX} y={AR.CY + 141} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={SUITE_SETS[0].x + SB.w / 2} y={sbTop - 16} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}

      {/* Compass */}
      <text x={AR.CX} y={13} textAnchor="middle" fontSize="9" fill="#1e3a5f" fontWeight="700" fontFamily="system-ui">N</text>
      <line x1={AR.CX} y1={16} x2={AR.CX} y2={22} stroke="#1e3a5f" strokeWidth="0.7" strokeDasharray="2,3" />
    </svg>
  );
}

// ─────────────────────────────── NFL MAP ─────────────────────────────────────
// Resized for more realistic seating proportions.
// Field: 230×96, bands: lower=28, club=18, upper=36.
// Suite strips along both sidelines. Section labels on lower band.

const NF = { W: 540, H: 320, CX: 270, CY: 162 };
const NFL_FIELD = { w: 230, h: 96 };
const NFX = NF.CX - NFL_FIELD.w / 2;  // 155
const NFY = NF.CY - NFL_FIELD.h / 2;  // 114
const EZ_W = 20;                        // end zone = 20px (≈10 of 120 yards)
const playW = NFL_FIELD.w - 2 * EZ_W; // 190

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
      <line x1={x} y1={NFY + NFL_FIELD.h * 0.74} x2={x} y2={crossY} stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
      <line x1={x - 11 * d} y1={crossY} x2={x + 11 * d} y2={crossY} stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
      <line x1={x - 11 * d} y1={crossY} x2={x - 11 * d} y2={crossY - 15} stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
      <line x1={x + 11 * d} y1={crossY} x2={x + 11 * d} y2={crossY - 15} stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" />
    </g>
  );
}

function NFLMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, showBadges, minByType, countByType }: MapProps) {
  // Section labels along lower band sidelines
  const lowerMidY_top = NFY - 14;       // mid of top edge of lower band
  const lowerMidY_bot = NFY + NFL_FIELD.h + 14; // mid of bottom edge

  const sideSecNums = [101, 108, 115, 122, 129];
  const sideSecX = sideSecNums.map((_, i) => NFX + EZ_W + playW * (i + 1) / (sideSecNums.length + 1));

  return (
    <svg viewBox={`0 0 ${NF.W} ${NF.H}`} className="w-full" style={{ background: "#050810" }}>

      {/* Seating bands — outer to inner */}
      {[...NFL_BANDS].reverse().map((band) => {
        const bx = NFX - band.pad, by = NFY - band.pad;
        const bw = NFL_FIELD.w + band.pad * 2, bh = NFL_FIELD.h + band.pad * 2;
        const f = zoneFill(band.type, hoveredZone, activeSectionTypes);
        return (
          <g key={band.type}>
            <rect x={bx} y={by} width={bw} height={bh} rx={band.rx}
              fill={f} stroke="#050810" strokeWidth="1.5"
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(band.type)}
              onMouseEnter={() => onZoneHover(band.type)}
              onMouseLeave={() => onZoneHover(null)}
            />
          </g>
        );
      })}

      {/* Zone labels in each band */}
      {NFL_BANDS.map((band) => {
        const prevPad = band.pad === 28 ? 0 : band.pad === 46 ? 28 : 46;
        const labelY = NFY - prevPad - (band.pad - prevPad) / 2 + 3;
        return (
          <text key={band.type} x={NF.CX} y={labelY}
            textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.45)"
            fontFamily="system-ui" fontWeight="700" letterSpacing="0.7"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{band.label}</text>
        );
      })}

      {/* Section numbers along lower band — top sideline */}
      {sideSecNums.map((num, i) => (
        <text key={i} x={sideSecX[i]} y={lowerMidY_top + 3}
          textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.45)"
          fontFamily="system-ui" fontWeight="700"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >{num}</text>
      ))}
      {/* Section numbers — bottom sideline (mirrored) */}
      {sideSecNums.map((_, i) => (
        <text key={i} x={sideSecX[i]} y={lowerMidY_bot + 3}
          textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.45)"
          fontFamily="system-ui" fontWeight="700"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >{136 + i * 7}</text>
      ))}

      {/* Suite strips — both sidelines (inside lower band) */}
      {[
        { x: NFX - 28, y: NFY - 10, w: NFL_FIELD.w + 56, h: 9 },
        { x: NFX - 28, y: NFY + NFL_FIELD.h + 1,  w: NFL_FIELD.w + 56, h: 9 },
      ].map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={2}
          fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
          stroke="#050810" strokeWidth="0.8"
          style={{ cursor: "pointer", transition: "fill 0.12s" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => onZoneHover("suite")}
          onMouseLeave={() => onZoneHover(null)}
        />
      ))}
      <text x={NF.CX} y={NFY - 14} textAnchor="middle" fontSize="5.5"
        fill="rgba(255,255,255,0.3)" fontFamily="system-ui" fontWeight="600"
        style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>

      {/* Field base */}
      <rect x={NFX} y={NFY} width={NFL_FIELD.w} height={NFL_FIELD.h} rx={2}
        fill={fieldFill(hoveredZone, activeSectionTypes)}
        stroke={hoveredZone === "floor" ? "#4ade80" : "#166534"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Mowing stripes */}
      {Array.from({ length: 10 }, (_, i) => i % 2 === 0 ? null : (
        <rect key={i} x={NFX + EZ_W + i * playW / 10} y={NFY}
          width={playW / 10} height={NFL_FIELD.h}
          fill="rgba(255,255,255,0.03)" style={{ pointerEvents: "none" }} />
      ))}

      {/* End zones */}
      <rect x={NFX} y={NFY} width={EZ_W} height={NFL_FIELD.h} rx={2} fill="#14532d" style={{ pointerEvents: "none" }} />
      <rect x={NFX + NFL_FIELD.w - EZ_W} y={NFY} width={EZ_W} height={NFL_FIELD.h} rx={2} fill="#14532d" style={{ pointerEvents: "none" }} />
      {/* End zone text */}
      <text x={NFX + EZ_W / 2} y={NF.CY + 2} textAnchor="middle" fontSize="5"
        fill="rgba(255,255,255,0.3)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        transform={`rotate(-90, ${NFX + EZ_W / 2}, ${NF.CY})`}
        style={{ pointerEvents: "none", userSelect: "none" }}>END ZONE</text>
      <text x={NFX + NFL_FIELD.w - EZ_W / 2} y={NF.CY + 2} textAnchor="middle" fontSize="5"
        fill="rgba(255,255,255,0.3)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        transform={`rotate(90, ${NFX + NFL_FIELD.w - EZ_W / 2}, ${NF.CY})`}
        style={{ pointerEvents: "none", userSelect: "none" }}>END ZONE</text>

      {/* End zone separators */}
      <line x1={NFX + EZ_W} y1={NFY} x2={NFX + EZ_W} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.4)" strokeWidth="1" style={{ pointerEvents: "none" }} />
      <line x1={NFX + NFL_FIELD.w - EZ_W} y1={NFY} x2={NFX + NFL_FIELD.w - EZ_W} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.4)" strokeWidth="1" style={{ pointerEvents: "none" }} />

      {/* Yard lines + numbers */}
      {yardLines.map((x, i) => (
        <g key={i} style={{ pointerEvents: "none" }}>
          <line x1={x} y1={NFY + 2} x2={x} y2={NFY + NFL_FIELD.h - 2} stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
          <text x={x} y={NF.CY + 4} textAnchor="middle" fontSize="6.5"
            fill="rgba(255,255,255,0.4)" fontFamily="system-ui" fontWeight="700">{yardNums[i]}</text>
        </g>
      ))}

      {/* Hash marks */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = NFX + EZ_W + (i + 0.5) * playW / 10;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <line x1={x} y1={NFY + NFL_FIELD.h * 0.3} x2={x} y2={NFY + NFL_FIELD.h * 0.38} stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
            <line x1={x} y1={NFY + NFL_FIELD.h * 0.62} x2={x} y2={NFY + NFL_FIELD.h * 0.70} stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
          </g>
        );
      })}

      {/* Sidelines */}
      <line x1={NFX} y1={NFY} x2={NFX + NFL_FIELD.w} y2={NFY} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <line x1={NFX} y1={NFY + NFL_FIELD.h} x2={NFX + NFL_FIELD.w} y2={NFY + NFL_FIELD.h} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />

      {/* Goal posts */}
      <GoalPost x={NFX + EZ_W * 0.5} />
      <GoalPost x={NFX + NFL_FIELD.w - EZ_W * 0.5} flip />

      {/* Field label */}
      <text x={NF.CX} y={NF.CY - 10} textAnchor="middle" fontSize="8"
        fill="rgba(255,255,255,0.6)" fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>FIELD LEVEL</text>

      {/* Price badges */}
      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={NF.CX} y={NF.CY} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={NF.CX} y={NFY - 20} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={NF.CX} y={NFY - 38} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={NF.CX} y={NFY - 66} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={NF.CX} y={NFY - 7} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}

      {/* Compass */}
      <text x={NF.CX} y={13} textAnchor="middle" fontSize="9" fill="#1e3a5f" fontWeight="700" fontFamily="system-ui">N</text>
    </svg>
  );
}

// ─────────────────────────────── MLB MAP ─────────────────────────────────────
// Fan-shaped seating arcs radiating from home plate.
// viewBox 480×300, home plate at bottom-center (240, 278).
// Outfield distance markers. Foul poles. Warning track. Bullpens.

const BL = { W: 480, H: 300, HX: 240, HY: 278 };
const FAN_S = -218;
const FAN_E  = -38;

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
  lowerIn: 100, lowerOut: 145,
  suiteIn: 147, suiteOut: 155,
  clubIn:  157, clubOut:  175,
  upperIn: 177, upperOut: 220,
  wallOut: 226,
};

const MLB_DIVS = Array.from({ length: 14 }, (_, i) => FAN_S + i * (FAN_E - FAN_S) / 13);

function MLBMap({ activeSectionTypes, hoveredZone, onSectionTypeToggle, onZoneHover, showBadges, minByType, countByType }: MapProps) {
  const cx = BL.HX, cy = BL.HY;

  return (
    <svg viewBox={`0 0 ${BL.W} ${BL.H}`} className="w-full" style={{ background: "#050810" }}>

      {/* Upper deck */}
      <path d={arcBandPath(cx, cy, MLB_R.upperIn, MLB_R.upperOut, FAN_S, FAN_E)}
        fill={zoneFill("upper", hoveredZone, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("upper")}
        onMouseEnter={() => onZoneHover("upper")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Club / Mezzanine */}
      <path d={arcBandPath(cx, cy, MLB_R.clubIn, MLB_R.clubOut, FAN_S, FAN_E)}
        fill={zoneFill("club", hoveredZone, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("club")}
        onMouseEnter={() => onZoneHover("club")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Suite ring */}
      <path d={arcBandPath(cx, cy, MLB_R.suiteIn, MLB_R.suiteOut, FAN_S, FAN_E)}
        fill={zoneFill("suite", hoveredZone, activeSectionTypes)}
        stroke="#050810" strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => onZoneHover("suite")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Lower bowl */}
      <path d={arcBandPath(cx, cy, MLB_R.lowerIn, MLB_R.lowerOut, FAN_S, FAN_E)}
        fill={zoneFill("lower", hoveredZone, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("lower")}
        onMouseEnter={() => onZoneHover("lower")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Section dividers — all tiers */}
      {MLB_DIVS.map((deg, i) => {
        const lIn  = arcPoint(cx, cy, MLB_R.lowerIn,  deg);
        const lOut = arcPoint(cx, cy, MLB_R.lowerOut, deg);
        const cIn  = arcPoint(cx, cy, MLB_R.clubIn,   deg);
        const cOut = arcPoint(cx, cy, MLB_R.clubOut,  deg);
        const uIn  = arcPoint(cx, cy, MLB_R.upperIn,  deg);
        const uOut = arcPoint(cx, cy, MLB_R.upperOut, deg);
        const isAisle = i % 4 === 0;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <line x1={lIn.x}  y1={lIn.y}  x2={lOut.x} y2={lOut.y} stroke={isAisle ? "rgba(0,0,0,0.6)" : "#050810"} strokeWidth={isAisle ? "1.1" : "0.7"} />
            <line x1={cIn.x}  y1={cIn.y}  x2={cOut.x} y2={cOut.y} stroke={isAisle ? "rgba(0,0,0,0.6)" : "#050810"} strokeWidth={isAisle ? "1.1" : "0.7"} />
            <line x1={uIn.x}  y1={uIn.y}  x2={uOut.x} y2={uOut.y} stroke={isAisle ? "rgba(0,0,0,0.6)" : "#050810"} strokeWidth={isAisle ? "1.1" : "0.7"} />
          </g>
        );
      })}

      {/* Section numbers — lower bowl */}
      {Array.from({ length: 13 }, (_, i) => {
        const deg = FAN_S + (i + 0.5) * (FAN_E - FAN_S) / 13;
        const midR = (MLB_R.lowerIn + MLB_R.lowerOut) / 2;
        const pt = arcPoint(cx, cy, midR, deg);
        return (
          <text key={i} x={pt.x} y={pt.y + 2} textAnchor="middle" fontSize="6"
            fill="rgba(255,255,255,0.45)" fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{100 + i + 1}</text>
        );
      })}

      {/* Outfield grass (floor zone) */}
      <path d={arcBandPath(cx, cy, 62, MLB_R.lowerIn - 1, FAN_S, FAN_E)}
        fill={fieldFill(hoveredZone, activeSectionTypes)}
        stroke={hoveredZone === "floor" ? "#22c55e" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => onZoneHover("floor")}
        onMouseLeave={() => onZoneHover(null)}
      />

      {/* Warning track */}
      <path d={arcBandPath(cx, cy, MLB_R.upperOut, MLB_R.wallOut, FAN_S, FAN_E)}
        fill="#7a5c28" stroke="#050810" strokeWidth="0.8" style={{ pointerEvents: "none" }}
      />

      {/* Outfield wall */}
      <path d={sectorPath(cx, cy, MLB_R.wallOut + 3, FAN_S, FAN_E)}
        fill="none" stroke="#374151" strokeWidth="2.5" style={{ pointerEvents: "none" }}
      />

      {/* Foul poles */}
      {[FAN_S, FAN_E].map((deg, i) => {
        const pt = arcPoint(cx, cy, MLB_R.wallOut + 4, deg);
        return <circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill="#f59e0b" style={{ pointerEvents: "none" }} />;
      })}

      {/* Distance markers on wall */}
      {[
        { deg: FAN_S + 12, r: MLB_R.wallOut - 8, text: "330'" },
        { deg: (FAN_S + FAN_E) / 2, r: MLB_R.wallOut - 8, text: "410'" },
        { deg: FAN_E - 12, r: MLB_R.wallOut - 8, text: "330'" },
      ].map(({ deg, r, text }) => {
        const pt = arcPoint(cx, cy, r, deg);
        return (
          <text key={text + deg} x={pt.x} y={pt.y + 2} textAnchor="middle" fontSize="7"
            fill="rgba(255,255,255,0.45)" fontFamily="system-ui" fontWeight="700"
            style={{ pointerEvents: "none", userSelect: "none" }}>{text}</text>
        );
      })}

      {/* Bullpen rectangles in corner outfield */}
      {[
        { deg: FAN_S + 8, r: MLB_R.upperOut - 20, w: 16, h: 10 },
        { deg: FAN_E - 8, r: MLB_R.upperOut - 20, w: 16, h: 10 },
      ].map(({ deg, r }, i) => {
        const pt = arcPoint(cx, cy, r, deg);
        return (
          <rect key={i} x={pt.x - 8} y={pt.y - 5} width={16} height={10} rx={2}
            fill="#0a1e0a" stroke="#1a4020" strokeWidth="0.7" style={{ pointerEvents: "none" }} />
        );
      })}
      <text x={arcPoint(cx, cy, MLB_R.upperOut - 20, FAN_S + 8).x} y={arcPoint(cx, cy, MLB_R.upperOut - 20, FAN_S + 8).y + 2}
        textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.2)" fontFamily="system-ui"
        style={{ pointerEvents: "none", userSelect: "none" }}>BP</text>
      <text x={arcPoint(cx, cy, MLB_R.upperOut - 20, FAN_E - 8).x} y={arcPoint(cx, cy, MLB_R.upperOut - 20, FAN_E - 8).y + 2}
        textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.2)" fontFamily="system-ui"
        style={{ pointerEvents: "none", userSelect: "none" }}>BP</text>

      {/* Infield dirt */}
      <path
        d={`M ${cx - 56} ${cy - 8} A 68 52 0 0 1 ${cx + 56} ${cy - 8} L ${cx + 40} ${cy + 5} A 44 32 0 0 0 ${cx - 40} ${cy + 5} Z`}
        fill="#8b6930" stroke="#050810" strokeWidth="0.8" style={{ pointerEvents: "none" }}
      />
      {/* Infield grass */}
      <path
        d={`M ${cx - 42} ${cy - 6} A 52 38 0 0 1 ${cx + 42} ${cy - 6} L ${cx + 28} ${cy + 3} A 30 20 0 0 0 ${cx - 28} ${cy + 3} Z`}
        fill="#1a5c2a" stroke="none" style={{ pointerEvents: "none" }}
      />

      {/* Baseball diamond */}
      {(() => {
        const d = 30;
        const bases: [number, number][] = [
          [cx, cy - d],     // 2B
          [cx + d, cy],     // 1B
          [cx, cy + d],     // HP
          [cx - d, cy],     // 3B
        ];
        return (
          <g style={{ pointerEvents: "none" }}>
            {/* Base paths */}
            <line x1={bases[2][0]} y1={bases[2][1]} x2={bases[1][0]} y2={bases[1][1]} stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
            <line x1={bases[1][0]} y1={bases[1][1]} x2={bases[0][0]} y2={bases[0][1]} stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
            <line x1={bases[0][0]} y1={bases[0][1]} x2={bases[3][0]} y2={bases[3][1]} stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
            <line x1={bases[3][0]} y1={bases[3][1]} x2={bases[2][0]} y2={bases[2][1]} stroke="rgba(255,255,255,0.15)" strokeWidth="0.7" />
            {bases.map(([bx, by], i) => (
              <rect key={i} x={bx - 2.5} y={by - 2.5} width={5} height={5}
                fill={i === 2 ? "white" : "white"} opacity={0.85} />
            ))}
            {/* Pitcher's mound */}
            <circle cx={cx} cy={cy - d * 0.55} r={5} fill="#8b6930" stroke="#050810" strokeWidth="0.5" />
            {/* Pitcher's plate */}
            <rect x={cx - 2} y={cy - d * 0.55 - 1} width={4} height={2} fill="rgba(255,255,255,0.7)" />
            {/* Home plate */}
            <polygon points={`${cx},${cy + d - 4} ${cx - 4},${cy + d} ${cx - 4},${cy + d + 3} ${cx + 4},${cy + d + 3} ${cx + 4},${cy + d}`}
              fill="white" opacity={0.85} />
          </g>
        );
      })()}

      {/* Foul lines */}
      <line x1={cx} y1={cy + 30} x2={cx - 80} y2={cy - 140} stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <line x1={cx} y1={cy + 30} x2={cx + 80} y2={cy - 140} stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />

      {/* Zone labels */}
      {[
        { r: (MLB_R.lowerIn + MLB_R.lowerOut) / 2, text: "LOWER" },
        { r: (MLB_R.clubIn  + MLB_R.clubOut)  / 2, text: "CLUB"  },
        { r: (MLB_R.upperIn + MLB_R.upperOut) / 2, text: "UPPER" },
      ].map(({ r, text }) => {
        const pt = arcPoint(cx, cy, r, -128);
        return (
          <text key={text} x={pt.x} y={pt.y + 2} textAnchor="middle" fontSize="7"
            fill="rgba(255,255,255,0.45)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.6"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{text}</text>
        );
      })}
      <text x={arcPoint(cx, cy, 80, -128).x} y={arcPoint(cx, cy, 80, -128).y + 2}
        textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.5)"
        fontFamily="system-ui" fontWeight="700" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>FIELD</text>

      {/* Home plate label */}
      <text x={cx} y={cy + 46} textAnchor="middle" fontSize="5.5"
        fill="rgba(255,255,255,0.28)" fontFamily="system-ui"
        style={{ pointerEvents: "none", userSelect: "none" }}>HOME PLATE</text>

      {/* Price badges */}
      {showBadges && minByType && countByType && (
        <>
          <PriceBadge x={arcPoint(cx,cy,80,-128).x} y={arcPoint(cx,cy,80,-128).y - 10} count={countByType.floor} min={minByType.floor} active={activeSectionTypes.includes("floor")} />
          <PriceBadge x={arcPoint(cx,cy,123,-90).x + 20} y={arcPoint(cx,cy,123,-90).y} count={countByType.lower} min={minByType.lower} active={activeSectionTypes.includes("lower")} />
          <PriceBadge x={arcPoint(cx,cy,167,-90).x + 22} y={arcPoint(cx,cy,167,-90).y} count={countByType.club} min={minByType.club} active={activeSectionTypes.includes("club")} />
          <PriceBadge x={arcPoint(cx,cy,199,-90).x + 22} y={arcPoint(cx,cy,199,-90).y} count={countByType.upper} min={minByType.upper} active={activeSectionTypes.includes("upper")} />
          <PriceBadge x={arcPoint(cx,cy,151,-90).x + 22} y={arcPoint(cx,cy,151,-90).y} count={countByType.suite} min={minByType.suite} active={activeSectionTypes.includes("suite")} />
        </>
      )}
    </svg>
  );
}

// ── Listing row (for expanded panel) ─────────────────────────────────────────

function MapListingRow({ listing, cheapest }: { listing: TicketListing; cheapest: boolean }) {
  const color = PLAT_COLORS[listing.platform] ?? "#6b7280";
  return (
    <div className={`px-4 py-3 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors ${cheapest ? "bg-green-900/20 border-l-2 border-l-green-500" : ""}`}>
      {/* Platform dot */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-semibold truncate">{listing.section} · {listing.row}</div>
        <div className="text-gray-400 text-xs">{listing.platform} · {listing.quantity} ticket{listing.quantity !== 1 ? "s" : ""}</div>
      </div>
      {/* Price */}
      <div className="text-right flex-shrink-0">
        <div className={`font-bold text-sm ${cheapest ? "text-green-400" : "text-white"}`}>${listing.allInTotal}</div>
        <div className="text-gray-500 text-xs">all-in</div>
      </div>
      {/* Buy button */}
      <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
        Buy
      </button>
    </div>
  );
}

// ── Expanded modal ────────────────────────────────────────────────────────────

function ExpandedModal({
  listings, activeSectionTypes, hoveredZone, onSectionTypeToggle, onClearSectionTypes,
  onZoneHover, onClose, genre, minByType, countByType,
}: {
  listings: TicketListing[];
  activeSectionTypes: SectionType[];
  hoveredZone: SectionType | null;
  onSectionTypeToggle: (t: SectionType) => void;
  onClearSectionTypes: () => void;
  onZoneHover: (t: SectionType | null) => void;
  onClose: () => void;
  genre: string;
  minByType: Record<SectionType, number | null>;
  countByType: Record<SectionType, number>;
}) {
  // Panel listings: prioritize hovered zone, then active zones, then all
  const panelListings = useMemo(() => {
    let result: TicketListing[];
    if (hoveredZone) {
      result = listings.filter(l => l.sectionType === hoveredZone);
    } else if (activeSectionTypes.length > 0) {
      result = listings.filter(l => activeSectionTypes.includes(l.sectionType));
    } else {
      result = [...listings];
    }
    return result.sort((a, b) => a.allInTotal - b.allInTotal);
  }, [listings, hoveredZone, activeSectionTypes]);

  const displayZone = hoveredZone ?? (activeSectionTypes.length === 1 ? activeSectionTypes[0] : null);
  const panelTitle = displayZone
    ? getZoneLabel(displayZone, genre)
    : activeSectionTypes.length > 1 ? "Selected Zones"
    : "All Listings";
  const panelCount = panelListings.length;
  const panelMin = panelListings.length > 0 ? panelListings[0].allInTotal : null;

  const isNFL = genre === "NFL", isMLB = genre === "MLB";
  const mapTitle = isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : (genre === "NBA" || genre === "NHL") ? "Arena Map" : "Seat Map";

  // Close on backdrop click
  const backdropRef = useRef<HTMLDivElement>(null);

  // Trap scroll
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
      <div className="bg-[#050810] rounded-2xl border border-white/10 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-bold text-base">{mapTitle}</span>
            {/* Zone filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_ZONES.map((t) => {
                const isAct = activeSectionTypes.includes(t);
                const hasListings = countByType[t] > 0;
                if (!hasListings) return null;
                return (
                  <button key={t}
                    onClick={() => onSectionTypeToggle(t)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all border ${
                      isAct
                        ? "border-transparent text-white"
                        : "border-white/15 text-gray-400 hover:text-white hover:border-white/30"
                    }`}
                    style={isAct ? { backgroundColor: CLR[t].act } : {}}
                  >
                    {getZoneLabel(t, genre)}
                  </button>
                );
              })}
              {activeSectionTypes.length > 0 && (
                <button onClick={onClearSectionTypes} className="text-xs text-blue-400 hover:text-blue-300 transition">
                  Clear
                </button>
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

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* Map side */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6">
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full max-w-2xl">
                {isNFL ? (
                  <NFLMap
                    activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType}
                  />
                ) : isMLB ? (
                  <MLBMap
                    activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType}
                  />
                ) : (
                  <ArenaMap
                    genre={genre} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                    onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover}
                    showBadges minByType={minByType} countByType={countByType}
                  />
                )}
              </div>
            </div>
            <p className="text-center text-gray-600 text-xs mt-3">Click a zone to filter · Hover to preview listings</p>
          </div>

          {/* Listings panel */}
          <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col overflow-hidden flex-shrink-0">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-sm">{panelTitle}</span>
                <span className="text-gray-500 text-xs">{panelCount} listing{panelCount !== 1 ? "s" : ""}</span>
              </div>
              {panelMin !== null && (
                <p className="text-gray-400 text-xs mt-0.5">from <span className="text-white font-semibold">${panelMin}</span> all-in</p>
              )}
              {!displayZone && activeSectionTypes.length === 0 && (
                <p className="text-gray-600 text-xs mt-1">Hover or click a zone to filter</p>
              )}
            </div>

            {/* Listing rows */}
            <div className="flex-1 overflow-y-auto">
              {panelListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No listings</p>
                  <p className="text-gray-600 text-xs mt-1">for this zone</p>
                </div>
              ) : (
                panelListings.map((l, i) => (
                  <MapListingRow key={l.id} listing={l} cheapest={i === 0} />
                ))
              )}
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
  const zones: SectionType[] = ["floor", "lower", "suite", "club", "upper"];
  return (
    <div className="flex-1 p-4 flex flex-col justify-center gap-0.5">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Zones</p>
      {zones.map((type) => {
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
              {count > 0 && (
                <span className={`text-xs ${active ? "text-blue-500" : "text-gray-400"}`}>{count}</span>
              )}
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
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function VenueMap({ listings, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes, genre = "" }: Props) {
  const { minByType, countByType } = useZoneData(listings);

  const [expanded, setExpanded] = useState(false);
  // hoveredZone changes rarely (only on zone boundary cross), so state is fine here
  const [hoveredZone, setHoveredZone] = useState<SectionType | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  // Tooltip positioned via direct DOM ref — zero re-renders on mousemove
  const tooltipRef = useRef<HTMLDivElement>(null);

  const onZoneHover = useCallback((t: SectionType | null) => {
    setHoveredZone(t);
    // Show/hide the tooltip imperatively; position is updated in handleMouseMove
    if (tooltipRef.current) {
      tooltipRef.current.style.visibility = (t && countByType[t] > 0) ? "visible" : "hidden";
    }
  }, [countByType]);

  // Update tooltip position directly in the DOM — no setState, no re-render
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = svgContainerRef.current?.getBoundingClientRect();
    if (!rect || !tooltipRef.current) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tooltipRef.current.style.left = `${Math.min(x + 14, 180)}px`;
    tooltipRef.current.style.top  = `${Math.max(y - 52, 4)}px`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredZone(null);
    if (tooltipRef.current) tooltipRef.current.style.visibility = "hidden";
  }, []);

  const isNFL = genre === "NFL", isMLB = genre === "MLB";
  const isArena = genre === "NBA" || genre === "NHL";
  const title = isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : isArena ? "Arena Map" : "Seat Map";

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">

        {/* Header bar */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-gray-700 text-sm font-semibold">{title}</span>
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

        {/* Map + legend */}
        <div className="flex flex-col sm:flex-row">
          {/* SVG container — mousemove updates tooltip position via DOM ref only */}
          <div
            ref={svgContainerRef}
            className="w-full sm:w-72 flex-shrink-0 relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {isNFL ? (
              <NFLMap activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
            ) : isMLB ? (
              <MLBMap activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
            ) : (
              <ArenaMap genre={genre} activeSectionTypes={activeSectionTypes} hoveredZone={hoveredZone}
                onSectionTypeToggle={onSectionTypeToggle} onZoneHover={onZoneHover} />
            )}

            {/* Tooltip — always rendered, shown/hidden + positioned via ref (no re-renders) */}
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
                  <div className="text-gray-600 text-xs mt-0.5">Click to filter · Expand to browse</div>
                </>
              )}
            </div>
          </div>

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

      {/* Expanded modal */}
      {expanded && (
        <ExpandedModal
          listings={listings}
          activeSectionTypes={activeSectionTypes}
          hoveredZone={hoveredZone}
          onSectionTypeToggle={onSectionTypeToggle}
          onClearSectionTypes={onClearSectionTypes}
          onZoneHover={onZoneHover}
          onClose={() => setExpanded(false)}
          genre={genre}
          minByType={minByType}
          countByType={countByType}
        />
      )}
    </>
  );
}
