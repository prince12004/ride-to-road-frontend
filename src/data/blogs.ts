import type { BlogPost } from "@/types";

/** DEMO DATA — replace with the `blogs` collection (SEO pages). */
export const blogPosts: BlogPost[] = [
  {
    id: "b1",
    slug: "best-weekend-road-trips-from-delhi",
    title: "Best Weekend Road Trips From Delhi",
    excerpt: "Six routes under 350 km that turn a free weekend into a proper escape — with stops worth making.",
    category: "Road Trips",
    image: "/images/blog-roadtrips.jpg",
    readTime: "6 min read",
    publishedAt: "2026-09-12",
  },
  {
    id: "b2",
    slug: "things-to-check-before-a-self-drive",
    title: "Things to Check Before Taking a Self-Drive Car",
    excerpt: "Tyres, fuel level, documents and photos — a quick pickup checklist that saves time later.",
    category: "Driving Tips",
    image: "/images/blog-checklist.jpg",
    readTime: "4 min read",
    publishedAt: "2026-09-04",
  },
  {
    id: "b3",
    slug: "top-destinations-for-your-next-road-trip",
    title: "Top Destinations for Your Next Road Trip",
    excerpt: "From hill towns to heritage cities, the places our drivers keep coming back to.",
    category: "Destinations",
    image: "/images/blog-destinations.jpg",
    readTime: "5 min read",
    publishedAt: "2026-08-27",
  },
];
