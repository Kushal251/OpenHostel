import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canViewMess } from "@/lib/mess";
import { getCachedMessPassOffers } from "@/lib/mess-pass-offers";
import { getCachedMessProfile, getCachedMessProfilePass } from "@/lib/mess-profile";

function toIsoString(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = (await params).id;
  try {
    const mess = await getCachedMessProfile(id);
    if (!mess) return NextResponse.json({ error: "Mess not found" }, { status: 404 });
    if (!canViewMess(session.user.role, session.user.id, mess))
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const [passOffers, pass] = await Promise.all([
      getCachedMessPassOffers(id),
      getCachedMessProfilePass(id, session.user.id),
    ]);
    return NextResponse.json({ ...mess, passOffers, pass: pass && { ...pass, startsAt: toIsoString(pass.startsAt), expiresAt: toIsoString(pass.expiresAt), pauseEndsAt: toIsoString(pass.pauseEndsAt) } });
  } catch (error) {
    console.error("Unable to load mess profile details", error);
    return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
  }
}
