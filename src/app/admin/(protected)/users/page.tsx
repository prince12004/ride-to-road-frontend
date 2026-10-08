"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/admin/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { ADMIN_PERMISSION_MODULES, ADMIN_ROLES, type AdminUser, type AdminRole } from "@/types";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
}

const emptyForm: FormState = { name: "", email: "", password: "", role: "MANAGER", permissions: [], isActive: true };

export default function AdminUsersPage() {
  const currentAdmin = useAdminAuthStore((s) => s.admin);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminUser[]>("/admin/users");
      setUsers(res.data);
    } catch (err) {
      toast({ title: "Could not load users", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (currentAdmin && currentAdmin.role !== "SUPER_ADMIN") {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <ShieldCheck className="size-8 text-navy-300" />
        <p className="font-display text-base font-bold text-navy-900">Only Super Admins can manage admin users.</p>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, permissions: u.permissions, isActive: u.isActive });
    setOpen(true);
  };

  const togglePermission = (mod: string) => {
    setForm((s) => ({
      ...s,
      permissions: s.permissions.includes(mod) ? s.permissions.filter((p) => p !== mod) : [...s.permissions, mod],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!editing && !form.password.trim())) {
      toast({ title: "Missing fields", description: "Name, email and password (for new users) are required.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        permissions: form.permissions,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await apiFetch(`/admin/users/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast({ title: "User updated", variant: "success" });
      } else {
        await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "User created", variant: "success" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (currentAdmin && u._id === currentAdmin.id) {
      toast({ title: "Cannot delete your own account", variant: "error" });
      return;
    }
    if (!confirm(`Delete admin user "${u.name}"?`)) return;
    try {
      await apiFetch(`/admin/users/${u._id}`, { method: "DELETE" });
      toast({ title: "User deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage who can access this admin panel and what they can do."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add User
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No admin users yet." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4 font-semibold text-navy-900">{u.name}</td>
                  <td className="p-4 text-navy-700">{u.email}</td>
                  <td className="p-4">
                    <Badge variant="navy">{u.role.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.isActive ? "success" : "outline"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(u)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(u)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? "Edit Admin User" : "Add Admin User"} className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </div>
              <div>
                <Label>Password {editing && "(leave blank to keep unchanged)"}</Label>
                <Input className="mt-1.5" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v as AdminRole }))}>
                  <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Permissions {form.role === "SUPER_ADMIN" && "(Super Admin has full access regardless)"}</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-navy-100 p-3 sm:grid-cols-3">
                {ADMIN_PERMISSION_MODULES.map((mod) => (
                  <label key={mod} className="flex items-center gap-2 text-sm text-navy-700">
                    <Checkbox checked={form.permissions.includes(mod)} onCheckedChange={() => togglePermission(mod)} />
                    {mod}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: Boolean(v) }))} id="userActive" />
              <label htmlFor="userActive" className="text-sm font-semibold text-navy-700">
                Active
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
