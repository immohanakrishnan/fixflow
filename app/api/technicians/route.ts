import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
import { technicianSchema as schema } from "../../../features/technicians/technician.schema";
import { audit } from "../../../lib/audit";
export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  return NextResponse.json(
    await prisma.technicianProfile.findMany({
      include: {
        user: true,
        skills: true,
        property: true,
        assignments: {
          where: { ticket: { status: { notIn: ["CLOSED", "RESOLVED"] } } },
        },
      },
    }),
  );
}
export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const { name, email, phone, skills, propertyId } = body.data;
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: "",
      role: "TECHNICIAN",
      technician: {
        create: {
          phone,
          propertyId,
          createdById: auth.session.user.id,
          updatedById: auth.session.user.id,
          skills: { create: skills.map((name) => ({ name })) },
        },
      },
    },
    include: { technician: { include: { skills: true } } },
  });
  await audit(
    "TechnicianProfile",
    created.technician!.id,
    "CREATE",
    auth.session.user.id,
    undefined,
    created,
  );
  return NextResponse.json(created, { status: 201 });
}
