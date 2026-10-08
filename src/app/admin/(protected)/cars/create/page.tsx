"use client";

import { PageHeader } from "@/components/admin/page-header";
import { CarForm } from "@/components/admin/car-form";

export default function CreateCarPage() {
  return (
    <div>
      <PageHeader title="Add Car" description="Add a new car to the fleet." />
      <CarForm />
    </div>
  );
}
