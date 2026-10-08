"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/page-header";
import { apiFetch, ApiClientError } from "@/lib/api";
import { toast } from "@/store/toast-store";
import type { AdminCarDoc, AdminLocationDoc } from "@/types";

export default function OfflineBookingPage() {
  const router = useRouter();
  const [cars, setCars] = useState<AdminCarDoc[]>([]);
  const [locations, setLocations] = useState<AdminLocationDoc[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [carId, setCarId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [dropLocationId, setDropLocationId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("10:00");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("OFFLINE_CASH");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    apiFetch<AdminCarDoc[]>("/admin/cars?limit=200").then((res) => setCars(res.data)).catch(() => {});
    apiFetch<AdminLocationDoc[]>("/admin/locations").then((res) => setLocations(res.data)).catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId || !customerName || !mobile || !pickupLocationId || !dropLocationId || !pickupDate || !dropDate || !totalAmount) {
      toast({ title: "Missing fields", description: "Fill in all required fields.", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/admin/bookings/offline", {
        method: "POST",
        body: JSON.stringify({
          carId,
          customerName,
          mobile,
          email: email || undefined,
          pickupLocationId,
          dropLocationId,
          pickupDate,
          pickupTime,
          dropDate,
          dropTime,
          totalAmount: Number(totalAmount),
          paymentMethod,
          adminNotes: adminNotes || undefined,
        }),
      });
      toast({ title: "Offline booking created", description: "The booking has been confirmed.", variant: "success" });
      router.push("/admin/bookings");
    } catch (err) {
      toast({
        title: "Could not create booking",
        description: err instanceof ApiClientError ? err.message : "Try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Offline Booking" description="Create a manually confirmed booking for a phone/WhatsApp enquiry." />

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Customer & Car</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Customer Name</Label>
              <Input className="mt-1.5" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label>Mobile</Label>
              <Input className="mt-1.5" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9XXXXXXXXX" />
            </div>
            <div>
              <Label>Email (optional)</Label>
              <Input className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Car</Label>
              <Select value={carId} onValueChange={setCarId}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue placeholder="Select car" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Booking Details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Pickup Location</Label>
              <Select value={pickupLocationId} onValueChange={setPickupLocationId}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.city} · {l.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Drop Location</Label>
              <Select value={dropLocationId} onValueChange={setDropLocationId}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.city} · {l.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pickup Date</Label>
              <Input type="date" className="mt-1.5" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <Label>Pickup Time</Label>
              <Input type="time" className="mt-1.5" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
            </div>
            <div>
              <Label>Drop Date</Label>
              <Input type="date" className="mt-1.5" value={dropDate} onChange={(e) => setDropDate(e.target.value)} />
            </div>
            <div>
              <Label>Drop Time</Label>
              <Input type="time" className="mt-1.5" value={dropTime} onChange={(e) => setDropTime(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-navy-900">Payment</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Total Amount (₹)</Label>
              <Input type="number" className="mt-1.5" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1.5 h-12 rounded-2xl border border-navy-200 px-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE_CASH">Cash</SelectItem>
                  <SelectItem value="OFFLINE_UPI">UPI</SelectItem>
                  <SelectItem value="OFFLINE_OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea className="mt-1.5" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/bookings")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Create Booking
          </Button>
        </div>
      </form>
    </div>
  );
}
