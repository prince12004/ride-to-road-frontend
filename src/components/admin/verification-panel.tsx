"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VerificationStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminCustomer } from "@/types";

export function VerificationPanel({ customer, onReviewed }: { customer: AdminCustomer; onReviewed: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const review = async (status: "VERIFIED" | "REJECTED") => {
    if (status === "REJECTED" && !reason.trim()) {
      setRejecting(true);
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/admin/customers/${customer._id}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason: status === "REJECTED" ? reason : undefined }),
      });
      toast({ title: status === "VERIFIED" ? "Customer verified" : "Verification rejected", variant: "success" });
      setRejecting(false);
      setReason("");
      onReviewed();
    } catch (err) {
      toast({ title: "Could not save review", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy-900">Document Verification</h2>
        <VerificationStatusBadge status={customer.verification.status} />
      </div>
      <p className="mt-1 text-sm text-navy-500">{customer.name} · {customer.mobile}</p>

      {customer.verification.rejectionReason && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Previous rejection reason: {customer.verification.rejectionReason}
        </p>
      )}

      {customer.verification.documents.length === 0 ? (
        <p className="mt-4 text-sm text-navy-400">No documents uploaded.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {customer.verification.documents.map((doc, i) => (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border border-navy-100"
            >
              <div className="relative h-40 w-full bg-navy-50">
                <Image src={doc.url} alt={doc.type} fill className="object-cover" unoptimized />
              </div>
              <p className="p-2 text-center text-xs font-semibold text-navy-700">{doc.type}</p>
            </a>
          ))}
        </div>
      )}

      {customer.verification.status === "PENDING" && (
        <div className="mt-5 space-y-3 border-t border-navy-100 pt-5">
          {rejecting && (
            <Textarea
              placeholder="Reason for rejection (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          )}
          <div className="flex gap-3">
            <Button type="button" onClick={() => review("VERIFIED")} disabled={submitting} className="flex-1">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => review("REJECTED")}
              disabled={submitting}
              className="flex-1 border-red-200 text-red-600 hover:border-red-600"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              {rejecting ? "Confirm Reject" : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
