"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";

interface WishItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  price: number | null;
  priority: string;
  status: string;
  hidden: boolean;
  purchasedAt: string | null;
  createdBy: { id: string; displayName: string; avatar: string };
  purchasedBy: { id: string; displayName: string } | null;
}

export default function WishlistPage() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("medium");
  const [showForm, setShowForm] = useState(false);

  // Filter
  const [filter, setFilter] = useState<"all" | "mine" | "theirs" | "purchased">("all");

  const fetchWishes = useCallback(async () => {
    try {
      const [wishRes, sessionRes] = await Promise.all([
        fetch("/api/wishlist"),
        fetch("/api/auth/session"),
      ]);

      if (wishRes.ok) {
        const data = await wishRes.json();
        setWishes(data);
      }
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        if (session) setCurrentUserId(session.userId);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  async function addWish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          link: link.trim() || null,
          price: price || null,
          priority,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setTitle("");
      setDescription("");
      setLink("");
      setPrice("");
      setPriority("medium");
      setShowForm(false);
      fetchWishes();
    } catch {
      setError("添加失败");
    }
  }

  async function purchaseWish(wish: WishItem) {
    const confirmMsg =
      "确定标记为已购买吗？\n\n购买后对方将看不到这条心愿（惊喜模式），直到你选择公开。";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/wishlist/${wish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase: true }),
      });

      if (res.ok) {
        fetchWishes();
      }
    } catch {
      // ignore
    }
  }

  async function deleteWish(id: string) {
    if (!confirm("确定要删除这条心愿吗？")) return;

    try {
      const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      fetchWishes();
    } catch {
      // ignore
    }
  }

  const filteredWishes = wishes.filter((w) => {
    if (filter === "mine") return w.createdBy.id === currentUserId && w.status === "active";
    if (filter === "theirs") return w.createdBy.id !== currentUserId && w.status === "active";
    if (filter === "purchased") return w.status === "purchased";
    return true;
  });

  const priorityLabel = (p: string) => {
    switch (p) {
      case "high": return { text: "非常想要", color: "bg-red-100 text-red-600" };
      case "medium": return { text: "想要", color: "bg-yellow-100 text-yellow-700" };
      case "low": return { text: "随便看看", color: "bg-gray-100 text-gray-500" };
      default: return { text: p, color: "bg-gray-100 text-gray-500" };
    }
  };

  const formatPrice = (p: number | null) => {
    if (!p) return null;
    return `¥${p.toLocaleString()}`;
  };

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">💝 心愿单</h1>
            <p className="text-gray-400 text-sm mt-1">
              {wishes.filter((w) => w.status === "active").length} 个待实现
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition cursor-pointer"
          >
            {showForm ? "收起" : "+ 添加心愿"}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <form
            onSubmit={addWish}
            className="bg-white rounded-xl shadow-sm border border-pink-100 p-5 mb-6 space-y-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="想要什么？*"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              required
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述（可选）"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
              />
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="链接（可选）"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="价格（可选）"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white"
              >
                <option value="high">⭐ 非常想要</option>
                <option value="medium">💝 想要</option>
                <option value="low">👀 随便看看</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition cursor-pointer"
            >
              添加心愿
            </button>
          </form>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: "all", label: "全部" },
            { key: "mine", label: "我的心愿" },
            { key: "theirs", label: "TA 的心愿" },
            { key: "purchased", label: "已购买" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition cursor-pointer ${
                filter === f.key
                  ? "bg-pink-500 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Wishlist */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filteredWishes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-3">💝</div>
            <p className="text-gray-400">
              {filter === "all" ? "心愿单还是空的" : "没有符合条件的心愿"}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              添加你想要的东西，或者作为礼物的灵感
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredWishes.map((wish) => {
              const isMine = wish.createdBy.id === currentUserId;
              const isPurchased = wish.status === "purchased";
              const prio = priorityLabel(wish.priority);

              return (
                <div
                  key={wish.id}
                  className={`bg-white rounded-xl shadow-sm border p-4 ${
                    isPurchased ? "border-green-200 bg-green-50/30" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium ${
                          isPurchased ? "text-gray-500" : "text-gray-800"
                        }`}
                      >
                        {isPurchased ? "🎁 " : ""}
                        {wish.title}
                      </h3>
                      {wish.description && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          {wish.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${prio.color}`}
                    >
                      {prio.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm mb-3">
                    {wish.price && (
                      <span className="text-pink-500 font-medium">
                        {formatPrice(wish.price)}
                      </span>
                    )}
                    {wish.link && (
                      <a
                        href={wish.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-500 text-xs truncate"
                      >
                        🔗 查看链接
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div>
                      {isPurchased ? (
                        <span className="text-green-500 font-medium">
                          {isMine
                            ? `已由 ${wish.purchasedBy?.displayName || "?"} 购买`
                            : `你已购买`}
                          {wish.hidden && isMine === false && (
                            <span className="text-orange-400 ml-2">🔒 对方不可见</span>
                          )}
                          {wish.hidden && isMine && (
                            <span className="text-orange-400 ml-2">🔒 对你隐藏中</span>
                          )}
                        </span>
                      ) : (
                        <span>
                          {isMine ? "你" : wish.createdBy.displayName} 添加的
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPurchased && !isMine && (
                        <button
                          onClick={() => purchaseWish(wish)}
                          className="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full transition cursor-pointer"
                        >
                          我要买
                        </button>
                      )}
                      {isMine && (
                        <button
                          onClick={() => deleteWish(wish.id)}
                          className="text-gray-300 hover:text-red-400 transition cursor-pointer"
                          title="删除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
