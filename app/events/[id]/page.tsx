import { notFound } from "next/navigation";
import { getEvent, getListings } from "@/lib/api";
import TicketCentralClient from "@/app/TicketCentralClient";

interface Props {
  params: { id: string };
}

export default async function EventPage({ params }: Props) {
  const [event, listings] = await Promise.all([
    getEvent(params.id),
    getListings(params.id),
  ]);

  if (!event) notFound();

  return <TicketCentralClient event={event} initialListings={listings} />;
}
