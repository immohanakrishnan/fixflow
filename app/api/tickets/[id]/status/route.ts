import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { findAuthorizedTicket, requireSession } from "../../../../../lib/permissions";
import { ticketStatusSchema as schema } from "../../../../../features/tickets/ticket.schema";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession(["ADMIN", "TECHNICIAN", "TENANT"]);
  if ("response" in auth) return auth.response;
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const { id } = await params;
  const old = await findAuthorizedTicket(id, auth.session.user);
  if (!old)
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (
    body.data.status === "CLOSED" &&
    (!old.billingCompleted || auth.session.user.role !== "ADMIN")
  )
    return NextResponse.json(
      {
        error:
          "A ticket can be closed only after billing is completed by an administrator",
      },
      { status: 409 },
    );
  if (
    auth.session.user.role === "TENANT" &&
    !["CLOSED", "RESOLVED"].includes(body.data.status)
  )
    return NextResponse.json(
      { error: "Tenants may only confirm resolution or closure" },
      { status: 403 },
    );
  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      status: body.data.status,
      history: {
        create: {
          fromStatus: old.status,
          toStatus: body.data.status,
          note: body.data.note,
          actorId: auth.session.user.id,
        },
      },
    },
  });
  return NextResponse.json(updated);
}
