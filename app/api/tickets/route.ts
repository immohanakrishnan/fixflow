import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
import { audit } from "../../../lib/audit";
const schema = z.object({
  issue: z.string().min(3),
  category: z.string().min(2),
  priority: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]),
  propertyId: z.string(),
  unitId: z.string(),
});
export async function GET(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const view = new URL(request.url).searchParams.get("view");
  return NextResponse.json(
    await prisma.ticket.findMany({
      where: {
        deletedAt: null,
        ...(view === "active"
          ? { status: { notIn: ["RESOLVED", "CLOSED"] } }
          : {}),
      },
      include: {
        property: true,
        unit: true,
        request: true,
        assignments: { include: { technician: { include: { user: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}
export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const ticket = await prisma.ticket.create({
    data: {
      ...body.data,
      code: `FF-${Math.floor(1000 + Math.random() * 8999)}`,
      status: "OPEN",
      createdById: auth.session.user.id,
      updatedById: auth.session.user.id,
    },
  });
  await audit(
    "Ticket",
    ticket.id,
    "CREATE",
    auth.session.user.id,
    undefined,
    ticket,
  );
  return NextResponse.json(ticket, { status: 201 });
}
