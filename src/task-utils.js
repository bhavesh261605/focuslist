export function taskStatistics(tasks) {
  const completed = tasks.reduce(
    (count, task) => count + Number(task.completed),
    0,
  );
  return { total: tasks.length, completed, pending: tasks.length - completed };
}
export function selectTasks(
  tasks,
  { status = "All", priority = "All", search = "", sort = "newest" } = {},
) {
  const query = search.trim().toLocaleLowerCase();
  const rank = { High: 0, Medium: 1, Low: 2 };
  return tasks
    .filter(
      (task) =>
        (status === "All" || task.completed === (status === "Completed")) &&
        (priority === "All" || task.priority === priority) &&
        task.title.toLocaleLowerCase().includes(query),
    )
    .sort((a, b) => {
      if (sort === "priority")
        return (
          rank[a.priority] - rank[b.priority] ||
          (b.createdAt || 0) - (a.createdAt || 0)
        );
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "oldest") return (a.createdAt || 0) - (b.createdAt || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
}

// Focus selection is deterministic: a user's pinned choices come first, then
// priority and oldest creation time. No remote scoring or invented AI ranking.
export function getFocusQueue(tasks) {
  const active = selectTasks(tasks, { status: "Active", sort: "oldest" });
  const rank = { High: 0, Medium: 1, Low: 2 };
  return active.sort(
    (a, b) =>
      Number(!!b.focused) - Number(!!a.focused) ||
      rank[a.priority] - rank[b.priority],
  );
}
