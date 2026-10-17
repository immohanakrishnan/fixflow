import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireSession } from "../../../../../lib/permissions";
import { assignmentSchema as schema } from "../../../../../features/tickets/ticket.schema";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const { id } = await params;
  const tech = await prisma.technicianProfile.findUnique({
    where: { id: body.data.technicianId },
  });
  if (!tech || !tech.active)
    return NextResponse.json(
      { error: "Technician unavailable" },
      { status: 400 },
    );
  const assignment = await prisma.ticketAssignment.create({
    data: {
      ticketId: id,
      technicianId: body.data.technicianId,
      approvedById: auth.session.user.id,
      approvedAt: new Date(),
    },
  });
  await prisma.ticket.update({ where: { id }, data: { status: "ASSIGNED" } });
  return NextResponse.json(assignment, { status: 201 });
}
