import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { BadgeIndianRupee, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

const highlights = [
  { icon: ShieldCheck, label: "Secure OTP login — no passwords to remember" },
  { icon: BadgeIndianRupee, label: "Transparent pricing, every time" },
  { icon: Sparkles, label: "Manage bookings from one dashboard" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 bg-lanes lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-32 top-10 -z-0 size-[420px] rounded-full bg-lime/15 blur-[140px]" />
        <Logo onDark />
        <div className="relative z-10">
          <h1 className="max-w-md text-balance font-display text-4xl font-extrabold leading-[1.05] text-white">
            Your next self-drive trip is one OTP away.
          </h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-navy-200">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime/15 text-lime">
                  <Icon className="size-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src="/images/hero-suv.jpg" alt="Ride to Road self-drive SUV" fill sizes="50vw" className="object-cover" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-navy-50 px-4 py-12 lg:bg-white">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-3xl bg-navy-100" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
