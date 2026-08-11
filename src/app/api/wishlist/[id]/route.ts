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
    const { title, description, link, price, priority, purchase } = body;

    const existing = await prisma.wishItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "心愿不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (link !== undefined) updateData.link = link?.trim() || null;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (priority !== undefined) updateData.priority = priority;

    // Handle purchase action
    if (purchase === true) {
      // Can only purchase items created by the other person
      if (existing.createdByUserId === session.userId) {
        return NextResponse.json(
          { error: "不能购买自己创建的心愿" },
          { status: 400 }
        );
      }
      updateData.status = "purchased";
      updateData.purchasedByUserId = session.userId;
      updateData.purchasedAt = new Date();
      updateData.hidden = true; // Default: surprise mode, hide from partner
    }

    const wish = await prisma.wishItem.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        purchasedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(wish);
  } catch (error) {
    console.error("Update wish error:", error);
    return NextResponse.json({ error: "更新心愿失败" }, { status: 500 });
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

    const existing = await prisma.wishItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "心愿不存在" }, { status: 404 });
    }

    // Only creator can delete
    if (existing.createdByUserId !== session.userId) {
      return NextResponse.json(
        { error: "只能删除自己创建的心愿" },
        { status: 403 }
      );
    }

    await prisma.wishItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wish error:", error);
    return NextResponse.json({ error: "删除心愿失败" }, { status: 500 });
  }
}
