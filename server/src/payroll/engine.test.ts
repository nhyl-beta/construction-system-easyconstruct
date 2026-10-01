import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLine, getRules, periodEndDate, sssMsc, withholdingTaxFor } from "./engine.js";
import { computeStatutoryDeductions } from "./ph-statutory.js";

const rules = getRules("2026-07-31");

// Monthly pay of 176 hours × (rate/176) makes gross == the monthly rate.
const lineFor = (gross: number) =>
  computeLine(
    { payRate: gross, rateType: "Monthly", regularHours: 176, overtimeHours: 0, adjustments: 0 },
    rules,
  );

test("expected results table (employee side)", () => {
  const cases: Array<[number, number, number, number, number, number]> = [
    [10_000, 500, 250, 200, 0, 9_050],
    [25_000, 1_250, 625, 200, 313.8, 22_611.2],
    [50_000, 1_750, 1_250, 200, 4_568.4, 42_231.6],
    [100_000, 1_750, 2_500, 200, 15_762.55, 79_787.45],
  ];
  for (const [gross, sss, ph, pi, tax, net] of cases) {
    const l = lineFor(gross);
    assert.equal(l.gross, gross);
    assert.equal(l.sss, sss, `sss @${gross}`);
    assert.equal(l.philhealth, ph, `philhealth @${gross}`);
    assert.equal(l.pagibig, pi, `pagibig @${gross}`);
    assert.equal(l.withholdingTax, tax, `tax @${gross}`);
    assert.equal(l.net, net, `net @${gross}`);
  }
});

test("employer side", () => {
  const a = lineFor(25_000);
  assert.deepEqual(
    [a.employerSss, a.employerEc, a.employerPhilhealth, a.employerPagibig],
    [2_500, 30, 625, 200],
  );
  assert.equal(a.employerContributions, 3_355);
  assert.equal(a.employerCost, 28_355);

  const b = lineFor(10_000);
  assert.deepEqual(
    [b.employerSss, b.employerEc, b.employerPhilhealth, b.employerPagibig],
    [1_000, 10, 250, 200],
  );
  assert.equal(b.employerContributions, 1_460);
});

test("SSS MSC edges", () => {
  assert.equal(sssMsc(5_249.99, rules), 5_000);
  assert.equal(sssMsc(5_250, rules), 5_500);
  assert.equal(sssMsc(34_749.99, rules), 34_500);
  assert.equal(sssMsc(34_750, rules), 35_000);
  assert.equal(sssMsc(80_000, rules), 35_000);
});

test("Pag-IBIG bracket edge at 1,500 / 1,501", () => {
  assert.equal(lineFor(1_500).pagibig, 15);
  assert.equal(lineFor(1_501).pagibig, 30.02);
});

test("tax edge at taxable income 20,833 / 20,834", () => {
  assert.equal(withholdingTaxFor(20_833, rules), 0);
  assert.equal(withholdingTaxFor(20_834, rules), 0.15);
});

test("zero and negative gross give all zeros", () => {
  for (const adjustments of [0, -500]) {
    const l = computeLine(
      { payRate: 500, rateType: "Daily", regularHours: 0, overtimeHours: 0, adjustments },
      rules,
    );
    assert.equal(l.gross, 0);
    assert.equal(l.net, 0);
    assert.equal(l.deductions, 0);
    assert.equal(l.employerCost, 0);
  }
});

test("rate types and overtime multiplier", () => {
  const daily = computeLine(
    { payRate: 800, rateType: "Daily", regularHours: 8, overtimeHours: 2, adjustments: 100 },
    rules,
  );
  // 8×100 + 2×100×1.5 + 100
  assert.equal(daily.gross, 1_200);
  const hourly = computeLine(
    { payRate: 100, rateType: "Hourly", regularHours: 10, overtimeHours: 0, adjustments: 0 },
    rules,
  );
  assert.equal(hourly.gross, 1_000);
});

test("reproduces the legacy ph-statutory employee-side results", () => {
  for (const gross of [1_200, 5_249.99, 5_250, 9_800, 10_000, 18_000, 25_000, 34_750, 50_000, 75_000, 100_000, 250_000]) {
    const legacy = computeStatutoryDeductions(gross, 1);
    const l = lineFor(gross);
    assert.equal(l.sss, legacy.sss, `sss @${gross}`);
    assert.equal(l.philhealth, legacy.philhealth, `philhealth @${gross}`);
    assert.equal(l.pagibig, legacy.pagibig, `pagibig @${gross}`);
    assert.equal(l.withholdingTax, legacy.withholdingTax, `tax @${gross}`);
    assert.equal(l.deductions, legacy.total, `total @${gross}`);
  }
});

test("periodEndDate", () => {
  assert.equal(periodEndDate("2026-02"), "2026-02-28");
  assert.equal(periodEndDate("2026-07"), "2026-07-31");
  assert.equal(periodEndDate("2026-07-01 to 2026-07-15"), "2026-07-15");
});
