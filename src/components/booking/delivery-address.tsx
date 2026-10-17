"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { Booking } from "@/types";

/**
 * The public booking page only receives a masked address (booking ids are
 * guessable). When the signed-in customer owns this booking, fetch the full
 * address from their authenticated booking endpoint.
 */
export function DeliveryAddress({ bookingObjectId, maskedAddress }: { bookingObjectId: string; maskedAddress: string }) {
  const { user, isHydrated } = useAuthStore();
  const [fullAddress, setFullAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !user) return;
    apiFetch<{ booking: Booking }>(`/bookings/me/${bookingObjectId}`)
      .then((res) => setFullAddress(res.data.booking.homeDelivery?.address ?? null))
      .catch(() => {});
  }, [isHydrated, user, bookingObjectId]);

  return (
    <div className="col-span-2 rounded-2xl bg-navy-50 p-3">
      <dt className="flex items-center gap-1.5 text-navy-400">
        <Truck className="size-3.5" /> Home Delivery Address
      </dt>
      <dd className="mt-1 whitespace-pre-line font-semibold text-navy-900">{fullAddress ?? maskedAddress}</dd>
    </div>
  );
}
