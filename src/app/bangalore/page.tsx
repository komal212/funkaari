import type { Metadata } from "next";
import { EventListing } from "@/components/EventListing";

export const metadata: Metadata = {
  title: "Bengaluru — Funkaari",
  description:
    "Dated kids workshops and playdates in Bengaluru over the next two months.",
};

export default function BangalorePage() {
  return <EventListing city="bangalore" />;
}
