import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time reset: clear all data and re-seed invite codes
export async function GET() {
  return handleReset();
}

export async function POST() {
  return handleReset();
}

async function handleReset() {
  try {
    await prisma.todo.deleteMany();
    await prisma.wishItem.deleteMany();
    await prisma.user.deleteMany();
    await prisma.inviteCode.deleteMany();

    await prisma.inviteCode.create({
      data: { code: "COUPLE2024", maxUses: 2, usedCount: 0, isActive: true },
    });
    await prisma.inviteCode.create({
      data: { code: "LOVESPACE2024", maxUses: 2, usedCount: 0, isActive: true },
    });

    return NextResponse.json({ ok: true, message: "数据库已重置" });
  } catch (e) {
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
