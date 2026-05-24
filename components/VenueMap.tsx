"use client";

import { useState } from "react";
import type { TicketListing, SectionType } from "@/types/ticket";

interface Props {
  listings: TicketListing[];
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (type: SectionType) => void;
  onClearSectionTypes: () => void;
  genre?: string;
}

const fmt = (n: number) => `$${n}`;

function useMinByType(listings: TicketListing[]) {
  return Object.fromEntries(
    (["floor", "lower", "club", "upper", "suite"] as SectionType[]).map((t) => {
      const group = listings.filter((l) => l.sectionType === t);
      const min = group.length > 0 ? Math.min(...group.map((l) => l.allInTotal)) : null;
      return [t, min];
    })
  ) as Record<SectionType, number | null>;
}

// ─── ARENA MAP (concerts, NBA, NHL) ──────────────────────────────────────────

const A_CX = 240, A_CY = 178;
const toRad = (d: number) => (d * Math.PI) / 180;
const apx = (rx: number, deg: number) => A_CX + rx * Math.sin(toRad(deg));
const apy = (ry: number, deg: number) => A_CY - ry * Math.cos(toRad(deg));

function ringPath(iRx: number, iRy: number, oRx: number, oRy: number): string {
  const top = `M ${A_CX} ${A_CY - oRy}`;
  const oA1 = `A ${oRx} ${oRy} 0 0 1 ${A_CX} ${A_CY + oRy}`;
  const oA2 = `A ${oRx} ${oRy} 0 0 1 ${A_CX} ${A_CY - oRy}`;
  const iTop = `M ${A_CX} ${A_CY - iRy}`;
  const iA1 = `A ${iRx} ${iRy} 0 0 0 ${A_CX} ${A_CY + iRy}`;
  const iA2 = `A ${iRx} ${iRy} 0 0 0 ${A_CX} ${A_CY - iRy}`;
  return `${top} ${oA1} ${oA2} Z ${iTop} ${iA1} ${iA2} Z`;
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy - ry} Z`;
}

function divLine(iRx: number, iRy: number, oRx: number, oRy: number, deg: number) {
  return {
    x1: apx(iRx, deg), y1: apy(iRy, deg),
    x2: apx(oRx, deg), y2: apy(oRy, deg),
  };
}

const ARENA_ZONES = [
  { type: "lower" as SectionType, label: "Lower Bowl",  shortLabel: "LOWER", iRx: 70,  iRy: 54,  oRx: 116, oRy: 90,  color: "#1e4d8c", activeColor: "#2563eb", dimColor: "#162d50", divCount: 12 },
  { type: "club"  as SectionType, label: "Club Level",  shortLabel: "CLUB",  iRx: 124, iRy: 98,  oRx: 147, oRy: 116, color: "#5b3a8a", activeColor: "#7c3aed", dimColor: "#351f52", divCount: 8  },
  { type: "upper" as SectionType, label: "Upper Level", shortLabel: "UPPER", iRx: 155, iRy: 124, oRx: 206, oRy: 163, color: "#1e3a5f", activeColor: "#2d5a8e", dimColor: "#0f1f33", divCount: 16 },
];

// Suite clusters: 3 groups on each long side
const ARENA_SUITE_POSITIONS = [
  // Left side (west)
  { x: A_CX - 230, y: A_CY - 28, w: 18, h: 52 },
  // Right side (east)
  { x: A_CX + 212, y: A_CY - 28, w: 18, h: 52 },
];

function ArenaMap({
  genre,
  activeSectionTypes,
  onSectionTypeToggle,
  minByType,
}: {
  genre: string;
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  minByType: Record<SectionType, number | null>;
}) {
  const [hovered, setHovered] = useState<SectionType | null>(null);

  const isActive = (t: SectionType) => activeSectionTypes.length === 0 || activeSectionTypes.includes(t);
  const isDimmed = (t: SectionType) => activeSectionTypes.length > 0 && !activeSectionTypes.includes(t);

  function zoneFill(zone: (typeof ARENA_ZONES)[0]) {
    if (hovered === zone.type) return zone.activeColor;
    if (isDimmed(zone.type)) return zone.dimColor;
    if (activeSectionTypes.includes(zone.type)) return zone.activeColor;
    return zone.color;
  }

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const suiteActive = activeSectionTypes.includes("suite");
  const suiteDimmed = activeSectionTypes.length > 0 && !suiteActive;

  const floorFill = hovered === "floor" ? "#3b82f6" : floorDimmed ? "#0c1a33" : floorActive ? "#2563eb" : "#1d3a6e";
  const suiteFill = hovered === "suite" ? "#7c3aed" : suiteDimmed ? "#1a0a2e" : suiteActive ? "#8b5cf6" : "#4c1d95";

  // Floor label based on sport
  const floorLabel = genre === "NBA" ? "COURT" : genre === "NHL" ? "ICE" : "GA FLOOR";
  const floorSub   = genre === "NBA" ? "COURTSIDE" : genre === "NHL" ? "RINKSIDE" : "STAGE";
  // Court/ice surface color
  const surfaceColor = genre === "NBA" ? "#c47a2a" : genre === "NHL" ? "#c8ddf0" : "#1d3a6e";
  const surfaceStroke = genre === "NBA" ? "#a86020" : genre === "NHL" ? "#9bbdd4" : "#2d5a9e";

  return (
    <svg viewBox="0 0 480 330" className="w-full" style={{ background: "#06080f" }}>
      {/* Outer glow ring */}
      <ellipse cx={A_CX} cy={A_CY} rx={212} ry={170} fill="none" stroke="#1e3a5f" strokeWidth="1" opacity="0.4" />

      {/* Rings */}
      {ARENA_ZONES.map((zone) => (
        <g key={zone.type}>
          <path
            d={ringPath(zone.iRx, zone.iRy, zone.oRx, zone.oRy)}
            fill={zoneFill(zone)}
            fillRule="evenodd"
            stroke="#06080f"
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "fill 0.15s" }}
            onClick={() => onSectionTypeToggle(zone.type)}
            onMouseEnter={() => setHovered(zone.type)}
            onMouseLeave={() => setHovered(null)}
          />
          {/* Section dividers */}
          {Array.from({ length: zone.divCount }, (_, i) => {
            const l = divLine(zone.iRx, zone.iRy, zone.oRx, zone.oRy, i * (360 / zone.divCount));
            return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#06080f" strokeWidth="0.8" style={{ pointerEvents: "none" }} />;
          })}
          {/* Zone short label at right-side midpoint */}
          <text
            x={apx((zone.iRx + zone.oRx) / 2 + 6, 90)}
            y={apy((zone.iRy + zone.oRy) / 2, 90) + 3}
            textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.4)"
            fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.5"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {zone.shortLabel}
          </text>
        </g>
      ))}

      {/* Floor / court / ice */}
      <path
        d={ellipsePath(A_CX, A_CY, 61, 46)}
        fill={surfaceColor} stroke={surfaceStroke} strokeWidth="1"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHovered("floor")}
        onMouseLeave={() => setHovered(null)}
      />
      {/* Court markings for NBA */}
      {genre === "NBA" && (
        <>
          <ellipse cx={A_CX} cy={A_CY} rx={18} ry={14} fill="none" stroke={surfaceStroke} strokeWidth="0.8" />
          <line x1={A_CX - 61} y1={A_CY} x2={A_CX + 61} y2={A_CY} stroke={surfaceStroke} strokeWidth="0.6" />
        </>
      )}
      {/* Ice markings for NHL */}
      {genre === "NHL" && (
        <>
          <ellipse cx={A_CX} cy={A_CY} rx={18} ry={14} fill="none" stroke="#ff3b30" strokeWidth="0.8" />
          <line x1={A_CX} y1={A_CY - 46} x2={A_CX} y2={A_CY + 46} stroke="#ff3b30" strokeWidth="0.6" />
          <circle cx={A_CX - 30} cy={A_CY} r="5" fill="none" stroke="#ff3b30" strokeWidth="0.6" />
          <circle cx={A_CX + 30} cy={A_CY} r="5" fill="none" stroke="#ff3b30" strokeWidth="0.6" />
        </>
      )}
      {/* Stage for concerts */}
      {genre !== "NBA" && genre !== "NHL" && (
        <rect x={A_CX - 28} y={A_CY + 20} width={56} height={14} rx={2} fill="#0a1628" stroke="#1e3a6e" strokeWidth="0.8" />
      )}
      <text x={A_CX} y={A_CY - 8} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.65)" fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.6" style={{ pointerEvents: "none", userSelect: "none" }}>{floorLabel}</text>
      <text x={A_CX} y={A_CY + 5} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.35)" fontFamily="system-ui,sans-serif" style={{ pointerEvents: "none", userSelect: "none" }}>{floorSub}</text>

      {/* Suite clusters */}
      {ARENA_SUITE_POSITIONS.map((s, i) => (
        <rect
          key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={3}
          fill={suiteFill} stroke="#06080f" strokeWidth="1"
          style={{ cursor: "pointer", transition: "fill 0.15s" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => setHovered("suite")}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
      {/* Suite label */}
      <text
        x={ARENA_SUITE_POSITIONS[0].x + 9} y={ARENA_SUITE_POSITIONS[0].y + 29}
        textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.45)" fontFamily="system-ui,sans-serif"
        fontWeight="600" transform={`rotate(-90, ${ARENA_SUITE_POSITIONS[0].x + 9}, ${ARENA_SUITE_POSITIONS[0].y + 29})`}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >SUITES</text>

      {/* Compass N */}
      <text x={A_CX} y={16} textAnchor="middle" fontSize="9" fill="#2d4a6e" fontWeight="700" fontFamily="system-ui">N</text>
      <line x1={A_CX} y1={20} x2={A_CX} y2={A_CY - 165} stroke="#1e3a5f" strokeWidth="0.7" strokeDasharray="2,3" />
    </svg>
  );
}

// ─── NFL STADIUM MAP ──────────────────────────────────────────────────────────

const F_CX = 240, F_CY = 165;
const FIELD_W = 260, FIELD_H = 116;
const FIELD_X = F_CX - FIELD_W / 2;
const FIELD_Y = F_CY - FIELD_H / 2;

function NFLMap({
  activeSectionTypes,
  onSectionTypeToggle,
  minByType,
}: {
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  minByType: Record<SectionType, number | null>;
}) {
  const [hovered, setHovered] = useState<SectionType | null>(null);

  const isDimmed = (t: SectionType) => activeSectionTypes.length > 0 && !activeSectionTypes.includes(t);
  const isActiveZone = (t: SectionType) => activeSectionTypes.includes(t);

  // Lower bowl: tight band around field
  const lowerX = FIELD_X - 20, lowerY = FIELD_Y - 20;
  const lowerW = FIELD_W + 40, lowerH = FIELD_H + 40;
  // Club: next band
  const clubX = lowerX - 14, clubY = lowerY - 14;
  const clubW = lowerW + 28, clubH = lowerH + 28;
  // Upper: outer band
  const upperX = clubX - 18, upperY = clubY - 18;
  const upperW = clubW + 36, upperH = clubH + 36;

  function bandFill(t: SectionType, base: string, active: string, dim: string) {
    if (hovered === t) return active;
    if (isDimmed(t)) return dim;
    if (isActiveZone(t)) return active;
    return base;
  }

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const suiteActive = activeSectionTypes.includes("suite");
  const suiteDimmed = activeSectionTypes.length > 0 && !suiteActive;

  const floorFill = hovered === "floor" ? "#16a34a" : floorDimmed ? "#052010" : floorActive ? "#15803d" : "#166534";
  const suiteFill = hovered === "suite" ? "#7c3aed" : suiteDimmed ? "#1a0a2e" : suiteActive ? "#8b5cf6" : "#4c1d95";

  // Yard line positions (10-yard intervals: 10, 20, 30, 40, 50, 40, 30, 20, 10)
  const yardLines = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => FIELD_X + FIELD_W * (pct / 100));
  const yardLabels = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  // End zones (10% each side)
  const endZoneW = FIELD_W * 0.1;

  return (
    <svg viewBox="0 0 480 310" className="w-full" style={{ background: "#06080f" }}>

      {/* Upper bowl */}
      <rect
        x={upperX} y={upperY} width={upperW} height={upperH} rx={14}
        fill={bandFill("upper", "#1a2f4a", "#2d4f7a", "#0a1520")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("upper")}
        onMouseEnter={() => setHovered("upper")}
        onMouseLeave={() => setHovered(null)}
      />
      <text x={upperX + 8} y={upperY + upperH / 2 + 3} fontSize="6.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5" style={{ pointerEvents: "none", userSelect: "none" }}>UPPER</text>

      {/* Club */}
      <rect
        x={clubX} y={clubY} width={clubW} height={clubH} rx={10}
        fill={bandFill("club", "#3d1f6e", "#6d28d9", "#1a0a2e")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("club")}
        onMouseEnter={() => setHovered("club")}
        onMouseLeave={() => setHovered(null)}
      />

      {/* Lower bowl */}
      <rect
        x={lowerX} y={lowerY} width={lowerW} height={lowerH} rx={6}
        fill={bandFill("lower", "#1e4d8c", "#2563eb", "#0f1f3a")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("lower")}
        onMouseEnter={() => setHovered("lower")}
        onMouseLeave={() => setHovered(null)}
      />
      <text x={lowerX + 5} y={lowerY + lowerH / 2 + 3} fontSize="6" fill="rgba(255,255,255,0.4)" fontFamily="system-ui" fontWeight="700" style={{ pointerEvents: "none", userSelect: "none" }}>LOWER</text>

      {/* Suite strip along long sides */}
      <rect
        x={FIELD_X - 13} y={FIELD_Y - 13} width={FIELD_W + 26} height={8} rx={2}
        fill={suiteFill} stroke="#06080f" strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => setHovered("suite")}
        onMouseLeave={() => setHovered(null)}
      />
      <rect
        x={FIELD_X - 13} y={FIELD_Y + FIELD_H + 5} width={FIELD_W + 26} height={8} rx={2}
        fill={suiteFill} stroke="#06080f" strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => setHovered("suite")}
        onMouseLeave={() => setHovered(null)}
      />
      <text x={FIELD_X + FIELD_W / 2} y={FIELD_Y - 6} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.45)" fontFamily="system-ui" fontWeight="600" style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>

      {/* Field */}
      <rect x={FIELD_X} y={FIELD_Y} width={FIELD_W} height={FIELD_H} rx={3} fill={floorFill}
        stroke={hovered === "floor" ? "#22c55e" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHovered("floor")}
        onMouseLeave={() => setHovered(null)}
      />
      {/* End zones */}
      <rect x={FIELD_X} y={FIELD_Y} width={endZoneW} height={FIELD_H} rx={3} fill="#14532d" style={{ pointerEvents: "none" }} />
      <rect x={FIELD_X + FIELD_W - endZoneW} y={FIELD_Y} width={endZoneW} height={FIELD_H} rx={3} fill="#14532d" style={{ pointerEvents: "none" }} />
      {/* Yard lines */}
      {yardLines.map((x, i) => (
        <g key={i} style={{ pointerEvents: "none" }}>
          <line x1={x} y1={FIELD_Y + 2} x2={x} y2={FIELD_Y + FIELD_H - 2} stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
          <text x={x} y={F_CY + 4} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.35)" fontFamily="system-ui" fontWeight="700">{yardLabels[i]}</text>
        </g>
      ))}
      {/* Midfield hashmarks */}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={FIELD_X + endZoneW + (i + 0.5) * (FIELD_W - 2 * endZoneW) / 8} y1={FIELD_Y + FIELD_H * 0.3} x2={FIELD_X + endZoneW + (i + 0.5) * (FIELD_W - 2 * endZoneW) / 8} y2={FIELD_Y + FIELD_H * 0.4} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" style={{ pointerEvents: "none" }} />
      ))}
      <text x={F_CX} y={F_CY - 8} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.6)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5" style={{ pointerEvents: "none", userSelect: "none" }}>FIELD LEVEL</text>

      {/* Zone labels on bands */}
      <text x={upperX + upperW / 2} y={upperY - 8} textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.4)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5" style={{ pointerEvents: "none", userSelect: "none" }}>UPPER DECK</text>

      {/* Compass */}
      <text x={F_CX} y={14} textAnchor="middle" fontSize="9" fill="#2d4a6e" fontWeight="700" fontFamily="system-ui">N</text>
    </svg>
  );
}

// ─── MLB BASEBALL MAP ─────────────────────────────────────────────────────────

const B_CX = 240, B_CY = 260;
const DIAMOND_HALF = 36;

// Arc band helpers — fan sector from diamond out
function arcBand(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s1 = toRad(startDeg), e1 = toRad(endDeg);
  const cos = Math.cos, sin = Math.sin;
  const x1 = cx + r1 * cos(s1), y1 = cy + r1 * sin(s1);
  const x2 = cx + r2 * cos(s1), y2 = cy + r2 * sin(s1);
  const x3 = cx + r2 * cos(e1), y3 = cy + r2 * sin(e1);
  const x4 = cx + r1 * cos(e1), y4 = cy + r1 * sin(e1);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 ${large} 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 ${large} 0 ${x1} ${y1} Z`;
}

// Full fan arc
function fanArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = toRad(startDeg), e = toRad(endDeg);
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

// -130° to -50° is the fan (top-left to top-right in SVG coords where 0=right, -90=up)
// We want the fan to spread from left-field line to right-field line: about 220° total, centered upward
const FAN_START = -220; // degrees from positive x-axis
const FAN_END = -40;

function MLBMap({
  activeSectionTypes,
  onSectionTypeToggle,
  minByType,
}: {
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  minByType: Record<SectionType, number | null>;
}) {
  const [hovered, setHovered] = useState<SectionType | null>(null);

  const isDimmed = (t: SectionType) => activeSectionTypes.length > 0 && !activeSectionTypes.includes(t);
  const isActiveZone = (t: SectionType) => activeSectionTypes.includes(t);

  function bandFill(t: SectionType, base: string, active: string, dim: string) {
    if (hovered === t) return active;
    if (isDimmed(t)) return dim;
    if (isActiveZone(t)) return active;
    return base;
  }

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const suiteActive = activeSectionTypes.includes("suite");
  const suiteDimmed = activeSectionTypes.length > 0 && !suiteActive;

  const fieldFill = hovered === "floor" ? "#16a34a" : floorDimmed ? "#052010" : floorActive ? "#15803d" : "#166534";
  const suiteFill = hovered === "suite" ? "#7c3aed" : suiteDimmed ? "#1a0a2e" : suiteActive ? "#8b5cf6" : "#4c1d95";

  // Outfield warning track radius: 195
  const WT_R = 198; // warning track outer
  const WT_IN = 185; // warning track inner (= outfield grass inner)
  const OF_IN = 108; // infield arc outer
  const LOWER_IN = OF_IN;
  const LOWER_OUT = 148;
  const CLUB_IN = 152;
  const CLUB_OUT = 170;
  const UPPER_IN = 174;
  const UPPER_OUT = 210;

  // Radial divider lines for sections
  const divAngles = Array.from({ length: 16 }, (_, i) => FAN_START + i * (FAN_END - FAN_START) / 15);

  return (
    <svg viewBox="0 0 480 290" className="w-full" style={{ background: "#06080f" }}>

      {/* Upper deck (outermost fan) */}
      <path
        d={arcBand(B_CX, B_CY, UPPER_IN, UPPER_OUT, FAN_START, FAN_END)}
        fill={bandFill("upper", "#1a2f4a", "#2d4f7a", "#0a1520")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("upper")}
        onMouseEnter={() => setHovered("upper")}
        onMouseLeave={() => setHovered(null)}
      />

      {/* Club / Mezzanine */}
      <path
        d={arcBand(B_CX, B_CY, CLUB_IN, CLUB_OUT, FAN_START, FAN_END)}
        fill={bandFill("club", "#3d1f6e", "#6d28d9", "#1a0a2e")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("club")}
        onMouseEnter={() => setHovered("club")}
        onMouseLeave={() => setHovered(null)}
      />

      {/* Lower bowl */}
      <path
        d={arcBand(B_CX, B_CY, LOWER_IN, LOWER_OUT, FAN_START, FAN_END)}
        fill={bandFill("lower", "#1e4d8c", "#2563eb", "#0f1f3a")}
        stroke="#06080f" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("lower")}
        onMouseEnter={() => setHovered("lower")}
        onMouseLeave={() => setHovered(null)}
      />

      {/* Suite strip between lower and club */}
      <path
        d={arcBand(B_CX, B_CY, LOWER_OUT + 1, CLUB_IN - 1, FAN_START, FAN_END)}
        fill={suiteFill}
        stroke="#06080f" strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => setHovered("suite")}
        onMouseLeave={() => setHovered(null)}
      />

      {/* Section dividers */}
      {divAngles.map((deg, i) => {
        const r = toRad(deg);
        return (
          <line
            key={i}
            x1={B_CX + LOWER_IN * Math.cos(r)} y1={B_CY + LOWER_IN * Math.sin(r)}
            x2={B_CX + UPPER_OUT * Math.cos(r)} y2={B_CY + UPPER_OUT * Math.sin(r)}
            stroke="#06080f" strokeWidth="0.8"
            style={{ pointerEvents: "none" }}
          />
        );
      })}

      {/* Outfield grass */}
      <path
        d={arcBand(B_CX, B_CY, OF_IN, WT_IN, FAN_START, FAN_END)}
        fill={fieldFill}
        stroke={hovered === "floor" ? "#22c55e" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.15s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHovered("floor")}
        onMouseLeave={() => setHovered(null)}
      />
      {/* Warning track */}
      <path
        d={arcBand(B_CX, B_CY, WT_IN, WT_R, FAN_START, FAN_END)}
        fill="#8B6914" stroke="#06080f" strokeWidth="0.8"
        style={{ pointerEvents: "none" }}
      />
      {/* Outfield wall */}
      <path
        d={fanArc(B_CX, B_CY, WT_R + 4, FAN_START, FAN_END)}
        fill="none" stroke="#4a5568" strokeWidth="2"
        style={{ pointerEvents: "none" }}
      />

      {/* Infield dirt arc */}
      <path
        d={`M ${B_CX - DIAMOND_HALF * 1.8} ${B_CY - DIAMOND_HALF * 0.2} A ${OF_IN * 0.92} ${OF_IN * 0.72} 0 0 1 ${B_CX + DIAMOND_HALF * 1.8} ${B_CY - DIAMOND_HALF * 0.2} L ${B_CX + DIAMOND_HALF * 1.4} ${B_CY + DIAMOND_HALF * 0.6} A ${OF_IN * 0.5} ${OF_IN * 0.4} 0 0 0 ${B_CX - DIAMOND_HALF * 1.4} ${B_CY + DIAMOND_HALF * 0.6} Z`}
        fill="#7a5c28" stroke="#06080f" strokeWidth="0.8"
        style={{ pointerEvents: "none" }}
      />

      {/* Infield grass */}
      <path
        d={`M ${B_CX - DIAMOND_HALF * 1.5} ${B_CY - DIAMOND_HALF * 0.1} A ${OF_IN * 0.78} ${OF_IN * 0.6} 0 0 1 ${B_CX + DIAMOND_HALF * 1.5} ${B_CY - DIAMOND_HALF * 0.1} L ${B_CX + DIAMOND_HALF * 1.1} ${B_CY + DIAMOND_HALF * 0.55} A ${OF_IN * 0.38} ${OF_IN * 0.3} 0 0 0 ${B_CX - DIAMOND_HALF * 1.1} ${B_CY + DIAMOND_HALF * 0.55} Z`}
        fill="#1a5c2a" stroke="none"
        style={{ pointerEvents: "none" }}
      />

      {/* Diamond */}
      <polygon
        points={`${B_CX},${B_CY - DIAMOND_HALF} ${B_CX + DIAMOND_HALF},${B_CY} ${B_CX},${B_CY + DIAMOND_HALF} ${B_CX - DIAMOND_HALF},${B_CY}`}
        fill="#7a5c28" stroke="white" strokeWidth="0.8"
        style={{ pointerEvents: "none" }}
      />
      {/* Base paths */}
      {[
        [B_CX, B_CY - DIAMOND_HALF],       // 2nd
        [B_CX + DIAMOND_HALF, B_CY],        // 1st
        [B_CX, B_CY + DIAMOND_HALF],        // home
        [B_CX - DIAMOND_HALF, B_CY],        // 3rd
      ].map(([bx, by], i) => (
        <rect key={i} x={bx - 3} y={by - 3} width={6} height={6} fill="white" style={{ pointerEvents: "none" }} />
      ))}
      {/* Pitcher's mound */}
      <circle cx={B_CX} cy={B_CY - DIAMOND_HALF * 0.55} r={5} fill="#7a5c28" stroke="#06080f" strokeWidth="0.5" style={{ pointerEvents: "none" }} />

      {/* Foul lines */}
      <line x1={B_CX} y1={B_CY + DIAMOND_HALF} x2={B_CX + DIAMOND_HALF * 0.8} y2={B_CY - DIAMOND_HALF * 1.6 - 60} stroke="white" strokeWidth="0.6" opacity="0.4" style={{ pointerEvents: "none" }} />
      <line x1={B_CX} y1={B_CY + DIAMOND_HALF} x2={B_CX - DIAMOND_HALF * 0.8} y2={B_CY - DIAMOND_HALF * 1.6 - 60} stroke="white" strokeWidth="0.6" opacity="0.4" style={{ pointerEvents: "none" }} />

      {/* Labels */}
      <text x={B_CX} y={B_CY - 148} textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.5)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5" style={{ pointerEvents: "none", userSelect: "none" }}>FIELD LEVEL</text>
      <text x={B_CX} y={B_CY - 195} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.35)" fontFamily="system-ui" fontWeight="700" letterSpacing="0.5" style={{ pointerEvents: "none", userSelect: "none" }}>UPPER</text>

      {/* Home plate label */}
      <text x={B_CX} y={B_CY + DIAMOND_HALF + 14} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.35)" fontFamily="system-ui" style={{ pointerEvents: "none", userSelect: "none" }}>HOME PLATE</text>
    </svg>
  );
}

// ─── LEGEND PANEL ─────────────────────────────────────────────────────────────

function LegendPanel({
  genre,
  activeSectionTypes,
  onSectionTypeToggle,
  onClearSectionTypes,
  minByType,
}: {
  genre: string;
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  onClearSectionTypes: () => void;
  minByType: Record<SectionType, number | null>;
}) {
  const isMLB = genre === "MLB";
  const isNFL = genre === "NFL";
  const isNBA = genre === "NBA";
  const isNHL = genre === "NHL";

  const floorLabel = isNBA ? "Courtside" : isNHL ? "Rinkside" : (isMLB || isNFL) ? "Field Level" : "GA Floor";

  const zones: { type: SectionType; label: string; color: string }[] = [
    { type: "floor", label: floorLabel,    color: "#15803d" },
    { type: "lower", label: "Lower Bowl",  color: "#2563eb" },
    { type: "suite", label: "Suites",      color: "#8b5cf6" },
    { type: "club",  label: isMLB ? "Mezzanine" : "Club Level", color: "#7c3aed" },
    { type: "upper", label: "Upper Deck",  color: "#334155" },
  ];

  return (
    <div className="flex-1 p-4 flex flex-col justify-center gap-0.5">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Zones</p>
      {zones.map(({ type, label, color }) => {
        const min = minByType[type];
        const active = activeSectionTypes.includes(type);
        const dimmed = activeSectionTypes.length > 0 && !active;
        return (
          <button
            key={type}
            onClick={() => onSectionTypeToggle(type)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left transition-all ${
              active ? "bg-blue-50 border border-blue-200" : dimmed ? "border border-transparent opacity-40" : "border border-transparent hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className={`text-sm font-medium ${active ? "text-blue-700" : dimmed ? "text-gray-400" : "text-gray-700"}`}>{label}</span>
            </div>
            {min !== null ? (
              <span className={`text-xs font-semibold tabular-nums ${active ? "text-blue-600" : dimmed ? "text-gray-300" : "text-gray-500"}`}>from {fmt(min)}</span>
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

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function VenueMap({ listings, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes, genre = "" }: Props) {
  const minByType = useMinByType(listings);

  const isNFL = genre === "NFL";
  const isMLB = genre === "MLB";

  const mapTitle = isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : "Seat Map";

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-gray-700 text-sm font-semibold">{mapTitle}</span>
        <span className="text-gray-400 text-xs">Click a zone to filter</span>
      </div>

      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-72 flex-shrink-0 bg-[#06080f]">
          {isNFL ? (
            <NFLMap
              activeSectionTypes={activeSectionTypes}
              onSectionTypeToggle={onSectionTypeToggle}
              minByType={minByType}
            />
          ) : isMLB ? (
            <MLBMap
              activeSectionTypes={activeSectionTypes}
              onSectionTypeToggle={onSectionTypeToggle}
              minByType={minByType}
            />
          ) : (
            <ArenaMap
              genre={genre}
              activeSectionTypes={activeSectionTypes}
              onSectionTypeToggle={onSectionTypeToggle}
              minByType={minByType}
            />
          )}
        </div>

        <LegendPanel
          genre={genre}
          activeSectionTypes={activeSectionTypes}
          onSectionTypeToggle={onSectionTypeToggle}
          onClearSectionTypes={onClearSectionTypes}
          minByType={minByType}
        />
      </div>
    </div>
  );
}
