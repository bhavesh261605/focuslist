# FocusList — interaction and visual specification

## Product distinction
**Focus three → One thing at a time.** Pin up to three active tasks, select a pinned task to jump into the focus studio, run a 5/15/25-minute session, then complete it and advance. Completing a task clears its pin. Pins persist with the task data. The queue follows explicit pins, then priority, then age; this is a transparent deterministic rule, not an AI recommendation.

The full task workspace remains available with creation, editing, deletion/undo, status/priority/search filtering, sorting and statistics. The studio uses the same underlying tasks. Switching tasks starts a fresh timer; this behavior is stated beside the timer. Timer state lasts for the current visit.

## Visual system
Forest ink, lime action accents, soft neutral surfaces and a contrasting dark theme. Primary task actions stay prominent. Task badges include text, so status never depends on color alone. The desktop studio sits beside the task list; mobile stacks it below and pinned-task buttons move directly to it. Empty states are actionable and use no invented user data.

## Motion contract
Implemented and commented in `src/motion.css`:
- Press: **160ms**; state/entry: **220ms**; success: **280ms**.
- Standard easing: **cubic-bezier(.25,1,.5,1)**.
- Restrained spring approximation: **cubic-bezier(.2,.85,.3,1)**; no physical spring solver or independently adjustable damping coefficient.
- Animated properties: **transform and opacity only**. Progress strips use `scaleX`. SVG progress, color and layout changes apply immediately.
- No animation delays, staggered entrances or artificial loading states.
- Entry motion identifies new tasks/panels; number transitions indicate changed data; the checkmark response confirms success.
- CSS transitions retarget on new input. Pointer, keyboard and scroll input cancel running CSS entry/celebration animations. Data mutations and dialog dismissal never wait for animation completion.
- Reduced-motion preference disables animation, both through device settings and the app preference.
- No permanent `will-change` allocation. These are compositor-eligible effects, not a claim of measured 60/120fps on every device.

## Loading and performance
Task data is synchronously local, so no spinner or skeleton is needed. A future asynchronous source must show a layout-matched skeleton only while its real request is pending, with no minimum display delay. No animation dependency was added. The timer uses a deadline instead of assuming interval callbacks arrive on time.

## Verification and limits
Automated tests check filtering, sorting, statistics, focus queue order, immutable source data, motion duration bounds and transition properties. Browser checks verify pin limits, completion/advancement, persistence and responsive layouts. No FAIE score or universal frame-rate measurement has been claimed. Public evaluator access still requires the owner's sharing choice.
