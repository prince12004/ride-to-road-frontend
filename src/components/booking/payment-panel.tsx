"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, Clock3, Download, ImageUp, Loader2, QrCode, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR } from "@/lib/utils";
import type { BookingStatus, PaymentMethod, PaymentStatus } from "@/types";

const QR_IMAGE = "/images/rqr.jpeg";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PaymentPanelProps {
  bookingId: string;
  method?: PaymentMethod;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  amount: number;
  proofUploadedAt?: string;
  failureReason?: string;
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function PaymentPanel({ bookingId, method, paymentStatus, bookingStatus, amount, proofUploadedAt, failureReason }: PaymentPanelProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  if (bookingStatus === "CANCELLED") return null;

  if (method === "COD") {
    const paid = paymentStatus === "PAID";
    return (
      <Card id="payment" className="scroll-mt-24 flex items-start gap-4 p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime/20 text-brand-deep">
          {paid ? <CheckCircle2 className="size-5" /> : <Banknote className="size-5" />}
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy-900">{paid ? "Cash payment received" : "Cash on Delivery"}</h2>
          <p className="mt-1 text-sm text-navy-500">
            {paid
              ? "Thank you — your payment has been recorded."
              : `Your booking is confirmed. Please pay ${formatINR(amount)} in cash when you pick up the car.`}
          </p>
        </div>
      </Card>
    );
  }

  if (method !== "UPI_QR") return null;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Please upload a JPG, PNG or WEBP screenshot.", variant: "error" });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "error" });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiFetch(`/bookings/${bookingId}/payment-proof`, { method: "POST", body: fd });
      toast({ title: "Screenshot uploaded", description: "We'll verify your payment shortly.", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof ApiClientError ? err.message : "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  if (paymentStatus === "PAID") {
    return (
      <Card id="payment" className="scroll-mt-24 flex items-start gap-4 border-emerald-200 bg-emerald-50/50 p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-navy-900">Payment verified</h2>
          <p className="mt-1 text-sm text-navy-500">We've received your UPI payment of {formatINR(amount)}. Your booking is confirmed.</p>
        </div>
      </Card>
    );
  }

  const rejected = paymentStatus === "FAILED";
  const underReview = Boolean(proofUploadedAt) && !rejected;

  return (
    <Card id="payment" className="scroll-mt-24 overflow-hidden p-0">
      <div className="bg-navy-950 bg-lanes p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">Pay via UPI</p>
        <p className="mt-1 font-display text-2xl font-extrabold text-white">{formatINR(amount)}</p>
        <p className="mt-1 text-sm text-navy-300">Booking {bookingId}</p>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
        <div className="mx-auto w-full max-w-[220px]">
          <div className="relative aspect-[844/1600] overflow-hidden rounded-2xl border border-navy-100 bg-navy-950">
            <Image src={QR_IMAGE} alt="Ride to Road UPI payment QR code" fill priority sizes="220px" className="object-contain" />
          </div>
          <a
            href={QR_IMAGE}
            download="ride-to-road-upi-qr.jpeg"
            className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-navy-200 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-900"
          >
            <Download className="size-4" /> Download QR
          </a>
        </div>

        <div className="flex flex-col">
          <ol className="space-y-3 text-sm text-navy-600">
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs font-bold text-navy-900">1</span>
              <span>
                Scan the QR with any UPI app and pay <span className="font-semibold text-navy-900">{formatINR(amount)}</span>.
                On your phone? Download the QR and choose "scan from gallery" in your UPI app.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs font-bold text-navy-900">2</span>
              <span>Take a screenshot of the successful payment.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs font-bold text-navy-900">3</span>
              <span>Upload it below. We'll verify it and confirm your booking.</span>
            </li>
          </ol>

          {rejected && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-semibold">Payment could not be verified.</span> {failureReason} Please upload a clear screenshot again.
              </span>
            </p>
          )}

          {underReview && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Clock3 className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-semibold">Screenshot received{proofUploadedAt ? ` on ${fmt(proofUploadedAt)}` : ""}.</span> Your payment is
                pending verification — we'll confirm your booking shortly.
              </span>
            </p>
          )}

          <label
            className={
              "mt-5 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-colors " +
              (underReview
                ? "border border-navy-200 text-navy-700 hover:border-navy-900"
                : "bg-lime text-navy-900 hover:bg-lime-400") +
              (uploading ? " pointer-events-none opacity-60" : "")
            }
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : underReview ? <ImageUp className="size-4" /> : <QrCode className="size-4" />}
            {uploading ? "Uploading…" : underReview ? "Replace screenshot" : "Upload payment screenshot"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          <p className="mt-2 text-center text-xs text-navy-400">JPG, PNG or WEBP · max 5MB</p>
        </div>
      </div>
    </Card>
  );
}
