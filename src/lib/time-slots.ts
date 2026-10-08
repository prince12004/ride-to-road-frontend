export interface TimeSlot {
  value: string;
  label: string;
}

/** 06:00 → 23:00 in 1-hour increments. */
export const TIME_SLOTS: TimeSlot[] = Array.from({ length: 18 }, (_, i) => {
  const h = 6 + i;
  const value = `${String(h).padStart(2, "0")}:00`;
  const label = `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
  return { value, label };
});

export function labelForTime(value: string) {
  return TIME_SLOTS.find((t) => t.value === value)?.label ?? value;
}
