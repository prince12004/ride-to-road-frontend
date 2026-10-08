"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { CarForm } from "@/components/admin/car-form";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminCarDoc } from "@/types";

export default function EditCarPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<AdminCarDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminCarDoc>(`/admin/cars/${id}`)
      .then((res) => setCar(res.data))
      .catch((err) => {
        toast({ title: "Could not load car", description: err instanceof ApiClientError ? err.message : "Try again.", variant: "error" });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!car) return <p className="text-sm text-navy-500">Car not found.</p>;

  return (
    <div>
      <PageHeader title={`Edit ${car.name}`} description="Update car details." />
      <CarForm initial={car} carId={car._id} />
    </div>
  );
}
