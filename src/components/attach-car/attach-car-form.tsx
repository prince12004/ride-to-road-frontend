"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";

const currentYear = new Date().getFullYear();

// Mirrors the backend validation in routes/carLead.routes.ts.
const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  carMakeModel: z.string().trim().min(2, "Enter the car make and model").max(80),
  registrationNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, "").toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$|^\d{2}BH\d{4}[A-Z]{1,2}$/, "Enter a valid registration number, e.g. UP16AB1234")),
  manufacturingYear: z.coerce
    .number({ invalid_type_error: "Enter the manufacturing year" })
    .int("Enter a valid year")
    .min(1990, "Enter a valid manufacturing year")
    .max(currentYear, "Enter a valid manufacturing year"),
  city: z.string().trim().min(2, "Enter your city").max(60),
  details: z.string().trim().max(1000, "Keep it under 1000 characters").optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

/** Loaded on demand by AttachCarDialog — keeps zod/react-hook-form off the homepage bundle. */
export function AttachCarForm({ onSuccess }: { onSuccess: (whatsappUrl: string) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ id: string; whatsappUrl: string }>("/car-leads", {
        method: "POST",
        body: JSON.stringify({ ...values, details: values.details || undefined }),
      });
      onSuccess(res.data.whatsappUrl);
    } catch (err) {
      toast({
        title: "Could not submit your details",
        description: err instanceof ApiClientError ? err.message : "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label htmlFor="lead-name">Full Name</Label>
        <Input id="lead-name" className="mt-1.5" autoComplete="name" placeholder="Your full name" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="lead-mobile">Mobile Number</Label>
        <div className="mt-1.5 flex h-12 items-stretch overflow-hidden rounded-2xl border border-navy-200 focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-lime">
          <span className="flex items-center bg-navy-50 px-3 text-sm font-semibold text-navy-500">+91</span>
          <input
            id="lead-mobile"
            className="w-full border-0 bg-transparent px-3 text-sm font-medium text-navy-900 outline-none placeholder:text-navy-400"
            placeholder="98765 43210"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            {...register("mobile")}
          />
        </div>
        <FieldError message={errors.mobile?.message} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="lead-car">Car Make & Model</Label>
        <Input id="lead-car" className="mt-1.5" placeholder="e.g. Hyundai Creta SX" {...register("carMakeModel")} />
        <FieldError message={errors.carMakeModel?.message} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="lead-reg">Registration Number</Label>
        <Input id="lead-reg" className="mt-1.5 uppercase" placeholder="UP16AB1234" {...register("registrationNumber")} />
        <FieldError message={errors.registrationNumber?.message} />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="lead-year">Manufacturing Year</Label>
        <Input
          id="lead-year"
          className="mt-1.5"
          inputMode="numeric"
          maxLength={4}
          placeholder={String(currentYear - 2)}
          {...register("manufacturingYear")}
        />
        <FieldError message={errors.manufacturingYear?.message} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="lead-city">City / Location</Label>
        <Input id="lead-city" className="mt-1.5" placeholder="e.g. Noida Sector 62" {...register("city")} />
        <FieldError message={errors.city?.message} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="lead-details">Additional Details (optional)</Label>
        <Textarea id="lead-details" className="mt-1.5" rows={3} placeholder="Fuel type, kms driven, availability…" {...register("details")} />
        <FieldError message={errors.details?.message} />
      </div>
      <Button type="submit" size="lg" className="col-span-2 mt-2" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Submit Details
      </Button>
    </form>
  );
}
