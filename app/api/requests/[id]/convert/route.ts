import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireSession } from "../../../../../lib/permissions";
import { audit } from "../../../../../lib/audit";
const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  propertyId: z.string(),
  unitId: z.string(),
  category: z.string().min(2),
  priority: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]),
  slaDue: z.string().optional(),
  technicianId: z.string().min(1),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  if (body.data.slaDue) {
    const due = new Date(body.data.slaDue);
    if (Number.isNaN(due.getTime()) || due <= new Date()) {
      return NextResponse.json(
        { error: "SLA due date must be in the future" },
        { status: 400 },
      );
    }
  }
  const source = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { ticket: true },
  });
  if (!source)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const tech = await prisma.technicianProfile.findUnique({
    where: { id: body.data.technicianId },
  });
  if (!tech || !tech.active)
    return NextResponse.json(
      { error: "Technician unavailable" },
      { status: 400 },
    );
  const category = await prisma.category.findFirst({
    where: { name: body.data.category, active: true },
  });
  if (!category)
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  const data = {
    issue: body.data.title,
    category: body.data.category,
    categoryId: category.id,
    priority: body.data.priority,
    propertyId: body.data.propertyId,
    unitId: body.data.unitId,
    status: "ASSIGNED" as const,
    ...(body.data.slaDue ? { slaDue: new Date(body.data.slaDue) } : {}),
  };
  const ticket = await prisma.$transaction(async (tx) => {
    await tx.maintenanceRequest.update({
      where: { id: source.id },
      data: {
        title: body.data.title,
        description: body.data.description,
        category: body.data.category,
        categoryId: category.id,
        priority: body.data.priority,
        propertyId: body.data.propertyId,
        unitId: body.data.unitId,
        status: "CONVERTED",
        updatedById: auth.session.user.id,
      },
    });
    const created = source.ticket
      ? await tx.ticket.update({ where: { id: source.ticket.id }, data })
      : await tx.ticket.create({
          data: {
            ...data,
            code: `FF-${Math.floor(1000 + Math.random() * 8999)}`,
            requestId: source.id,
          },
        });
    if (body.data.technicianId) {
      await tx.ticketAssignment.deleteMany({ where: { ticketId: created.id } });
      await tx.ticketAssignment.create({
        data: {
          ticketId: created.id,
          technicianId: body.data.technicianId,
          approvedById: auth.session.user.id,
          approvedAt: new Date(),
        },
      });
    }
    return tx.ticket.findUnique({
      where: { id: created.id },
      include: {
        property: true,
        unit: true,
        assignments: { include: { technician: { include: { user: true } } } },
        request: true,
      },
    });
  });
  await audit(
    "Ticket",
    ticket!.id,
    source.ticket ? "UPDATE" : "CREATE",
    auth.session.user.id,
    source.ticket ?? undefined,
    ticket,
  );
  return NextResponse.json(ticket, { status: source.ticket ? 200 : 201 });
}
