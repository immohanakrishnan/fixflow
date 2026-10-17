import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { findAuthorizedTicket, requireSession } from "../../../../../lib/permissions";
const schema = z.object({ body: z.string().min(1).max(2000) });
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const ticket = await findAuthorizedTicket((await params).id, auth.session.user);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json(
    await prisma.ticketComment.findMany({
      where: { ticketId: (await params).id },
      include: { author: { select: { name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    }),
  );
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const ticket = await findAuthorizedTicket((await params).id, auth.session.user);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: (await params).id,
      authorId: auth.session.user.id,
      body: body.data.body,
    },
    include: { author: { select: { name: true, role: true } } },
  });
  return NextResponse.json(comment, { status: 201 });
}
