"use client";

import { useEffect, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/admin/dialog";

const FULL: PercentCrop = { unit: "%", x: 0, y: 0, width: 100, height: 100 };
const MAX_SIDE = 2000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draws `img` rotated by `deg` (multiple of 90) and returns it as a data URL. */
async function rotated(src: string, deg: number): Promise<string> {
  if (deg % 360 === 0) return src;
  const img = await loadImage(src);
  const swap = deg % 180 !== 0;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? img.naturalHeight : img.naturalWidth;
  canvas.height = swap ? img.naturalWidth : img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas.toDataURL("image/jpeg", 0.95);
}

async function cropToFile(src: string, crop: PercentCrop, name: string): Promise<File> {
  const img = await loadImage(src);
  const sx = (crop.x / 100) * img.naturalWidth;
  const sy = (crop.y / 100) * img.naturalHeight;
  const sw = Math.max(1, (crop.width / 100) * img.naturalWidth);
  const sh = Math.max(1, (crop.height / 100) * img.naturalHeight);
  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), "image/jpeg", 0.9));
  return new File([blob], name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/**
 * Lets the customer rotate and crop a document photo before it is uploaded,
 * so the whole card fits without its edges (or the number) being cut off.
 */
export function ImageCropDialog({
  file,
  title,
  onCancel,
  onDone,
}: {
  file: File | null;
  title: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [original, setOriginal] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<PercentCrop>(FULL);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginal(url);
    setSrc(url);
    setRotation(0);
    setCrop(FULL);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rotate = async () => {
    if (!original) return;
    const next = (rotation + 90) % 360;
    setBusy(true);
    try {
      setSrc(await rotated(original, next));
      setRotation(next);
      setCrop(FULL);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!src || !file) return;
    setBusy(true);
    try {
      onDone(await cropToFile(src, crop.width && crop.height ? crop : FULL, file.name));
    } catch {
      onDone(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent title={`Adjust ${title}`} description="Drag the corners so the whole card fits inside the box. Keep the number and photo clear." className="max-w-xl">
        <div className="grid min-h-48 place-items-center rounded-2xl bg-navy-950 p-2">
          {src && (
            <ReactCrop crop={crop} onChange={(_, pct) => setCrop(pct)} keepSelection ruleOfThirds>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Document preview" className="max-h-[55vh] w-auto" />
            </ReactCrop>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={rotate} disabled={busy}>
            <RotateCw className="size-4" /> Rotate
          </Button>
          <Button type="button" variant="outline" onClick={() => setCrop(FULL)} disabled={busy}>
            Reset
          </Button>
          <Button type="button" className="ml-auto" onClick={confirm} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Use this photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
