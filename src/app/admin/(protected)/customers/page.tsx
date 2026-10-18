"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Trash2, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { VerificationStatusBadge } from "@/components/admin/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import type { AdminCustomer } from "@/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const role = useAdminAuthStore((s) => s.admin?.role);
  const canDelete = role === "SUPER_ADMIN" || role === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (verificationStatus !== "ALL") params.set("verificationStatus", verificationStatus);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await apiFetch<AdminCustomer[]>(`/admin/customers?${params.toString()}`);
      setCustomers(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load customers", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, verificationStatus, page]);

  useEffect(() => {
    load();
  }, [load]);


  const handleDelete = async (c: AdminCustomer) => {
    if (!confirm(`Delete customer ${c.name} (${c.mobile})? Their account and uploaded documents will be removed. This cannot be undone.`)) return;
    setDeletingId(c._id);
    try {
      await apiFetch(`/admin/customers/${c._id}`, { method: "DELETE" });
      toast({ title: "Customer deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Could not delete customer", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Customers" description="All registered customers." />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select
            value={verificationStatus}
            onValueChange={(v) => {
              setPage(1);
              setVerificationStatus(v);
            }}
          >
            <SelectTrigger className="h-12 w-56 rounded-2xl border border-navy-200 px-4">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Verification Statuses</SelectItem>
              {["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No customers yet." description="Customers will appear here once they sign up on the site." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Email</th>
                <th className="p-4">Bookings</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Account</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 font-semibold text-navy-900">{c.name}</td>
                  <td className="p-4 text-navy-700">{c.mobile}</td>
                  <td className="p-4 text-navy-700">{c.email ?? "—"}</td>
                  <td className="p-4 text-navy-700">{c.bookingsCount ?? 0}</td>
                  <td className="p-4">
                    <VerificationStatusBadge status={c.verification.status} />
                  </td>
                  <td className="p-4">
                    <Badge variant={c.isBlocked ? "destructive" : "success"}>{c.isBlocked ? "Blocked" : "Active"}</Badge>
                  </td>
                  <td className="p-4 text-navy-400">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link href={`/admin/customers/${c._id}`} className="text-sm font-semibold text-brand-deep hover:underline">
                        View
                      </Link>
                      {canDelete && !c.bookingsCount && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c._id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          aria-label={`Delete ${c.name}`}
                          title="Delete customer (only possible with no bookings)"
                        >
                          {deletingId === c._id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4">
            <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
