import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { audit } from "../../../../lib/audit";
const schema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  availability: z.string().optional(),
  active: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
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
  const tech = await prisma.technicianProfile.findUnique({
    where: { id },
    include: { user: true, skills: true },
  });
  if (!tech)
    return NextResponse.json(
      { error: "Technician not found" },
      { status: 404 },
    );
  const { name, phone, availability, active, skills } = body.data;
  if (skills) {
    await prisma.technicianSkill.deleteMany({ where: { technicianId: id } });
    await prisma.technicianSkill.createMany({
      data: skills.map((name) => ({ name, technicianId: id })),
    });
  }
  const updated = await prisma.technicianProfile.update({
    where: { id },
    data: {
      phone,
      availability,
      active,
      updatedById: auth.session.user.id,
      user: { update: { name } },
    },
    include: { user: true, skills: true },
  });
  await audit(
    "TechnicianProfile",
    id,
    "UPDATE",
    auth.session.user.id,
    tech,
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
  const tech = await prisma.technicianProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!tech)
    return NextResponse.json(
      { error: "Technician not found" },
      { status: 404 },
    );
  const updated = await prisma.technicianProfile.update({
    where: { id },
    data: {
      active: false,
      availability: "OFFLINE",
      deletedAt: new Date(),
      updatedById: auth.session.user.id,
    },
    include: { user: true, skills: true },
  });
  await audit(
    "TechnicianProfile",
    id,
    "DELETE",
    auth.session.user.id,
    tech,
    updated,
  );
  return NextResponse.json({ deleted: true, record: updated });
}
