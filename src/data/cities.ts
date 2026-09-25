import type { CityId } from "@/types/event";

export const CITIES: {
  id: CityId;
  label: string;
  href: string;
  chip: string;
  listingLine: string;
  footerLine: string;
}[] = [
  {
    id: "bangalore",
    label: "Bengaluru",
    href: "/bangalore",
    chip: "Bengaluru",
    listingLine:
      "Playdates in the park, art sessions at cafés, open houses at playschools — if it’s for little ones, it’s here.",
    footerLine:
      "We find every kids’ event near you so you don’t have to. Updated weekly.",
  },
];

export function cityMeta(id: CityId) {
  return CITIES.find((city) => city.id === id) ?? CITIES[0];
}
