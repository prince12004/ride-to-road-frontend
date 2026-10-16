"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { CreditCard, FileCheck2, FileText, IdCard, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { KycDocument, UserProfile, VerificationStatus } from "@/types";

// `type` values must match VERIFICATION_DOCUMENT_TYPES in the backend.
const DOC_SLOTS = [
  { type: "Aadhaar Card", label: "Aadhaar Card", icon: IdCard, hint: "Photo of front & back, or e-Aadhaar PDF", required: true },
  { type: "Driving Licence", label: "Driving Licence", icon: ShieldCheck, hint: "Valid, 1+ year old", required: true },
  { type: "PAN Card", label: "PAN Card", icon: CreditCard, hint: "Clear photo of your PAN", required: true },
  { type: "Other Documents", label: "Other Documents", icon: FileText, hint: "Optional — e.g. address proof", required: false },
] as const;

const REQUIRED_SLOTS = DOC_SLOTS.filter((s) => s.required);

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const STATUS_META: Record<VerificationStatus, { label: string; variant: NonNullable<BadgeProps["variant"]> }> = {
  NOT_SUBMITTED: { label: "Not Submitted", variant: "outline" },
  PENDING: { label: "Pending Review", variant: "warning" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

type SlotStatus = "ready" | VerificationStatus;

export default function VerificationPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [pendingDocs, setPendingDocs] = useState<KycDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await apiFetch<UserProfile>("/auth/me");
      setProfile(res.data);
    } catch (err) {
      toast({
        title: "Could not load verification status",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const overallStatus = profile?.verification?.status ?? "NOT_SUBMITTED";
  const submittedDocs = profile?.verification.documents ?? [];

  const slotStatus = (type: string): SlotStatus => {
    if (pendingDocs.some((d) => d.type === type)) return "ready";
    if (submittedDocs.some((d) => d.type === type)) return overallStatus;
    return "NOT_SUBMITTED";
  };

  const verifiedCount = REQUIRED_SLOTS.filter((s) => slotStatus(s.type) === "VERIFIED").length;
  const submittedCount = DOC_SLOTS.filter((s) => slotStatus(s.type) !== "NOT_SUBMITTED").length;

  const handleFileChange = async (type: string, e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast({ title: "Unsupported file type", description: "Please upload a JPG, PNG, WEBP image or a PDF.", variant: "error" });
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "error" });
      return;
    }
    setUploadingType(type);
    try {
      const fd = new FormData();
      fd.append("file", selected);
      const res = await apiFetch<{ url: string; publicId: string }>("/user/verification/upload", {
        method: "POST",
        body: fd,
      });
      setPendingDocs((prev) => [...prev.filter((d) => d.type !== type), { type, url: res.data.url, publicId: res.data.publicId }]);
      toast({ title: `${type} uploaded`, description: "Submit below to send it for review.", variant: "success" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmitVerification = async () => {
    if (!pendingDocs.length) return;
    setSubmitting(true);
    try {
      await apiFetch("/user/verification", {
        method: "POST",
        body: JSON.stringify({ documents: pendingDocs }),
      });
      toast({
        title: "Submitted for verification",
        description: "We'll review your documents shortly.",
        variant: "success",
      });
      setPendingDocs([]);
      await loadProfile();
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-24 animate-pulse rounded-3xl bg-navy-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-navy-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">
          <span className="h-px w-6 bg-current" /> Account
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">Quick eKYC</h1>
        <p className="mt-1 text-sm text-navy-500">Verify your identity and driving eligibility securely in a few steps.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-navy-950 bg-lanes p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">Verification progress</p>
              <p className="mt-1 font-display text-xl font-bold text-white">{verifiedCount} of {REQUIRED_SLOTS.length} documents verified</p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 font-display text-lg font-extrabold text-white">
              {Math.round((verifiedCount / REQUIRED_SLOTS.length) * 100)}%
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{ width: `${(verifiedCount / REQUIRED_SLOTS.length) * 100}%` }}
            />
          </div>
        </div>
        {overallStatus === "REJECTED" && profile?.verification.rejectionReason && (
          <p className="bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Reason for rejection: </span>
            {profile.verification.rejectionReason} — please re-upload the relevant document below.
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOC_SLOTS.map(({ type, label, icon: Icon, hint }) => {
          const status = slotStatus(type);
          const meta = status === "ready" ? { label: "Ready to submit", variant: "lime" as const } : STATUS_META[status as VerificationStatus];
          const isUploading = uploadingType === type;
          const canUpload = status === "NOT_SUBMITTED" || status === "REJECTED";

          return (
            <Card
              key={type}
              className={cn(
                "flex flex-col p-5 transition-shadow duration-300",
                status === "VERIFIED" && "border-emerald-200 bg-emerald-50/40",
                status === "REJECTED" && "border-red-200",
              )}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-2xl",
                  status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : "bg-navy-50 text-brand-deep",
                )}
              >
                <Icon className="size-5" />
              </span>
              <p className="mt-4 font-display text-base font-bold text-navy-900">{label}</p>
              <p className="mt-1 text-xs text-navy-400">{hint}</p>
              <div className="mt-3">
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>

              <div className="mt-4">
                {canUpload ? (
                  <label
                    className={cn(
                      "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-navy-200 text-sm font-semibold text-navy-700 transition-colors hover:border-navy-900",
                      isUploading && "pointer-events-none opacity-60",
                    )}
                  >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    {status === "REJECTED" ? "Re-upload" : "Verify Now"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(type, e)}
                    />
                  </label>
                ) : status === "VERIFIED" ? (
                  <p className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-100 text-sm font-semibold text-emerald-700">
                    <FileCheck2 className="size-4" /> Verified
                  </p>
                ) : (
                  <p className="flex h-11 items-center justify-center rounded-xl bg-navy-50 text-sm font-semibold text-navy-500">
                    Under review
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {pendingDocs.length > 0 && (
        <Card className="flex flex-col items-center gap-3 border-lime/40 bg-lime/5 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-semibold text-navy-900">
            {pendingDocs.length} document{pendingDocs.length !== 1 ? "s" : ""} ready — submit for review.
          </p>
          <Button onClick={handleSubmitVerification} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            Submit for Verification
          </Button>
        </Card>
      )}

      <p className="text-center text-xs text-navy-400">
        JPG, PNG, WEBP or PDF · max 5MB per file. Your documents are stored privately and only seen by our verification team.
        <br />
        {submittedCount === 0
          ? "Documents are reviewed by our team — usually within a few hours."
          : "Our team reviews submitted documents manually, usually within a few hours."}
      </p>
    </div>
  );
}
