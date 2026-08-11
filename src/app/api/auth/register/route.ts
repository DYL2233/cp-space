import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { username, password, displayName, inviteCode } = await request.json();

    if (!username || !password || !displayName || !inviteCode) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 30) {
      return NextResponse.json(
        { error: "用户名需要 2-30 个字符" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 个字符" },
        { status: 400 }
      );
    }

    // Verify invite code (case-insensitive — normalize to uppercase)
    const normalizedCode = inviteCode.trim().toUpperCase();
    const code = await prisma.inviteCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!code || !code.isActive) {
      return NextResponse.json(
        { error: "邀请码无效" },
        { status: 400 }
      );
    }

    if (code.usedCount >= code.maxUses) {
      return NextResponse.json(
        { error: "邀请码已达到使用上限" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "用户名已被使用" },
        { status: 400 }
      );
    }

    // Create user and update invite code usage
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        displayName,
      },
    });

    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { usedCount: { increment: 1 } },
    });

    // Auto login after registration
    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.displayName = user.displayName;
    await session.save();

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
