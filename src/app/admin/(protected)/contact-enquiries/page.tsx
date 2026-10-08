"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { ContactEnquiry } from "@/types";

const STATUSES = ["NEW", "CONTACTED", "RESOLVED"] as const;

export default function ContactEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await apiFetch<ContactEnquiry[]>(`/admin/contact-enquiries?${params.toString()}`);
      setEnquiries(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load enquiries", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (e: ContactEnquiry, status: string) => {
    try {
      await apiFetch(`/admin/contact-enquiries/${e._id}`, { method: "PUT", body: JSON.stringify({ status }) });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleDelete = async (e: ContactEnquiry) => {
    if (!confirm(`Delete enquiry from "${e.name}"?`)) return;
    try {
      await apiFetch(`/admin/contact-enquiries/${e._id}`, { method: "DELETE" });
      toast({ title: "Enquiry deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader title="Contact Enquiries" description="Messages submitted through the contact form." />

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
          <Input
            className="pl-10"
            placeholder="Search by name, mobile or email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : enquiries.length === 0 ? (
        <EmptyState icon={Mail} title="No enquiries yet." description="Contact form submissions will appear here." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                  <th className="p-4">Name</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e) => (
                  <tr key={e._id} className="border-b border-navy-50 last:border-0 align-top transition-colors duration-150 hover:bg-navy-50/60">
                    <td className="p-4 font-semibold text-navy-900">{e.name}</td>
                    <td className="p-4 text-navy-700">{e.mobile}</td>
                    <td className="p-4 text-navy-700">{e.email ?? "—"}</td>
                    <td className="p-4 max-w-xs text-navy-700">
                      <p className={expanded === e._id ? "" : "line-clamp-2"}>{e.message}</p>
                      {e.message.length > 80 && (
                        <button
                          className="mt-1 text-xs font-semibold text-brand-deep hover:underline"
                          onClick={() => setExpanded(expanded === e._id ? null : e._id)}
                        >
                          {expanded === e._id ? "Show less" : "Show more"}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={e.status}
                        onChange={(ev) => handleStatusChange(e, ev.target.value)}
                        className="rounded-full border border-navy-200 bg-white px-2 py-1 text-xs font-semibold"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-navy-400">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(e)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4">
              <AdminPagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
