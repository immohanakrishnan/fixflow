import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
import { hashPassword } from "../../../lib/password";
import { audit } from "../../../lib/audit";

const rowSchema = z.object({
  tenantName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  propertyName: z.string().min(2),
  unit: z.string().min(1),
});
const schema = z.object({ rows: z.array(rowSchema).min(1).max(500) });

export async function GET() {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  return NextResponse.json(
    await prisma.tenant.findMany({
      include: { user: true, property: true, unit: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  );
}

export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const results = [];
  for (const row of parsed.data.rows) {
    const property = await prisma.property.findFirst({
      where: { name: row.propertyName },
    });
    if (!property)
      return NextResponse.json(
        { error: `Property not found: ${row.propertyName}` },
        { status: 400 },
      );
    const unit = await prisma.unit.findFirst({
      where: { propertyId: property.id, label: row.unit },
    });
    if (!unit)
      return NextResponse.json(
        { error: `Unit not found: ${row.unit} at ${row.propertyName}` },
        { status: 400 },
      );
    const user = await prisma.user.upsert({
      where: { email: row.email },
      update: { name: row.tenantName, phone: row.phone, role: "TENANT" },
      create: {
        name: row.tenantName,
        email: row.email,
        phone: row.phone,
        passwordHash: hashPassword("ChangeMe123!"),
        role: "TENANT",
      },
    });
    const tenant = await prisma.tenant.upsert({
      where: { userId: user.id },
      update: {
        propertyId: property.id,
        unitId: unit.id,
        status: "ACTIVE",
        deletedAt: null,
        updatedById: auth.session.user.id,
      },
      create: {
        userId: user.id,
        propertyId: property.id,
        unitId: unit.id,
        createdById: auth.session.user.id,
        updatedById: auth.session.user.id,
      },
    });
    await audit(
      "Tenant",
      tenant.id,
      "UPDATE",
      auth.session.user.id,
      undefined,
      { ...tenant, userId: user.id, propertyId: property.id, unitId: unit.id },
    );
    const existing = await prisma.tenantOccupancy.findFirst({
      where: { userId: user.id, unitId: unit.id, endedAt: null },
    });
    if (!existing)
      await prisma.tenantOccupancy.create({
        data: {
          userId: user.id,
          unitId: unit.id,
          tenantId: tenant.id,
          createdById: auth.session.user.id,
          updatedById: auth.session.user.id,
        },
      });
    results.push(tenant);
  }
  return NextResponse.json({ imported: results.length }, { status: 201 });
}
