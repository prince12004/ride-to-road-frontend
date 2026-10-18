"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader, GalleryUploader } from "@/components/admin/image-uploader";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminCarDoc, AdminLocationDoc, CarSpecification, ImageRef } from "@/types";

export interface CarFormValues {
  name: string;
  brand: string;
  model: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  tag: string;
  pricePerDay: number;
  pricePerHour: string;
  weeklyPrice: string;
  monthlyPrice: string;
  securityDeposit: string;
  extraKmRate: string;
  registrationNumber: string;
  homeDeliveryAvailable: boolean;
  homeDeliveryPrice: string;
  description: string;
  features: string[];
  specifications: CarSpecification[];
  location: string;
  allCities: boolean;
  cities: string[];
  mainImage: ImageRef | null;
  gallery: ImageRef[];
  status: string;
  isFeatured: boolean;
  seoTitle: string;
  metaDescription: string;
  ogImage: ImageRef | null;
}

const emptyValues: CarFormValues = {
  name: "",
  brand: "",
  model: "",
  category: "hatchback",
  transmission: "Manual",
  fuel: "Petrol",
  seats: 5,
  tag: "",
  pricePerDay: 0,
  pricePerHour: "",
  weeklyPrice: "",
  monthlyPrice: "",
  securityDeposit: "",
  extraKmRate: "",
  registrationNumber: "",
  homeDeliveryAvailable: false,
  homeDeliveryPrice: "",
  description: "",
  features: [],
  specifications: [],
  location: "",
  allCities: false,
  cities: [],
  mainImage: null,
  gallery: [],
  status: "AVAILABLE",
  isFeatured: false,
  seoTitle: "",
  metaDescription: "",
  ogImage: null,
};

export function carDocToFormValues(car: AdminCarDoc): CarFormValues {
  return {
    name: car.name,
    brand: car.brand,
    model: car.model,
    category: car.category,
    transmission: car.transmission,
    fuel: car.fuel,
    seats: car.seats,
    tag: car.tag ?? "",
    pricePerDay: car.pricePerDay,
    pricePerHour: car.pricePerHour != null ? String(car.pricePerHour) : "",
    weeklyPrice: car.weeklyPrice != null ? String(car.weeklyPrice) : "",
    monthlyPrice: car.monthlyPrice != null ? String(car.monthlyPrice) : "",
    securityDeposit: car.securityDeposit != null ? String(car.securityDeposit) : "",
    extraKmRate: car.extraKmRate ? String(car.extraKmRate) : "",
    registrationNumber: car.registrationNumber ?? "",
    homeDeliveryAvailable: car.homeDelivery?.available ?? false,
    homeDeliveryPrice: car.homeDelivery?.price != null ? String(car.homeDelivery.price) : "",
    description: car.description ?? "",
    features: car.features ?? [],
    specifications: car.specifications ?? [],
    location: typeof car.location === "object" ? car.location._id : car.location,
    allCities: Boolean(car.allCities),
    cities: (car.cities ?? []).map((c) => (typeof c === "object" ? c._id : c)),
    mainImage: car.mainImage ?? null,
    gallery: car.gallery ?? [],
    status: car.status,
    isFeatured: car.isFeatured,
    seoTitle: car.seo?.seoTitle ?? "",
    metaDescription: car.seo?.metaDescription ?? "",
    ogImage: car.seo?.ogImage ?? null,
  };
}

/** Daily price derived from the hourly price, or null when no hourly price is set. */
function autoDailyPrice(v: Pick<CarFormValues, "pricePerHour">): number | null {
  const hourly = Number(v.pricePerHour);
  return hourly > 0 ? Math.round(hourly * 24) : null;
}

function buildPayload(v: CarFormValues) {
  return {
    name: v.name,
    brand: v.brand,
    model: v.model,
    category: v.category,
    transmission: v.transmission,
    fuel: v.fuel,
    seats: Number(v.seats),
    tag: v.tag || undefined,
    // With an hourly price the daily price is always hourly × 24 (the API
    // enforces this too). Cleared optional prices are sent as null so the
    // API removes them instead of keeping the old value.
    pricePerDay: autoDailyPrice(v) ?? Number(v.pricePerDay),
    pricePerHour: v.pricePerHour ? Number(v.pricePerHour) : null,
    weeklyPrice: v.weeklyPrice ? Number(v.weeklyPrice) : null,
    monthlyPrice: v.monthlyPrice ? Number(v.monthlyPrice) : null,
    securityDeposit: v.securityDeposit ? Number(v.securityDeposit) : undefined,
    extraKmRate: v.extraKmRate ? Math.max(0, Number(v.extraKmRate)) : 0,
    registrationNumber: v.registrationNumber.trim().toUpperCase(),
    homeDelivery: {
      available: v.homeDeliveryAvailable,
      price: v.homeDeliveryPrice ? Number(v.homeDeliveryPrice) : 0,
    },
    description: v.description || undefined,
    features: v.features,
    specifications: v.specifications,
    location: v.location,
    allCities: v.allCities,
    cities: v.allCities ? [] : v.cities.filter((c) => c !== v.location),
    mainImage: v.mainImage,
    gallery: v.gallery,
    status: v.status,
    isFeatured: v.isFeatured,
    seo: {
      seoTitle: v.seoTitle || undefined,
      metaDescription: v.metaDescription || undefined,
      ogImage: v.ogImage ?? undefined,
    },
  };
}

export function CarForm({ initial, carId }: { initial?: AdminCarDoc; carId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<CarFormValues>(initial ? carDocToFormValues(initial) : emptyValues);
  const [locations, setLocations] = useState<AdminLocationDoc[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<AdminLocationDoc[]>("/admin/locations").then((res) => setLocations(res.data)).catch(() => {});
  }, []);

  const set = <K extends keyof CarFormValues>(key: K, val: CarFormValues[K]) => setValues((s) => ({ ...s, [key]: val }));

  const addFeature = () => {
    if (!featureInput.trim()) return;
    set("features", [...values.features, featureInput.trim()]);
    setFeatureInput("");
  };

  const removeFeature = (i: number) => set("features", values.features.filter((_, idx) => idx !== i));

  const addSpec = () => set("specifications", [...values.specifications, { label: "", value: "" }]);
  const updateSpec = (i: number, key: "label" | "value", v: string) =>
    set("specifications", values.specifications.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));
  const removeSpec = (i: number) => set("specifications", values.specifications.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.brand || !values.model) {
      toast({ title: "Missing fields", description: "Name, brand and model are required.", variant: "error" });
      return;
    }
    if (!values.location) {
      toast({ title: "Location required", description: "Select a pickup location for this car.", variant: "error" });
      return;
    }
    if (!autoDailyPrice(values) && !(Number(values.pricePerDay) > 0)) {
      toast({ title: "Price required", description: "Enter the hourly price (the daily price is calculated from it).", variant: "error" });
      return;
    }
    if (values.extraKmRate && (!Number.isFinite(Number(values.extraKmRate)) || Number(values.extraKmRate) < 0)) {
      toast({ title: "Invalid extra km charge", description: "Enter 0 or a positive amount per km.", variant: "error" });
      return;
    }
    if (!values.mainImage) {
      toast({ title: "Main image required", description: "Upload a main image for this car.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(values);
      if (carId) {
        await apiFetch(`/admin/cars/${carId}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "Car updated", variant: "success" });
      } else {
        await apiFetch("/admin/cars", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Car created", variant: "success" });
      }
      router.push("/admin/cars");
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Basic Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5" value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Creta" />
          </div>
          <div>
            <Label>Brand</Label>
            <Input className="mt-1.5" value={values.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Hyundai" />
          </div>
          <div>
            <Label>Model</Label>
            <Input className="mt-1.5" value={values.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. SX 2023" />
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input
              className="mt-1.5 uppercase"
              value={values.registrationNumber}
              onChange={(e) => set("registrationNumber", e.target.value)}
              placeholder="e.g. DL01AB1234"
              maxLength={15}
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={values.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["hatchback", "sedan", "suv", "luxury"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Transmission</Label>
            <Select value={values.transmission} onValueChange={(v) => set("transmission", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Manual", "Automatic"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fuel</Label>
            <Select value={values.fuel} onValueChange={(v) => set("fuel", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Petrol", "Diesel", "CNG", "Electric"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seats</Label>
            <Input
              className="mt-1.5"
              type="number"
              value={values.seats}
              onChange={(e) => set("seats", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Tag (optional)</Label>
            <Input className="mt-1.5" value={values.tag} onChange={(e) => set("tag", e.target.value)} placeholder="e.g. Popular" />
          </div>
          <div>
            <Label>Pickup Location</Label>
            <Select value={values.location} onValueChange={(v) => set("location", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l._id} value={l._id}>
                    {l.city} · {l.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {locations.length === 0 && <p className="mt-1 text-xs text-amber-600">No locations yet — add one under Locations first.</p>}
          </div>
        </div>

        <div className="mt-6 border-t border-navy-100 pt-5">
          <Label>Available In</Label>
          <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
            {[
              { value: false, label: "Specific cities" },
              { value: true, label: "All cities" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={values.allCities === opt.value}
                onClick={() => set("allCities", opt.value)}
                className={
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors " +
                  (values.allCities === opt.value ? "border-navy-900 bg-navy-900 text-white" : "border-navy-200 text-navy-700 hover:border-navy-900")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          {values.allCities ? (
            <p className="mt-2 text-xs text-navy-500">Customers searching any city will see this car.</p>
          ) : (
            <>
              <p className="mt-2 text-xs text-navy-500">The pickup location is always included. Tick any other cities where customers can book this car.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {locations.map((l) => {
                  const isBase = l._id === values.location;
                  const checked = isBase || values.cities.includes(l._id);
                  return (
                    <label
                      key={l._id}
                      className={
                        "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm " +
                        (checked ? "border-brand-deep bg-lime/10 text-navy-900" : "border-navy-200 text-navy-600") +
                        (isBase ? " cursor-default opacity-90" : "")
                      }
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-[#1f7a36]"
                        checked={checked}
                        disabled={isBase}
                        onChange={(e) =>
                          set("cities", e.target.checked ? [...values.cities, l._id] : values.cities.filter((c) => c !== l._id))
                        }
                      />
                      {l.city}
                      {isBase && <span className="text-xs text-navy-400">(pickup)</span>}
                      {!l.isActive && <span className="text-xs text-amber-600">(inactive)</span>}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Pricing</h2>
        <p className="mt-1 text-sm text-navy-500">
          Enter the hourly price — the daily price is calculated automatically (hourly × 24). Bookings are at least 24 hours.
          Weekly and monthly prices are optional; when set they apply to 7+ and 30+ day bookings.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div>
            <Label>Price / Hour (₹)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              step="0.01"
              value={values.pricePerHour}
              onChange={(e) => set("pricePerHour", e.target.value)}
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <Label>Price / Day (₹)</Label>
            {autoDailyPrice(values) ? (
              <>
                <Input className="mt-1.5 bg-navy-50 font-semibold" type="number" value={autoDailyPrice(values)!} readOnly aria-readonly />
                <p className="mt-1 text-xs text-navy-400">
                  Auto: ₹{values.pricePerHour} × 24
                </p>
              </>
            ) : (
              <>
                <Input className="mt-1.5" type="number" min={0} value={values.pricePerDay} onChange={(e) => set("pricePerDay", Number(e.target.value))} />
                <p className="mt-1 text-xs text-navy-400">Calculated automatically once an hourly price is entered.</p>
              </>
            )}
          </div>
          <div>
            <Label>Weekly Price (₹) · optional</Label>
            <Input className="mt-1.5" type="number" min={0} value={values.weeklyPrice} onChange={(e) => set("weeklyPrice", e.target.value)} placeholder="Leave blank" />
          </div>
          <div>
            <Label>Monthly Price (₹) · optional</Label>
            <Input className="mt-1.5" type="number" min={0} value={values.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} placeholder="Leave blank" />
          </div>
          <div>
            <Label>Security Deposit (₹)</Label>
            <Input className="mt-1.5" type="number" value={values.securityDeposit} onChange={(e) => set("securityDeposit", e.target.value)} />
          </div>
          <div>
            <Label>Extra KM Charge (₹/km)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              step="0.5"
              value={values.extraKmRate}
              onChange={(e) => set("extraKmRate", e.target.value)}
              placeholder="e.g. 10"
            />
            <p className="mt-1 text-xs text-navy-400">Charged per km beyond the free km allowance.</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Home Delivery</h2>
        <p className="mt-1 text-sm text-navy-500">Let customers get this car delivered to their doorstep for an extra fee.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={values.homeDeliveryAvailable}
              onCheckedChange={(v) => set("homeDeliveryAvailable", Boolean(v))}
              id="homeDelivery"
            />
            <label htmlFor="homeDelivery" className="text-sm font-semibold text-navy-700">
              Available for home delivery
            </label>
          </div>
          {values.homeDeliveryAvailable && (
            <div className="w-40">
              <Label>Delivery Fee (₹)</Label>
              <Input
                className="mt-1.5"
                type="number"
                value={values.homeDeliveryPrice}
                onChange={(e) => set("homeDeliveryPrice", e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Description</h2>
        <Textarea className="mt-3" rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Features</h2>
        <div className="mt-3 flex gap-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
            placeholder="e.g. Air Conditioning"
          />
          <Button type="button" variant="outline" onClick={addFeature}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {values.features.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700">
              {f}
              <button type="button" onClick={() => removeFeature(i)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">Specifications</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="size-4" /> Add Row
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {values.specifications.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} />
              <Input placeholder="Value" value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} />
              <Button type="button" variant="outline" size="sm" onClick={() => removeSpec(i)}>
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Images</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ImageUploader label="Main Image" required value={values.mainImage} onChange={(img) => set("mainImage", img)} folder="cars" />
          <GalleryUploader label="Gallery" value={values.gallery} onChange={(imgs) => set("gallery", imgs)} folder="cars" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Status</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["AVAILABLE", "BOOKED", "MAINTENANCE", "INACTIVE"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox checked={values.isFeatured} onCheckedChange={(v) => set("isFeatured", Boolean(v))} id="featured" />
            <label htmlFor="featured" className="text-sm font-semibold text-navy-700">
              Featured on homepage
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">SEO</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <Label>SEO Title</Label>
            <Input className="mt-1.5" value={values.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea className="mt-1.5" value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
          </div>
          <ImageUploader label="OG Image" value={values.ogImage} onChange={(img) => set("ogImage", img)} folder="cars" />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/cars")}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {carId ? "Save Changes" : "Create Car"}
        </Button>
      </div>
    </form>
  );
}
