import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
export async function GET() {
  return NextResponse.json(await getServerSession(authOptions));
}
