"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";

const mobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
});
type MobileValues = z.infer<typeof mobileSchema>;

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
  name: z.string().optional(),
});
type OtpValues = z.infer<typeof otpSchema>;

interface RequestOtpResponse {
  isNewUser: boolean;
  devOtp?: string;
}

interface VerifyOtpResponse {
  user: { id: string; name: string; mobile: string; email?: string };
  accessToken: string;
}

const RESEND_COOLDOWN_SECONDS = 30;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const setSession = useAuthStore((s) => s.setSession);

  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const mobileForm = useForm<MobileValues>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "", name: "" },
  });

  const requestOtp = async (mobileNumber: string) => {
    const res = await apiFetch<RequestOtpResponse>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ mobile: mobileNumber }),
    });
    setIsNewUser(res.data.isNewUser);
    setDevOtp(res.data.devOtp ?? null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return res.data;
  };

  const onSubmitMobile = async (values: MobileValues) => {
    setSubmitting(true);
    try {
      await requestOtp(values.mobile);
      setMobile(values.mobile);
      otpForm.reset({ otp: "", name: "" });
      setStep("otp");
    } catch (err) {
      toast({
        title: "Could not send OTP",
        description: err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || submitting) return;
    setSubmitting(true);
    try {
      await requestOtp(mobile);
      toast({ title: "OTP resent", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not resend OTP",
        description: err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (values: OtpValues) => {
    if (isNewUser && !values.name?.trim()) {
      otpForm.setError("name", { message: "Please enter your name" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          mobile,
          otp: values.otp,
          ...(isNewUser ? { name: values.name } : {}),
        }),
      });
      setSession(res.data.user, res.data.accessToken);
      toast({
        title: `Welcome${res.data.user.name ? `, ${res.data.user.name}` : ""}!`,
        variant: "success",
      });
      router.push(redirectTo);
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <Card className="w-full max-w-sm p-6 shadow-[0_30px_80px_-20px_rgba(8,19,26,0.15)] sm:p-8">
        {step === "mobile" ? (
          <>
            <h1 className="font-display text-xl font-bold text-navy-900">Login / Sign up</h1>
            <p className="mt-1 text-sm text-navy-500">Enter your mobile number to continue with an OTP.</p>
            <form onSubmit={mobileForm.handleSubmit(onSubmitMobile)} className="mt-6 space-y-4">
              <div>
                <Label>Mobile Number</Label>
                <div className="mt-1.5 flex h-12 items-stretch overflow-hidden rounded-2xl border border-navy-200 focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-lime">
                  <span className="flex items-center bg-navy-50 px-3 text-sm font-semibold text-navy-500">+91</span>
                  <input
                    className="w-full border-0 bg-transparent px-3 text-sm font-medium text-navy-900 outline-none placeholder:text-navy-400"
                    placeholder="98765 43210"
                    inputMode="numeric"
                    maxLength={10}
                    autoFocus
                    {...mobileForm.register("mobile")}
                  />
                </div>
                {mobileForm.formState.errors.mobile && (
                  <p className="mt-1 text-xs text-red-600">{mobileForm.formState.errors.mobile.message}</p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Send OTP
              </Button>
            </form>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-navy-900"
            >
              <ArrowLeft className="size-3.5" /> Change number
            </button>
            <h1 className="font-display text-xl font-bold text-navy-900">Verify OTP</h1>
            <p className="mt-1 text-sm text-navy-500">
              Sent to <span className="font-semibold text-navy-900">+91 {mobile}</span>
            </p>

            {devOtp && (
              <div className="mt-4 rounded-2xl border border-dashed border-lime-500 bg-lime/10 p-3 text-xs text-brand-deep">
                <p className="font-semibold">
                  Development mode — since no SMS provider is configured yet, here&apos;s your OTP:
                </p>
                <p className="mt-1 font-display text-lg font-extrabold tracking-widest text-navy-900">{devOtp}</p>
              </div>
            )}

            <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="mt-6 space-y-4">
              <div>
                <Label>OTP</Label>
                <div className="mt-1.5">
                  <OtpInput
                    value={otpForm.watch("otp") || ""}
                    onChange={(v) => otpForm.setValue("otp", v, { shouldValidate: true })}
                    autoFocus
                    hasError={Boolean(otpForm.formState.errors.otp)}
                  />
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              {isNewUser && (
                <div>
                  <Label>Your Name</Label>
                  <Input className="mt-1.5" placeholder="Full name" {...otpForm.register("name")} />
                  {otpForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.name.message}</p>
                  )}
                </div>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Verify &amp; Continue
              </Button>
            </form>

            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || submitting}
              className="mt-4 w-full text-center text-xs font-semibold text-navy-500 hover:text-navy-900 disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
