"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { ADMIN_PERMISSION_MODULES, type ActivityLog } from "@/types";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (module !== "ALL") params.set("module", module);
      params.set("page", String(page));
      params.set("limit", "30");
      const res = await apiFetch<ActivityLog[]>(`/admin/activity-logs?${params.toString()}`);
      setLogs(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load activity logs", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [module, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Activity Logs" description="Read-only audit trail of admin actions." />

      <Card className="mb-4 p-4">
        <Select
          value={module}
          onValueChange={(v) => {
            setPage(1);
            setModule(v);
          }}
        >
          <SelectTrigger className="h-12 w-56 rounded-2xl border border-navy-200 px-4">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Modules</SelectItem>
            {ADMIN_PERMISSION_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet." description="Actions taken across the admin panel will show up here." />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Record ID</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                    <td className="p-4">
                      <p className="font-semibold text-navy-900">{log.admin?.name}</p>
                      <p className="text-xs text-navy-400">{log.admin?.role}</p>
                    </td>
                    <td className="p-4 text-navy-700">{log.action}</td>
                    <td className="p-4 text-navy-700">{log.module}</td>
                    <td className="p-4 font-mono text-xs text-navy-500">{log.recordId ?? "—"}</td>
                    <td className="p-4 text-navy-400">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
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
