import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const wishes = await prisma.wishItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        purchasedBy: { select: { id: true, displayName: true } },
      },
    });

    // Filter: hide surprise-purchased items from the creator
    const filtered = wishes.filter((wish) => {
      // Purchaser always sees their purchased items
      if (wish.purchasedByUserId === session.userId) return true;
      // Creator doesn't see items that are hidden (surprise mode)
      if (wish.createdByUserId === session.userId && wish.hidden) return false;
      // Everyone else sees it
      return true;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json({ error: "获取心愿单失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { title, description, link, price, priority } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "请输入心愿名称" }, { status: 400 });
    }

    const wish = await prisma.wishItem.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        link: link?.trim() || null,
        price: price ? parseFloat(price) : null,
        priority: priority || "medium",
        createdByUserId: session.userId,
      },
      include: {
        createdBy: { select: { id: true, displayName: true, avatar: true } },
        purchasedBy: { select: { id: true, displayName: true } },
      },
    });

    return NextResponse.json(wish, { status: 201 });
  } catch (error) {
    console.error("Create wish error:", error);
    return NextResponse.json({ error: "创建心愿失败" }, { status: 500 });
  }
}
