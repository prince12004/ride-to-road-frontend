"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAdminAuthStore, type AdminUserSummary } from "@/store/admin-auth-store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

interface LoginResponse {
  admin: AdminUserSummary;
  accessToken: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await apiFetch<LoginResponse>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSession(res.data.admin, res.data.accessToken);
      toast({ title: "Welcome back", description: `Logged in as ${res.data.admin.name}`, variant: "success" });
      router.push("/admin");
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof ApiClientError ? err.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 bg-lanes px-4">
      <div className="pointer-events-none absolute -left-32 top-0 size-[420px] rounded-full bg-lime/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[420px] rounded-full bg-lime/10 blur-[140px]" />
      <Card className="relative w-full max-w-md border-white/10 bg-white p-8 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-full bg-lime text-base font-extrabold text-navy-900">R</div>
          <div>
            <p className="font-display text-lg font-bold text-navy-950">Ride to Road</p>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-navy-400">Admin Panel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" placeholder="admin@ridetoroad.com" autoComplete="username" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-navy-400 hover:text-navy-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Sign In
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-navy-400">Access restricted to authorised Ride to Road staff.</p>
      </Card>
    </div>
  );
}
