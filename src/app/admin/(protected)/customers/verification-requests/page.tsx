"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { VerificationPanel } from "@/components/admin/verification-panel";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminCustomer } from "@/types";

export default function VerificationRequestsPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminCustomer[]>("/admin/customers/verification-requests?status=PENDING");
      setCustomers(res.data);
    } catch (err) {
      toast({ title: "Could not load requests", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Verification Requests" description="Customers awaiting KYC document review." />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState title="No pending verification requests." description="You're all caught up." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {customers.map((c) => (
            <VerificationPanel key={c._id} customer={c} onReviewed={load} />
          ))}
        </div>
      )}
    </div>
  );
}
