import { NextResponse } from "next/server";
import { z } from "zod";
import { mobileRefresh } from "../../../../../lib/mobile-auth";

const schema = z.object({ refreshToken: z.string().min(1) });

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: "Refresh token is required." }, { status: 400 });
  const result = await mobileRefresh(body.data.refreshToken);
  if (!result)
    return NextResponse.json({ error: "Refresh token is invalid or expired." }, { status: 401 });
  return NextResponse.json(result);
}
