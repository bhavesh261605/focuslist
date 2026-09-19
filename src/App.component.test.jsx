import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { FocusTimer, AppearanceControls } from "./Enhancements";
import { TASK_KEY } from "./task-storage";
const seed = (items) =>
  localStorage.setItem(
    TASK_KEY,
    JSON.stringify(
      items.map((t, i) => ({
        id: String(i),
        title: t.title,
        priority: t.priority || "Medium",
        completed: !!t.completed,
        createdAt: i + 1,
        focused: !!t.focused,
      })),
    ),
  );
async function add(user, title, priority = "Medium") {
  await user.type(
    screen.getByRole("textbox", { name: "New task title" }),
    title,
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Priority", exact: true }),
    priority,
  );
  await user.click(
    screen.getByRole("button", { name: "Add task", exact: true }),
  );
}
describe("Required task flows", () => {
  it("rejects blank titles and persists a task with its selected priority", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Add task", exact: true }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("title first");
    await add(user, "Ship demo", "High");
    expect(
      screen.getByRole("checkbox", { name: "Mark Ship demo as completed" }),
    ).not.toBeChecked();
    expect(JSON.parse(localStorage.getItem(TASK_KEY))[0]).toMatchObject({
      title: "Ship demo",
      priority: "High",
      completed: false,
    });
  });
  it("completion updates full-data statistics while filters combine", async () => {
    seed([
      { title: "Review demo", priority: "High" },
      { title: "Review notes", priority: "Low" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("checkbox", { name: "Mark Review demo as completed" }),
    );
    await user.click(
      within(
        screen.getByRole("group", { name: "Filter task status" }),
      ).getByRole("button", { name: "Completed", exact: true }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by priority" }),
      "High",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Search tasks by title" }),
      " REVIEW ",
    );
    expect(
      within(screen.getByRole("list", { name: "Task list" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /Total tasks 02/ }),
    ).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });
  it("edits title and priority and reloads the saved result", async () => {
    seed([{ title: "Original" }]);
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(screen.getByRole("button", { name: "Edit Original" }));
    const dialog = screen.getByRole("dialog");
    const title = within(dialog).getByRole("textbox", {
      name: "Task title",
      exact: true,
    });
    expect(title).toHaveFocus();
    await user.clear(title);
    await user.type(title, "Revised");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "Priority" }),
      "Low",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );
    view.unmount();
    render(<App />);
    expect(
      screen.getByRole("checkbox", { name: "Mark Revised as completed" }),
    ).toBeVisible();
    expect(JSON.parse(localStorage.getItem(TASK_KEY))[0].priority).toBe("Low");
  });
  it("keeps delete Undo available without a deadline", () => {
    seed([{ title: "Restore me" }]);
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Restore me" }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole("button", { name: "Undo" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      screen.getByRole("checkbox", { name: "Mark Restore me as completed" }),
    ).toBeVisible();
  });
  it("renders markup as inert text and recovers valid saved records", () => {
    localStorage.setItem(
      TASK_KEY,
      JSON.stringify([
        {
          id: "safe",
          title: "<img src=x onerror=alert(1)>",
          priority: "Low",
          completed: false,
        },
        { id: "bad", title: "", priority: "Critical" },
      ]),
    );
    render(<App />);
    expect(screen.getByRole("alert")).toHaveTextContent("recovered");
    expect(
      screen.getByRole("list", { name: "Task list" }).querySelector("img"),
    ).toBeNull();
    expect(
      within(screen.getByRole("list", { name: "Task list" })).getByRole(
        "checkbox",
      ),
    ).toBeVisible();
  });
  it("retains tasks in memory and announces storage failure", async () => {
    const user = userEvent.setup();
    render(<App />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota");
    });
    await add(user, "Keep this work");
    expect(
      screen.getByRole("checkbox", {
        name: "Mark Keep this work as completed",
      }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("could not save");
  });
  it("synchronizes task changes from another tab", () => {
    render(<App />);
    seed([{ title: "Another tab" }]);
    act(() =>
      window.dispatchEvent(new StorageEvent("storage", { key: TASK_KEY })),
    );
    expect(
      screen.getByRole("checkbox", { name: "Mark Another tab as completed" }),
    ).toBeVisible();
  });
  it("limits focus pins and completing the studio advances to another task", async () => {
    seed([
      { title: "A", focused: true },
      { title: "B", focused: true },
      { title: "C", focused: true },
      { title: "D" },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: "Pin D to focus queue" }),
    );
    expect(
      screen.getByRole("region", { name: "Your focus queue" }),
    ).toHaveTextContent("3/3");
    await user.click(
      screen.getByRole("button", { name: "Complete & move forward" }),
    );
    expect(
      screen.getByRole("region", { name: "Your focus queue" }),
    ).toHaveTextContent("2/3");
    expect(
      screen.getByRole("checkbox", { name: "Mark A as active" }),
    ).toBeChecked();
  });
});
describe("Preferences and timer", () => {
  it("persists dark mode and can disable single-key shortcuts", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("switch", { name: "Dark mode" }));
    expect(localStorage.getItem("focuslist.theme")).toBe("dark");
    await user.click(
      screen.getByLabelText("Display preferences and shortcuts"),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Enable single-key shortcuts" }),
    );
    await user.click(screen.getByRole("switch", { name: "Dark mode" }));
    await user.keyboard("n");
    expect(
      screen.getByRole("textbox", { name: "New task title" }),
    ).not.toHaveFocus();
  });
  it("pauses, resumes and completes using elapsed wall time", () => {
    vi.useFakeTimers();
    render(<FocusTimer />);
    fireEvent.click(screen.getByRole("button", { name: "5 min" }));
    fireEvent.click(screen.getByRole("button", { name: "Start focus timer" }));
    act(() => vi.advanceTimersByTime(65000));
    expect(screen.getByRole("timer")).toHaveTextContent("03:55");
    fireEvent.click(screen.getByRole("button", { name: "Pause focus timer" }));
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByRole("timer")).toHaveTextContent("03:55");
    fireEvent.click(screen.getByRole("button", { name: "Start focus timer" }));
    act(() => vi.advanceTimersByTime(235000));
    expect(screen.getByRole("status")).toHaveTextContent("Session complete");
  });
});
