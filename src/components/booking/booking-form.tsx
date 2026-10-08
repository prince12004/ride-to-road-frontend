"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format, parse, startOfDay } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  Loader2,
  LogIn,
  ShieldCheck,
  Sparkles,
  Truck,
  Building2,
  Tag,
  Clock3,
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
import { Reveal } from "@/components/motion/reveal";
import { apiFetch, ApiClientError } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatINR } from "@/lib/utils";
import { labelForTime } from "@/lib/time-slots";
import type { CarDetail, Location, Booking, RazorpayOrderInfo } from "@/types";

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
});

type FormValues = z.infer<typeof schema>;

function todayStr(offsetDays = 0) {
  return format(addDays(new Date(), offsetDays), "yyyy-MM-dd");
}

interface InitiateResponse {
  booking: Booking;
  razorpayConfigured: boolean;
  razorpayOrder?: RazorpayOrderInfo;
}

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
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [verification, setVerification] = useState<{ status: string } | null>(null);
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState("");
  const defaultLocationId = initial?.locationId || (typeof car.location === "object" ? car.location.id : locations[0]?.id ?? "");
  const deliveryFee = car.homeDelivery?.available ? car.homeDelivery.price : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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

  useEffect(() => {
    if (!user) return;
    apiFetch<{ verification: { status: string } }>("/auth/me")
      .then((res) => setVerification(res.data.verification))
      .catch(() => {});
  }, [user]);

  type ScheduleField = "pickupDate" | "pickupTime" | "dropDate" | "dropTime";
  const [openField, setOpenField] = useState<ScheduleField | null>(null);
  const isOpen = (k: ScheduleField) => openField === k;
  const setOpen = (k: ScheduleField) => (open: boolean) =>
    setOpenField((current) => {
      if (open) return k;
      return current === k ? null : current;
    });

  const today = useMemo(() => startOfDay(new Date()), []);
  const pickupDateObj = useMemo(() => parse(values.pickupDate, "yyyy-MM-dd", today), [values.pickupDate, today]);
  const dropDateObj = useMemo(() => parse(values.dropDate, "yyyy-MM-dd", today), [values.dropDate, today]);

  const handlePickupDateChange = (d: Date) => {
    setValue("pickupDate", format(d, "yyyy-MM-dd"), { shouldValidate: true });
    // Default the return date to a 24-hour rental unless the user adjusts it next.
    setValue("dropDate", format(addDays(d, 1), "yyyy-MM-dd"), { shouldValidate: true });
    setOpenField("pickupTime");
  };
  const handlePickupTimeChange = (v: string) => {
    setValue("pickupTime", v, { shouldValidate: true });
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
      const baseAmount = car.pricePerHour ? Math.round(car.pricePerHour * hours) : days * car.pricePerDay;
      const delivery = homeDelivery ? deliveryFee : 0;
      const discount = coupon && values.couponCode?.trim().toUpperCase() === coupon.code ? coupon.discountAmount : 0;
      return { hours, days, baseAmount, delivery, discount, amount: Math.max(0, baseAmount + delivery - discount) };
    } catch {
      return { hours: 0, days: 0, baseAmount: 0, delivery: 0, discount: 0, amount: 0 };
    }
  }, [
    values.pickupDate,
    values.pickupTime,
    values.dropDate,
    values.dropTime,
    values.couponCode,
    car.pricePerDay,
    car.pricePerHour,
    homeDelivery,
    deliveryFee,
    coupon,
  ]);

  const onSubmit = async (formValues: FormValues) => {
    setSubmitting(true);
    try {
      const res = await apiFetch<InitiateResponse>("/bookings/initiate", {
        method: "POST",
        body: JSON.stringify({ ...formValues, carId: car._id, email: formValues.email || undefined, homeDelivery }),
      });

      const { booking, razorpayConfigured, razorpayOrder } = res.data;

      if (!razorpayConfigured || !razorpayOrder) {
        toast({
          title: "Booking saved",
          description: "Online payment isn't configured yet — our team will contact you to confirm.",
          variant: "success",
        });
        router.push(`/booking/${booking.bookingId}`);
        return;
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.orderId,
        name: "Ride to Road",
        description: `${car.name} · ${booking.bookingId}`,
        prefill: { name: formValues.customerName, contact: formValues.mobile, email: formValues.email },
        theme: { color: "#a6ce39" },
        handler: async (response) => {
          try {
            await apiFetch("/bookings/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                bookingId: booking.bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            toast({ title: "Payment successful", description: "Your booking is confirmed!", variant: "success" });
            router.push(`/booking/success/${booking.bookingId}`);
          } catch (err) {
            toast({
              title: "Payment could not be verified",
              description: err instanceof ApiClientError ? err.message : "Please contact support.",
              variant: "error",
            });
            router.push(`/booking/${booking.bookingId}`);
          }
        },
        modal: {
          ondismiss: async () => {
            await apiFetch("/bookings/payment-failed", {
              method: "POST",
              body: JSON.stringify({ bookingId: booking.bookingId, reason: "Customer closed the payment window." }),
            }).catch(() => {});
            toast({ title: "Payment cancelled", description: "You can retry anytime from your booking details.", variant: "default" });
            router.push(`/booking/${booking.bookingId}`);
          },
        },
      });

      rzp.open();
    } catch (err) {
      toast({
        title: "Booking failed",
        description: err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="h-96 animate-pulse rounded-3xl bg-navy-100" />
        <div className="h-72 animate-pulse rounded-3xl bg-navy-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg overflow-hidden p-0 text-center shadow-[0_30px_80px_-20px_rgba(8,19,26,0.2)]">
        <div className="bg-navy-950 bg-lanes p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime/15 text-lime">
            <LogIn className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-white">Login to continue booking</h2>
          <p className="mt-2 text-sm text-navy-300">
            Please verify your mobile number with an OTP before you book the {car.name}. It only takes a few seconds.
          </p>
        </div>
        <div className="p-6">
          <Button asChild size="lg" className="w-full">
            <Link href={loginRedirect}>
              <ShieldCheck className="size-4" /> Login with OTP
            </Link>
          </Button>
          <p className="mt-3 text-xs text-navy-400">You'll be brought right back here to finish your booking.</p>
        </div>
      </Card>
    );
  }

  const hasPrefill = Boolean(initial?.locationId || initial?.pickupDate || initial?.dropDate);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        {hasPrefill && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm font-semibold text-brand-deep">
            <Sparkles className="size-4 shrink-0" /> Pre-filled from your search — change anything below if needed.
          </div>
        )}

        <Reveal>
        <Card className="p-6 transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_rgba(14,29,38,0.25)]">
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
        </Reveal>

        <Reveal delay={0.08}>
        <Card className="p-6 transition-shadow duration-300 hover:shadow-[0_24px_48px_-28px_rgba(14,29,38,0.25)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-brand-deep">
              <CalendarClock className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold text-navy-900">Booking Details</h2>
          </div>

          {car.homeDelivery?.available && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setHomeDelivery(false)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                  !homeDelivery ? "border-brand-deep bg-navy-50" : "border-navy-100 hover:border-navy-200",
                )}
              >
                <Building2 className="mt-0.5 size-5 shrink-0 text-brand-deep" />
                <span>
                  <span className="block text-sm font-bold text-navy-900">Self pickup</span>
                  <span className="block text-xs text-navy-500">Collect the car from our location</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHomeDelivery(true)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                  homeDelivery ? "border-brand-deep bg-navy-50" : "border-navy-100 hover:border-navy-200",
                )}
              >
                <Truck className="mt-0.5 size-5 shrink-0 text-brand-deep" />
                <span>
                  <span className="block text-sm font-bold text-navy-900">Home delivery · +{formatINR(car.homeDelivery.price)}</span>
                  <span className="block text-xs text-navy-500">We drop the car at your doorstep</span>
                </span>
              </button>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Pickup Location</Label>
              <Select value={values.pickupLocationId} onValueChange={(v) => setValue("pickupLocationId", v, { shouldValidate: true })}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
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
                  <span className="mt-1.5 flex h-12 w-full items-center gap-2.5 rounded-2xl border border-navy-200 px-4 text-sm font-semibold text-navy-900">
                    <CalendarDays className="size-4 text-navy-400" /> {format(pickupDateObj, "EEE, d MMM yyyy")}
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
                  <span className="mt-1.5 flex h-12 w-full items-center gap-2.5 rounded-2xl border border-navy-200 px-4 text-sm font-semibold text-navy-900">
                    <Clock className="size-4 text-navy-400" /> {labelForTime(values.pickupTime)}
                  </span>
                }
              />
            </div>
            <div>
              <Label>Return Date</Label>
              <CalendarPopoverField
                value={dropDateObj}
                onChange={handleDropDateChange}
                fromDate={pickupDateObj}
                open={isOpen("dropDate")}
                onOpenChange={setOpen("dropDate")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full items-center gap-2.5 rounded-2xl border border-navy-200 px-4 text-sm font-semibold text-navy-900">
                    <CalendarDays className="size-4 text-navy-400" /> {format(dropDateObj, "EEE, d MMM yyyy")}
                  </span>
                }
              />
            </div>
            <div>
              <Label>Return Time</Label>
              <TimePopoverField
                value={values.dropTime}
                onChange={handleDropTimeChange}
                open={isOpen("dropTime")}
                onOpenChange={setOpen("dropTime")}
                trigger={
                  <span className="mt-1.5 flex h-12 w-full items-center gap-2.5 rounded-2xl border border-navy-200 px-4 text-sm font-semibold text-navy-900">
                    <Clock className="size-4 text-navy-400" /> {labelForTime(values.dropTime)}
                  </span>
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Special Request (optional)</Label>
              <Textarea placeholder="Anything we should know?" className="mt-1.5" {...register("specialRequest")} />
            </div>
          </div>
        </Card>
        </Reveal>
      </div>

      <Reveal delay={0.16}>
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
                <dd className="font-semibold text-navy-900">
                  {estimate.days} day{estimate.days !== 1 ? "s" : ""} ({estimate.hours} hrs)
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-navy-500">
                  Base fare
                  {car.pricePerHour && (
                    <span className="block text-xs text-navy-400">
                      {formatINR(car.pricePerHour)} × {estimate.hours} hrs
                    </span>
                  )}
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
              {car.securityDeposit ? (
                <div className="flex items-center justify-between">
                  <dt className="text-navy-500">Security deposit (refundable)</dt>
                  <dd className="font-semibold text-navy-900">{formatINR(car.securityDeposit)}</dd>
                </div>
              ) : null}
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

            <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-navy-100 pt-4">
              <p className="font-display text-base font-bold text-navy-900">Estimated Total</p>
              <p className="font-display text-2xl font-extrabold text-navy-900">{formatINR(estimate.amount)}</p>
            </div>
            <p className="mt-1 text-xs text-navy-400">
              Taxes, refundable deposit and any coupon discount are settled at checkout. Final amount is shown before payment.
            </p>

            {verification && verification.status !== "VERIFIED" && (
              <Link
                href="/dashboard/verification"
                className="mt-5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900 transition-colors hover:border-amber-300"
              >
                <BadgeCheck className="size-4 shrink-0" />
                KYC not completed yet — you can still book, but verify when you get a chance.
                <ArrowRight className="ml-auto size-3.5 shrink-0" />
              </Link>
            )}

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Proceed to Payment
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-navy-400">
              <ShieldCheck className="size-3.5" /> Secured by Razorpay
            </p>
          </div>
        </Card>
      </div>
      </Reveal>
    </form>
  );
}
