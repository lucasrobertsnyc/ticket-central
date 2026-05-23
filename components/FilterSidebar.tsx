"use client";

import type { FilterState, SectionType } from "@/types/ticket";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "floor", label: "GA Floor"    },
  { value: "lower", label: "Lower Bowl"  },
  { value: "club",  label: "Club Level"  },
  { value: "upper", label: "Upper Level" },
  { value: "suite", label: "Suite"       },
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
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-slate-200 font-semibold text-sm">Filters</h2>
          {isDirty && (
            <button
              onClick={reset}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium transition"
            >
              Reset
            </button>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* Price range */}
          <div className="space-y-2.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              All-in price
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-slate-600 text-xs mb-1 block">Min</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min={absoluteMin}
                    max={filters.maxPrice}
                    value={filters.minPrice}
                    onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>
              <span className="text-slate-700 mt-5 text-sm">–</span>
              <div className="flex-1">
                <label className="text-slate-600 text-xs mb-1 block">Max</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min={filters.minPrice}
                    max={absoluteMax}
                    value={filters.maxPrice}
                    onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Range track */}
            <div className="relative h-1 bg-slate-700 rounded-full">
              <div
                className="absolute h-1 bg-blue-600 rounded-full"
                style={{
                  left: `${((filters.minPrice - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`,
                  right: `${100 - ((filters.maxPrice - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-slate-600 text-xs tabular-nums">
              <span>${absoluteMin}</span>
              <span>${absoluteMax}</span>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Min tickets
            </p>
            <div className="grid grid-cols-4 gap-1">
              {QUANTITY_OPTIONS.map((qty) => (
                <button
                  key={qty}
                  onClick={() => onChange({ ...filters, minQuantity: qty })}
                  className={`py-1.5 rounded-md text-sm font-medium transition ${
                    filters.minQuantity === qty
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {qty}+
                </button>
              ))}
            </div>
          </div>

          {/* Section type */}
          <div className="space-y-1.5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Section type
            </p>
            {SECTION_TYPES.map(({ value, label }) => {
              const active = filters.sectionTypes.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleSection(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    active
                      ? "bg-blue-600/15 border border-blue-600/50 text-blue-300"
                      : "border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  {active && (
                    <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
