import type { Journey } from "@/types";

/** DEMO DATA — approximate road distances; replace with CMS content. */
export const journeys: Journey[] = [
  {
    id: "j1",
    slug: "delhi-to-rishikesh",
    from: "Delhi",
    to: "Rishikesh",
    distanceKm: 240,
    driveTime: "5–6 hrs",
    highlight: "Ganga ghats, cafés and Himalayan foothills",
    image: "/images/trip-rishikesh.jpg",
  },
  {
    id: "j2",
    slug: "delhi-to-jaipur",
    from: "Delhi",
    to: "Jaipur",
    distanceKm: 280,
    driveTime: "5 hrs",
    highlight: "Forts, bazaars and the Pink City at dusk",
    image: "/images/trip-jaipur.jpg",
  },
  {
    id: "j3",
    slug: "delhi-to-agra",
    from: "Delhi",
    to: "Agra",
    distanceKm: 230,
    driveTime: "3.5–4 hrs",
    highlight: "An easy expressway run to the Taj",
    image: "/images/trip-agra.jpg",
  },
];
