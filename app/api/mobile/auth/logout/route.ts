import { NextResponse } from "next/server";
import { z } from "zod";
import { mobileLogout } from "../../../../../lib/mobile-auth";

const schema = z.object({ refreshToken: z.string().min(1) });

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return new NextResponse(null, { status: 204 });
  await mobileLogout(body.data.refreshToken);
  return new NextResponse(null, { status: 204 });
}
