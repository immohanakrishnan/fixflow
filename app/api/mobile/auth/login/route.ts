import { NextResponse } from "next/server";
import { z } from "zod";
import { mobileLogin } from "../../../../../lib/mobile-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success)
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const result = await mobileLogin(body.data.email, body.data.password);
  if (!result)
    return NextResponse.json({ error: "Invalid mobile credentials." }, { status: 401 });
  return NextResponse.json(result);
}
