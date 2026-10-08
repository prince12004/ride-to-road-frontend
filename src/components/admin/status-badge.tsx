import { Badge } from "@/components/ui/badge";
import type { BookingStatus, PaymentStatus, VerificationStatus } from "@/types";

const bookingStatusVariant: Record<BookingStatus, "navy" | "lime" | "outline" | "warning" | "success" | "destructive"> = {
  PAYMENT_PENDING: "warning",
  PAYMENT_FAILED: "destructive",
  CONFIRMED: "lime",
  CAR_ASSIGNED: "navy",
  ACTIVE: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={bookingStatusVariant[status] ?? "outline"}>{status.replace(/_/g, " ")}</Badge>;
}

const paymentStatusVariant: Record<PaymentStatus, "navy" | "lime" | "outline" | "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "outline",
  NOT_APPLICABLE: "outline",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentStatusVariant[status] ?? "outline"}>{status.replace(/_/g, " ")}</Badge>;
}

const verificationVariant: Record<VerificationStatus, "navy" | "lime" | "outline" | "warning" | "success" | "destructive"> = {
  NOT_SUBMITTED: "outline",
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return <Badge variant={verificationVariant[status] ?? "outline"}>{status.replace(/_/g, " ")}</Badge>;
}

const carStatusVariant: Record<string, "navy" | "lime" | "outline" | "warning" | "success" | "destructive"> = {
  AVAILABLE: "success",
  BOOKED: "navy",
  MAINTENANCE: "warning",
  INACTIVE: "outline",
};

export function CarStatusBadge({ status }: { status: string }) {
  return <Badge variant={carStatusVariant[status] ?? "outline"}>{status}</Badge>;
}
