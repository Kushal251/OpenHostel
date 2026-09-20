import { NextResponse } from "next/server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const range =
    new URL(request.url).searchParams.get("range") || "day";

  const start = new Date();

  start.setHours(0, 0, 0, 0);

  if (range === "yesterday") {
    start.setDate(start.getDate() - 1);

    const end = new Date(start);

    end.setDate(end.getDate() + 1);

    return NextResponse.json(
      await prisma.mealTransaction.findMany({
        where: {
          userId: session.user.id,
          servedAt: {
            gte: start,
            lt: end,
          },
        },
        include: {
          mess: {
            select: {
              name: true,
            },
          },
          mealWindow: {
            select: {
              label: true,
            },
          },
        },
        orderBy: {
          servedAt: "desc",
        },
      }),
    );
  }

  if (range === "week") {
    start.setDate(start.getDate() - 6);
  }

  if (range === "month") {
    start.setDate(start.getDate() - 29);
  }

  return NextResponse.json(
    await prisma.mealTransaction.findMany({
      where: {
        userId: session.user.id,
        servedAt: {
          gte: start,
        },
      },
      include: {
        mess: {
          select: {
            name: true,
          },
        },
        mealWindow: {
          select: {
            label: true,
          },
        },
      },
      orderBy: {
        servedAt: "desc",
      },
    }),
  );
}