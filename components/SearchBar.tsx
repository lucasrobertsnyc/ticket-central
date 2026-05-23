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
        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by section, platform, or row…"
        className="w-full bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 rounded-xl pl-12 pr-36 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
      />
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <span className="text-zinc-500 text-sm">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
