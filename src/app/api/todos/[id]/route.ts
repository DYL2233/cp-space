import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, dueDate, completed } = body;

    // Check todo exists
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "待办不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    // Handle completion toggle
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) {
        updateData.completedByUserId = session.userId;
        updateData.completedAt = new Date();
      } else {
        updateData.completedByUserId = null;
        updateData.completedAt = null;
      }
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        completedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Update todo error:", error);
    return NextResponse.json({ error: "更新待办失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "待办不存在" }, { status: 404 });
    }

    await prisma.todo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete todo error:", error);
    return NextResponse.json({ error: "删除待办失败" }, { status: 500 });
  }
}
