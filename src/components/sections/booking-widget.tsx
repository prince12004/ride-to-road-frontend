"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isBefore, parse, startOfDay } from "date-fns";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPopoverField, TimePopoverField } from "@/components/booking/date-time-popover";
import { labelForTime } from "@/lib/time-slots";
import { MIN_RENTAL_HOURS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type FieldKey = "city" | "pickupDate" | "pickupTime" | "returnDate" | "returnTime";

export interface BookingWidgetInitial {
  city?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
}

function Field({ icon, label, children, className }: { icon: ReactNode; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-5", className)}>
      {/* Below 360px every pixel goes to the value text; the icon is decorative. */}
      <span className="hidden size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-brand-deep min-[360px]:grid sm:size-9 [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 sm:text-[11px]">{label}</p>
        {children}
      </div>
    </div>
  );
}

const triggerText = "block w-full truncate text-left text-sm font-semibold text-navy-900";

function parseDateStr(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function BookingWidget({ cities, initial }: { cities: string[]; initial?: BookingWidgetInitial }) {
  const router = useRouter();
  const today = useMemo(() => startOfDay(new Date()), []);
  const defaultCity = useMemo(
    () => initial?.city || cities.find((c) => c.toLowerCase() === "noida") || "",
    [cities, initial?.city],
  );

  const [city, setCity] = useState<string>(defaultCity);
  const [pickupDate, setPickupDate] = useState<Date>(() => parseDateStr(initial?.pickupDate, addDays(today, 1)));
  const [pickupTime, setPickupTime] = useState(initial?.pickupTime || "10:00");
  const [returnDate, setReturnDate] = useState<Date>(() => parseDateStr(initial?.returnDate, addDays(today, 2)));
  const [returnTime, setReturnTime] = useState(initial?.returnTime || "10:00");
  const [error, setError] = useState("");
  const [openField, setOpenField] = useState<FieldKey | null>(null);

  const isOpen = (key: FieldKey) => openField === key;
  // Radix Select fires onOpenChange(false) itself right after onValueChange
  // when an item is picked. If we've already advanced openField to the next
  // field in that same tick, a naive "always clear on close" would stomp on
  // it — so only clear when this field is still the one marked open.
  const setOpen = (key: FieldKey) => (open: boolean) =>
    setOpenField((current) => {
      if (open) return key;
      return current === key ? null : current;
    });

  const handlePickupDate = (d: Date) => {
    setPickupDate(d);
    // Default to a 24-hour rental unless the user changes the return date next.
    setReturnDate(addDays(d, 1));
    setOpenField("pickupTime");
  };

  const handlePickupTime = (v: string) => {
    setPickupTime(v);
    // Keep at least 24 hours between pickup and return.
    const pickup = new Date(`${format(pickupDate, "yyyy-MM-dd")}T${v}`);
    const drop = new Date(`${format(returnDate, "yyyy-MM-dd")}T${returnTime}`);
    if (drop.getTime() - pickup.getTime() < MIN_RENTAL_HOURS * 60 * 60 * 1000) {
      setReturnDate(addDays(pickupDate, 1));
      setReturnTime(v);
    }
    setOpenField("returnDate");
  };

  const handleReturnDate = (d: Date) => {
    setReturnDate(d);
    setOpenField("returnTime");
  };

  const handleReturnTime = (v: string) => {
    setReturnTime(v);
    setOpenField(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return setError("Please choose a pickup city.");
    const pickup = new Date(`${format(pickupDate, "yyyy-MM-dd")}T${pickupTime}`);
    const drop = new Date(`${format(returnDate, "yyyy-MM-dd")}T${returnTime}`);
    if (!isBefore(pickup, drop)) return setError("Return time must be after pickup.");
    if (drop.getTime() - pickup.getTime() < MIN_RENTAL_HOURS * 60 * 60 * 1000) {
      return setError(`Minimum booking is ${MIN_RENTAL_HOURS} hours — choose a later return.`);
    }
    setError("");

    const params = new URLSearchParams({
      city,
      pickupDate: format(pickupDate, "yyyy-MM-dd"),
      pickupTime,
      returnDate: format(returnDate, "yyyy-MM-dd"),
      returnTime,
    });
    router.push(`/cars?${params.toString()}`);
  };

  // Two equal columns from the smallest phone up (date | time on one row),
  // collapsing into a single bar on desktop.
  const cell = "border-navy-100";

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Check car availability"
      className="rounded-3xl bg-white p-2 shadow-[0_30px_80px_-20px_rgba(8,19,26,0.45)] ring-1 ring-navy-900/5"
    >
      <div className="grid grid-cols-2 lg:grid-cols-[1.1fr_1fr_0.85fr_1fr_0.85fr_auto] lg:items-center">
        <Field icon={<MapPin />} label="Pickup city" className={cn(cell, "col-span-2 border-b lg:col-span-1 lg:border-b-0")}>
          <Select
            value={city}
            open={isOpen("city")}
            onOpenChange={setOpen("city")}
            onValueChange={(v) => {
              setCity(v);
              setError("");
              setOpenField("pickupDate");
            }}
          >
            <SelectTrigger aria-label="Pickup city">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field icon={<CalendarDays />} label="Pickup date" className={cn(cell, "border-b lg:border-b-0 lg:border-l")}>
          <CalendarPopoverField
            value={pickupDate}
            onChange={handlePickupDate}
            fromDate={today}
            open={isOpen("pickupDate")}
            onOpenChange={setOpen("pickupDate")}
            trigger={<span className={triggerText}>{format(pickupDate, "EEE, d MMM")}</span>}
          />
        </Field>
        <Field icon={<Clock />} label="Pickup time" className={cn(cell, "border-b border-l lg:border-b-0")}>
          <TimePopoverField
            value={pickupTime}
            onChange={handlePickupTime}
            open={isOpen("pickupTime")}
            onOpenChange={setOpen("pickupTime")}
            trigger={<span className={triggerText}>{labelForTime(pickupTime)}</span>}
          />
        </Field>

        <Field icon={<CalendarDays />} label="Return date" className={cn(cell, "lg:border-l")}>
          <CalendarPopoverField
            value={returnDate}
            onChange={handleReturnDate}
            fromDate={addDays(pickupDate, 1)}
            open={isOpen("returnDate")}
            onOpenChange={setOpen("returnDate")}
            trigger={<span className={triggerText}>{format(returnDate, "EEE, d MMM")}</span>}
          />
        </Field>
        <Field icon={<Clock />} label="Return time" className={cn(cell, "border-l")}>
          <TimePopoverField
            value={returnTime}
            onChange={handleReturnTime}
            open={isOpen("returnTime")}
            onOpenChange={setOpen("returnTime")}
            trigger={<span className={triggerText}>{labelForTime(returnTime)}</span>}
          />
        </Field>

        <div className="col-span-2 p-2 lg:col-span-1">
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lime px-7 font-display font-bold text-navy-900 transition-colors hover:bg-lime-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900"
          >
            Find a car <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      <p role="alert" aria-live="polite" className={cn("px-5 text-sm font-medium text-red-600", error ? "pb-3" : "sr-only")}>
        {error}
      </p>
    </form>
  );
}
