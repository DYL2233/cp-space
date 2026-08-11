"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: { id: string; displayName: string; avatar: string };
  completedBy: { id: string; displayName: string } | null;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [error, setError] = useState("");

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      setTitle("");
      setDescription("");
      fetchTodos();
    } catch {
      setError("添加失败，请稍后重试");
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (res.ok) {
        fetchTodos();
      }
    } catch {
      // ignore
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm("确定要删除这条待办吗？")) return;

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTodos();
      }
    } catch {
      // ignore
    }
  }

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <ProtectedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">✅ 共享待办</h1>
            <p className="text-gray-400 text-sm mt-1">
              {activeCount} 个待完成
            </p>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={addTodo} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="添加新的待办事项..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-xl transition cursor-pointer whitespace-nowrap"
            >
              + 添加
            </button>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="备注（可选）"
            className="w-full mt-3 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "all", label: "全部" },
            { key: "active", label: "未完成" },
            { key: "completed", label: "已完成" },
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

        {/* Todo List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-400">
              {filter === "all" ? "还没有待办事项" : filter === "active" ? "没有未完成的待办" : "还没有已完成的待办"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-xl shadow-sm border p-4 flex items-start gap-3 transition ${
                  todo.completed ? "border-gray-100 opacity-75" : "border-gray-100"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo)}
                  className="mt-0.5 text-xl cursor-pointer flex-shrink-0"
                  title={todo.completed ? "标记为未完成" : "标记为完成"}
                >
                  {todo.completed ? "✅" : "⬜"}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      todo.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>创建：{todo.createdBy.displayName}</span>
                    {todo.completed && todo.completedBy && (
                      <span className="text-green-500">
                        完成：{todo.completedBy.displayName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
