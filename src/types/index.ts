/**
 * Domain types for Ride to Road.
 *
 * These mirror the shape the future MongoDB collections / Admin panel
 * will return, so UI components never need to change when the data
 * source moves from static demo files to the API.
 */

export type CarCategory = "hatchback" | "sedan" | "suv" | "luxury";
export type Transmission = "Manual" | "Automatic";
export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric";

export interface HomeDelivery {
  available: boolean;
  price: number;
}

export interface Car {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CarCategory;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  pricePerDay: number;
  pricePerHour?: number;
  image: string;
  tag?: string;
  status?: "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "INACTIVE";
  available?: boolean;
  homeDelivery?: HomeDelivery;
}

export interface Location {
  id: string;
  slug: string;
  city: string;
  region: string;
  image: string;
}

export interface Journey {
  id: string;
  slug: string;
  from: string;
  to: string;
  distanceKm: number;
  driveTime: string;
  highlight: string;
  image: string;
}

export interface Offer {
  id: string;
  code?: string;
  eyebrow: string;
  title: string;
  description: string;
  terms: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  car?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  readTime: string;
  publishedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface CarDetail extends Car {
  _id: string;
  model: string;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit?: number;
  description?: string;
  features: string[];
  specifications: { label: string; value: string }[];
  gallery: string[];
  location: Location | string;
  status: "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "INACTIVE";
  isFeatured: boolean;
}

export type BookingStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "CAR_ASSIGNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "NOT_APPLICABLE";

export interface Booking {
  _id: string;
  bookingId: string;
  user?: string;
  car: CarDetail | Car | string;
  customerName: string;
  mobile: string;
  email?: string;
  address?: string;
  pickupLocation: Location | string;
  dropLocation: Location | string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  durationHours: number;
  baseAmount: number;
  additionalCharges: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  extensionCharges?: number;
  extensions?: BookingExtension[];
  payment: {
    status: PaymentStatus;
    method?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount?: number;
    paidAt?: string;
    failureReason?: string;
  };
  status: BookingStatus;
  source: "ONLINE" | "ADMIN_OFFLINE";
  specialRequest?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface BookingExtension {
  _id: string;
  previousDropAt: string;
  newDropAt: string;
  extraHours: number;
  amount: number;
  paymentStatus: "PAID" | "PENDING";
  paymentMethod?: string;
  note?: string;
  createdAt: string;
}

export interface BookingStatusHistoryEntry {
  _id: string;
  status: BookingStatus;
  note?: string;
  createdAt: string;
}

export interface RazorpayOrderInfo {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/* ---------------------------------------------------------------------- */
/* Customer dashboard, profile & KYC verification                         */
/* (appended by the auth/dashboard workstream — see src/app/login and     */
/* src/app/dashboard/**)                                                  */
/* ---------------------------------------------------------------------- */

export type VerificationStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface KycDocument {
  type: string;
  url: string;
  publicId: string;
}

export interface Verification {
  status: VerificationStatus;
  documents: KycDocument[];
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

/** Full user profile document as returned by GET /auth/me and PUT /user/profile. */
export interface UserProfile {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: string;
  verification: Verification;
  isBlocked: boolean;
  isVerifiedMobile: boolean;
  createdAt: string;
}

/** Lightweight car shape the backend populates onto a user's own bookings. */
export interface BookingCarSummary {
  name: string;
  brand: string;
  slug: string;
  mainImage?: { url: string; publicId: string };
  pricePerDay?: number;
}

/** A booking as returned by the authenticated /user/* endpoints (car populated with a summary shape, not the full CarDetail/Car). */
export interface UserBooking extends Omit<Booking, "car"> {
  car: BookingCarSummary;
}

export interface DashboardSummary {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingPaymentBookings: number;
  nextBooking: UserBooking | null;
}

/* ------------------------------------------------------------------ */
/* Admin-only types (appended for the admin panel)                     */
/* ------------------------------------------------------------------ */

export const ADMIN_PERMISSION_MODULES = [
  "dashboard",
  "cars",
  "bookings",
  "customers",
  "coupons",
  "offers",
  "blogs",
  "locations",
  "faqs",
  "testimonials",
  "contact",
  "cms",
  "settings",
  "users",
  "activityLogs",
] as const;
export type AdminPermissionModule = (typeof ADMIN_PERMISSION_MODULES)[number];

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "CONTENT_MANAGER", "BOOKING_MANAGER"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ImageRef {
  url: string;
  publicId: string;
}

export interface CarSpecification {
  label: string;
  value: string;
}

export interface CarDocuments {
  rc?: ImageRef;
  insurance?: ImageRef;
  puc?: ImageRef;
}

export interface CarSeo {
  seoTitle?: string;
  metaDescription?: string;
  ogImage?: ImageRef;
}

/**
 * Raw admin API shape for a Location doc — Mongoose's default JSON
 * serialization only emits `_id`, not the public site's `id` virtual, so
 * admin code must use this instead of the shared `Location` type.
 */
export interface AdminLocationDoc {
  _id: string;
  city: string;
  region: string;
  slug: string;
  address?: string;
  image?: ImageRef;
  isActive: boolean;
}

export interface AdminCarDoc {
  _id: string;
  name: string;
  brand: string;
  model: string;
  slug: string;
  category: CarCategory;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  tag?: string;
  pricePerDay: number;
  pricePerHour?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  securityDeposit?: number;
  homeDelivery?: HomeDelivery;
  description?: string;
  features: string[];
  specifications: CarSpecification[];
  location: AdminLocationDoc | string;
  mainImage: ImageRef;
  gallery: ImageRef[];
  documents?: CarDocuments;
  status: "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "INACTIVE";
  isFeatured: boolean;
  seo?: CarSeo;
  bookingsCount?: number;
  createdAt?: string;
}

export interface AdminBookingListItem extends Omit<Booking, "car" | "pickupLocation" | "dropLocation"> {
  car: { _id: string; name: string; brand: string; model?: string; slug?: string } | string;
  pickupLocation: { _id: string; city: string; region: string } | string;
  dropLocation: { _id: string; city: string; region: string } | string;
}

export interface AdminBookingDetail extends Omit<Booking, "car" | "pickupLocation" | "dropLocation" | "user"> {
  car: AdminCarDoc;
  pickupLocation: AdminLocationDoc;
  dropLocation: AdminLocationDoc;
  user?: { name: string; email?: string; mobile: string };
  coupon?: { code: string };
}

export interface BookingHistoryEntry {
  _id: string;
  status: BookingStatus;
  note?: string;
  changedByAdmin?: { name: string };
  createdAt: string;
}

export interface VerificationDocument {
  type: string;
  url: string;
  publicId: string;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profileImage?: ImageRef;
  isBlocked: boolean;
  isVerifiedMobile: boolean;
  verification: {
    status: VerificationStatus;
    documents: VerificationDocument[];
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  bookingsCount?: number;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  percentage?: number;
  fixedAmount?: number;
  minBookingAmount?: number;
  maxDiscount?: number;
  applicableCars: (AdminCarDoc | string)[];
  usageLimit?: number;
  perUserLimit?: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

export interface AdminOffer {
  _id: string;
  eyebrow: string;
  title: string;
  description: string;
  terms?: string;
  code?: string;
  image: ImageRef;
  ctaLabel: string;
  ctaHref: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface AdminBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: BlogCategory | string;
  image: ImageRef;
  author?: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: ImageRef;
  readTime?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface AdminFaq {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
}

export interface AdminTestimonial {
  _id: string;
  name: string;
  location?: string;
  rating: number;
  quote: string;
  car?: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface AdminJourney {
  _id: string;
  slug: string;
  from: string;
  to: string;
  distanceKm: number;
  driveTime: string;
  highlight: string;
  image: ImageRef;
  isActive: boolean;
}

export interface ContactEnquiry {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  message: string;
  status: "NEW" | "CONTACTED" | "RESOLVED";
  createdAt: string;
}

export interface CmsSettings {
  companyName: string;
  logo?: ImageRef;
  whatsappNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    x?: string;
  };
  booking: {
    minRentalHours: number;
    maxRentalDays: number;
    taxPercent: number;
    cancellationRulesText?: string;
  };
  seo: {
    defaultSeoTitle?: string;
    defaultDescription?: string;
    defaultOgImage?: ImageRef;
  };
}

export type SiteContentKey =
  | "about-us"
  | "contact-us"
  | "terms-and-conditions"
  | "cancellation-policy"
  | "refund-policy";

export interface SiteContentPage {
  _id: string;
  key: SiteContentKey;
  title: string;
  content: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  admin: { name: string; email: string; role: string };
  action: string;
  module: string;
  recordId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingPaymentBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalUsers: number;
  totalRevenue: number;
  recentBookings: AdminBookingListItem[];
  recentUsers: { name: string; mobile: string; createdAt: string }[];
  dailyRevenue: { date: string; total: number; count: number }[];
}
