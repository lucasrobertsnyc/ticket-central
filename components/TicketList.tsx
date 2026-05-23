"use client";

import type { TicketListing } from "@/types/ticket";
import TicketCard from "./TicketCard";

interface Props {
  listings: TicketListing[];
  cheapestId: string | null;
}

export default function TicketList({ listings, cheapestId }: Props) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h3 className="text-slate-200 text-base font-semibold mb-1">No listings match</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Try adjusting your filters or broadening your search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {listings.map((listing, index) => (
        <TicketCard
          key={listing.id}
          listing={listing}
          isBestDeal={listing.id === cheapestId}
          rank={index + 1}
        />
      ))}
    </div>
  );
}
