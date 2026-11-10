import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { useApp } from "../state/app-state";
import type { Priority, Todo } from "../types";
import { Badge, Button, EmptyState, IconButton, Select, TextInput } from "../components/ui";

type Filter = "all" | "active" | "done";

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function TodoApp() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useApp();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const filtered = todos.filter((todo) => {
      if (filter === "active") return !todo.done;
      if (filter === "done") return todo.done;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      return b.createdAt - a.createdAt;
    });
  }, [todos, filter]);

  const completedCount = todos.filter((todo) => todo.done).length;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addTodo({ title, priority, due: due || null });
    setTitle("");
    setDue("");
    setPriority("medium");
  };

  const renderPriority = (todo: Todo) => {
    if (todo.priority === "high") {
      return (
        <Badge tone="rose">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> High
        </Badge>
      );
    }
    if (todo.priority === "low") {
      return (
        <Badge tone="neutral">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Low
        </Badge>
      );
    }
    return (
      <Badge tone="amber">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Medium
      </Badge>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <form onSubmit={submit} className="space-y-2 border-b border-slate-900/10 p-3 dark:border-white/10">
        <div className="flex gap-2">
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a task…"
            aria-label="Task title"
          />
          <Button type="submit" variant="primary" icon="plus">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            aria-label="Priority"
            className="w-auto py-1 text-xs"
          >
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </Select>
          <input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            aria-label="Due date"
            className="rounded-xl border border-slate-900/10 bg-white/70 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-orange-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 border-b border-slate-900/10 px-3 py-2 dark:border-white/10">
        {(["all", "active", "done"] as Filter[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition",
              filter === option
                ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                : "text-slate-500 hover:bg-slate-900/5 dark:text-slate-400 dark:hover:bg-white/10",
            )}
          >
            {option}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
          {completedCount}/{todos.length} done
        </span>
        {completedCount > 0 ? (
          <IconButton
            icon="trash"
            label="Remove completed tasks"
            size="sm"
            onClick={() =>
              todos.filter((todo) => todo.done).forEach((todo) => deleteTodo(todo.id))
            }
          />
        ) : null}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <EmptyState
            icon="checklist"
            title={todos.length === 0 ? "No tasks yet" : "Nothing in this view"}
            description={
              todos.length === 0
                ? "Add your first task — it is saved automatically."
                : "Switch filters to see the rest."
            }
          />
        ) : (
          <ul className="space-y-1.5">
            {visible.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition hover:border-slate-900/10 hover:bg-slate-900/5 dark:hover:border-white/10 dark:hover:bg-white/5"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={todo.done}
                  aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
                  onClick={() => toggleTodo(todo.id)}
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition",
                    todo.done
                      ? "border-transparent bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                      : "border-slate-400/60 text-transparent hover:border-orange-400",
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m4 12 5 5L20 6" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm",
                      todo.done
                        ? "text-slate-400 line-through dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200",
                    )}
                  >
                    {todo.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {renderPriority(todo)}
                    {todo.due ? (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        due {todo.due}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <IconButton
                    icon="refresh"
                    label="Cycle priority"
                    size="sm"
                    className="h-6 w-6"
                    onClick={() => {
                      const order: Priority[] = ["low", "medium", "high"];
                      const next = order[(order.indexOf(todo.priority) + 1) % order.length];
                      updateTodo(todo.id, { priority: next });
                    }}
                  />
                  <IconButton
                    icon="trash"
                    label="Delete task"
                    size="sm"
                    className="h-6 w-6 hover:text-rose-500"
                    onClick={() => deleteTodo(todo.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
