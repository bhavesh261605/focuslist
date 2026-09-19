import { useEffect, useRef, useState } from "react";
import { normalizeTasks, readTasks, TASK_KEY } from "./task-storage";
/** Persistence is isolated from presentation. Failed writes retain in-memory work. */
export function useTaskStore() {
  const [initial] = useState(readTasks);
  const [tasks, setTasks] = useState(initial.tasks);
  const [warning, setWarning] = useState(initial.warning);
  const current = useRef(tasks);
  function persist(next) {
    const result = normalizeTasks(
      typeof next === "function" ? next(current.current) : next,
    );
    if (result.discarded) throw new Error("Invalid task change.");
    current.current = result.tasks;
    setTasks(result.tasks);
    try {
      localStorage.setItem(TASK_KEY, JSON.stringify(result.tasks));
      setWarning("");
    } catch {
      setWarning(
        "Changes are available now, but this browser could not save them. Keep this tab open.",
      );
    }
  }
  useEffect(() => {
    const sync = (e) => {
      if (e.key === TASK_KEY || e.key === null) {
        const data = readTasks();
        current.current = data.tasks;
        setTasks(data.tasks);
        setWarning(data.warning);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return { tasks, warning, persist };
}
