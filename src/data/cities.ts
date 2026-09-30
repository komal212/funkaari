import type { CityId } from "@/types/event";

export const CITIES: {
  id: CityId;
  label: string;
  href: string;
  listingLine: string;
  footerLine: string;
}[] = [
  {
    id: "bangalore",
    label: "Bengaluru",
    href: "/bangalore",
    listingLine:
      "Playdates, workshops, open houses, nature walks — scattered across Instagram, websites and a hundred other places.",
    footerLine:
      "We find every kids’ event near you so you don’t have to. Updated weekly.",
  },
];

export function cityMeta(id: CityId) {
  return CITIES.find((city) => city.id === id) ?? CITIES[0];
}
