import ProtectedLayout from "@/components/ProtectedLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  // Get the partner (the other user)
  const users = await prisma.user.findMany({
    where: { NOT: { id: session.userId } },
    select: { displayName: true, avatar: true },
  });
  const partner = users[0];

  // Get statistics
  const [todoCount, activeTodoCount, wishCount, activeWishCount] =
    await Promise.all([
      prisma.todo.count(),
      prisma.todo.count({ where: { completed: false } }),
      prisma.wishItem.count(),
      prisma.wishItem.count({ where: { status: "active" } }),
    ]);

  // Recent todos
  const recentTodos = await prisma.todo.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      createdBy: { select: { displayName: true } },
      completedBy: { select: { displayName: true } },
    },
  });

  // Recent wishes
  const recentWishes = await prisma.wishItem.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      createdBy: { select: { displayName: true } },
      purchasedBy: { select: { displayName: true } },
    },
  });

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-pink-400 to-rose-400 rounded-2xl p-6 sm:p-8 text-white mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            你好，{session.displayName} 👋
          </h1>
          {partner && (
            <p className="text-pink-100 text-lg">
              和 {partner.displayName} 的共享空间
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link href="/todos" className="no-underline">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-1">✅</div>
              <div className="text-2xl font-bold text-gray-800">{activeTodoCount}</div>
              <div className="text-sm text-gray-400">待完成</div>
            </div>
          </Link>
          <Link href="/todos" className="no-underline">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-1">📋</div>
              <div className="text-2xl font-bold text-gray-800">{todoCount}</div>
              <div className="text-sm text-gray-400">全部待办</div>
            </div>
          </Link>
          <Link href="/wishlist" className="no-underline">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-1">💝</div>
              <div className="text-2xl font-bold text-gray-800">{activeWishCount}</div>
              <div className="text-sm text-gray-400">未购心愿</div>
            </div>
          </Link>
          <Link href="/wishlist" className="no-underline">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="text-3xl mb-1">🎁</div>
              <div className="text-2xl font-bold text-gray-800">{wishCount}</div>
              <div className="text-sm text-gray-400">全部心愿</div>
            </div>
          </Link>
        </div>

        {/* Recent Items */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Recent Todos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">最近待办</h2>
              <Link href="/todos" className="text-sm text-pink-500 hover:text-pink-600">
                查看全部 →
              </Link>
            </div>
            {recentTodos.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                还没有待办事项，去添加一个吧
              </p>
            ) : (
              <ul className="space-y-2">
                {recentTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className={todo.completed ? "line-through text-gray-300" : "text-gray-700"}>
                      {todo.completed ? "✅" : "⬜"}
                    </span>
                    <span className={`flex-1 text-sm ${todo.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {todo.title}
                    </span>
                    <span className="text-xs text-gray-400">{todo.createdBy.displayName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Wishes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">最近心愿</h2>
              <Link href="/wishlist" className="text-sm text-pink-500 hover:text-pink-600">
                查看全部 →
              </Link>
            </div>
            {recentWishes.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                还没有心愿，去添加一个吧
              </p>
            ) : (
              <ul className="space-y-2">
                {recentWishes.map((wish) => (
                  <li
                    key={wish.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <span>{wish.status === "purchased" ? "🎁" : wish.priority === "high" ? "⭐" : "💝"}</span>
                    <span className={`flex-1 text-sm ${wish.status === "purchased" ? "text-gray-400" : "text-gray-700"}`}>
                      {wish.title}
                    </span>
                    <span className="text-xs text-gray-400">{wish.createdBy.displayName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
