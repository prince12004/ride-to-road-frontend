import type { NavItem } from "@/types";

export const siteConfig = {
  name: "Ride to Road",
  tagline: "Self Drive, Your Way",
  description:
    "Premium self-drive car rentals across Delhi NCR. Pick your ride, choose your time, and hit the road on your terms.",
  url: "https://ridetoroad.com",
  contact: {
    whatsapp: "919310811124",
    phoneDisplay: "+91 93108 11124",
    phone: "+919310811124",
    email: "hello@ridetoroad.com",
  },
  social: {
    instagram: "#",
    facebook: "#",
    youtube: "#",
    x: "#",
  },
} as const;

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Cars", href: "/cars" },
  { label: "Locations", href: "/#locations" },
  { label: "Offers", href: "/#offers" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Blogs", href: "/blogs" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Explore",
    items: [
      { label: "Cars", href: "/cars" },
      { label: "Locations", href: "/#locations" },
      { label: "Offers", href: "/#offers" },
      { label: "Blogs", href: "/blogs" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about-us" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Contact", href: "/contact-us" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];
