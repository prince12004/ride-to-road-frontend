"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { CreditCard, FileCheck2, FileText, Hash, IdCard, Loader2, Save, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropDialog } from "@/components/kyc/image-crop-dialog";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { UserProfile, VerificationStatus } from "@/types";

export interface KycSlot {
  /** Must match VERIFICATION_DOCUMENT_TYPES in the backend. */
  type: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  required: boolean;
  /** Older single-image type that also satisfies this slot. */
  legacyType?: string;
}

export const KYC_SLOTS: KycSlot[] = [
  { type: "Aadhaar Card (Front)", label: "Aadhaar · Front", hint: "Side with your photo", icon: IdCard, required: true, legacyType: "Aadhaar Card" },
  { type: "Aadhaar Card (Back)", label: "Aadhaar · Back", hint: "Side with your address", icon: IdCard, required: true, legacyType: "Aadhaar Card" },
  { type: "Driving Licence (Front)", label: "Driving Licence · Front", hint: "Valid, 1+ year old", icon: ShieldCheck, required: true, legacyType: "Driving Licence" },
  { type: "Driving Licence (Back)", label: "Driving Licence · Back", hint: "Reverse side of your DL", icon: ShieldCheck, required: true, legacyType: "Driving Licence" },
  { type: "PAN Card", label: "PAN Card", hint: "Clear photo of your PAN", icon: CreditCard, required: false },
  { type: "Other Documents", label: "Other Documents", hint: "Optional — e.g. address proof", icon: FileText, required: false },
];

/** The four documents needed before pickup: Aadhaar and DL, both sides. */
export const BOOKING_KYC_SLOTS = KYC_SLOTS.filter((s) => s.type.startsWith("Aadhaar") || s.type.startsWith("Driving"));

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type SlotState = VerificationStatus;

const STATUS_META: Record<SlotState, { label: string; variant: NonNullable<BadgeProps["variant"]> }> = {
  NOT_SUBMITTED: { label: "Not uploaded", variant: "outline" },
  PENDING: { label: "Under review", variant: "warning" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

/** Loads the signed-in customer's KYC state; `reload` refreshes it after an upload. */
export function useKycProfile(enabled = true) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    try {
      const res = await apiFetch<UserProfile>("/auth/me");
      setProfile(res.data);
    } catch {
      // Not signed in or offline — callers show their own state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { profile, loading, reload };
}

export function slotState(profile: UserProfile | null, slot: KycSlot): SlotState {
  const docs = profile?.verification?.documents ?? [];
  const has = docs.some((d) => d.type === slot.type || (slot.legacyType && d.type === slot.legacyType));
  return has ? profile!.verification.status : "NOT_SUBMITTED";
}

/**
 * Upload cards for KYC documents. Each file is uploaded privately and sent
 * for review straight away — there is no separate submit step to forget.
 */
export function KycDocumentGrid({
  slots,
  profile,
  onUploaded,
  compact = false,
}: {
  slots: KycSlot[];
  profile: UserProfile | null;
  onUploaded: () => void | Promise<void>;
  compact?: boolean;
}) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [cropping, setCropping] = useState<{ slot: KycSlot; file: File } | null>(null);

  const handleFile = (slot: KycSlot, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Unsupported file type", description: "Please upload a JPG, PNG, WEBP image or a PDF.", variant: "error" });
      return;
    }
    // Photos are adjusted (rotate / crop) first; the cropped copy is what's checked and sent.
    if (file.type !== "application/pdf") return setCropping({ slot, file });
    void upload(slot, file);
  };

  const upload = async (slot: KycSlot, file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "error" });
      return;
    }

    setUploadingType(slot.type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploaded = await apiFetch<{ url: string; publicId: string }>("/user/verification/upload", { method: "POST", body: fd });
      await apiFetch("/user/verification", {
        method: "POST",
        body: JSON.stringify({ documents: [{ type: slot.type, url: uploaded.data.url, publicId: uploaded.data.publicId }] }),
      });
      toast({ title: `${slot.label} uploaded`, description: "Sent to our team for verification.", variant: "success" });
      await onUploaded();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof ApiClientError ? err.message : "Please check your connection and try again.",
        variant: "error",
      });
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <>
    <ImageCropDialog
      file={cropping?.file ?? null}
      title={cropping?.slot.label ?? ""}
      onCancel={() => setCropping(null)}
      onDone={(cropped) => {
        const slot = cropping!.slot;
        setCropping(null);
        void upload(slot, cropped);
      }}
    />
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-2 sm:gap-4")}>
      {slots.map((slot) => {
        const state = slotState(profile, slot);
        const meta = STATUS_META[state];
        const busy = uploadingType === slot.type;
        const canUpload = state !== "VERIFIED";
        const Icon = slot.icon;

        return (
          <div
            key={slot.type}
            className={cn(
              "flex flex-col rounded-2xl border bg-white",
              compact ? "p-3" : "p-5",
              state === "VERIFIED" ? "border-emerald-200 bg-emerald-50/40" : state === "REJECTED" ? "border-red-200" : "border-navy-100",
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-xl",
                  compact ? "size-8" : "size-11 rounded-2xl",
                  state === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : "bg-navy-50 text-brand-deep",
                )}
              >
                <Icon className={compact ? "size-4" : "size-5"} />
              </span>
              <div className="min-w-0">
                <p className={cn("font-display font-bold leading-tight text-navy-900", compact ? "text-[13px]" : "text-base")}>{slot.label}</p>
                {!compact && <p className="mt-1 text-xs text-navy-400">{slot.hint}</p>}
              </div>
            </div>
            <div className={compact ? "mt-2" : "mt-3"}>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <div className={cn("mt-auto", compact ? "pt-2.5" : "pt-4")}>
              {canUpload ? (
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-navy-200 text-xs font-semibold text-navy-700 transition-colors hover:border-navy-900 sm:text-sm",
                    compact ? "h-10" : "h-11",
                    busy && "pointer-events-none opacity-60",
                  )}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                  {busy ? "Uploading…" : state === "NOT_SUBMITTED" ? "Upload" : "Replace"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => handleFile(slot, e)}
                  />
                </label>
              ) : (
                <p className={cn("flex items-center justify-center gap-1.5 rounded-xl bg-emerald-100 text-xs font-semibold text-emerald-700 sm:text-sm", compact ? "h-10" : "h-11")}>
                  <FileCheck2 className="size-4" /> Verified
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}

const NUMBER_FIELDS = [
  { key: "aadhaarNumber", label: "Aadhaar Number", placeholder: "1234 5678 9012", from: "aadhaar", test: (v: string) => /^[2-9]\d{11}$/.test(v), error: "Aadhaar number must be 12 digits" },
  { key: "dlNumber", label: "Driving Licence Number", placeholder: "DL0420110012345", from: "drivingLicence", test: (v: string) => /^[A-Z0-9]{8,20}$/.test(v), error: "Enter a valid driving licence number" },
  { key: "panNumber", label: "PAN Number (optional)", placeholder: "ABCDE1234F", from: "pan", test: (v: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(v), error: "PAN must look like ABCDE1234F" },
] as const;

const squash = (v: string) => v.replace(/[\s-]/g, "").toUpperCase();

/** Aadhaar / DL / PAN numbers, typed next to the uploads and printed on the booking form. */
export function KycNumbersForm({ profile, onSaved, compact = false }: { profile: UserProfile | null; onSaved?: () => void | Promise<void>; compact?: boolean }) {
  const initial = () =>
    Object.fromEntries(NUMBER_FIELDS.map((f) => [f.key, profile?.documentNumbers?.[f.from] ?? ""])) as Record<(typeof NUMBER_FIELDS)[number]["key"], string>;
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.documentNumbers?.aadhaar, profile?.documentNumbers?.drivingLicence, profile?.documentNumbers?.pan]);

  const dirty = NUMBER_FIELDS.some((f) => squash(values[f.key]) !== (profile?.documentNumbers?.[f.from] ?? ""));

  const save = async () => {
    const errs: Record<string, string> = {};
    for (const f of NUMBER_FIELDS) {
      const v = squash(values[f.key]);
      if (v && !f.test(v)) errs[f.key] = f.error;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await apiFetch("/user/verification/numbers", {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(NUMBER_FIELDS.map((f) => [f.key, squash(values[f.key])]))),
      });
      toast({ title: "Document numbers saved", variant: "success" });
      await onSaved?.();
    } catch (err) {
      toast({ title: "Could not save", description: err instanceof ApiClientError ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("rounded-2xl border border-navy-100 bg-white", compact ? "p-3" : "p-5")}>
      <p className="flex items-center gap-2 font-display text-sm font-bold text-navy-900">
        <Hash className="size-4 text-brand-deep" /> Document numbers
      </p>
      <div className={cn("mt-3 grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-3")}>
        {NUMBER_FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <Input
              className="mt-1 font-mono uppercase"
              inputMode={f.key === "aadhaarNumber" ? "numeric" : "text"}
              maxLength={f.key === "aadhaarNumber" ? 14 : 20}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
            />
            {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
          </div>
        ))}
      </div>
      {dirty && (
        <Button type="button" size="sm" className="mt-3" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save numbers
        </Button>
      )}
    </div>
  );
}
