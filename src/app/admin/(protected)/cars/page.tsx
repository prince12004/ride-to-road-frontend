"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Pencil, Copy, Trash2, Star, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminPagination } from "@/components/admin/pagination";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import { formatINR, cn } from "@/lib/utils";
import type { AdminCarDoc } from "@/types";
import { Car as CarIcon } from "lucide-react";

const CAR_STATUSES = ["AVAILABLE", "BOOKED", "MAINTENANCE", "INACTIVE"];

function AdminCarsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [cars, setCars] = useState<AdminCarDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(statusParam && CAR_STATUSES.includes(statusParam) ? statusParam : "ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (category !== "ALL") params.set("category", category);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await apiFetch<AdminCarDoc[]>(`/admin/cars?${params.toString()}`);
      setCars(res.data);
      setPages(res.pagination?.pages ?? 1);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      toast({ title: "Could not load cars", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, status, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (car: AdminCarDoc) => {
    if (!confirm(`Delete "${car.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/cars/${car._id}`, { method: "DELETE" });
      toast({ title: "Car deleted", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleDuplicate = async (car: AdminCarDoc) => {
    try {
      await apiFetch(`/admin/cars/${car._id}/duplicate`, { method: "POST" });
      toast({ title: "Car duplicated", variant: "success" });
      load();
    } catch (err) {
      toast({ title: "Duplicate failed", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleToggleFeatured = async (car: AdminCarDoc) => {
    try {
      await apiFetch(`/admin/cars/${car._id}/featured`, { method: "PATCH" });
      load();
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  const handleStatusChange = async (car: AdminCarDoc, newStatus: string) => {
    try {
      await apiFetch(`/admin/cars/${car._id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      load();
    } catch (err) {
      toast({ title: "Could not update status", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Cars"
        description="Manage the fleet shown on the public site."
        action={
          <Button asChild>
            <Link href="/admin/cars/create">
              <Plus className="size-4" /> Add Car
            </Link>
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or brand..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setPage(1);
              setStatus(v);
            }}
          >
            <SelectTrigger className="h-12 w-44 rounded-2xl border border-navy-200 px-4">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {["AVAILABLE", "BOOKED", "MAINTENANCE", "INACTIVE"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setPage(1);
              setCategory(v);
            }}
          >
            <SelectTrigger className="h-12 w-44 rounded-2xl border border-navy-200 px-4">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {["hatchback", "sedan", "suv", "luxury"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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
      ) : cars.length === 0 ? (
        <EmptyState
          icon={CarIcon}
          title="No cars added yet."
          description="Click 'Add Car' to get started."
          action={
            <Button asChild size="sm">
              <Link href="/admin/cars/create">
                <Plus className="size-4" /> Add Car
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
                <th className="p-4">Car</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Price/Day</th>
                <th className="p-4">Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Bookings</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car._id} className="border-b border-navy-50 last:border-0 transition-colors duration-150 hover:bg-navy-50/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-navy-50">
                        {car.mainImage?.url && <Image src={car.mainImage.url} alt="" fill className="object-cover" unoptimized />}
                      </div>
                      <div>
                        <p className="font-semibold text-navy-900">{car.name}</p>
                        <p className="text-xs text-navy-400">{car.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize text-navy-700">{car.category}</td>
                  <td className="p-4 text-navy-700">
                    {typeof car.location === "object" ? car.location.city : "—"}
                  </td>
                  <td className="p-4 font-medium text-navy-900">{formatINR(car.pricePerDay)}</td>
                  <td className="p-4">
                    <select
                      value={car.status}
                      onChange={(e) => handleStatusChange(car, e.target.value)}
                      className="rounded-full border border-navy-200 bg-white px-2 py-1 text-xs font-semibold"
                    >
                      {["AVAILABLE", "BOOKED", "MAINTENANCE", "INACTIVE"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleToggleFeatured(car)}>
                      <Star className={cn("size-5", car.isFeatured ? "fill-lime-500 text-lime-500" : "text-navy-200")} />
                    </button>
                  </td>
                  <td className="p-4 text-navy-700">{car.bookingsCount ?? 0}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/admin/cars/${car._id}/edit`} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Pencil className="size-4" />
                      </Link>
                      <button onClick={() => handleDuplicate(car)} className="grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-50">
                        <Copy className="size-4" />
                      </button>
                      <button onClick={() => handleDelete(car)} className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-50">
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

export default function AdminCarsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-navy-400" />
        </div>
      }
    >
      <AdminCarsContent />
    </Suspense>
  );
}
