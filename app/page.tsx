import { Suspense } from "react";
import { getEvents } from "@/lib/api";
import HomepageClient from "./HomepageClient";

export default async function HomePage() {
  const events = await getEvents();
  return (
    <Suspense>
      <HomepageClient events={events} />
    </Suspense>
  );
}
