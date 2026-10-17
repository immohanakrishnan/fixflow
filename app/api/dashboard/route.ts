import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";

export async function GET() {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const [tickets, opened, triage, scheduled, overdue, emergencies] =
    await Promise.all([
      prisma.ticket.findMany({
        where: { deletedAt: null },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        take: 100,
        include: {
          property: true,
          unit: true,
          assignments: { include: { technician: { include: { user: true } } } },
        },
      }),
      prisma.ticket.count({
        where: { deletedAt: null, status: { not: "CLOSED" } },
      }),
      prisma.ticket.count({ where: { deletedAt: null, status: "TRIAGE" } }),
      prisma.appointment.count({ where: { startsAt: { gte: new Date() } } }),
      prisma.ticket.count({
        where: {
          deletedAt: null,
          slaDue: { lt: new Date() },
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      }),
      prisma.ticket.count({
        where: {
          deletedAt: null,
          priority: "EMERGENCY",
          status: { not: "CLOSED" },
        },
      }),
    ]);
  return NextResponse.json({
    kpis: { opened, triage, scheduled, overdue, emergencies },
    tickets,
  });
}
