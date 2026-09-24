import { bangaloreInstagramUrls } from "@/data/bangalore-instagram-urls";

export const PARALLEL_BANGALORE_OBJECTIVE =
  "Extract upcoming dated kids workshops, playdates, open houses, pottery, storytime, music, treks, festivals, and online/Zoom sessions that Bengaluru parents can join (India / IST) in the next two months for children aged 6 months to 6 years. For each event include title, calendar date, time, venue or Online, neighbourhood, age range, price, booking URL and Instagram post URL if any. Skip adult-only sessions, admissions-only flyers, US-timezone classes, and undated weekly class schedules.";

export const PARALLEL_BANGALORE_QUERIES = [
  "Bangalore kids events September October 2026",
  "Bengaluru toddler workshop playdate",
  "preschool open house Bengaluru",
  "book tickets kids Bangalore",
];

export const BANGALORE_SEED_URLS = [
  "https://allevents.in/bangalore/kids",
  "https://allevents.in/bangalore/children",
  "https://allevents.in/bangalore/family",
  "https://allevents.in/bangalore/kids--this-weekend",
  "https://allevents.in/bangalore/children--this-weekend",
  "https://allevents.in/bangalore/kids--this-month",
  "https://allevents.in/bangalore/children--today",
  "https://allevents.in/bangalore",
  "https://allevents.in/bangalore/international-clown-festival-bengaluru/3900030490915719",
  "https://allevents.in/bangalore/kids-baking-experience-pizza-cupcake-and-cookie/3900030716160209",
  "https://insider.in/bangalore",
  "https://in.bookmyshow.com/explore/kids-bengaluru",
  "https://www.district.in/events/bangalore",
  "https://www.eventbrite.com/d/india--bangalore/kids/",
  "https://www.eventbrite.com/d/india--bangalore/family-and-education--events/",
  "https://parentingnirvana.com/",
  "https://www.kidsstoppress.com/city/bangalore/",
  "https://www.whatsuplife.in/bangalore/kids",
  "https://www.skillboxes.com/bangalore",
  "https://weekendr.in/",
  "https://www.klay.in/",
  "https://www.viverointernational.com/",
  "https://www.headstart.edu.in/",
  "https://www.eurokidsindia.com/",
  "https://playhood.in/",
  "https://www.champaca.in/",
  "https://allevents.in/online/kids",
  "https://www.eventbrite.com/d/online/kids--events/",
  "https://bangaloreinternationalcentre.org/events/",
  "https://ngma.gov.in/en/ngma-bengaluru.html",
  "https://www.phoenixmarketcity.com/bengaluru",
  "https://prayag.in/",
  "https://www.forumsouthbangalore.com/",
];

export const BANGALORE_SEARCHES: {
  objective: string;
  searchQueries: string[];
  includeDomains?: string[];
}[] = [
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "Bangalore kids events this month next month",
      "Bengaluru toddler workshop weekend",
      "Bangalore preschool open house 2026",
      "kids playdate pottery storytime Bengaluru",
    ],
  },
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "allevents.in Bangalore kids children family",
      "insider.in Bangalore family kids",
      "BookMyShow kids Bengaluru workshop",
      "district.in Bangalore kids events",
    ],
  },
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "Eventbrite Bangalore kids family",
      "kidsstoppress Bangalore events",
      "weekend workshops children Bengaluru",
      "indoor play sensory messy play Bangalore kids",
    ],
  },
  {
    objective:
      "Find Instagram posts for dated kids events in Bangalore or Bengaluru this September October November for ages 6 months to 6 years. Prefer instagram.com/p/ links with captions that include a calendar date.",
    searchQueries: [
      "instagram.com/p Bangalore kids workshop",
      "instagram Bengaluru playdate toddler September",
      "instagram preschool open house Bengaluru",
      "instagram kids festival Bengaluru November",
    ],
  },
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "KLAY Vivero Headstart EuroKids open house Bangalore",
      "Prayag Montessori Jumpstart Bangalore kids",
      "Forum South VR Bengaluru kids events",
      "Champaca library storytime Bangalore children",
    ],
  },
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "Bangalore kids pottery clay workshop",
      "Bengaluru kids music class concert",
      "Bangalore toddler trek farm picnic",
      "Bengaluru kids art camp October",
    ],
  },
  {
    objective: PARALLEL_BANGALORE_OBJECTIVE,
    searchQueries: [
      "online kids workshop India Zoom IST toddler",
      "virtual storytime preschool India rupees",
      "Zoom kids art class India ages 3",
      "online playdate kids India September October",
    ],
  },
];

export function bangaloreWideUrls(): string[] {
  return [...new Set([...BANGALORE_SEED_URLS, ...bangaloreInstagramUrls()])];
}
