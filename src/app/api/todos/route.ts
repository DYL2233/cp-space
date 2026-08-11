import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        completedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Get todos error:", error);
    return NextResponse.json({ error: "获取待办失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { title, description, dueDate } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "请输入待办标题" }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdByUserId: session.userId,
      },
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        completedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Create todo error:", error);
    return NextResponse.json({ error: "创建待办失败" }, { status: 500 });
  }
}
