import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTasks, restoreDeleted, validTitle } from "./task-storage.js";
const task = {
  id: "a",
  title: " Task ",
  priority: "High",
  completed: false,
  createdAt: 1,
  focused: true,
};
test("storage rejects invalid records and deduplicates IDs without dropping valid tasks", () => {
  const result = normalizeTasks([
    task,
    { ...task },
    { ...task, id: "b", title: " " },
    { ...task, id: "c", priority: "Critical" },
  ]);
  assert.equal(result.discarded, 3);
  assert.equal(result.tasks[0].title, "Task");
});
test("normalization strips unknown fields and repairs invalid timestamps and focus values", () => {
  const result = normalizeTasks([
    { ...task, createdAt: "bad", focused: "yes", injected: "ignored" },
  ]);
  assert.deepEqual(result.tasks[0], {
    id: "a",
    title: "Task",
    priority: "High",
    completed: false,
    createdAt: 0,
    focused: false,
  });
});
test("undo cannot exceed the three-focus-task limit or duplicate existing IDs", () => {
  const tasks = [0, 1, 2].map((i) => ({ ...task, id: String(i) }));
  const next = restoreDeleted(tasks, { task, index: 0 });
  assert.equal(next.length, 4);
  assert.equal(next.filter((t) => t.focused).length, 3);
  assert.equal(restoreDeleted(next, { task, index: 0 }), next);
});
test("title length boundary and whitespace validation", () => {
  assert.equal(validTitle("x".repeat(200)), true);
  assert.equal(validTitle("x".repeat(201)), false);
  assert.equal(validTitle(" \n "), false);
});
