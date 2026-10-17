import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireSession } from "../../../../../lib/permissions";
import { audit } from "../../../../../lib/audit";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN"]);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  const before = await (prisma as any).ticket.findUnique({ where: { id } });
  if (!before)
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (before.status !== "RESOLVED")
    return NextResponse.json(
      { error: "Only resolved tickets can be billed and closed" },
      { status: 409 },
    );
  const updated = await (prisma as any).ticket.update({
    where: { id },
    data: {
      billingCompleted: true,
      billingCompletedAt: new Date(),
      billingCompletedById: auth.session.user.id,
      status: "CLOSED",
      updatedById: auth.session.user.id,
      history: {
        create: {
          fromStatus: before.status,
          toStatus: "CLOSED",
          note: "Billing completed",
          actorId: auth.session.user.id,
        },
      },
    },
  });
  await audit("Ticket", id, "UPDATE", auth.session.user.id, before, updated);
  return NextResponse.json(updated);
}
