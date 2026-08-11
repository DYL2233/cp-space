import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // Generate a random 8-character code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        maxUses: 2,
        usedCount: 0,
        isActive: true,
      },
    });

    return NextResponse.json({ code: inviteCode.code }, { status: 201 });
  } catch (error) {
    console.error("Generate invite code error:", error);
    return NextResponse.json(
      { error: "生成邀请码失败" },
      { status: 500 }
    );
  }
}
