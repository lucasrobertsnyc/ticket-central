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
      <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <p className="text-gray-700 font-semibold mb-1">No listings match your filters</p>
        <p className="text-gray-400 text-sm">Try adjusting your price range, quantity, or section type.</p>
      </div>
    );
  }

  const allInMin = Math.min(...listings.map((l) => l.allInTotal));
  const allInMax = Math.max(...listings.map((l) => l.allInTotal));

  return (
    <div className="flex flex-col gap-2.5">
      {listings.map((listing, index) => (
        <TicketCard
          key={listing.id}
          listing={listing}
          isBestDeal={listing.id === cheapestId}
          rank={index + 1}
          allInMin={allInMin}
          allInMax={allInMax}
        />
      ))}
    </div>
  );
}
