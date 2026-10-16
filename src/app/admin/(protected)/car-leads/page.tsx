"use client";

import { useCallback, useEffect, useState } from "react";
import { CarFront, Loader2, MessageCircle, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { CarLead, CarLeadStatus } from "@/types";

const STATUSES: CarLeadStatus[] = ["NEW", "CONTACTED", "ONBOARDED", "REJECTED"];

export default function CarLeadsPage() {
  const [leads, setLeads] = useState<CarLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | CarLeadStatus>("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await apiFetch<CarLead[]>(`/admin/car-leads?${params.toString()}`);
      setLeads(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load car leads", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (lead: CarLead, next: string) => {
    try {
      await apiFetch(`/admin/car-leads/${lead._id}`, { method: "PUT", body: JSON.stringify({ status: next }) });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleDelete = async (lead: CarLead) => {
    if (!confirm(`Delete the lead from "${lead.name}"?`)) return;
    try {
      await apiFetch(`/admin/car-leads/${lead._id}`, { method: "DELETE" });
      toast({ title: "Lead deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const whatsappHref = (lead: CarLead) =>
    `https://wa.me/91${lead.mobile}?text=${encodeURIComponent(
      `Hi ${lead.name}, this is Ride to Road about attaching your ${lead.carMakeModel} (${lead.registrationNumber}).`,
    )}`;

  return (
    <div>
      <PageHeader title="Car Leads" description="Car owners who submitted the “Attach Your Car” form." />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
          <Input
            className="pl-10"
            placeholder="Search by name, mobile, car, registration or city..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as "" | CarLeadStatus);
          }}
          className="h-12 rounded-2xl border border-navy-200 bg-white px-4 text-sm font-semibold text-navy-900"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState icon={CarFront} title="No car leads yet." description="Submissions from the “Attach Your Car” form will appear here." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Owner</th>
                <th className="p-4">Car</th>
                <th className="p-4">Reg. No.</th>
                <th className="p-4">Year</th>
                <th className="p-4">City</th>
                <th className="p-4">Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b border-navy-50 align-top transition-colors duration-150 last:border-0 hover:bg-navy-50/60">
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{lead.name}</p>
                    <a href={`tel:+91${lead.mobile}`} className="text-navy-600 hover:underline">
                      {lead.mobile}
                    </a>
                  </td>
                  <td className="p-4 text-navy-700">{lead.carMakeModel}</td>
                  <td className="p-4 font-mono text-xs text-navy-900">{lead.registrationNumber}</td>
                  <td className="p-4 text-navy-700">{lead.manufacturingYear}</td>
                  <td className="p-4 text-navy-700">{lead.city}</td>
                  <td className="max-w-xs p-4 text-navy-600">{lead.details || "—"}</td>
                  <td className="p-4">
                    <select
                      value={lead.status}
                      onChange={(ev) => handleStatusChange(lead, ev.target.value)}
                      className="rounded-full border border-navy-200 bg-white px-2 py-1 text-xs font-semibold"
                      aria-label={`Status for ${lead.name}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap p-4 text-navy-400">{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <a
                        href={whatsappHref(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${lead.name}`}
                        className="grid size-8 place-items-center rounded-full text-emerald-600 hover:bg-emerald-50"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(lead)}
                        aria-label={`Delete lead from ${lead.name}`}
                        className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
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
