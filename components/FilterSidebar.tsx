"use client";

import type { FilterState, SectionType } from "@/types/ticket";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "floor", label: "GA Floor"    },
  { value: "lower", label: "Lower Bowl"  },
  { value: "club",  label: "Club Level"  },
  { value: "upper", label: "Upper Level" },
  { value: "suite", label: "Suite"       },
];

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  absoluteMin: number;
  absoluteMax: number;
}

export default function FilterSidebar({ filters, onChange, absoluteMin, absoluteMax }: Props) {
  function toggleSection(type: SectionType) {
    const next = filters.sectionTypes.includes(type)
      ? filters.sectionTypes.filter((t) => t !== type)
      : [...filters.sectionTypes, type];
    onChange({ ...filters, sectionTypes: next });
  }

  function reset() {
    onChange({ search: filters.search, minPrice: absoluteMin, maxPrice: absoluteMax, minQuantity: 1, sectionTypes: [] });
  }

  const isDirty =
    filters.minPrice !== absoluteMin ||
    filters.maxPrice !== absoluteMax ||
    filters.minQuantity !== 1 ||
    filters.sectionTypes.length > 0;

  // Percentage positions for the visual fill + thumbs
  const range = absoluteMax > absoluteMin ? absoluteMax - absoluteMin : 1;
  const minPct = ((filters.minPrice - absoluteMin) / range) * 100;
  const maxPct = ((filters.maxPrice - absoluteMin) / range) * 100;

  return (
    <aside className="w-full lg:w-52 flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-gray-900 font-semibold text-sm">Filters</h2>
          {isDirty && (
            <button onClick={reset} className="text-gray-500 hover:text-gray-700 text-xs font-medium transition">
              Reset all
            </button>
          )}
        </div>

        <div className="p-4 space-y-5">

          {/* ── Price ──────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">All-in price</p>

            {/* Live price display */}
            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-semibold text-sm tabular-nums">${filters.minPrice}</span>
              <span className="text-gray-300 text-xs">–</span>
              <span className="text-gray-900 font-semibold text-sm tabular-nums">${filters.maxPrice}</span>
            </div>

            {/*
              Dual-handle range slider.
              Both <input type="range"> elements share the same absolute container.
              pointer-events: none on the input track is set in globals.css via
              .dual-range-input; pointer-events: all is set only on the thumb
              pseudo-element, so each handle is independently draggable.
              The coloured track fill + endpoint labels are rendered as plain divs.
            */}
            <div className="relative" style={{ height: 20 }}>
              {/* Grey track */}
              <div
                className="absolute rounded-full bg-gray-200 pointer-events-none"
                style={{ top: "50%", transform: "translateY(-50%)", left: 0, right: 0, height: 4 }}
              />
              {/* Blue fill between the two thumbs */}
              <div
                className="absolute rounded-full bg-gray-700 pointer-events-none"
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: `${minPct}%`,
                  right: `${100 - maxPct}%`,
                  height: 4,
                }}
              />

              {/* Min input — thumb is the only interactive part (see .dual-range-input CSS) */}
              <input
                type="range"
                className="dual-range-input"
                min={absoluteMin}
                max={absoluteMax}
                step={1}
                value={filters.minPrice}
                style={{ zIndex: minPct >= maxPct ? 5 : 3 }}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ ...filters, minPrice: Math.min(v, filters.maxPrice) });
                }}
              />

              {/* Max input — sits above min by default so it is draggable */}
              <input
                type="range"
                className="dual-range-input"
                min={absoluteMin}
                max={absoluteMax}
                step={1}
                value={filters.maxPrice}
                style={{ zIndex: 4 }}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ ...filters, maxPrice: Math.max(v, filters.minPrice) });
                }}
              />
            </div>

            <div className="flex justify-between text-gray-400 text-xs tabular-nums">
              <span>${absoluteMin}</span>
              <span>${absoluteMax}</span>
            </div>
          </div>

          {/* ── Tickets ────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tickets</p>
            <div className="relative">
              <select
                value={filters.minQuantity}
                onChange={(e) => onChange({ ...filters, minQuantity: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value={10}>10+</option>
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Section type ───────────────────────── */}
          <div className="space-y-1">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Section</p>
            {SECTION_TYPES.map(({ value, label }) => {
              const active = filters.sectionTypes.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleSection(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    active
                      ? "bg-gray-100 border border-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  {active && (
                    <svg className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </aside>
  );
}
