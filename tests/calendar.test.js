import test from "node:test";
import assert from "node:assert/strict";

import {
  gregorianToReconstructed,
  reconstructedToGregorian,
  reconstructedYearDayToGregorian,
  isGregorianLeapYear
} from "../src/calendar.js";

test("Martius comienza el 1 de marzo", () => {
  assert.deepEqual(
    gregorianToReconstructed({ year: 2026, month: 3, day: 1 }),
    {
      kind: "month-day",
      auc: 2779,
      startYear: 2026,
      dayOfCycle: 1,
      month: 1,
      monthName: "Martius",
      monthMeaning: "Marte",
      day: 1,
      cycleLength: 365
    }
  );
});

test("cada mes tiene exactamente 28 días", () => {
  const end = gregorianToReconstructed({ year: 2026, month: 3, day: 28 });
  const next = gregorianToReconstructed({ year: 2026, month: 3, day: 29 });

  assert.equal(end.monthName, "Martius");
  assert.equal(end.day, 28);
  assert.equal(next.monthName, "Aprilis");
  assert.equal(next.day, 1);
});

test("14 de agosto de 2026 corresponde a 27 Sextilis 2779 AUC", () => {
  const result = gregorianToReconstructed({ year: 2026, month: 8, day: 14 });

  assert.equal(result.kind, "month-day");
  assert.equal(result.auc, 2779);
  assert.equal(result.month, 6);
  assert.equal(result.monthName, "Sextilis");
  assert.equal(result.day, 27);
});

test("16 de agosto de 2026 inicia September", () => {
  const result = gregorianToReconstructed({ year: 2026, month: 8, day: 16 });

  assert.equal(result.month, 7);
  assert.equal(result.monthName, "September");
  assert.equal(result.day, 1);
});

test("Mercedonius termina en el día 364 del ciclo", () => {
  const result = gregorianToReconstructed({ year: 2027, month: 2, day: 27 });

  assert.equal(result.month, 13);
  assert.equal(result.monthName, "Mercedonius");
  assert.equal(result.day, 28);
  assert.equal(result.dayOfCycle, 364);
});

test("el día solar sobrante queda fuera de los 13 meses", () => {
  const result = gregorianToReconstructed({ year: 2027, month: 2, day: 28 });

  assert.deepEqual(result, {
    kind: "year-day",
    auc: 2779,
    startYear: 2026,
    dayOfCycle: 365,
    yearDay: 1,
    cycleLength: 365
  });
});

test("un ciclo que termina en año bisiesto contiene dos días solares", () => {
  assert.equal(isGregorianLeapYear(2028), true);

  const first = gregorianToReconstructed({ year: 2028, month: 2, day: 28 });
  const second = gregorianToReconstructed({ year: 2028, month: 2, day: 29 });

  assert.equal(first.kind, "year-day");
  assert.equal(first.yearDay, 1);
  assert.equal(second.kind, "year-day");
  assert.equal(second.yearDay, 2);
});

test("conversión reconstruida a gregoriana es reversible", () => {
  const gregorian = reconstructedToGregorian({ auc: 2779, month: 6, day: 27 });
  assert.deepEqual(gregorian, { year: 2026, month: 8, day: 14 });

  const reconstructed = gregorianToReconstructed(gregorian);
  assert.equal(reconstructed.monthName, "Sextilis");
  assert.equal(reconstructed.day, 27);
});

test("conversión de Día del Año respeta ciclos comunes y bisiestos", () => {
  assert.deepEqual(
    reconstructedYearDayToGregorian({ auc: 2779, yearDay: 1 }),
    { year: 2027, month: 2, day: 28 }
  );

  assert.deepEqual(
    reconstructedYearDayToGregorian({ auc: 2780, yearDay: 2 }),
    { year: 2028, month: 2, day: 29 }
  );

  assert.throws(
    () => reconstructedYearDayToGregorian({ auc: 2779, yearDay: 2 }),
    /no contiene/
  );
});
