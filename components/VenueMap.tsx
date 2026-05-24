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

// ── Zone color palette ────────────────────────────────────────────────────────
const CLR: Record<SectionType, { base: string; act: string; dim: string }> = {
  floor: { base: "#166534", act: "#16a34a", dim: "#062010" }, // green — used for legend dot
  lower: { base: "#1e3a8a", act: "#2563eb", dim: "#0a1840" },
  club:  { base: "#4c1d95", act: "#7c3aed", dim: "#1e0a40" },
  upper: { base: "#1e293b", act: "#475569", dim: "#0a1018" },
  suite: { base: "#78350f", act: "#d97706", dim: "#311505" },
};

// Green fill for NFL/MLB fields (overrides generic floor color)
const GRS = { base: "#166534", act: "#16a34a", dim: "#062010" };
function fieldFill(hov: SectionType | null, active: SectionType[]): string {
  if (hov === "floor") return GRS.act;
  if (active.length > 0 && !active.includes("floor")) return GRS.dim;
  if (active.includes("floor")) return GRS.act;
  return GRS.base;
}

function zoneFill(
  type: SectionType,
  hovered: SectionType | null,
  active: SectionType[]
): string {
  if (hovered === type) return CLR[type].act;
  if (active.length > 0 && !active.includes(type)) return CLR[type].dim;
  if (active.includes(type)) return CLR[type].act;
  return CLR[type].base;
}

function useMinByType(listings: TicketListing[]) {
  return Object.fromEntries(
    (["floor", "lower", "club", "upper", "suite"] as SectionType[]).map((t) => {
      const g = listings.filter((l) => l.sectionType === t);
      return [t, g.length > 0 ? Math.min(...g.map((l) => l.allInTotal)) : null];
    })
  ) as Record<SectionType, number | null>;
}

const fmt = (n: number) => `$${n}`;
const toRad = (d: number) => (d * Math.PI) / 180;

// ── ARENA MAP ─────────────────────────────────────────────────────────────────
// Wide oval (1.70 aspect ratio) so it looks like a real arena from above.
// viewBox 580 × 300, center (290, 150).
// Labels placed at bottom of each ring (180°) so they're spread vertically.

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
  { type: "lower" as SectionType, label: "LOWER BOWL", iRx: 90, iRy: 46, oRx: 152, oRy: 94, divs: 14 },
  { type: "club"  as SectionType, label: "CLUB",        iRx: 160, iRy: 101, oRx: 184, oRy: 117, divs: 10 },
  { type: "upper" as SectionType, label: "UPPER DECK",  iRx: 192, iRy: 124, oRx: 250, oRy: 148, divs: 18 },
];

// Suite boxes: 5 stacked rects on each side, outside the upper ring
const SB = { w: 14, h: 10, gap: 3, count: 5 };
const sbTotalH = SB.count * SB.h + (SB.count - 1) * SB.gap; // 62
const sbTop = AR.CY - sbTotalH / 2; // 119
const SUITE_SETS = [
  { x: AR.CX - 250 - SB.w - 6 },  // left:  x=20
  { x: AR.CX + 250 + 6 },          // right: x=546
];

function ArenaMap({ genre, activeSectionTypes, onSectionTypeToggle }: {
  genre: string;
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
}) {
  const [hov, setHov] = useState<SectionType | null>(null);
  const isNBA = genre === "NBA", isNHL = genre === "NHL";
  const floorLabel = isNBA ? "COURT" : isNHL ? "ICE" : "FLOOR";
  const floorSub   = isNBA ? "COURTSIDE" : isNHL ? "RINKSIDE" : "GA / STAGE";

  return (
    <svg viewBox={`0 0 ${AR.W} ${AR.H}`} className="w-full" style={{ background: "#050810" }}>
      {/* Faint outer glow */}
      <ellipse cx={AR.CX} cy={AR.CY} rx={256} ry={151} fill="none" stroke="#1a3050" strokeWidth="1.5" opacity="0.6" />

      {/* Seating rings — drawn outer-to-inner so inner rings sit on top */}
      {[...ARENA_RINGS].reverse().map((ring) => {
        const f = zoneFill(ring.type, hov, activeSectionTypes);
        const midRy = (ring.iRy + ring.oRy) / 2;
        return (
          <g key={ring.type}>
            <path
              d={ringPath(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy)}
              fill={f} fillRule="evenodd"
              stroke="#050810" strokeWidth="1.5"
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(ring.type)}
              onMouseEnter={() => setHov(ring.type)}
              onMouseLeave={() => setHov(null)}
            />
            {/* Section divider lines */}
            {Array.from({ length: ring.divs }, (_, i) => {
              const l = divLine(AR.CX, AR.CY, ring.iRx, ring.iRy, ring.oRx, ring.oRy, i * (360 / ring.divs));
              return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#050810" strokeWidth="0.7" style={{ pointerEvents: "none" }} />;
            })}
            {/* Label at bottom of ring, centered */}
            <text
              x={AR.CX} y={AR.CY + midRy + 4}
              textAnchor="middle" fontSize="6.5"
              fill="rgba(255,255,255,0.5)"
              fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.7"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >{ring.label}</text>
          </g>
        );
      })}

      {/* Floor ellipse (court / ice / stage) */}
      <path
        d={ellipsePath(AR.CX, AR.CY, 82, 38)}
        fill={isNBA ? "#7c4a18" : isNHL ? "#bdd3e8" : "#0a2540"}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHov("floor")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Court markings — NBA */}
      {isNBA && (
        <g style={{ pointerEvents: "none" }}>
          <ellipse cx={AR.CX} cy={AR.CY} rx={18} ry={13} fill="none" stroke="#a06820" strokeWidth="0.8" />
          <line x1={AR.CX} y1={AR.CY - 38} x2={AR.CX} y2={AR.CY + 38} stroke="#a06820" strokeWidth="0.6" />
          <rect x={AR.CX - 14} y={AR.CY - 38} width={28} height={14} fill="none" stroke="#a06820" strokeWidth="0.6" />
          <rect x={AR.CX - 14} y={AR.CY + 24} width={28} height={14} fill="none" stroke="#a06820" strokeWidth="0.6" />
        </g>
      )}

      {/* Ice markings — NHL */}
      {isNHL && (
        <g style={{ pointerEvents: "none" }}>
          <ellipse cx={AR.CX} cy={AR.CY} rx={18} ry={12} fill="none" stroke="#cc2200" strokeWidth="0.9" />
          <line x1={AR.CX} y1={AR.CY - 38} x2={AR.CX} y2={AR.CY + 38} stroke="#cc2200" strokeWidth="0.8" />
          {[-22, 22].map((dy) =>
            [-34, 34].map((dx) => (
              <circle key={`${dx}${dy}`} cx={AR.CX + dx} cy={AR.CY + dy} r={4} fill="none" stroke="#cc2200" strokeWidth="0.7" />
            ))
          )}
        </g>
      )}

      {/* Stage — concerts */}
      {!isNBA && !isNHL && (
        <g style={{ pointerEvents: "none" }}>
          <rect x={AR.CX - 30} y={AR.CY + 15} width={60} height={14} rx={2} fill="#081828" stroke="#14375e" strokeWidth="0.8" />
          <text x={AR.CX} y={AR.CY + 25} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.25)" fontFamily="system-ui">STAGE</text>
        </g>
      )}

      {/* Floor labels */}
      <text x={AR.CX} y={AR.CY - 5} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.7)"
        fontFamily="system-ui,sans-serif" fontWeight="800" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>{floorLabel}</text>
      <text x={AR.CX} y={AR.CY + 8} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.3)"
        fontFamily="system-ui,sans-serif" style={{ pointerEvents: "none", userSelect: "none" }}>{floorSub}</text>

      {/* Suite box clusters on both long sides */}
      {SUITE_SETS.map((set, si) => (
        <g key={si}
          style={{ cursor: "pointer" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => setHov("suite")}
          onMouseLeave={() => setHov(null)}
        >
          {Array.from({ length: SB.count }, (_, i) => (
            <rect
              key={i}
              x={set.x} y={sbTop + i * (SB.h + SB.gap)}
              width={SB.w} height={SB.h} rx={2}
              fill={zoneFill("suite", hov, activeSectionTypes)}
              stroke="#050810" strokeWidth="0.8"
              style={{ transition: "fill 0.12s" }}
            />
          ))}
          <text
            x={set.x + SB.w / 2}
            y={sbTop - 5}
            textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.3)"
            fontFamily="system-ui" fontWeight="600"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >SUITES</text>
        </g>
      ))}

      {/* Compass */}
      <text x={AR.CX} y={13} textAnchor="middle" fontSize="9" fill="#1e3a5f" fontWeight="700" fontFamily="system-ui">N</text>
      <line x1={AR.CX} y1={17} x2={AR.CX} y2={AR.CY - 150} stroke="#1e3a5f" strokeWidth="0.7" strokeDasharray="2,3" />
    </svg>
  );
}

// ── NFL STADIUM MAP ───────────────────────────────────────────────────────────
// Rectangular field centred in concentric rounded-rect seating bands.
// viewBox 520 × 310, field 264 × 118.

const NF = { W: 520, H: 310, CX: 260, CY: 157 };
const FIELD = { w: 264, h: 118 };
const FX = NF.CX - FIELD.w / 2;  // 128
const FY = NF.CY - FIELD.h / 2;  // 98
const EZ_W = FIELD.w * 0.091;     // ~24 — one end zone (≈10 yds of 110)

// Band: lower, club, upper — defined as padding around field
const NFL_BANDS = [
  { type: "lower" as SectionType, pad: 22,  rx: 8,  label: "LOWER" },
  { type: "club"  as SectionType, pad: 38,  rx: 11, label: "CLUB"  },
  { type: "upper" as SectionType, pad: 60,  rx: 15, label: "UPPER DECK" },
];

// Yard line x positions (10-yd intervals inside playing field, not end zones)
const playW = FIELD.w - 2 * EZ_W;
const yardLines = Array.from({ length: 9 }, (_, i) => FX + EZ_W + playW * ((i + 1) / 10));
const yardNums  = [10, 20, 30, 40, 50, 40, 30, 20, 10];

function GoalPost({ x, flip }: { x: number; flip?: boolean }) {
  const baseX = x, crossY = FY + FIELD.h * 0.25;
  const dir = flip ? -1 : 1;
  return (
    <g style={{ pointerEvents: "none" }}>
      <line x1={baseX} y1={FY + FIELD.h * 0.75} x2={baseX} y2={crossY} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1={baseX - 10 * dir} y1={crossY} x2={baseX + 10 * dir} y2={crossY} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1={baseX - 10 * dir} y1={crossY} x2={baseX - 10 * dir} y2={crossY - 14} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1={baseX + 10 * dir} y1={crossY} x2={baseX + 10 * dir} y2={crossY - 14} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
    </g>
  );
}

function NFLMap({ activeSectionTypes, onSectionTypeToggle }: {
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
}) {
  const [hov, setHov] = useState<SectionType | null>(null);

  return (
    <svg viewBox={`0 0 ${NF.W} ${NF.H}`} className="w-full" style={{ background: "#050810" }}>

      {/* Seating bands — outer to inner */}
      {[...NFL_BANDS].reverse().map((band) => {
        const bx = FX - band.pad, by = FY - band.pad;
        const bw = FIELD.w + band.pad * 2, bh = FIELD.h + band.pad * 2;
        const f = zoneFill(band.type, hov, activeSectionTypes);
        return (
          <g key={band.type}>
            <rect
              x={bx} y={by} width={bw} height={bh} rx={band.rx}
              fill={f} stroke="#050810" strokeWidth="1.5"
              style={{ cursor: "pointer", transition: "fill 0.12s" }}
              onClick={() => onSectionTypeToggle(band.type)}
              onMouseEnter={() => setHov(band.type)}
              onMouseLeave={() => setHov(null)}
            />
          </g>
        );
      })}

      {/* Zone labels — placed in each band */}
      {NFL_BANDS.map((band) => {
        const by = FY - band.pad;
        const prevPad = band.pad === 22 ? 0 : band.pad === 38 ? 22 : 38;
        // Put label above the field, in the top portion of the band
        const labelY = by + (prevPad === 0 ? band.pad / 2 + 3 : (band.pad - prevPad) / 2 + 3);
        return (
          <text
            key={band.type}
            x={NF.CX} y={labelY}
            textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.45)"
            fontFamily="system-ui" fontWeight="700" letterSpacing="0.7"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >{band.label}</text>
        );
      })}

      {/* Suite strip along both sidelines */}
      {[
        { x: FX - 22, y: FY - 12, w: FIELD.w + 44, h: 10 },
        { x: FX - 22, y: FY + FIELD.h + 2, w: FIELD.w + 44, h: 10 },
      ].map((s, i) => (
        <rect
          key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={2}
          fill={zoneFill("suite", hov, activeSectionTypes)}
          stroke="#050810" strokeWidth="0.8"
          style={{ cursor: "pointer", transition: "fill 0.12s" }}
          onClick={() => onSectionTypeToggle("suite")}
          onMouseEnter={() => setHov("suite")}
          onMouseLeave={() => setHov(null)}
        />
      ))}
      <text x={NF.CX} y={FY - 16} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.35)"
        fontFamily="system-ui" fontWeight="600" style={{ pointerEvents: "none", userSelect: "none" }}>SUITES</text>

      {/* Field base */}
      <rect x={FX} y={FY} width={FIELD.w} height={FIELD.h} rx={2}
        fill={fieldFill(hov, activeSectionTypes)}
        stroke={hov === "floor" ? "#22c55e" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHov("floor")}
        onMouseLeave={() => setHov(null)}
      />

      {/* End zones (darker green) */}
      <rect x={FX} y={FY} width={EZ_W} height={FIELD.h} rx={2} fill="#14532d" style={{ pointerEvents: "none" }} />
      <rect x={FX + FIELD.w - EZ_W} y={FY} width={EZ_W} height={FIELD.h} rx={2} fill="#14532d" style={{ pointerEvents: "none" }} />

      {/* End zone separator lines */}
      <line x1={FX + EZ_W} y1={FY} x2={FX + EZ_W} y2={FY + FIELD.h} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />
      <line x1={FX + FIELD.w - EZ_W} y1={FY} x2={FX + FIELD.w - EZ_W} y2={FY + FIELD.h} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" style={{ pointerEvents: "none" }} />

      {/* Yard lines + numbers */}
      {yardLines.map((x, i) => (
        <g key={i} style={{ pointerEvents: "none" }}>
          <line x1={x} y1={FY + 2} x2={x} y2={FY + FIELD.h - 2} stroke="rgba(255,255,255,0.22)" strokeWidth="0.7" />
          <text x={x} y={NF.CY + 4} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.3)" fontFamily="system-ui" fontWeight="700">{yardNums[i]}</text>
        </g>
      ))}

      {/* Hash marks */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = FX + EZ_W + (i + 0.5) * playW / 10;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            <line x1={x} y1={FY + FIELD.h * 0.3} x2={x} y2={FY + FIELD.h * 0.38} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <line x1={x} y1={FY + FIELD.h * 0.62} x2={x} y2={FY + FIELD.h * 0.7} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          </g>
        );
      })}

      {/* Goal posts */}
      <GoalPost x={FX + EZ_W * 0.5} />
      <GoalPost x={FX + FIELD.w - EZ_W * 0.5} flip />

      {/* Field label */}
      <text x={NF.CX} y={NF.CY - 10} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.55)"
        fontFamily="system-ui" fontWeight="800" letterSpacing="0.5"
        style={{ pointerEvents: "none", userSelect: "none" }}>FIELD LEVEL</text>

      {/* Compass */}
      <text x={NF.CX} y={13} textAnchor="middle" fontSize="9" fill="#1e3a5f" fontWeight="700" fontFamily="system-ui">N</text>
    </svg>
  );
}

// ── MLB BALLPARK MAP ──────────────────────────────────────────────────────────
// Fan-shaped seating arcs radiating from home plate.
// viewBox 480 × 300, home plate at bottom-center (240, 278).

const BL = { W: 480, H: 300, HX: 240, HY: 278 };
const FAN_S = -218; // start angle (degrees from +x axis, SVG coords)
const FAN_E = -38;  // end angle

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = toRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcBandPath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s = arcPoint(cx, cy, r1, startDeg);
  const e = arcPoint(cx, cy, r1, endDeg);
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

// Seating band radii
const MLB_R = { lowerIn: 100, lowerOut: 145, suiteIn: 147, suiteOut: 155, clubIn: 157, clubOut: 175, upperIn: 177, upperOut: 218, wallOut: 223 };
// Warning track
const MLB_WT = { in: 208, out: 222 };

// Divider angles for the lower bowl (radial section lines)
const MLB_DIVS = Array.from({ length: 14 }, (_, i) => FAN_S + i * (FAN_E - FAN_S) / 13);

function MLBMap({ activeSectionTypes, onSectionTypeToggle }: {
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
}) {
  const [hov, setHov] = useState<SectionType | null>(null);
  const cx = BL.HX, cy = BL.HY;

  return (
    <svg viewBox={`0 0 ${BL.W} ${BL.H}`} className="w-full" style={{ background: "#050810" }}>

      {/* Upper deck */}
      <path
        d={arcBandPath(cx, cy, MLB_R.upperIn, MLB_R.upperOut, FAN_S, FAN_E)}
        fill={zoneFill("upper", hov, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("upper")}
        onMouseEnter={() => setHov("upper")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Club / Mezzanine */}
      <path
        d={arcBandPath(cx, cy, MLB_R.clubIn, MLB_R.clubOut, FAN_S, FAN_E)}
        fill={zoneFill("club", hov, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("club")}
        onMouseEnter={() => setHov("club")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Suite ring */}
      <path
        d={arcBandPath(cx, cy, MLB_R.suiteIn, MLB_R.suiteOut, FAN_S, FAN_E)}
        fill={zoneFill("suite", hov, activeSectionTypes)}
        stroke="#050810" strokeWidth="0.8"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("suite")}
        onMouseEnter={() => setHov("suite")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Lower bowl */}
      <path
        d={arcBandPath(cx, cy, MLB_R.lowerIn, MLB_R.lowerOut, FAN_S, FAN_E)}
        fill={zoneFill("lower", hov, activeSectionTypes)}
        stroke="#050810" strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("lower")}
        onMouseEnter={() => setHov("lower")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Section divider lines in lower bowl */}
      {MLB_DIVS.map((deg, i) => {
        const inner = arcPoint(cx, cy, MLB_R.lowerIn, deg);
        const outer = arcPoint(cx, cy, MLB_R.lowerOut, deg);
        return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#050810" strokeWidth="0.7" style={{ pointerEvents: "none" }} />;
      })}

      {/* Outfield grass (floor zone = field level seats + outfield) */}
      <path
        d={arcBandPath(cx, cy, 62, MLB_R.lowerIn - 1, FAN_S, FAN_E)}
        fill={fieldFill(hov, activeSectionTypes)}
        stroke={hov === "floor" ? "#22c55e" : "#15803d"} strokeWidth="1.5"
        style={{ cursor: "pointer", transition: "fill 0.12s" }}
        onClick={() => onSectionTypeToggle("floor")}
        onMouseEnter={() => setHov("floor")}
        onMouseLeave={() => setHov(null)}
      />

      {/* Warning track */}
      <path
        d={arcBandPath(cx, cy, MLB_R.upperOut, MLB_R.wallOut, FAN_S, FAN_E)}
        fill="#7a5c28" stroke="#050810" strokeWidth="0.8" style={{ pointerEvents: "none" }}
      />

      {/* Outfield wall */}
      <path
        d={sectorPath(cx, cy, MLB_R.wallOut + 3, FAN_S, FAN_E)}
        fill="none" stroke="#374151" strokeWidth="2.5" style={{ pointerEvents: "none" }}
      />

      {/* Infield — dirt arc */}
      <path
        d={`M ${cx - 55} ${cy - 8} A 68 52 0 0 1 ${cx + 55} ${cy - 8} L ${cx + 40} ${cy + 4} A 44 32 0 0 0 ${cx - 40} ${cy + 4} Z`}
        fill="#8b6930" stroke="#050810" strokeWidth="0.8" style={{ pointerEvents: "none" }}
      />

      {/* Infield grass */}
      <path
        d={`M ${cx - 42} ${cy - 6} A 52 40 0 0 1 ${cx + 42} ${cy - 6} L ${cx + 28} ${cy + 3} A 30 22 0 0 0 ${cx - 28} ${cy + 3} Z`}
        fill="#1a5c2a" stroke="none" style={{ pointerEvents: "none" }}
      />

      {/* Diamond */}
      {(() => {
        const d = 30;
        const bases = [
          [cx, cy - d],       // 2B
          [cx + d, cy],       // 1B
          [cx, cy + d],       // HP
          [cx - d, cy],       // 3B
        ] as [number, number][];
        return (
          <g style={{ pointerEvents: "none" }}>
            <polygon
              points={bases.map(([bx, by]) => `${bx},${by}`).join(" ")}
              fill="#8b6930" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7"
            />
            {bases.map(([bx, by], i) => (
              <rect key={i} x={bx - 2.5} y={by - 2.5} width={5} height={5} fill="white" opacity={0.8} />
            ))}
            {/* Pitcher's mound */}
            <circle cx={cx} cy={cy - d * 0.55} r={4.5} fill="#8b6930" stroke="#050810" strokeWidth="0.5" />
          </g>
        );
      })()}

      {/* Foul lines */}
      <line x1={cx} y1={cy + 30} x2={cx - 78} y2={cy - 138} stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" style={{ pointerEvents: "none" }} />
      <line x1={cx} y1={cy + 30} x2={cx + 78} y2={cy - 138} stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" style={{ pointerEvents: "none" }} />

      {/* Zone labels */}
      {(() => {
        // Place labels at the middle of each band at the top-center angle (-128°)
        const labelAngle = -128;
        const labels: { r: number; text: string }[] = [
          { r: (MLB_R.lowerIn + MLB_R.lowerOut) / 2, text: "LOWER" },
          { r: (MLB_R.clubIn + MLB_R.clubOut) / 2,   text: "CLUB" },
          { r: (MLB_R.upperIn + MLB_R.upperOut) / 2, text: "UPPER" },
        ];
        return labels.map(({ r, text }) => {
          const pt = arcPoint(cx, cy, r, labelAngle);
          return (
            <text key={text} x={pt.x} y={pt.y + 2}
              textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.45)"
              fontFamily="system-ui" fontWeight="700" letterSpacing="0.6"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >{text}</text>
          );
        });
      })()}

      {/* Field level label */}
      {(() => {
        const pt = arcPoint(cx, cy, 80, -128);
        return (
          <text x={pt.x} y={pt.y + 2} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.5)"
            fontFamily="system-ui" fontWeight="700" letterSpacing="0.5"
            style={{ pointerEvents: "none", userSelect: "none" }}>FIELD</text>
        );
      })()}

      {/* Home plate label */}
      <text x={cx} y={cy + 44} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.3)"
        fontFamily="system-ui" style={{ pointerEvents: "none", userSelect: "none" }}>HOME PLATE</text>
    </svg>
  );
}

// ── LEGEND PANEL ──────────────────────────────────────────────────────────────

function LegendPanel({ genre, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes, minByType }: {
  genre: string;
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (t: SectionType) => void;
  onClearSectionTypes: () => void;
  minByType: Record<SectionType, number | null>;
}) {
  const isNBA = genre === "NBA", isNHL = genre === "NHL";
  const isMLB = genre === "MLB", isNFL = genre === "NFL";
  const floorLabel = isNBA ? "Courtside" : isNHL ? "Rinkside" : (isMLB || isNFL) ? "Field Level" : "GA Floor";

  const zones: { type: SectionType; label: string }[] = [
    { type: "floor", label: floorLabel     },
    { type: "lower", label: "Lower Bowl"   },
    { type: "suite", label: "Suites"       },
    { type: "club",  label: isMLB ? "Mezzanine" : "Club Level" },
    { type: "upper", label: "Upper Deck"   },
  ];

  return (
    <div className="flex-1 p-4 flex flex-col justify-center gap-0.5">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Zones</p>
      {zones.map(({ type, label }) => {
        const min = minByType[type];
        const active = activeSectionTypes.includes(type);
        const dimmed = activeSectionTypes.length > 0 && !active;
        return (
          <button
            key={type}
            onClick={() => onSectionTypeToggle(type)}
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

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function VenueMap({ listings, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes, genre = "" }: Props) {
  const minByType = useMinByType(listings);
  const isNFL = genre === "NFL", isMLB = genre === "MLB";
  const title = isNFL ? "Stadium Map" : isMLB ? "Ballpark Map" : "Seat Map";

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-gray-700 text-sm font-semibold">{title}</span>
        <span className="text-gray-400 text-xs">Click a zone to filter</span>
      </div>

      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-72 flex-shrink-0">
          {isNFL ? (
            <NFLMap activeSectionTypes={activeSectionTypes} onSectionTypeToggle={onSectionTypeToggle} />
          ) : isMLB ? (
            <MLBMap activeSectionTypes={activeSectionTypes} onSectionTypeToggle={onSectionTypeToggle} />
          ) : (
            <ArenaMap genre={genre} activeSectionTypes={activeSectionTypes} onSectionTypeToggle={onSectionTypeToggle} />
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
