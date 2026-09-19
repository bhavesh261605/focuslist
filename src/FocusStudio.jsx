import { useMemo } from "react";
import { Crosshair, ArrowRight, Check, Pin, X } from "lucide-react";
import { FocusTimer } from "./Enhancements";
import { getFocusQueue } from "./task-utils";

export function FocusQueue({ tasks, onUnpin, onChoose }) {
  const pinned = tasks.filter((t) => t.focused && !t.completed);
  return (
    <section className="focus-queue" aria-label="Your focus queue">
      <div className="queue-heading">
        <span>
          <Crosshair size={16} /> Your focus three
        </span>
        <span>{pinned.length}/3</span>
      </div>
      {pinned.length ? (
        <div className="queue-items">
          {pinned.map((task, i) => (
            <div className="queue-chip" key={task.id}>
              <span className="queue-index">{i + 1}</span>
              <button
                className="queue-task-link"
                onClick={() => onChoose(task)}
                aria-label={`Focus on ${task.title}`}
              >
                {task.title}
              </button>
              <button
                onClick={() => onUnpin(task)}
                aria-label={`Unpin ${task.title}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>Pin up to three tasks below. Give today a little direction.</p>
      )}
    </section>
  );
}

export function FocusDesk({ tasks, selectedId, onSelect, onComplete, onAdd }) {
  const queue = useMemo(() => getFocusQueue(tasks), [tasks]);
  const task = queue.find((t) => t.id === selectedId) || queue[0];
  return (
    <section
      id="focus-studio"
      tabIndex={-1}
      className="focus-desk"
      aria-label="One-task focus studio"
    >
      <div className="desk-heading">
        <span>
          <Crosshair size={17} /> ONE THING AT A TIME
        </span>
        <span className="desk-edition">FOCUS / 01</span>
      </div>
      <div className="desk-task" key={task?.id || "empty"}>
        <div className="desk-context">
          {task ? (
            <>
              <span className={`badge ${task.priority.toLowerCase()}`}>
                {task.priority} priority
              </span>
              <span>
                {task.focused ? (
                  <>
                    <Pin size={12} /> Your focus queue
                  </>
                ) : (
                  "Suggested by priority"
                )}
              </span>
            </>
          ) : (
            <span className="desk-ready">A little room to begin</span>
          )}
        </div>
        <h2>
          {task
            ? task.title
            : tasks.length
              ? "Everything is taken care of."
              : "What gets your attention today?"}
        </h2>
        <p>
          {task
            ? "Your next step, with a little space around it."
            : tasks.length
              ? "Enjoy the headspace. Add something when you’re ready."
              : "Add your first task to start a focused session."}
        </p>
      </div>
      {task ? (
        <>
          <div className="desk-select">
            <label htmlFor="focus-task">Focus on</label>
            <select
              id="focus-task"
              value={task.id}
              onChange={(e) => onSelect(e.target.value)}
            >
              {queue.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <FocusTimer
            key={task.id}
            taskTitle={task.title}
            onStart={() => onSelect(task.id)}
          />
          <button className="finish-focus" onClick={() => onComplete(task)}>
            <Check size={18} /> Complete & move forward <ArrowRight size={17} />
          </button>
          <span className="desk-footnote">
            Switching tasks starts a fresh timer.
          </span>
        </>
      ) : (
        <button className="finish-focus" onClick={onAdd}>
          Add a task <ArrowRight size={17} />
        </button>
      )}
    </section>
  );
}
