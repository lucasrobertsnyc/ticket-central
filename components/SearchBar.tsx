"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}

export default function SearchBar({ value, onChange, resultCount }: Props) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by section, row, or platform…"
        className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-200 rounded-xl pl-9 pr-24 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
      />
      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
        <span className="text-gray-400 text-xs tabular-nums">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
