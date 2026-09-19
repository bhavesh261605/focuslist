import { memo } from "react";
import { Check, Pin, Pencil, Trash2 } from "lucide-react";
export const TaskRow = memo(function TaskRow({
  task,
  onToggle,
  onPin,
  onEdit,
  onDelete,
}) {
  return (
    <li className={`task-row ${task.completed ? "is-complete" : ""}`}>
      <label className="check-control">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
          aria-label={`Mark ${task.title} as ${task.completed ? "active" : "completed"}`}
        />
        <span className="check-visual" aria-hidden="true">
          <Check size={15} />
        </span>
      </label>
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.completed ? "Completed" : "To do"}
          {task.createdAt > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={new Date(task.createdAt).toISOString()}>
                {new Date(task.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </>
          )}
        </span>
      </div>
      <span className={`badge ${task.priority.toLowerCase()}`}>
        <span aria-hidden="true" />
        {task.priority}
      </span>
      <div className="row-actions">
        {!task.completed && (
          <button
            type="button"
            className={task.focused ? "pin-button pinned" : "pin-button"}
            aria-label={`${task.focused ? "Unpin" : "Pin"} ${task.title}${task.focused ? " from" : " to"} focus queue`}
            aria-pressed={!!task.focused}
            onClick={() => onPin(task)}
          >
            <Pin size={16} />
          </button>
        )}
        <button
          type="button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="delete-button"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
});
