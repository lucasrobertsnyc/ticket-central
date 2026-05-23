"use client";

import type { FilterState, SectionType } from "@/types/ticket";

const SECTION_TYPES: { value: SectionType; label: string; emoji: string }[] = [
  { value: "floor", label: "GA Floor", emoji: "🎤" },
  { value: "lower", label: "Lower Bowl", emoji: "🥇" },
  { value: "club", label: "Club Level", emoji: "🥈" },
  { value: "upper", label: "Upper Level", emoji: "🥉" },
  { value: "suite", label: "Suite", emoji: "👑" },
];

const QUANTITY_OPTIONS = [1, 2, 3, 4];

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  absoluteMin: number;
  absoluteMax: number;
}

export default function FilterSidebar({
  filters,
  onChange,
  absoluteMin,
  absoluteMax,
}: Props) {
  function toggleSection(type: SectionType) {
    const next = filters.sectionTypes.includes(type)
      ? filters.sectionTypes.filter((t) => t !== type)
      : [...filters.sectionTypes, type];
    onChange({ ...filters, sectionTypes: next });
  }

  function reset() {
    onChange({
      search: filters.search,
      minPrice: absoluteMin,
      maxPrice: absoluteMax,
      minQuantity: 1,
      sectionTypes: [],
    });
  }

  const isDirty =
    filters.minPrice !== absoluteMin ||
    filters.maxPrice !== absoluteMax ||
    filters.minQuantity !== 1 ||
    filters.sectionTypes.length > 0;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Filters
          </h2>
          {isDirty && (
            <button
              onClick={reset}
              className="text-pink-400 hover:text-pink-300 text-xs font-medium transition"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Price range */}
        <div className="space-y-3">
          <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
            All-in price
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-zinc-500 text-xs mb-1 block">Min</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                <input
                  type="number"
                  min={absoluteMin}
                  max={filters.maxPrice}
                  value={filters.minPrice}
                  onChange={(e) =>
                    onChange({ ...filters, minPrice: Number(e.target.value) })
                  }
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <span className="text-zinc-600 mt-5">–</span>
            <div className="flex-1">
              <label className="text-zinc-500 text-xs mb-1 block">Max</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                <input
                  type="number"
                  min={filters.minPrice}
                  max={absoluteMax}
                  value={filters.maxPrice}
                  onChange={(e) =>
                    onChange({ ...filters, maxPrice: Number(e.target.value) })
                  }
                  className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Visual range indicator */}
          <div className="relative h-1 bg-zinc-600 rounded-full mt-2">
            <div
              className="absolute h-1 bg-pink-500 rounded-full"
              style={{
                left: `${((filters.minPrice - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`,
                right: `${100 - ((filters.maxPrice - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-zinc-500 text-xs">
            <span>${absoluteMin}</span>
            <span>${absoluteMax}</span>
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-3">
          <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
            Min tickets
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {QUANTITY_OPTIONS.map((qty) => (
              <button
                key={qty}
                onClick={() => onChange({ ...filters, minQuantity: qty })}
                className={`py-2 rounded-lg text-sm font-semibold transition ${
                  filters.minQuantity === qty
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {qty}+
              </button>
            ))}
          </div>
        </div>

        {/* Section type */}
        <div className="space-y-2">
          <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
            Section type
          </p>
          {SECTION_TYPES.map(({ value, label, emoji }) => {
            const active = filters.sectionTypes.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleSection(value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-pink-600/20 border border-pink-500 text-pink-200"
                    : "bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{label}</span>
                {active && (
                  <svg className="w-4 h-4 ml-auto text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
