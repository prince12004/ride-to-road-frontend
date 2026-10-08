"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface UploadResponse {
  url: string;
  publicId: string;
}

async function uploadFile(file: File, folder: string): Promise<ImageRef> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await apiFetch<UploadResponse>("/admin/upload", { method: "POST", body: formData });
  return { url: res.data.url, publicId: res.data.publicId };
}

async function deleteFile(publicId: string) {
  await apiFetch("/admin/upload/delete", { method: "POST", body: JSON.stringify({ publicId }) });
}

/** Single-image uploader with preview + delete. */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = "Image",
  required,
}: {
  value: ImageRef | null | undefined;
  onChange: (image: ImageRef | null) => void;
  folder: string;
  label?: string;
  required?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: "Unsupported file", description: "Only JPG, PNG or WEBP images are allowed.", variant: "error" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max image size is 5MB.", variant: "error" });
      return;
    }
    setUploading(true);
    try {
      const image = await uploadFile(file, folder);
      onChange(image);
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof ApiClientError ? err.message : "Please try again.", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    const prev = value;
    onChange(null);
    try {
      await deleteFile(prev.publicId);
    } catch {
      // Non-fatal: image just becomes orphaned in Cloudinary.
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="mt-1.5">
        {value ? (
          <div className="relative flex items-center gap-3 rounded-2xl border border-navy-200 bg-white p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-navy-50">
              <Image src={value.url} alt="" fill className="object-cover" unoptimized />
            </div>
            <p className="flex-1 truncate text-xs text-navy-500">{value.url}</p>
            <button
              type="button"
              onClick={handleRemove}
              className="grid size-9 shrink-0 place-items-center rounded-full text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-navy-300 bg-navy-50/50 text-navy-500 transition-colors hover:border-navy-900 hover:text-navy-900",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
            <span className="text-xs font-semibold">{uploading ? "Uploading..." : "Click to upload (JPG, PNG, WEBP, max 5MB)"}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Multi-image uploader for a gallery array. */
export function GalleryUploader({
  value,
  onChange,
  folder,
  label = "Gallery",
}: {
  value: ImageRef[];
  onChange: (images: ImageRef[]) => void;
  folder: string;
  label?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const uploaded: ImageRef[] = [];
      for (const file of Array.from(files)) {
        if (!ACCEPTED.includes(file.type) || file.size > MAX_SIZE) continue;
        uploaded.push(await uploadFile(file, folder));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof ApiClientError ? err.message : "Please try again.", variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const img = value[index];
    onChange(value.filter((_, i) => i !== index));
    try {
      await deleteFile(img.publicId);
    } catch {
      // Non-fatal.
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={img.publicId + i} className="relative size-20 overflow-hidden rounded-xl border border-navy-200 bg-navy-50">
            <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-navy-950/70 text-white hover:bg-red-600"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="grid size-20 place-items-center rounded-xl border border-dashed border-navy-300 bg-navy-50/50 text-navy-400 hover:border-navy-900 hover:text-navy-900"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
