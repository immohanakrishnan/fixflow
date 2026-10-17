import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { z } from "zod";
import { audit } from "../../../../lib/audit";
const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN", "TENANT"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const current = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (
    !current ||
    (auth.session.user.role === "TENANT" &&
      current.createdById !== auth.session.user.id)
  )
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: { ...body.data, updatedById: auth.session.user.id },
    include: { ticket: true },
  });
  await audit(
    "MaintenanceRequest",
    id,
    "UPDATE",
    auth.session.user.id,
    current,
    updated,
  );
  return NextResponse.json(updated);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { ticket: true },
  });
  if (!request)
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.maintenanceRequest.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: auth.session.user.id },
    });
    if (request.ticket)
      await tx.ticket.update({
        where: { id: request.ticket.id },
        data: { deletedAt: new Date(), updatedById: auth.session.user.id },
      });
    return saved;
  });
  await audit(
    "MaintenanceRequest",
    id,
    "DELETE",
    auth.session.user.id,
    request,
    updated,
  );
  return NextResponse.json({ deleted: true, record: updated });
}
