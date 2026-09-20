export const HOSTELS = ["CSA"] as const;

export type Hostel = (typeof HOSTELS)[number];

export function isHostel(value: unknown): value is Hostel {
  return typeof value === "string" && HOSTELS.includes(value as Hostel);
}
