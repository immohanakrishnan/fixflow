import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
export async function GET() {
  const auth = await requireSession(["TECHNICIAN"]);
  if ("response" in auth) return auth.response;
  const tech = await prisma.technicianProfile.findUnique({
    where: { userId: auth.session.user.id },
  });
  if (!tech)
    return NextResponse.json(
      { error: "Technician profile not found" },
      { status: 404 },
    );
  return NextResponse.json(
    await prisma.ticket.findMany({
      where: {
        deletedAt: null,
        assignments: { some: { technicianId: tech.id } },
      },
      include: {
        property: true,
        unit: true,
        comments: { include: { author: { select: { name: true } } } },
        history: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  );
}
