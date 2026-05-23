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
    if (f === field) {
      onChange(f, dir === "asc" ? "desc" : "asc");
    } else {
      onChange(f, "asc");
    }
  }

  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-slate-500 text-xs">
        <span className="text-slate-300 font-medium tabular-nums">{count}</span>{" "}
        listing{count !== 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
        <span className="text-slate-600 text-xs pl-2 pr-1 select-none">Sort:</span>
        {OPTIONS.map(({ field: f, label }) => {
          const active = field === f;
          return (
            <button
              key={f}
              onClick={() => handleClick(f)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                active
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
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
