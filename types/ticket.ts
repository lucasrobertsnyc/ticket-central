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
  /** Direct checkout URL — opens the real purchase page on the originating platform */
  buyUrl?: string;
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
  /** Hero image URL — stock photo by default, replaced by Spotify when creds are set */
  imageUrl: string;
  /** The event's purchase page on the originating platform (Ticketmaster, SeatGeek, etc.) */
  url?: string;
}

export interface FilterState {
  search: string;
  minPrice: number;
  maxPrice: number;
  minQuantity: number;
  sectionTypes: SectionType[];
}
