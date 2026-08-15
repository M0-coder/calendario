import test from "node:test";
import assert from "node:assert/strict";

import {
  gregorianToReconstructed,
  reconstructedToGregorian,
  reconstructedYearDayToGregorian,
  reconstructedYearDayCount,
  reconstructedWeekInfo,
  isGregorianLeapYear,
  parseISODate
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

test("la semana se numera sobre las 52 semanas anuales, no dentro del mes", () => {
  const result = gregorianToReconstructed({ year: 2026, month: 8, day: 15 });
  assert.equal(result.monthName, "Sextilis");
  assert.equal(result.day, 28);
  assert.deepEqual(reconstructedWeekInfo(result), { weekOfYear: 24, weekday: 7 });
});

test("Mercedonius termina en el día 364 del ciclo", () => {
  const result = gregorianToReconstructed({ year: 2027, month: 2, day: 27 });

  assert.equal(result.month, 13);
  assert.equal(result.monthName, "Mercedonius");
  assert.equal(result.day, 28);
  assert.equal(result.dayOfCycle, 364);
  assert.deepEqual(reconstructedWeekInfo(result), { weekOfYear: 52, weekday: 7 });
});

test("el día solar sobrante queda fuera de los 13 meses y de las semanas", () => {
  const result = gregorianToReconstructed({ year: 2027, month: 2, day: 28 });

  assert.deepEqual(result, {
    kind: "year-day",
    auc: 2779,
    startYear: 2026,
    dayOfCycle: 365,
    yearDay: 1,
    cycleLength: 365
  });
  assert.throws(() => reconstructedWeekInfo(result), /fuera de la semana/);
});

test("un ciclo que termina en año bisiesto contiene dos días solares", () => {
  assert.equal(isGregorianLeapYear(2028), true);
  assert.equal(reconstructedYearDayCount(2780), 2);

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
  assert.equal(reconstructedYearDayCount(2779), 1);
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

test("años gregorianos 0001–0099 no sufren el desplazamiento 1900 de Date.UTC", () => {
  assert.deepEqual(parseISODate("0001-03-01"), { year: 1, month: 3, day: 1 });

  const result = gregorianToReconstructed({ year: 1, month: 3, day: 1 });
  assert.equal(result.auc, 754);
  assert.equal(result.monthName, "Martius");
  assert.equal(result.day, 1);
});

test("la interfaz rechaza año gregoriano 0000 y fechas inexistentes", () => {
  assert.throws(() => parseISODate("0000-03-01"), /comienza en el año 0001/);
  assert.throws(() => parseISODate("2026-02-29"), /inválida/);
  assert.throws(() => parseISODate("10000-01-01"), /AAAA-MM-DD/);
});

test("AUC no admite cero ni valores negativos", () => {
  assert.throws(() => reconstructedToGregorian({ auc: 0, month: 1, day: 1 }), /mayor o igual que 1/);
  assert.throws(() => reconstructedYearDayCount(-1), /mayor o igual que 1/);
});

test("todos los días regulares son reversibles en ciclos común, bisiesto y secular", () => {
  for (const auc of [2753, 2779, 2780, 2852, 2853]) {
    for (let month = 1; month <= 13; month += 1) {
      for (let day = 1; day <= 28; day += 1) {
        const gregorian = reconstructedToGregorian({ auc, month, day });
        const reconstructed = gregorianToReconstructed(gregorian);

        assert.equal(reconstructed.kind, "month-day");
        assert.equal(reconstructed.auc, auc);
        assert.equal(reconstructed.month, month);
        assert.equal(reconstructed.day, day);
      }
    }
  }
});
