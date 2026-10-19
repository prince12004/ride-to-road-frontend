"use client";

import { Card } from "@/components/ui/card";
import { KYC_SLOTS, KycDocumentGrid, KycNumbersForm, slotState, useKycProfile } from "@/components/kyc/kyc-documents";

const REQUIRED_SLOTS = KYC_SLOTS.filter((s) => s.required);

export default function VerificationPage() {
  const { profile, loading, reload } = useKycProfile();

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-24 animate-pulse rounded-3xl bg-navy-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-navy-100" />
          ))}
        </div>
      </div>
    );
  }

  const overallStatus = profile?.verification?.status ?? "NOT_SUBMITTED";
  const verifiedCount = REQUIRED_SLOTS.filter((s) => slotState(profile, s) === "VERIFIED").length;
  const uploadedCount = REQUIRED_SLOTS.filter((s) => slotState(profile, s) !== "NOT_SUBMITTED").length;
  const pct = Math.round((verifiedCount / REQUIRED_SLOTS.length) * 100);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-deep">
          <span className="h-px w-6 bg-current" /> Account
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">Quick eKYC</h1>
        <p className="mt-1 text-sm text-navy-500">
          Upload both sides of your Aadhaar and Driving Licence. Documents must be verified before pickup.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-navy-950 bg-lanes p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lime">Verification progress</p>
              <p className="mt-1 font-display text-xl font-bold text-white">
                {verifiedCount} of {REQUIRED_SLOTS.length} documents verified
              </p>
              <p className="mt-0.5 text-xs text-navy-300">
                {uploadedCount} of {REQUIRED_SLOTS.length} uploaded
              </p>
            </div>
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 font-display text-lg font-extrabold text-white">
              {pct}%
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {overallStatus === "REJECTED" && profile?.verification.rejectionReason && (
          <p className="bg-red-50 p-4 text-sm text-red-700">
            <span className="font-semibold">Reason for rejection: </span>
            {profile.verification.rejectionReason} — please upload the relevant document again below.
          </p>
        )}
      </Card>

      <KycDocumentGrid slots={KYC_SLOTS} profile={profile} onUploaded={reload} />

      <KycNumbersForm profile={profile} onSaved={reload} />

      <p className="text-center text-xs text-navy-400">
        JPG, PNG, WEBP or PDF · max 5MB per file. Your documents are stored privately and only seen by our verification team,
        usually within a few hours.
      </p>
    </div>
  );
}
