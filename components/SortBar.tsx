"use client";

import type { SortField, SortDir } from "@/types/ticket";

interface Props {
  field: SortField;
  dir: SortDir;
  onChange: (field: SortField, dir: SortDir) => void;
  count: number;
}

const OPTIONS: { field: SortField; label: string }[] = [
  { field: "price",    label: "Price"   },
  { field: "section",  label: "Section" },
  { field: "row",      label: "Row"     },
  { field: "quantity", label: "Qty"     },
];

export default function SortBar({ field, dir, onChange, count }: Props) {
  function handleClick(f: SortField) {
    onChange(f, f === field ? (dir === "asc" ? "desc" : "asc") : "asc");
  }

  return (
    <div className="flex items-center justify-between mb-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
      <p className="text-gray-500 text-sm">
        <span className="text-gray-900 font-semibold tabular-nums">{count}</span>{" "}
        listing{count !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-xs mr-1 hidden sm:block">Sort:</span>
        {OPTIONS.map(({ field: f, label }) => {
          const active = field === f;
          return (
            <button
              key={f}
              onClick={() => handleClick(f)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-transparent"
              }`}
            >
              {label}
              {active && (
                <svg
                  className={`w-3 h-3 transition-transform ${dir === "desc" ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
