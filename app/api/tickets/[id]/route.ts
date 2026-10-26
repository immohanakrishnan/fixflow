import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { audit } from "../../../../lib/audit";
const schema = z.object({
  issue: z.string().min(3),
  description: z.string().min(5).optional(),
  category: z.string().min(2),
  priority: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  slaDue: z.string().nullable().optional(),
  technicianId: z.string().nullable().optional(),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const { technicianId, slaDue, description, ...ticketData } = body.data;
  if (slaDue) {
    const due = new Date(slaDue);
    if (Number.isNaN(due.getTime()) || due <= new Date()) {
      return NextResponse.json(
        { error: "SLA due date must be in the future" },
        { status: 400 },
      );
    }
  }
  const id = (await params).id;
  const before = await prisma.ticket.findUnique({
    where: { id },
    include: { assignments: true },
  });
  if (technicianId) {
    const tech = await prisma.technicianProfile.findUnique({
      where: { id: technicianId },
    });
    if (!tech || !tech.active)
      return NextResponse.json(
        { error: "Technician unavailable" },
        { status: 400 },
      );
  }
  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data: {
        ...ticketData,
        ...(slaDue !== undefined
          ? { slaDue: slaDue ? new Date(slaDue) : null }
          : {}),
        ...(technicianId ? { status: "ASSIGNED" } : {}),
        updatedById: auth.session.user.id,
      },
    });
    if (description !== undefined && before?.requestId) {
      await tx.maintenanceRequest.update({
        where: { id: before.requestId },
        data: {
          title: body.data.issue,
          description,
          updatedById: auth.session.user.id,
        },
      });
    }
    if (technicianId) {
      await tx.ticketAssignment.deleteMany({ where: { ticketId: id } });
      await tx.ticketAssignment.create({
        data: {
          ticketId: id,
          technicianId,
          approvedById: auth.session.user.id,
          approvedAt: new Date(),
          createdById: auth.session.user.id,
          updatedById: auth.session.user.id,
        },
      });
    }
    return updated;
  });
  await audit("Ticket", id, "UPDATE", auth.session.user.id, before, ticket);
  return NextResponse.json(ticket);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const before = await prisma.ticket.findUnique({ where: { id } });
  if (!before)
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  const updated = await prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: auth.session.user.id },
  });
  await audit("Ticket", id, "DELETE", auth.session.user.id, before, updated);
  return NextResponse.json({ deleted: true, record: updated });
}
