export type Platform =
  | "SeatGeek"
  | "StubHub"
  | "Vivid Seats"
  | "TickPick"
  | "GameTime"
  | "Ticketmaster"
  | "AXS";

export type SectionType = "floor" | "lower" | "club" | "upper" | "suite";

export type SortField = "price" | "section" | "row" | "quantity";
export type SortDir = "asc" | "desc";

export interface TicketListing {
  id: string;
  platform: Platform;
  section: string;
  sectionType: SectionType;
  row: string;
  quantity: number;
  basePrice: number;
  fees: number;
  tax: number;
  allInTotal: number;
  dealerNotes?: string;
}

export interface Event {
  id: string;
  artist: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  genre: string;
  lowestAllInPrice: number;
  listingCount: number;
}

export interface FilterState {
  search: string;
  minPrice: number;
  maxPrice: number;
  minQuantity: number;
  sectionTypes: SectionType[];
}
