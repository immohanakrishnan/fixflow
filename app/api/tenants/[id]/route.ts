import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { audit } from "../../../../lib/audit";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  propertyName: z.string().min(2),
  unit: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const id = (await params).id;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!tenant)
    return NextResponse.json(
      { error: "Tenant assignment not found" },
      { status: 404 },
    );
  const property = await prisma.property.findFirst({
    where: { name: parsed.data.propertyName },
  });
  if (!property)
    return NextResponse.json(
      { error: `Property not found: ${parsed.data.propertyName}` },
      { status: 400 },
    );
  const unit = await prisma.unit.findFirst({
    where: { propertyId: property.id, label: parsed.data.unit },
  });
  if (!unit)
    return NextResponse.json(
      { error: `Unit not found: ${parsed.data.unit}` },
      { status: 400 },
    );
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: tenant.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
    });
    const assignment = await tx.tenant.update({
      where: { id },
      data: {
        propertyId: property.id,
        unitId: unit.id,
        updatedById: auth.session.user.id,
      },
      include: { property: true, unit: true },
    });
    return { ...assignment, user };
  });
  await audit("Tenant", id, "UPDATE", auth.session.user.id, tenant, updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant)
    return NextResponse.json(
      { error: "Tenant assignment not found" },
      { status: 404 },
    );
  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      status: "INACTIVE",
      deletedAt: new Date(),
      updatedById: auth.session.user.id,
    },
  });
  await audit("Tenant", id, "DELETE", auth.session.user.id, tenant, updated);
  return NextResponse.json({ deleted: true });
}
