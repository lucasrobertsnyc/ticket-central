"use client";

import type { TicketListing } from "@/types/ticket";
import TicketCard from "./TicketCard";

interface Props {
  listings: TicketListing[];
}

export default function TicketList({ listings }: Props) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🎟️</div>
        <h3 className="text-white text-xl font-bold mb-2">No listings found</h3>
        <p className="text-zinc-400 text-sm max-w-xs">
          Try adjusting your filters or search to see more results.
        </p>
      </div>
    );
  }

  const bestDealId = listings[0].id;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-zinc-400 text-sm">
          Sorted by{" "}
          <span className="text-zinc-200 font-medium">all-in price</span>
        </p>
        <p className="text-zinc-500 text-xs">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {listings.map((listing, index) => (
        <TicketCard
          key={listing.id}
          listing={listing}
          isBestDeal={listing.id === bestDealId}
          rank={index + 1}
        />
      ))}
    </div>
  );
}
