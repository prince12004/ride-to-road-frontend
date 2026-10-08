import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

const ORDER: BookingStatus[] = ["PAYMENT_PENDING", "CONFIRMED", "CAR_ASSIGNED", "ACTIVE", "COMPLETED"];
const LABELS: Record<string, string> = {
  PAYMENT_PENDING: "Booking Created",
  CONFIRMED: "Payment Confirmed",
  CAR_ASSIGNED: "Car Assigned",
  ACTIVE: "Trip Active",
  COMPLETED: "Completed",
};

export function BookingStatusTimeline({ status }: { status: BookingStatus }) {
  if (status === "CANCELLED" || status === "PAYMENT_FAILED") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        <XCircle className="size-5" />
        {status === "CANCELLED" ? "This booking has been cancelled." : "Payment was not completed for this booking."}
      </div>
    );
  }

  const currentIndex = ORDER.indexOf(status);

  return (
    <div>
      {ORDER.map((step, i) => {
        const isDone = i <= currentIndex;
        const isLast = i === ORDER.length - 1;
        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              {isDone ? <CheckCircle2 className="size-5 text-lime-600" /> : <Circle className="size-5 text-navy-200" />}
              {!isLast && <div className={cn("w-px flex-1", isDone ? "bg-lime" : "bg-navy-200")} style={{ minHeight: 24 }} />}
            </div>
            <p className={cn("pb-6 text-sm", isDone ? "font-semibold text-navy-900" : "text-navy-400")}>{LABELS[step]}</p>
          </div>
        );
      })}
    </div>
  );
}
