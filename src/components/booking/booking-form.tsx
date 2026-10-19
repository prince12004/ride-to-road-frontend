"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format, parse } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  Loader2,
  ShieldCheck,
  Sparkles,
  Truck,
  Building2,
  Banknote,
  QrCode,
  Tag,
  Clock3,
  Gauge,
  UserRound,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPopoverField, TimePopoverField } from "@/components/booking/date-time-popover";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatINR, todayInIndia } from "@/lib/utils";
import { labelForTime } from "@/lib/time-slots";
import { RENTAL_TERMS } from "@/config/rental-terms";
import { calculateBaseAmount, DEFAULT_EXTRA_KM_RATE, DEFAULT_KM_PER_DAY, effectiveDailyRate, formatDuration, includedKm, MIN_RENTAL_HOURS } from "@/lib/pricing";
import { BOOKING_KYC_SLOTS, KycDocumentGrid, KycNumbersForm, slotState, useKycProfile } from "@/components/kyc/kyc-documents";
import type { CarDetail, Location, Booking } from "@/types";

const schema = z.object({
  customerName: z.string().min(2, "Name is too short"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  pickupLocationId: z.string().min(1, "Select a pickup location"),
  dropLocationId: z.string().min(1),
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  dropDate: z.string().min(1),
  dropTime: z.string().min(1),
  specialRequest: z.string().optional(),
  couponCode: z.string().optional(),
  termsAccepted: z.boolean().refine((v) => v, "Please accept the rental terms to continue"),
  homeDelivery: z.boolean(),
  deliveryAddress: z.string().max(500, "Keep the address under 500 characters").optional(),
}).superRefine((v, ctx) => {
  // Self-drive bookings are at least a full day (the API enforces this too).
  const pickup = new Date(`${v.pickupDate}T${v.pickupTime}`);
  const drop = new Date(`${v.dropDate}T${v.dropTime}`);
  if (drop.getTime() - pickup.getTime() < MIN_RENTAL_HOURS * 60 * 60 * 1000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dropDate"],
      message: `Minimum booking is ${MIN_RENTAL_HOURS} hours — choose a later return date or time`,
    });
  }
  // Mirrors the API rule: delivery needs a complete address.
  if (v.homeDelivery && (v.deliveryAddress ?? "").trim().length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deliveryAddress"],
      message: "Enter your complete delivery address (house no., street, area, city)",
    });
  }
});

// Shown before the customer confirms (from the business's rental rules).

type FormValues = z.infer<typeof schema>;

function todayStr(offsetDays = 0) {
  return format(addDays(todayInIndia(), offsetDays), "yyyy-MM-dd");
}

/** True for fields that open the on-screen keyboard. */
function isTextField(el: EventTarget | null) {
  return el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit"].includes(el.type));
}

/** Form data kept across the OTP-login round trip so nothing has to be re-typed. */
const draftKey = (slug: string) => `rtr-booking-draft:${slug}`;

interface InitiateResponse {
  booking: Booking;
}

type PaymentChoice = "COD" | "UPI_QR";

const PAYMENT_OPTIONS: { value: PaymentChoice; title: string; description: string; icon: typeof Banknote }[] = [
  {
    value: "COD",
    title: "Cash on Delivery",
    description: "Confirm now, pay in cash when you pick up the car.",
    icon: Banknote,
  },
  {
    value: "UPI_QR",
    title: "Pay online via UPI QR",
    description: "Scan our QR with any UPI app, then upload the payment screenshot.",
    icon: QrCode,
  },
];

export interface BookingFormInitial {
  locationId?: string;
  pickupDate?: string;
  pickupTime?: string;
  dropDate?: string;
  dropTime?: string;
}

export function BookingForm({
  car,
  locations,
  initial,
}: {
  car: CarDetail;
  locations: Location[];
  initial?: BookingFormInitial;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginRedirect = `/login?redirect=${encodeURIComponent(
    searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname,
  )}`;
  const { user, isHydrated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  // Synchronous guard against double taps — state updates land a render late.
  const submittingRef = useRef(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentChoice>("COD");
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");
  // The car-detail API populates `location` with Mongo's `_id`, while the
  // locations list uses `id` — accept either so the car's own location is
  // preselected, falling back to the first location.
  const carLocation = typeof car.location === "object" ? (car.location as Location & { _id?: string }) : null;
  const carLocationId = carLocation?.id ?? carLocation?._id ?? (typeof car.location === "string" ? car.location : undefined);
  // Only cities where this car can be booked (same rule as the API).
  const offeredLocations = locations.filter(
    (l) => car.allCities || l.showAllCars || l.id === carLocationId || (car.cities ?? []).includes(l.id),
  );
  const defaultLocationId =
    (initial?.locationId && offeredLocations.some((l) => l.id === initial.locationId) ? initial.locationId : undefined) ||
    (carLocationId && offeredLocations.some((l) => l.id === carLocationId) ? carLocationId : offeredLocations[0]?.id ?? "");
  const deliveryFee = car.homeDelivery?.available ? car.homeDelivery.price : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      termsAccepted: false,
      homeDelivery: false,
      deliveryAddress: "",
      customerName: user?.name || "",
      mobile: user?.mobile || "",
      email: user?.email || "",
      pickupLocationId: defaultLocationId,
      dropLocationId: defaultLocationId,
      pickupDate: initial?.pickupDate || todayStr(1),
      pickupTime: initial?.pickupTime || "10:00",
      dropDate: initial?.dropDate || todayStr(2),
      dropTime: initial?.dropTime || "10:00",
    },
  });

  const values = watch();

  const chooseDelivery = (delivery: boolean) => {
    setHomeDelivery(delivery);
    setValue("homeDelivery", delivery);
    if (!delivery) {
      clearErrors("deliveryAddress");
    } else if (!getValues("deliveryAddress")?.trim() && getValues("address")?.trim()) {
      // Start from the address the customer already typed above.
      setValue("deliveryAddress", getValues("address"));
    }
  };

  // Self-drive rentals return to the same spot they were picked up from —
  // keep dropLocationId in lockstep with pickupLocationId instead of asking twice.
  useEffect(() => {
    if (values.dropLocationId !== values.pickupLocationId) {
      setValue("dropLocationId", values.pickupLocationId);
    }
  }, [values.pickupLocationId, values.dropLocationId, setValue]);

  // react-hook-form only reads `defaultValues` once at mount, but the auth
  // store can still be hydrating then — backfill once the user is known so
  // logged-in customers never have to re-type details already on file.
  useEffect(() => {
    if (!user) return;
    reset((current) => ({
      ...current,
      customerName: current.customerName || user.name || "",
      mobile: current.mobile || user.mobile || "",
      email: current.email || user.email || "",
    }));
  }, [user, reset]);

  // Coming back from the OTP login: restore what the customer had entered.
  useEffect(() => {
    if (!isHydrated || !user) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(draftKey(car.slug));
      if (raw) sessionStorage.removeItem(draftKey(car.slug));
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { values: Partial<FormValues>; paymentMethod?: PaymentChoice; homeDelivery?: boolean };
      reset((current) => ({
        ...current,
        ...draft.values,
        customerName: draft.values.customerName || current.customerName || user.name || "",
        mobile: draft.values.mobile || current.mobile || user.mobile || "",
      }));
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
      if (typeof draft.homeDelivery === "boolean") {
        setHomeDelivery(draft.homeDelivery);
        setValue("homeDelivery", draft.homeDelivery);
      }
      toast({ title: "Welcome back", description: "Your booking details are saved — review and confirm.", variant: "success" });
    } catch {
      // Ignore a corrupt draft.
    }
  }, [isHydrated, user, car.slug, reset]);

  const { profile: kycProfile, reload: reloadKyc } = useKycProfile(Boolean(user));
  const kycUploaded = BOOKING_KYC_SLOTS.filter((s) => slotState(kycProfile, s) !== "NOT_SUBMITTED").length;
  const kycVerified = BOOKING_KYC_SLOTS.every((s) => slotState(kycProfile, s) === "VERIFIED");

  type ScheduleField = "pickupDate" | "pickupTime" | "dropDate" | "dropTime";
  const [openField, setOpenField] = useState<ScheduleField | null>(null);
  const isOpen = (k: ScheduleField) => openField === k;
  const setOpen = (k: ScheduleField) => (open: boolean) =>
    setOpenField((current) => {
      if (open) return k;
      return current === k ? null : current;
    });

  const today = useMemo(() => todayInIndia(), []);
  const pickupDateObj = useMemo(() => parse(values.pickupDate, "yyyy-MM-dd", today), [values.pickupDate, today]);
  const dropDateObj = useMemo(() => parse(values.dropDate, "yyyy-MM-dd", today), [values.dropDate, today]);

  const handlePickupDateChange = (d: Date) => {
    setValue("pickupDate", format(d, "yyyy-MM-dd"), { shouldValidate: true });
    // Default the return date to a 24-hour rental unless the user adjusts it next.
    setValue("dropDate", format(addDays(d, 1), "yyyy-MM-dd"), { shouldValidate: true });
    setOpenField("pickupTime");
  };
  /** Keeps the return at least 24 hours after pickup when pickup moves later. */
  const ensureMinimumDuration = (pickupDate: string, pickupTime: string) => {
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const drop = new Date(`${getValues("dropDate")}T${getValues("dropTime")}`);
    if (drop.getTime() - pickup.getTime() < MIN_RENTAL_HOURS * 60 * 60 * 1000) {
      const minDrop = new Date(pickup.getTime() + MIN_RENTAL_HOURS * 60 * 60 * 1000);
      setValue("dropDate", format(minDrop, "yyyy-MM-dd"), { shouldValidate: true });
      setValue("dropTime", pickupTime, { shouldValidate: true });
    }
  };
  const handlePickupTimeChange = (v: string) => {
    setValue("pickupTime", v, { shouldValidate: true });
    ensureMinimumDuration(getValues("pickupDate"), v);
    setOpenField("dropDate");
  };
  const handleDropDateChange = (d: Date) => {
    setValue("dropDate", format(d, "yyyy-MM-dd"), { shouldValidate: true });
    setOpenField("dropTime");
  };
  const handleDropTimeChange = (v: string) => {
    setValue("dropTime", v, { shouldValidate: true });
    setOpenField(null);
  };

  // A coupon was validated against a specific code — if the user edits the
  // text afterwards, the discount shouldn't silently keep applying.
  useEffect(() => {
    if (coupon && values.couponCode?.trim().toUpperCase() !== coupon.code) {
      setCoupon(null);
    }
  }, [values.couponCode, coupon]);

  const applyCoupon = async () => {
    const code = values.couponCode?.trim();
    if (!code) return;
    setCouponChecking(true);
    setCouponError("");
    try {
      const res = await apiFetch<{ code: string; discountAmount: number; estimatedAmount: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, carId: car._id, baseAmount: estimate.baseAmount, mobile: values.mobile || undefined }),
      });
      setCoupon({ code: res.data.code, discountAmount: res.data.discountAmount });
      toast({ title: "Coupon applied", description: `You saved ${formatINR(res.data.discountAmount)}.`, variant: "success" });
    } catch (err) {
      setCoupon(null);
      setCouponError(err instanceof ApiClientError ? err.message : "Could not apply this coupon.");
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError("");
    setValue("couponCode", "");
  };

  const estimate = useMemo(() => {
    try {
      const pickup = new Date(`${values.pickupDate}T${values.pickupTime}`);
      const drop = new Date(`${values.dropDate}T${values.dropTime}`);
      const hours = Math.max(1, Math.ceil((drop.getTime() - pickup.getTime()) / (1000 * 60 * 60)));
      const days = Math.max(1, Math.ceil(hours / 24));
      // Same formula the API uses (daily = hourly × 24, weekly/monthly tiers).
      const baseAmount = calculateBaseAmount(car, hours);
      const delivery = homeDelivery ? deliveryFee : 0;
      const discount = coupon && values.couponCode?.trim().toUpperCase() === coupon.code ? coupon.discountAmount : 0;
      // Mirrors the backend: the refundable deposit is added after discount/tax.
      const deposit = Math.max(0, car.securityDeposit ?? 0);
      const rental = Math.max(0, baseAmount + delivery - discount);
      const freeKm = includedKm(hours, car.kmPerDay ?? DEFAULT_KM_PER_DAY);
      return { hours, days, baseAmount, delivery, discount, deposit, rental, amount: rental + deposit, freeKm };
    } catch {
      return { hours: 0, days: 0, baseAmount: 0, delivery: 0, discount: 0, deposit: 0, rental: 0, amount: 0, freeKm: 0 };
    }
  }, [
    values.pickupDate,
    values.pickupTime,
    values.dropDate,
    values.dropTime,
    values.couponCode,
    car,
    car.securityDeposit,
    homeDelivery,
    deliveryFee,
    coupon,
  ]);

  const onSubmit = async (formValues: FormValues) => {
    if (submittingRef.current) return;

    if (!user) {
      // Verify the mobile number first; the form comes back pre-filled.
      try {
        sessionStorage.setItem(draftKey(car.slug), JSON.stringify({ values: formValues, paymentMethod, homeDelivery }));
      } catch {
        // Private mode etc. — the customer just re-enters details after login.
      }
      toast({ title: "Verify your mobile number", description: "Log in with a quick OTP to confirm this booking." });
      router.push(loginRedirect);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await apiFetch<InitiateResponse>("/bookings/initiate", {
        method: "POST",
        body: JSON.stringify({
          ...formValues,
          carId: car._id,
          email: formValues.email || undefined,
          homeDelivery,
          deliveryAddress: homeDelivery ? formValues.deliveryAddress?.trim() : undefined,
          paymentMethod,
        }),
      });

      const { booking } = res.data;

      if (paymentMethod === "COD") {
        toast({ title: "Booking confirmed", description: "Pay in cash when you pick up the car.", variant: "success" });
        router.push(`/booking/success/${booking.bookingId}`);
      } else {
        toast({
          title: "Booking created",
          description: "Scan the QR to pay, then upload your payment screenshot.",
          variant: "success",
        });
        router.push(`/booking/${booking.bookingId}#payment`);
      }
    } catch (err) {
      toast({
        title: "Booking failed",
        description: err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const hasPrefill = Boolean(initial?.locationId || initial?.pickupDate || initial?.dropDate);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      onFocus={(e) => setInputFocused(isTextField(e.target))}
      onBlur={(e) => setInputFocused(isTextField(e.relatedTarget))}
      className="grid gap-5 pb-28 sm:gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:pb-0"
    >
      <div className="space-y-4 sm:space-y-6">
        {hasPrefill && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm font-semibold text-brand-deep">
            <Sparkles className="size-4 shrink-0" /> Pre-filled from your search — change anything below if needed.
          </div>
        )}


        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
              <CalendarClock className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold text-navy-900">Booking Details</h2>
          </div>

          {car.homeDelivery?.available && (
            <div role="radiogroup" aria-label="Pickup or delivery" className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                role="radio"
                aria-checked={!homeDelivery}
                onClick={() => chooseDelivery(false)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-colors min-[400px]:flex-row min-[400px]:gap-2.5 sm:gap-3 sm:p-4",
                  !homeDelivery ? "border-brand-deep bg-navy-50" : "border-navy-100 hover:border-navy-200",
                )}
              >
                <Building2 className="mt-0.5 size-5 shrink-0 text-brand-deep" />
                <span>
                  <span className="block text-sm font-bold text-navy-900">Self pickup</span>
                  <span className="block text-xs text-navy-500">Collect from our location</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={homeDelivery}
                onClick={() => chooseDelivery(true)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3 text-left transition-colors min-[400px]:flex-row min-[400px]:gap-2.5 sm:gap-3 sm:p-4",
                  homeDelivery ? "border-brand-deep bg-navy-50" : "border-navy-100 hover:border-navy-200",
                )}
              >
                <Truck className="mt-0.5 size-5 shrink-0 text-brand-deep" />
                <span>
                  <span className="block text-sm font-bold text-navy-900">Home delivery</span>
                  <span className="block text-xs text-navy-500">+{formatINR(car.homeDelivery.price)} · to your doorstep</span>
                </span>
              </button>
            </div>
          )}

          {car.homeDelivery?.available && homeDelivery && (
            <div className="mt-4">
              <Label htmlFor="deliveryAddress">
                Delivery Address <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="deliveryAddress"
                rows={3}
                autoComplete="street-address"
                placeholder="House / flat no., street, area, landmark, city, pincode"
                className="mt-1.5"
                aria-invalid={Boolean(errors.deliveryAddress)}
                {...register("deliveryAddress")}
              />
              {errors.deliveryAddress ? (
                <p className="mt-1 text-xs text-red-600">{errors.deliveryAddress.message}</p>
              ) : (
                <p className="mt-1 text-xs text-navy-400">We'll deliver and collect the car at this address.</p>
              )}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="col-span-2">
              <Label>Pickup Location</Label>
              <Select value={values.pickupLocationId} onValueChange={(v) => setValue("pickupLocationId", v, { shouldValidate: true })}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {offeredLocations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pickupLocationId && <p className="mt-1 text-xs text-red-600">{errors.pickupLocationId.message}</p>}
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-navy-400">
                <Building2 className="size-3.5" /> Return location: same as pickup
              </p>
            </div>
            <div>
              <Label>Pickup Date</Label>
              <CalendarPopoverField
                value={pickupDateObj}
                onChange={handlePickupDateChange}
                fromDate={today}
                open={isOpen("pickupDate")}
                onOpenChange={setOpen("pickupDate")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-navy-200 px-3 text-sm font-semibold text-navy-900 sm:gap-2.5 sm:px-4">
                    <CalendarDays className="hidden size-4 shrink-0 text-navy-400 min-[360px]:block" />
                    <span className="truncate">{format(pickupDateObj, "EEE, d MMM")}</span>
                  </span>
                }
              />
            </div>
            <div>
              <Label>Pickup Time</Label>
              <TimePopoverField
                value={values.pickupTime}
                onChange={handlePickupTimeChange}
                open={isOpen("pickupTime")}
                onOpenChange={setOpen("pickupTime")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-navy-200 px-3 text-sm font-semibold text-navy-900 sm:gap-2.5 sm:px-4">
                    <Clock className="hidden size-4 shrink-0 text-navy-400 min-[360px]:block" />
                    <span className="truncate">{labelForTime(values.pickupTime)}</span>
                  </span>
                }
              />
            </div>
            <div>
              <Label>Return Date</Label>
              <CalendarPopoverField
                value={dropDateObj}
                onChange={handleDropDateChange}
                fromDate={addDays(pickupDateObj, 1)}
                open={isOpen("dropDate")}
                onOpenChange={setOpen("dropDate")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-navy-200 px-3 text-sm font-semibold text-navy-900 sm:gap-2.5 sm:px-4">
                    <CalendarDays className="hidden size-4 shrink-0 text-navy-400 min-[360px]:block" />
                    <span className="truncate">{format(dropDateObj, "EEE, d MMM")}</span>
                  </span>
                }
              />
              {errors.dropDate && <p className="mt-1 text-xs text-red-600">{errors.dropDate.message}</p>}
            </div>
            <div>
              <Label>Return Time</Label>
              <TimePopoverField
                value={values.dropTime}
                onChange={handleDropTimeChange}
                open={isOpen("dropTime")}
                onOpenChange={setOpen("dropTime")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full min-w-0 items-center gap-2 rounded-2xl border border-navy-200 px-3 text-sm font-semibold text-navy-900 sm:gap-2.5 sm:px-4">
                    <Clock className="hidden size-4 shrink-0 text-navy-400 min-[360px]:block" />
                    <span className="truncate">{labelForTime(values.dropTime)}</span>
                  </span>
                }
              />
            </div>
            <div className="col-span-2">
              <Label>Special Request (optional)</Label>
              <Textarea placeholder="Anything we should know?" className="mt-1.5" {...register("specialRequest")} />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
              <UserRound className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold text-navy-900">Customer Details</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1.5" placeholder="Your full name" {...register("customerName")} />
              {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName.message}</p>}
            </div>
            <div>
              <Label>Mobile Number</Label>
              <div className="mt-1.5 flex h-12 items-stretch overflow-hidden rounded-2xl border border-navy-200 focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-lime">
                <span className="flex items-center bg-navy-50 px-3 text-sm font-semibold text-navy-500">+91</span>
                <input
                  className="w-full border-0 bg-transparent px-3 text-sm font-medium text-navy-900 outline-none placeholder:text-navy-400"
                  placeholder="98765 43210"
                  inputMode="numeric"
                  maxLength={10}
                  {...register("mobile")}
                />
              </div>
              {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>}
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input className="mt-1.5" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Address (optional)</Label>
              <Input className="mt-1.5" placeholder="Your address" {...register("address")} />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
              <BadgeCheck className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-navy-900">Documents (KYC)</h2>
                {user && (
                  <span className="text-xs font-semibold text-navy-500">
                    {kycVerified ? "All verified" : `${kycUploaded} of ${BOOKING_KYC_SLOTS.length} uploaded`}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-navy-500">
                Upload both sides of your Aadhaar and Driving Licence. Documents must be verified before pickup.
              </p>
            </div>
          </div>
          <div className="mt-4">
            {user ? (
              <>
                <KycDocumentGrid slots={BOOKING_KYC_SLOTS} profile={kycProfile} onUploaded={reloadKyc} compact />
                <div className="mt-3">
                  <KycNumbersForm profile={kycProfile} onSaved={reloadKyc} compact />
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/60 p-4 text-sm text-navy-600">
                You can upload your Aadhaar and DL (front &amp; back) right after verifying your mobile number when you confirm —
                or later from <span className="font-semibold">My Account → Verification</span>.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
              <Banknote className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold text-navy-900">Payment Method</h2>
          </div>
          <div role="radiogroup" aria-label="Payment method" className="mt-5 grid gap-3 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map(({ value, title, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={paymentMethod === value}
                onClick={() => setPaymentMethod(value)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                  paymentMethod === value ? "border-brand-deep bg-navy-50" : "border-navy-100 hover:border-navy-200",
                )}
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-deep" />
                <span>
                  <span className="block text-sm font-bold text-navy-900">{title}</span>
                  <span className="block text-xs text-navy-500">{description}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24 overflow-hidden p-0 shadow-[0_30px_80px_-20px_rgba(8,19,26,0.25)] transition-transform duration-300 hover:-translate-y-0.5">
          <div className="bg-navy-950 bg-lanes p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">Booking Summary</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-extrabold text-white backdrop-blur">
                {car.brand.slice(0, 3).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-white">{car.name}</p>
                <p className="text-xs text-navy-300">
                  {car.pricePerHour ? `${formatINR(car.pricePerHour)}/hr` : `${formatINR(car.pricePerDay)}/day`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-navy-500">
                  <Clock3 className="size-4 text-navy-400" /> Duration
                </dt>
                <dd className="text-right font-semibold text-navy-900">
                  {formatDuration(estimate.hours)}
                  {estimate.hours < MIN_RENTAL_HOURS && (
                    <span className="block text-xs font-normal text-red-600">Minimum {MIN_RENTAL_HOURS} hours</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-navy-500">
                  <Gauge className="size-4 text-navy-400" /> Free km
                </dt>
                <dd className="text-right font-semibold text-navy-900">
                  {estimate.freeKm.toLocaleString("en-IN")} km
                  <span className="block text-xs font-normal text-navy-400">
                    {car.kmPerDay ?? DEFAULT_KM_PER_DAY} km per 24 hrs
                     · extra {formatINR(car.extraKmRate ?? DEFAULT_EXTRA_KM_RATE)}/km
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-navy-500">
                  Base fare
                  <span className="block text-xs text-navy-400">
                    {(car.weeklyPrice && estimate.hours >= 7 * 24) || (car.monthlyPrice && estimate.hours >= 30 * 24)
                      ? "Weekly / monthly rate applied"
                      : `${formatINR(effectiveDailyRate(car))}/day${car.pricePerHour ? ` · ${formatINR(car.pricePerHour)}/hr after the first day` : ""}`}
                  </span>
                </dt>
                <dd className="font-semibold text-navy-900">{formatINR(estimate.baseAmount)}</dd>
              </div>
              {homeDelivery && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-navy-500">
                    <Truck className="size-4 text-navy-400" /> Home delivery
                  </dt>
                  <dd className="font-semibold text-navy-900">{formatINR(estimate.delivery)}</dd>
                </div>
              )}
              {estimate.discount > 0 && (
                <div className="flex items-center justify-between text-brand-deep">
                  <dt className="flex items-center gap-2">
                    <Tag className="size-4" /> Coupon ({coupon?.code})
                  </dt>
                  <dd className="font-semibold">− {formatINR(estimate.discount)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 border-t border-dashed border-navy-100 pt-4">
              {coupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 py-2 pl-3 pr-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <Tag className="size-3.5" /> "{coupon.code}" applied · saved {formatINR(coupon.discountAmount)}
                  </p>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-emerald-700 hover:bg-emerald-100"
                    aria-label="Remove coupon"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 rounded-xl border border-navy-200 bg-navy-50/50 py-1 pl-3 pr-1 focus-within:border-navy-900">
                    <Tag className="size-4 shrink-0 text-navy-400" />
                    <input
                      placeholder="Have a coupon code?"
                      className="h-9 w-full border-0 bg-transparent text-sm font-semibold uppercase text-navy-900 outline-none placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:text-navy-400"
                      {...register("couponCode")}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponChecking || !values.couponCode?.trim()}
                      className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 text-xs font-bold text-white transition-opacity disabled:opacity-40"
                    >
                      {couponChecking ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 px-1 text-xs text-red-600">{couponError}</p>}
                </div>
              )}
            </div>

            <dl className="mt-4 space-y-2 border-t border-dashed border-navy-100 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-navy-500">Rental amount</dt>
                <dd className="font-semibold text-navy-900">{formatINR(estimate.rental)}</dd>
              </div>
              {estimate.deposit > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-navy-500">
                    Security deposit
                    <span className="block text-xs text-navy-400">Refundable after the car is returned</span>
                  </dt>
                  <dd className="font-semibold text-navy-900">+ {formatINR(estimate.deposit)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-navy-100 pt-3">
              <p className="font-display text-base font-bold text-navy-900">Total Payable</p>
              <p className="font-display text-2xl font-extrabold text-navy-900">{formatINR(estimate.amount)}</p>
            </div>
            <p className="mt-1 text-xs text-navy-400">
              {estimate.deposit > 0 ? "Includes the refundable security deposit. " : ""}Taxes and any coupon discount are applied when you confirm.
            </p>

            <div className="mt-5 rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
              <p className="font-display text-sm font-bold text-navy-900">Rental Terms</p>
              <ul className="mt-2 space-y-1.5 text-xs text-navy-600">
                {RENTAL_TERMS.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand-deep" /> {t}
                  </li>
                ))}
              </ul>
              <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-navy-100 pt-3 text-xs text-navy-700">
                <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[#1f7a36]" {...register("termsAccepted")} />
                <span>
                  I agree to the rental terms above, the{" "}
                  <Link href="/terms-and-conditions" target="_blank" className="font-semibold text-brand-deep underline underline-offset-2">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and the{" "}
                  <Link href="/cancellation-policy" target="_blank" className="font-semibold text-brand-deep underline underline-offset-2">
                    Cancellation Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.termsAccepted && <p className="mt-1.5 text-xs text-red-600">{errors.termsAccepted.message}</p>}
            </div>

            <Button type="submit" size="lg" className="mt-6 hidden w-full lg:inline-flex" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : paymentMethod === "COD" ? <ShieldCheck className="size-4" /> : <QrCode className="size-4" />}
              {paymentMethod === "COD" ? "Confirm Booking" : "Continue to UPI Payment"}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-navy-400">
              <ShieldCheck className="size-3.5" />
              {paymentMethod === "COD" ? "Pay in cash at pickup — no advance payment." : "You'll see our UPI QR on the next screen."}
            </p>
            <p className="mt-2 text-center text-xs text-navy-400">Not logged in? You'll verify your mobile with a quick OTP when you confirm.</p>

            {user && !kycVerified && (
              <p className="mt-4 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                <BadgeCheck className="size-4 shrink-0" />
                Documents must be uploaded and verified before pickup — add them in the Documents section.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Phones: the total and the confirm button stay one thumb-tap away.
          Hidden while typing so the on-screen keyboard never stacks on it. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-20px_rgba(14,29,38,0.4)] backdrop-blur-xl transition-transform duration-200 lg:hidden",
          inputFocused && "translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              {formatDuration(estimate.hours)} · Total
            </p>
            <p className="font-display text-xl font-extrabold text-navy-900">{formatINR(estimate.amount)}</p>
          </div>
          <Button type="submit" size="lg" className="ml-auto h-12 flex-1 px-4" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : paymentMethod === "COD" ? <ShieldCheck className="size-4" /> : <QrCode className="size-4" />}
            {submitting ? "Please wait…" : paymentMethod === "COD" ? "Confirm Booking" : "Pay via UPI"}
          </Button>
        </div>
      </div>
    </form>
  );
}
