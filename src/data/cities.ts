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
      "Playdates, workshops and open houses for ages 6 months to 6 years.",
    footerLine:
      "Funkaari helps Bengaluru parents find exciting, age-appropriate experiences for their little ones, easily and confidently.",
  },
];

export function cityMeta(id: CityId) {
  return CITIES.find((city) => city.id === id) ?? CITIES[0];
}
