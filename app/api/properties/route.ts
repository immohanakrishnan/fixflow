import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
import { z } from "zod";
import { audit } from "../../../lib/audit";
const schema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  city: z.string().min(2).default("Riyadh"),
  unitCount: z.number().int().min(0).max(500).default(0),
});
export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  if (auth.session.user.role === "TENANT") {
    const tenant = await prisma.tenant.findUnique({
      where: { userId: auth.session.user.id },
      include: { property: true, unit: true },
    });
    if (!tenant || tenant.status !== "ACTIVE" || tenant.deletedAt)
      return NextResponse.json([]);
    return NextResponse.json([
      {
        ...tenant.property,
        units: [tenant.unit],
        _count: { tickets: 0 },
      },
    ]);
  }
  return NextResponse.json(
    await prisma.property.findMany({
      include: { units: true, _count: { select: { tickets: true } } },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
  );
}
export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const { unitCount, ...property } = body.data;
  const created = await prisma.property.create({
    data: {
      ...property,
      createdById: auth.session.user.id,
      updatedById: auth.session.user.id,
      units: {
        create: Array.from({ length: unitCount }, (_, i) => ({
          label: `Apt ${101 + i}`,
          createdById: auth.session.user.id,
          updatedById: auth.session.user.id,
        })),
      },
    },
    include: { units: true },
  });
  await audit(
    "Property",
    created.id,
    "CREATE",
    auth.session.user.id,
    undefined,
    created,
  );
  return NextResponse.json(created, { status: 201 });
}
