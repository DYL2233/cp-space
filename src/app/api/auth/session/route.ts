import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      userId: session.userId,
      username: session.username,
      displayName: session.displayName,
    });
  } catch {
    return NextResponse.json(null);
  }
}
