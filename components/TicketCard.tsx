"use client";

import type { TicketListing, Platform } from "@/types/ticket";

const PLATFORM_STYLES: Record<Platform, { badge: string; dot: string }> = {
  SeatGeek:      { badge: "bg-emerald-950 text-emerald-300 border border-emerald-900", dot: "bg-emerald-400" },
  StubHub:       { badge: "bg-blue-950 text-blue-300 border border-blue-900",          dot: "bg-blue-400"    },
  "Vivid Seats": { badge: "bg-violet-950 text-violet-300 border border-violet-900",    dot: "bg-violet-400"  },
  TickPick:      { badge: "bg-amber-950 text-amber-300 border border-amber-900",       dot: "bg-amber-400"   },
  GameTime:      { badge: "bg-orange-950 text-orange-300 border border-orange-900",    dot: "bg-orange-400"  },
  Ticketmaster:  { badge: "bg-sky-950 text-sky-300 border border-sky-900",             dot: "bg-sky-400"     },
  AXS:           { badge: "bg-rose-950 text-rose-300 border border-rose-900",          dot: "bg-rose-400"    },
};

interface Props {
  listing: TicketListing;
  isBestDeal: boolean;
  rank: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TicketCard({ listing, isBestDeal, rank }: Props) {
  const { badge, dot } = PLATFORM_STYLES[listing.platform];
  const hasFees = listing.fees > 0;

  return (
    <div
      className={`group bg-slate-900 border rounded-xl transition-all duration-150 hover:border-slate-600 hover:bg-slate-800/70 ${
        isBestDeal ? "border-green-700" : "border-slate-800"
      }`}
    >
      {/* Best deal accent line */}
      {isBestDeal && (
        <div className="h-px bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500" />
      )}

      <div className="px-4 py-3.5">
        {/* ── Top row ───────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Rank */}
          <span className="text-slate-700 text-xs font-mono w-5 flex-shrink-0 pt-0.5 select-none">
            {rank}
          </span>

          {/* Platform badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
            {listing.platform}
          </div>

          {/* Section + row */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-slate-100 font-semibold text-sm">{listing.section}</span>
              <span className="text-slate-500 text-sm">·</span>
              <span className="text-slate-400 text-sm">{listing.row}</span>
              {isBestDeal && (
                <span className="inline-flex items-center gap-1 bg-green-900/60 border border-green-700/60 text-green-300 text-xs font-semibold px-2 py-0.5 rounded">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Best Deal
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-slate-500 text-xs">
                {listing.quantity} ticket{listing.quantity !== 1 ? "s" : ""}
              </span>
              {!hasFees && (
                <span className="text-green-500 text-xs font-medium">No fees</span>
              )}
              {listing.dealerNotes && (
                <span className="text-slate-600 text-xs truncate max-w-[200px]" title={listing.dealerNotes}>
                  {listing.dealerNotes}
                </span>
              )}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-slate-100 font-bold text-lg leading-none tabular-nums">
                ${fmt(listing.allInTotal)}
              </div>
              <div className="text-slate-600 text-xs mt-0.5">each · all-in</div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition whitespace-nowrap">
              Buy
            </button>
          </div>
        </div>

        {/* ── Price breakdown (collapsible feel via details) ── */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-slate-600 text-xs">Base</p>
            <p className="text-slate-300 text-sm font-medium tabular-nums mt-0.5">${fmt(listing.basePrice)}</p>
          </div>
          <div>
            <p className="text-slate-600 text-xs">Fees</p>
            {hasFees ? (
              <p className="text-slate-300 text-sm font-medium tabular-nums mt-0.5">${fmt(listing.fees)}</p>
            ) : (
              <p className="text-green-500 text-sm font-medium tabular-nums mt-0.5">$0.00</p>
            )}
          </div>
          <div>
            <p className="text-slate-600 text-xs">Tax</p>
            <p className="text-slate-300 text-sm font-medium tabular-nums mt-0.5">${fmt(listing.tax)}</p>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <span className="text-slate-600 text-xs tabular-nums">
            Total for {listing.quantity}: <span className="text-slate-400 font-medium">${fmt(listing.allInTotal * listing.quantity)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
