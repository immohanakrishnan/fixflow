import { NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/permissions";

export async function GET() {
  const auth = await requireSession(["TENANT", "TECHNICIAN"]);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ user: auth.session.user });
}
