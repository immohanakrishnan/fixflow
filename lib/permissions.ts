import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { mobilePrincipalFromToken } from "./mobile-auth";
import { prisma } from "./prisma";

type ApiUser = { id: string; name?: string | null; email?: string | null; role: string };

function unauthorized() {
  return {
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  } as const;
}

export async function requireSession(roles?: string[]) {
  const authorization = (await headers()).get("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) return unauthorized();
    const mobileUser = await mobilePrincipalFromToken(token);
    if (!mobileUser) return unauthorized();
    if (roles && !roles.includes(mobileUser.role))
      return {
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      } as const;
    return { session: { user: mobileUser } } as { session: { user: ApiUser } };
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorized();
  if (roles && !roles.includes(session.user.role))
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  return { session } as const;
}

export async function findAuthorizedTicket(
  ticketId: string,
  user: { id: string; role: string },
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, deletedAt: null },
    include: {
      request: { select: { createdById: true } },
      assignments: { select: { technician: { select: { userId: true } } } },
    },
  });
  if (!ticket) return null;
  if (user.role === "ADMIN") return ticket;
  if (user.role === "TENANT" && ticket.request?.createdById === user.id) return ticket;
  if (
    user.role === "TECHNICIAN" &&
    ticket.assignments.some((assignment) => assignment.technician.userId === user.id)
  )
    return ticket;
  return null;
}
