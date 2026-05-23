"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}

export default function SearchBar({ value, onChange, resultCount }: Props) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by section, row, or platform…"
        className="w-full bg-slate-900 text-slate-100 placeholder-slate-600 border border-slate-800 rounded-xl pl-10 pr-32 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
      />
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <span className="text-slate-600 text-xs tabular-nums">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
