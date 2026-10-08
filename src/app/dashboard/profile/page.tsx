"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import type { UserProfile } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobile, setMobile] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", address: "", city: "", state: "", pincode: "" },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<UserProfile>("/auth/me");
        setMobile(res.data.mobile);
        reset({
          name: res.data.name || "",
          email: res.data.email || "",
          address: res.data.address || "",
          city: res.data.city || "",
          state: res.data.state || "",
          pincode: res.data.pincode || "",
        });
      } catch (err) {
        toast({
          title: "Could not load profile",
          description: err instanceof ApiClientError ? err.message : "Please try again.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      await apiFetch<UserProfile>("/user/profile", {
        method: "PUT",
        body: JSON.stringify({ ...values, email: values.email || undefined }),
      });
      await fetchMe();
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not update profile",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const watchedName = watch("name");

  if (loading) {
    return <div className="h-64 max-w-2xl animate-pulse rounded-3xl bg-navy-100" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-lg font-extrabold text-white">
          {(watchedName || mobile || "RR").trim().slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">
            <span className="h-px w-6 bg-current" /> Account
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-navy-950">Profile</h1>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">Personal Details</h2>
        <p className="mt-1 text-sm text-navy-500">Keep your details up to date.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Mobile Number</Label>
              <Input className="mt-1.5" value={mobile ? `+91 ${mobile}` : ""} disabled readOnly />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1.5" placeholder="Your full name" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Pincode</Label>
              <Input className="mt-1.5" placeholder="110001" {...register("pincode")} />
              {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input className="mt-1.5" placeholder="House no, street, area" {...register("address")} />
            </div>
            <div>
              <Label>City</Label>
              <Input className="mt-1.5" placeholder="New Delhi" {...register("city")} />
            </div>
            <div>
              <Label>State</Label>
              <Input className="mt-1.5" placeholder="Delhi" {...register("state")} />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
