"use client";

import type { TicketListing, Platform } from "@/types/ticket";

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; dot: string }> = {
  SeatGeek:     { bg: "bg-emerald-900/40", text: "text-emerald-300", dot: "bg-emerald-400" },
  StubHub:      { bg: "bg-blue-900/40",    text: "text-blue-300",    dot: "bg-blue-400" },
  "Vivid Seats":{ bg: "bg-violet-900/40",  text: "text-violet-300",  dot: "bg-violet-400" },
  TickPick:     { bg: "bg-amber-900/40",   text: "text-amber-300",   dot: "bg-amber-400" },
  GameTime:     { bg: "bg-orange-900/40",  text: "text-orange-300",  dot: "bg-orange-400" },
  Ticketmaster: { bg: "bg-sky-900/40",     text: "text-sky-300",     dot: "bg-sky-400" },
  AXS:          { bg: "bg-rose-900/40",    text: "text-rose-300",    dot: "bg-rose-400" },
};

interface Props {
  listing: TicketListing;
  isBestDeal: boolean;
  rank: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TicketCard({ listing, isBestDeal, rank }: Props) {
  const colors = PLATFORM_COLORS[listing.platform];
  const hasFees = listing.fees > 0;

  return (
    <div
      className={`relative bg-zinc-800 border rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-500 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5 ${
        isBestDeal ? "border-pink-500 shadow-pink-500/10 shadow-lg" : "border-zinc-700"
      }`}
    >
      {/* Best deal ribbon */}
      {isBestDeal && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank + platform */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <span className="text-zinc-600 text-xs font-mono">#{rank}</span>
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${colors.bg} ${colors.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {listing.platform}
            </div>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base">{listing.section}</h3>
              {isBestDeal && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Best Deal
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 text-sm">
              <span>{listing.row}</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.quantity} ticket{listing.quantity !== 1 ? "s" : ""}
              </span>
            </div>

            {listing.dealerNotes && (
              <p className="mt-2 text-zinc-500 text-xs italic leading-snug">
                {listing.dealerNotes}
              </p>
            )}
          </div>

          {/* Price column */}
          <div className="flex-shrink-0 text-right">
            <div className="text-white text-2xl font-black tracking-tight">
              ${fmt(listing.allInTotal)}
            </div>
            <div className="text-zinc-500 text-xs mt-0.5">per ticket · all-in</div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="mt-4 pt-4 border-t border-zinc-700/60">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-700/40 rounded-xl p-3 text-center">
              <p className="text-zinc-500 text-xs mb-1">Base price</p>
              <p className="text-zinc-200 text-sm font-semibold">${fmt(listing.basePrice)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${hasFees ? "bg-zinc-700/40" : "bg-emerald-900/20 border border-emerald-800/40"}`}>
              <p className="text-zinc-500 text-xs mb-1">Fees</p>
              {hasFees ? (
                <p className="text-zinc-200 text-sm font-semibold">${fmt(listing.fees)}</p>
              ) : (
                <p className="text-emerald-400 text-sm font-semibold">$0.00</p>
              )}
            </div>
            <div className="bg-zinc-700/40 rounded-xl p-3 text-center">
              <p className="text-zinc-500 text-xs mb-1">Tax</p>
              <p className="text-zinc-200 text-sm font-semibold">${fmt(listing.tax)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {!hasFees && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  No fees
                </span>
              )}
              <span>
                Total: <span className="text-white font-bold">${fmt(listing.allInTotal * listing.quantity)}</span> for {listing.quantity}
              </span>
            </div>
            <button className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95">
              Get tickets →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
