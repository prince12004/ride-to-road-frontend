"use client";

import { ShieldAlert } from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth-store";

/** Wrap a page's content to block rendering when the admin lacks the given permission module. */
export function PermissionGate({ module, children }: { module: string; children: React.ReactNode }) {
  const { admin, hasPermission } = useAdminAuthStore();
  const allowed = admin?.role === "SUPER_ADMIN" || hasPermission(module);

  if (!allowed) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldAlert className="size-8 text-navy-300" />
        <p className="font-display text-base font-bold text-navy-900">You don&apos;t have access to this section.</p>
        <p className="text-sm text-navy-500">Ask a Super Admin to grant you the required permission.</p>
      </div>
    );
  }

  return <>{children}</>;
}
