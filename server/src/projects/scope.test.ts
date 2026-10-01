import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ASSIGNED_SCOPED_ROLES, canAccessCode, filterRowsByCodes, isAssignedScoped } from "./scope.js";

const rows = [
  { id: 1, project: "P-A" },
  { id: 2, project: "P-B" },
  { id: 3, project: null },
  { id: 4, project: "P-C" },
];

describe("project scope core", () => {
  test("keeps only rows on assigned projects and drops rows with no project", () => {
    const out = filterRowsByCodes(rows, new Set(["P-A", "P-C"]), (r) => r.project);
    assert.deepEqual(out.map((r) => r.id), [1, 4]);
  });

  test("an architect with no assignments sees nothing", () => {
    assert.deepEqual(filterRowsByCodes(rows, new Set(), (r) => r.project), []);
  });

  test("canAccessCode refuses another architect's project and empty codes", () => {
    const mine = new Set(["P-A"]);
    assert.equal(canAccessCode(mine, "P-A"), true);
    assert.equal(canAccessCode(mine, "P-B"), false);
    assert.equal(canAccessCode(mine, null), false);
  });

  test("only architect is scoped today; admin and others are untouched", () => {
    assert.equal(isAssignedScoped({ id: 1, role: "architect" }), true);
    for (const role of ["admin", "project-manager", "consultant", "engineer", "owner"]) {
      assert.equal(isAssignedScoped({ id: 1, role }), false);
    }
    assert.equal(isAssignedScoped(undefined), false);
    assert.ok(ASSIGNED_SCOPED_ROLES.has("architect"));
  });
});
