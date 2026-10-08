import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BookingStatus } from "@/types";

const VARIANT: Record<BookingStatus, NonNullable<BadgeProps["variant"]>> = {
  PAYMENT_PENDING: "warning",
  PAYMENT_FAILED: "destructive",
  CONFIRMED: "lime",
  CAR_ASSIGNED: "lime",
  ACTIVE: "lime",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const LABEL: Record<BookingStatus, string> = {
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_FAILED: "Payment Failed",
  CONFIRMED: "Confirmed",
  CAR_ASSIGNED: "Car Assigned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
