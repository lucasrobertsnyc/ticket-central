import type { Event } from "@/types/ticket";

interface Props {
  event: Event;
}

const PLATFORMS = [
  {
    name: "SeatGeek",
    search: (q: string) => `https://seatgeek.com/search?q=${q}`,
    bg: "#059669",
    border: "#047857",
  },
  {
    name: "StubHub",
    search: (q: string) => `https://www.stubhub.com/find/s/?q=${q}`,
    bg: "#CC2828",
    border: "#B91C1C",
  },
  {
    name: "Vivid Seats",
    search: (q: string) => `https://www.vividseats.com/search?searchTerm=${q}`,
    bg: "#6D28D9",
    border: "#5B21B6",
  },
  {
    name: "TickPick",
    search: (q: string) => `https://www.tickpick.com/search?q=${q}`,
    bg: "#0284C7",
    border: "#0369A1",
  },
  {
    name: "GameTime",
    search: (q: string) => `https://gametime.co/events?search=${q}`,
    bg: "#EA580C",
    border: "#C2410C",
  },
];

export default function BuyTickets({ event }: Props) {
  // Build a search query from the event name + venue for best results
  const query = encodeURIComponent(`${event.artist} ${event.venue}`);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-gray-900 font-bold text-base">Buy Tickets</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Purchase directly from a ticketing platform
          </p>
        </div>
        <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">Opens in new tab</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {PLATFORMS.map(({ name, search, bg, border }) => (
          <a
            key={name}
            href={search(query)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold
                       transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            style={{
              backgroundColor: bg,
              boxShadow: `0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)`,
              border: `1px solid ${border}`,
            }}
          >
            {name}
            {/* External link icon */}
            <svg
              className="w-3.5 h-3.5 opacity-75 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
