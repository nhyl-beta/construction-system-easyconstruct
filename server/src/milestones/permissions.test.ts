import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assertEngineerMayUpdate } from "./permissions.js";
import { ForbiddenError } from "../utils/errors.js";

describe("assertEngineerMayUpdate", () => {
  test("staffed engineer can complete an active or at-risk milestone", () => {
    assert.doesNotThrow(() => assertEngineerMayUpdate({ status: "completed" }, "active", true));
    assert.doesNotThrow(() => assertEngineerMayUpdate({ status: "completed" }, "at-risk", true));
  });

  test("cannot complete on a project they are not staffed on", () => {
    assert.throws(() => assertEngineerMayUpdate({ status: "completed" }, "active", false), ForbiddenError);
  });

  test("cannot edit any other field, even alongside completion", () => {
    assert.throws(() => assertEngineerMayUpdate({ status: "completed", title: "x" }, "active", true), ForbiddenError);
    assert.throws(() => assertEngineerMayUpdate({ estimatedCompletionDate: "2026-12-31" }, "active", true), ForbiddenError);
    assert.throws(() => assertEngineerMayUpdate({ description: "x" }, "active", true), ForbiddenError);
  });

  test("cannot set any status other than completed", () => {
    for (const status of ["draft", "active", "at-risk", "cancelled"] as const) {
      assert.throws(() => assertEngineerMayUpdate({ status }, "active", true), ForbiddenError);
    }
  });

  test("cannot complete from draft, cancelled or already-completed", () => {
    for (const from of ["draft", "cancelled", "completed"]) {
      assert.throws(() => assertEngineerMayUpdate({ status: "completed" }, from, true), ForbiddenError);
    }
  });
});
