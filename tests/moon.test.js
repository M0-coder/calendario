import test from "node:test";
import assert from "node:assert/strict";
import {
  approximateNextPrimaryPhase,
  moonStateAt,
  moonStateForGregorian,
  primaryMoonPhaseForGregorianDay
} from "../src/moon.js";

const utc = (value) => new Date(`${value}Z`);

function circularDistance(a, b) {
  const direct = Math.abs(a - b) % 1;
  return Math.min(direct, 1 - direct);
}

test("anclas USNO 2026 caen en las cuatro fases principales", () => {
  const anchors = [
    ["2026-08-12T17:37:00", 0, 0],
    ["2026-08-20T02:46:00", 0.25, 2],
    ["2026-08-28T04:18:00", 0.5, 4],
    ["2026-09-04T07:51:00", 0.75, 6]
  ];

  for (const [instant, target, phaseIndex] of anchors) {
    const state = moonStateAt(utc(instant));
    assert.equal(state.supported, true);
    assert.equal(state.phaseIndex, phaseIndex);
    assert.ok(circularDistance(state.phase, target) < 0.01, `${instant} se aleja de ${target}`);
  }
});

test("15 agosto 2026 es creciente, con iluminación baja y próxima a cuarto creciente", () => {
  const state = moonStateForGregorian({ year: 2026, month: 8, day: 15 });
  assert.equal(state.phaseName, "Creciente");
  assert.equal(state.trend, "creciente");
  assert.ok(state.illuminationPercent >= 5 && state.illuminationPercent <= 20);
  assert.ok(state.ageDaysApprox > 2 && state.ageDaysApprox < 5);

  const next = approximateNextPrimaryPhase(utc("2026-08-15T12:00:00"));
  assert.equal(next.name, "Cuarto creciente");
  assert.ok(next.daysApprox > 3 && next.daysApprox < 6);
});

test("después de luna llena la tendencia es menguante", () => {
  const state = moonStateForGregorian({ year: 2026, month: 9, day: 1 });
  assert.equal(state.trend, "menguante");
  assert.ok(state.phase > 0.5);
});

test("la vista diaria marca una sola fecha para cada fase principal cercana", () => {
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 2026, month: 8, day: 12 }).phaseIndex, 0);
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 2026, month: 8, day: 20 }).phaseIndex, 2);
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 2026, month: 8, day: 28 }).phaseIndex, 4);
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 2026, month: 9, day: 4 }).phaseIndex, 6);
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 2026, month: 8, day: 21 }), null);
});

test("la capa lunar no inventa precisión fuera del rango validado", () => {
  const state = moonStateForGregorian({ year: 1699, month: 12, day: 31 });
  assert.equal(state.supported, false);
  assert.match(state.message, /1700.*2100/);
  assert.equal(approximateNextPrimaryPhase(utc("1699-12-31T12:00:00")), null);
  assert.equal(primaryMoonPhaseForGregorianDay({ year: 1700, month: 1, day: 1 }), null);
});

test("rechaza Date y componentes gregorianos inválidos", () => {
  assert.throws(() => moonStateAt(new Date(Number.NaN)), RangeError);
  assert.throws(() => moonStateForGregorian({ year: 2026, month: 2, day: 30 }), RangeError);
  assert.throws(() => moonStateForGregorian({ year: 2026.5, month: 8, day: 15 }), RangeError);
});
