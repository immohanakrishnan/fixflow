import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
export async function GET() {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  return NextResponse.json(
    await prisma.notification.findMany({
      where: { userId: auth.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  );
}
