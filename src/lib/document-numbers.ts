/** Same rules as the API (booking.validator.ts): spaces/dashes removed, upper-cased, "" = not given. */
export const squashDocNumber = (v: string) => v.replace(/[\s-]/g, "").toUpperCase();

const RULES = {
  aadhaar: { test: /^[2-9]\d{11}$/, error: "Aadhaar number must be 12 digits" },
  drivingLicence: { test: /^[A-Z0-9]{8,20}$/, error: "Enter a valid driving licence number" },
  pan: { test: /^[A-Z]{5}\d{4}[A-Z]$/, error: "PAN must look like ABCDE1234F" },
} as const;

export function docNumberError(kind: keyof typeof RULES, value: string): string | null {
  const v = squashDocNumber(value);
  return v && !RULES[kind].test.test(v) ? RULES[kind].error : null;
}
