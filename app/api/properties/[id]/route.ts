import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { audit } from "../../../../lib/audit";
const schema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  city: z.string().min(2).optional(),
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
  const id = (await params).id;
  const before = await prisma.property.findUnique({ where: { id } });
  const updated = await prisma.property.update({
    where: { id },
    data: { ...body.data, updatedById: auth.session.user.id },
  });
  await audit("Property", id, "UPDATE", auth.session.user.id, before, updated);
  return NextResponse.json(updated);
}
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property)
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const updated = await prisma.property.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deletedAt: new Date(),
      updatedById: auth.session.user.id,
    },
  });
  await audit(
    "Property",
    id,
    "DELETE",
    auth.session.user.id,
    property,
    updated,
  );
  return NextResponse.json({ deleted: true, record: updated });
}
