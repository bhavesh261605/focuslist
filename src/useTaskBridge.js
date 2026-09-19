import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { PRIORITIES as priorities } from "./task-storage";
const uid = () => crypto.randomUUID();
export function useTaskBridge(actions, onCreate) {
  const reveal = useRef(onCreate);
  reveal.current = onCreate;
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Progressive enhancement; ordinary controls remain available. */
      }
    };
    register({
      name: "list_focuslist_tasks",
      title: "Read FocusList tasks",
      description:
        "Read the tasks stored in this browser, optionally searching titles. Returns real task data without modifying it.",
      inputSchema: {
        type: "object",
        properties: { search: { type: "string" } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        if (
          !input ||
          typeof input !== "object" ||
          (input.search !== undefined && typeof input.search !== "string") ||
          Object.keys(input).some((k) => k !== "search")
        )
          throw new Error("Provide an optional search string.");
        return {
          tasks: actions.current.tasks.filter((t) =>
            t.title
              .toLowerCase()
              .includes((input.search || "").trim().toLowerCase()),
          ),
        };
      },
    });
    register({
      name: "create_focuslist_tasks",
      title: "Add tasks to FocusList",
      description:
        "Create one or more tasks in this browser’s FocusList. Saves them locally and updates the visible task list.",
      inputSchema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: {
              type: "object",
              properties: {
                title: { type: "string", minLength: 1, maxLength: 200 },
                priority: { type: "string", enum: priorities },
              },
              required: ["title", "priority"],
              additionalProperties: false,
            },
          },
        },
        required: ["tasks"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (
          !input ||
          !Array.isArray(input.tasks) ||
          input.tasks.length < 1 ||
          input.tasks.length > 50 ||
          Object.keys(input).some((k) => k !== "tasks") ||
          input.tasks.some(
            (t) =>
              !t ||
              typeof t.title !== "string" ||
              !t.title.trim() ||
              t.title.length > 200 ||
              !priorities.includes(t.priority) ||
              Object.keys(t).some((k) => !["title", "priority"].includes(k)),
          )
        )
          throw new Error(
            "Each task needs a non-empty title up to 200 characters and a High, Medium or Low priority.",
          );
        const created = input.tasks.map((t) => ({
          id: uid(),
          title: t.title.trim(),
          priority: t.priority,
          completed: false,
          createdAt: Date.now(),
        }));
        flushSync(() => {
          actions.current.persist([...created, ...actions.current.tasks]);
          reveal.current();
        });
        return { created };
      },
    });
    return () => lifecycle.abort();
  }, []);
}
