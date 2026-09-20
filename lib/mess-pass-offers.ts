import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Pass offers do not expire on their own. The offer mutation route explicitly
// invalidates this tag, so every add, activation change, or deletion is visible
// immediately without paying for repeat database reads.
export const getCachedMessPassOffers = unstable_cache(
  (messId: string, includeInactive = false) =>
    prisma.messPassOffer.findMany({
      where: includeInactive ? { messId } : { messId, active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["mess-pass-offers"],
  { revalidate: false, tags: ["mess-pass-offers"] },
);
