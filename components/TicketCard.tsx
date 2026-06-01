"use client";

import type { TicketListing, Platform } from "@/types/ticket";

const PLATFORM_COLORS: Record<Platform, { text: string; border: string }> = {
  SeatGeek:      { text: "text-emerald-700", border: "border-emerald-200 bg-emerald-50"  },
  StubHub:       { text: "text-blue-700",    border: "border-blue-200 bg-blue-50"        },
  "Vivid Seats": { text: "text-violet-700",  border: "border-violet-200 bg-violet-50"    },
  TickPick:      { text: "text-amber-700",   border: "border-amber-200 bg-amber-50"      },
  GameTime:      { text: "text-orange-700",  border: "border-orange-200 bg-orange-50"    },
  Ticketmaster:  { text: "text-sky-700",     border: "border-sky-200 bg-sky-50"          },
  AXS:           { text: "text-rose-700",    border: "border-rose-200 bg-rose-50"        },
};

interface Props {
  listing: TicketListing;
  isBestDeal: boolean;
  rank: number;
  allInMin: number;
  allInMax: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function dealScore(price: number, min: number, max: number): number {
  if (max === min) return 100;
  return Math.round(100 - ((price - min) / (max - min)) * 100);
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Great Deal";
  if (score >= 45) return "Fair Price";
  return "High Price";
}

function scoreColor(score: number): { bar: string; text: string; badge: string } {
  if (score >= 75) return { bar: "bg-green-500",  text: "text-green-700",  badge: "bg-green-100 text-green-700"  };
  if (score >= 45) return { bar: "bg-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" };
  return              { bar: "bg-red-400",    text: "text-red-700",    badge: "bg-red-100 text-red-700"    };
}

export default function TicketCard({ listing, isBestDeal, rank, allInMin, allInMax }: Props) {
  const { text: pText, border: pBorder } = PLATFORM_COLORS[listing.platform];
  const hasFees = listing.fees > 0;
  const score = dealScore(listing.allInTotal, allInMin, allInMax);
  const { badge: scoreBadge } = scoreColor(score);

  return (
    <div
      className={`bg-white border rounded-xl transition-shadow duration-150 hover:shadow-md ${
        isBestDeal ? "border-green-400 ring-1 ring-green-300" : "border-gray-200"
      }`}
    >
      {isBestDeal && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-1.5 flex items-center gap-1.5 rounded-t-xl">
          <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-green-700 text-xs font-semibold">Best Deal — Lowest all-in price</span>
        </div>
      )}

      <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-4">

        {/* ── Left: section info ─────────────────────────── */}
        <div className="flex-1 min-w-0 sm:w-56 sm:flex-none">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-sm">{listing.section}</span>
            <span className="text-gray-400 text-sm">&middot;</span>
            <span className="text-gray-600 text-sm">{listing.row}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${pBorder} ${pText}`}>
              {listing.platform}
            </span>
            <span className="text-gray-400 text-xs">
              {listing.quantity} ticket{listing.quantity !== 1 ? "s" : ""}
            </span>
            {!hasFees && (
              <span className="text-green-600 text-xs font-semibold">No fees</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-gray-400 text-xs">Deal Score:</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded tabular-nums ${scoreBadge}`}>
              {score}
            </span>
            <span className="text-gray-400 text-xs">{scoreLabel(score)}</span>
          </div>
          {listing.dealerNotes && (
            <p className="text-gray-400 text-xs mt-1 truncate max-w-[220px]" title={listing.dealerNotes}>
              {listing.dealerNotes}
            </p>
          )}
        </div>

        {/* ── Right: price + CTA ────────────────────────── */}
        <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-gray-900 font-extrabold text-xl tabular-nums leading-tight">
              ${fmt(listing.allInTotal)}
            </div>
            <div className="text-gray-400 text-xs">each &middot; all-in</div>
          </div>
          {listing.buyUrl ? (
            <a
              href={listing.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              Get Tickets
              <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
              Get Tickets
            </button>
          )}
        </div>
      </div>

      {/* ── Price breakdown row ───────────────────────────── */}
      <div className="px-4 pb-3 flex items-center gap-6 text-xs text-gray-400 border-t border-gray-100 pt-2.5">
        <span>Base: <span className="text-gray-600 font-medium">${fmt(listing.basePrice)}</span></span>
        <span>
          Fees:{" "}
          {hasFees
            ? <span className="text-gray-600 font-medium">${fmt(listing.fees)}</span>
            : <span className="text-green-600 font-semibold">$0.00</span>
          }
        </span>
        <span>Tax: <span className="text-gray-600 font-medium">${fmt(listing.tax)}</span></span>
        <span className="ml-auto">
          Total for {listing.quantity}:{" "}
          <span className="text-gray-800 font-semibold">${fmt(listing.allInTotal * listing.quantity)}</span>
        </span>
      </div>
    </div>
  );
}
