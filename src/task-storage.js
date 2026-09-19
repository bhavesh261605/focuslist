/** Shared task boundary: browser storage and UI mutations use the same schema. */
export const TASK_KEY = "focuslist.tasks.v1";
export const PRIORITIES = ["High", "Medium", "Low"];
export const TITLE_LIMIT = 200;
export function validTitle(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= TITLE_LIMIT
  );
}
export function normalizeTasks(value) {
  if (!Array.isArray(value)) throw new Error("Saved tasks must be an array.");
  const seen = new Set();
  let pins = 0;
  let discarded = 0;
  const tasks = [];
  for (const item of value) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      item.id.length > 128 ||
      seen.has(item.id) ||
      !validTitle(item.title) ||
      !PRIORITIES.includes(item.priority) ||
      typeof item.completed !== "boolean"
    ) {
      discarded++;
      continue;
    }
    seen.add(item.id);
    const focused = item.focused === true && !item.completed && pins < 3;
    if (focused) pins++;
    // Keep only known fields. Text remains text: React escapes it when rendered.
    tasks.push({
      id: item.id,
      title: item.title.trim(),
      priority: item.priority,
      completed: item.completed,
      focused,
      createdAt:
        typeof item.createdAt === "number" &&
        Number.isFinite(item.createdAt) &&
        item.createdAt >= 0 &&
        item.createdAt <= 8640000000000000
          ? item.createdAt
          : 0,
    });
  }
  return { tasks, discarded };
}
export function readTasks() {
  try {
    const raw = localStorage.getItem(TASK_KEY);
    if (!raw) return { tasks: [], warning: "" };
    const result = normalizeTasks(JSON.parse(raw));
    return {
      tasks: result.tasks,
      warning: result.discarded
        ? "Some saved entries were invalid. Valid tasks were recovered; stored data stays unchanged until you make an edit."
        : "",
    };
  } catch {
    return {
      tasks: [],
      warning:
        "Saved tasks could not be read. Stored data stays unchanged until you make an edit.",
    };
  }
}
export function restoreDeleted(tasks, deleted) {
  if (!deleted || tasks.some((t) => t.id === deleted.task.id)) return tasks;
  const next = [...tasks];
  const focused =
    deleted.task.focused &&
    !deleted.task.completed &&
    tasks.filter((t) => t.focused && !t.completed).length < 3;
  next.splice(Math.min(deleted.index, next.length), 0, {
    ...deleted.task,
    focused: !!focused,
  });
  return next;
}
