import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
export async function GET() {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const [byCategory, byProperty, byPriority, resolved] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["propertyId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.ticket.count({
      where: { deletedAt: null, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
  ]);
  return NextResponse.json({ byCategory, byProperty, byPriority, resolved });
}
