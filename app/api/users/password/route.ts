import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireSession } from "../../../../lib/permissions";
import { hashPassword } from "../../../../lib/password";
import { audit } from "../../../../lib/audit";

const schema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8),
});

export async function PATCH(request: Request) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Password must contain at least 8 characters." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!user || !["TENANT", "TECHNICIAN"].includes(user.role))
    return NextResponse.json({ error: "Tenant or technician user not found." }, { status: 404 });

  if (user.role === "TENANT") {
    const tenant = await prisma.tenant.findUnique({
      where: { userId: user.id },
      select: { status: true, deletedAt: true },
    });
    if (!tenant || tenant.status !== "ACTIVE" || tenant.deletedAt)
      return NextResponse.json({ error: "Inactive tenants cannot change passwords." }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.password) },
  });
  await prisma.mobileSession.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await audit("User", user.id, "UPDATE", auth.session.user.id);
  return NextResponse.json({ updated: true });
}
