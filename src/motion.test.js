import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const motion = readFileSync(
  new URL("./motion.css", import.meta.url),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");
test("motion tokens stay within 150–300ms, with no linear easing or delays", () => {
  const durations = [...motion.matchAll(/:\s*(\d+)ms/g)].map((x) =>
    Number(x[1]),
  );
  assert.equal(durations.length, 3);
  assert.ok(durations.every((t) => t >= 150 && t <= 300));
  assert.doesNotMatch(motion, /\blinear\b|animation-delay|transition-delay/);
});
test("transitions only interpolate transform and opacity; legacy motion is retired", () => {
  for (const match of motion.matchAll(/transition:\s*([^;}]+)/g)) {
    if (match[1].startsWith("none")) continue;
    const names = match[1]
      .split(/,(?![^()]*\))/)
      .map((s) => s.trim().split(" ")[0]);
    assert.ok(
      names.every((n) => ["transform", "opacity"].includes(n)),
      names.join(","),
    );
  }
  const legacy = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.doesNotMatch(legacy, /(?:transition|animation)(?:-[a-z-]+)?\s*:/);
});
