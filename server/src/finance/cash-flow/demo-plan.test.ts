import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assignSlots, pickInstant, projectInflow } from "./demo-plan.js";
import { lastMonthKeys } from "./months.js";

const now = new Date("2026-10-06T08:00:00Z");

describe("assignSlots", () => {
  test("heavier early, non-decreasing, deterministic", () => {
    const a = assignSlots(12, 6);
    assert.deepEqual(a, assignSlots(12, 6));
    assert.deepEqual([...a].sort((x, y) => x - y), a);
    const counts = Array.from({ length: 6 }, (_, k) => a.filter((s) => s === k).length);
    assert.ok(counts[0]! >= counts[5]!, counts.join());
    assert.equal(counts.reduce((x, y) => x + y, 0), 12);
  });
  test("no slots, no items", () => {
    assert.deepEqual(assignSlots(3, 0), []);
    assert.deepEqual(assignSlots(0, 6), []);
  });
});

describe("pickInstant", () => {
  test("is stable for the same seed and never after now", () => {
    assert.deepEqual(pickInstant("2026-10", "EXP-1", now), pickInstant("2026-10", "EXP-1", now));
    assert.ok(pickInstant("2026-10", "EXP-1", now) <= now);
  });
  test("never before the project start inside the start month", () => {
    const start = new Date("2026-05-20T00:00:00Z");
    for (const seed of ["a", "b", "c", "d", "e"]) assert.ok(pickInstant("2026-05", seed, now, start) >= start, seed);
  });
});

describe("projectInflow", () => {
  const window = lastMonthKeys(6, now); // 2026-05 .. 2026-10
  const project = { code: "P", contractValue: 10_000_000, plannedStart: "2026-04-10", progress: 50 };

  test("an advance in the start month, lagged lumpy payments after, none in the current month", () => {
    const m = projectInflow(project, window, now);
    assert.equal(m.has("2026-04"), false, "April is outside the window");
    assert.equal(m.has("2026-10"), false);
    assert.ok([...m.values()].every((v) => v > 0));
  });
  test("total received never exceeds contract x (advance + progress)", () => {
    const all = projectInflow(project, lastMonthKeys(24, now), now);
    const total = [...all.values()].reduce((a, b) => a + b, 0);
    assert.ok(total <= 10_000_000 * 0.6 + 0.01, String(total));
    assert.ok(total > 0);
  });
  test("a project that has not started, or has no contract value, receives nothing", () => {
    assert.equal(projectInflow({ ...project, plannedStart: "2027-01-01" }, window, now).size, 0);
    assert.equal(projectInflow({ ...project, contractValue: 0 }, window, now).size, 0);
    assert.equal(projectInflow({ ...project, plannedStart: null }, window, now).size, 0);
  });
});
