import { Hero } from "@/components/Hero";
import { EventListing } from "@/components/EventListing";

export default function HomePage() {
  return (
    <>
      <Hero city="bangalore" />
      <EventListing city="bangalore" />
    </>
  );
}
