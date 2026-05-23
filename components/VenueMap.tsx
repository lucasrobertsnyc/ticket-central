"use client";

import { useState } from "react";
import type { TicketListing, SectionType } from "@/types/ticket";

interface Props {
  listings: TicketListing[];
  activeSectionTypes: SectionType[];
  onSectionTypeToggle: (type: SectionType) => void;
  onClearSectionTypes: () => void;
}

// ── SVG geometry helpers ──────────────────────────────────────────────────────
const CX = 238, CY = 182;
const toRad = (d: number) => (d * Math.PI) / 180;
const px = (rx: number, deg: number) => CX + rx * Math.sin(toRad(deg));
const py = (ry: number, deg: number) => CY - ry * Math.cos(toRad(deg));

/** Full annular ring path using two 180-degree arcs + evenodd fill. */
function ringPath(iRx: number, iRy: number, oRx: number, oRy: number): string {
  const top = `M ${CX} ${CY - oRy}`;
  const oA1 = `A ${oRx} ${oRy} 0 0 1 ${CX} ${CY + oRy}`;
  const oA2 = `A ${oRx} ${oRy} 0 0 1 ${CX} ${CY - oRy}`;
  const iTop = `M ${CX} ${CY - iRy}`;
  const iA1 = `A ${iRx} ${iRy} 0 0 0 ${CX} ${CY + iRy}`;
  const iA2 = `A ${iRx} ${iRy} 0 0 0 ${CX} ${CY - iRy}`;
  return `${top} ${oA1} ${oA2} Z ${iTop} ${iA1} ${iA2} Z`;
}

/** Floor solid ellipse path (two 180-degree arcs). */
function ellipsePath(rx: number, ry: number): string {
  return `M ${CX} ${CY - ry} A ${rx} ${ry} 0 0 1 ${CX} ${CY + ry} A ${rx} ${ry} 0 0 1 ${CX} ${CY - ry} Z`;
}

/** Radial divider line between inner and outer ellipse at a given degree. */
function divLine(iRx: number, iRy: number, oRx: number, oRy: number, deg: number) {
  return {
    x1: px(iRx, deg), y1: py(iRy, deg),
    x2: px(oRx, deg), y2: py(oRy, deg),
  };
}

// ── Zone config ───────────────────────────────────────────────────────────────
const ZONES: {
  type: SectionType;
  label: string;
  shortLabel: string;
  iRx: number; iRy: number;
  oRx: number; oRy: number;
  color: string;
  activeColor: string;
  dimColor: string;
  divCount: number;
}[] = [
  {
    type: "lower",
    label: "Lower Bowl",   shortLabel: "LOWER",
    iRx: 64,  iRy: 51,  oRx: 110, oRy: 87,
    color: "#1e4d8c",  activeColor: "#2563eb",  dimColor: "#162d50",
    divCount: 10,
  },
  {
    type: "club",
    label: "Club Level",   shortLabel: "CLUB",
    iRx: 118, iRy: 95,  oRx: 141, oRy: 112,
    color: "#5b3a8a",  activeColor: "#7c3aed",  dimColor: "#351f52",
    divCount: 8,
  },
  {
    type: "upper",
    label: "Upper Level",  shortLabel: "UPPER",
    iRx: 149, iRy: 120, oRx: 200, oRy: 160,
    color: "#1e293b",  activeColor: "#334155",  dimColor: "#0f172a",
    divCount: 14,
  },
];

// Suite boxes: positioned just outside the upper ring at ~NW, NE, SW, SE
const SUITES = [
  { x: CX + 175 * Math.sin(toRad(45))  - 14, y: CY - 140 * Math.cos(toRad(45))  - 9 },
  { x: CX + 175 * Math.sin(toRad(135)) - 14, y: CY - 140 * Math.cos(toRad(135)) - 9 },
  { x: CX + 175 * Math.sin(toRad(225)) - 14, y: CY - 140 * Math.cos(toRad(225)) - 9 },
  { x: CX + 175 * Math.sin(toRad(315)) - 14, y: CY - 140 * Math.cos(toRad(315)) - 9 },
];

export default function VenueMap({ listings, activeSectionTypes, onSectionTypeToggle, onClearSectionTypes }: Props) {
  const [hovered, setHovered] = useState<SectionType | null>(null);

  // Min price per section type from provided listings
  const minByType = Object.fromEntries(
    (["floor", "lower", "club", "upper", "suite"] as SectionType[]).map((t) => {
      const group = listings.filter((l) => l.sectionType === t);
      const min = group.length > 0 ? Math.min(...group.map((l) => l.allInTotal)) : null;
      return [t, min];
    })
  ) as Record<SectionType, number | null>;

  const isActive = (t: SectionType) =>
    activeSectionTypes.length === 0 || activeSectionTypes.includes(t);
  const isDimmed = (t: SectionType) =>
    activeSectionTypes.length > 0 && !activeSectionTypes.includes(t);

  function fillFor(zone: (typeof ZONES)[0]) {
    if (hovered === zone.type) return zone.activeColor;
    if (isDimmed(zone.type)) return zone.dimColor;
    if (isActive(zone.type) && activeSectionTypes.includes(zone.type)) return zone.activeColor;
    return zone.color;
  }

  const floorActive = activeSectionTypes.includes("floor");
  const floorDimmed = activeSectionTypes.length > 0 && !floorActive;
  const suiteActive = activeSectionTypes.includes("suite");
  const suiteDimmed = activeSectionTypes.length > 0 && !suiteActive;

  const floorFill = hovered === "floor"
    ? "#2563eb"
    : floorDimmed ? "#0c1a33"
    : floorActive ? "#3b82f6"
    : "#1d3a6e";

  const suiteFill = hovered === "suite"
    ? "#7c3aed"
    : suiteDimmed ? "#1a0a2e"
    : suiteActive ? "#8b5cf6"
    : "#4c1d95";

  const fmt = (n: number) => `$${n}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-gray-700 text-sm font-semibold">Seat Map</span>
        <span className="text-gray-400 text-xs">Click a zone to filter</span>
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* SVG */}
        <svg
          viewBox="0 0 476 340"
          className="w-full sm:w-72 flex-shrink-0"
          style={{ background: "#080c15" }}
        >
          {/* ── Rings ─────────────────────────────── */}
          {ZONES.map((zone) => (
            <g key={zone.type}>
              <path
                d={ringPath(zone.iRx, zone.iRy, zone.oRx, zone.oRy)}
                fill={fillFor(zone)}
                fillRule="evenodd"
                stroke="#080c15"
                strokeWidth="1.5"
                style={{ cursor: "pointer", transition: "fill 0.15s" }}
                onClick={() => onSectionTypeToggle(zone.type)}
                onMouseEnter={() => setHovered(zone.type)}
                onMouseLeave={() => setHovered(null)}
              />
              {/* Section divider lines */}
              {Array.from({ length: zone.divCount }, (_, i) => {
                const l = divLine(zone.iRx, zone.iRy, zone.oRx, zone.oRy, i * (360 / zone.divCount));
                return (
                  <line
                    key={i}
                    x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                    stroke="#080c15"
                    strokeWidth="0.8"
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}
              {/* Zone label */}
              <text
                x={CX + (zone.iRx + zone.oRx) / 2 + 4}
                y={CY + 3}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(255,255,255,0.45)"
                fontFamily="system-ui,sans-serif"
                fontWeight="600"
                letterSpacing="0.5"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {zone.shortLabel}
              </text>
            </g>
          ))}

          {/* ── Floor ellipse ────────────────────── */}
          <path
            d={ellipsePath(55, 43)}
            fill={floorFill}
            stroke="#080c15"
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "fill 0.15s" }}
            onClick={() => onSectionTypeToggle("floor")}
            onMouseEnter={() => setHovered("floor")}
            onMouseLeave={() => setHovered(null)}
          />
          <text
            x={CX} y={CY - 6}
            textAnchor="middle"
            fontSize="7.5"
            fill="rgba(255,255,255,0.55)"
            fontFamily="system-ui,sans-serif"
            fontWeight="700"
            letterSpacing="0.5"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            GA FLOOR
          </text>
          <text
            x={CX} y={CY + 7}
            textAnchor="middle"
            fontSize="6.5"
            fill="rgba(255,255,255,0.35)"
            fontFamily="system-ui,sans-serif"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            STAGE
          </text>

          {/* ── Suite boxes ─────────────────────── */}
          {SUITES.map((s, i) => (
            <rect
              key={i}
              x={s.x} y={s.y}
              width={28} height={18}
              rx={3}
              fill={suiteFill}
              stroke="#080c15"
              strokeWidth="1.2"
              style={{ cursor: "pointer", transition: "fill 0.15s" }}
              onClick={() => onSectionTypeToggle("suite")}
              onMouseEnter={() => setHovered("suite")}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Suite label on first box */}
          <text
            x={SUITES[0].x + 14} y={SUITES[0].y + 11}
            textAnchor="middle"
            fontSize="5.5"
            fill="rgba(255,255,255,0.5)"
            fontFamily="system-ui,sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            SUITE
          </text>

          {/* ── Compass ─────────────────────────── */}
          <text x={CX} y={18} textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700" fontFamily="system-ui">N</text>
          <line x1={CX} y1={22} x2={CX} y2={CY - 162} stroke="#1e293b" strokeWidth="0.8" />
        </svg>

        {/* ── Legend + prices ──────────────────────── */}
        <div className="flex-1 p-4 flex flex-col justify-center gap-1">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Zones</p>

          {([
            { type: "floor" as SectionType,  label: "GA Floor",    color: "#2563eb" },
            { type: "lower" as SectionType,  label: "Lower Bowl",  color: "#1d4ed8" },
            { type: "club"  as SectionType,  label: "Club Level",  color: "#7c3aed" },
            { type: "upper" as SectionType,  label: "Upper Level", color: "#6b7280" },
            { type: "suite" as SectionType,  label: "Suite",       color: "#8b5cf6" },
          ]).map(({ type, label, color }) => {
            const min = minByType[type];
            const active = activeSectionTypes.includes(type);
            const dimmed = activeSectionTypes.length > 0 && !active;

            return (
              <button
                key={type}
                onClick={() => onSectionTypeToggle(type)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left transition-all ${
                  active
                    ? "bg-blue-50 border border-blue-200"
                    : dimmed
                    ? "border border-transparent opacity-40"
                    : "border border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-sm font-medium ${active ? "text-blue-700" : dimmed ? "text-gray-400" : "text-gray-700"}`}>{label}</span>
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
            <button
              onClick={onClearSectionTypes}
              className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition text-left"
            >
              Clear zone filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
