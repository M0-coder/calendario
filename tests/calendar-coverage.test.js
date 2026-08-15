import test from "node:test";
import assert from "node:assert/strict";

import {
  aucFromGregorianYearStart,
  formatGregorian,
  formatGregorianShort,
  getLocalTodayParts,
  gregorianToReconstructed,
  gregorianYearStartFromAuc,
  isGregorianLeapYear,
  monthGregorianRange,
  reconstructedToGregorian,
  reconstructedYearDayToGregorian
} from "../src/calendar.js";

test("validaciones de enteros y límites rechazan entradas inválidas", () => {
  assert.throws(() => isGregorianLeapYear(2028.5), /entero/);
  assert.throws(
    () => gregorianToReconstructed({ year: 2026, month: 3.5, day: 1 }),
    /valores enteros/
  );
  assert.throws(() => aucFromGregorianYearStart(2026.5), /entero/);
  assert.throws(() => aucFromGregorianYearStart(-753), /antes de 1 AUC/);
  assert.throws(() => reconstructedToGregorian({ auc: 2779, month: 0, day: 1 }), /entre 1 y 13/);
  assert.throws(() => reconstructedToGregorian({ auc: 2779, month: 1, day: 29 }), /entre 1 y 28/);
  assert.throws(
    () => reconstructedYearDayToGregorian({ auc: 2780, yearDay: 3 }),
    /debe ser 1 o 2/
  );
});

test("equivalencia AUC conserva el año gregoriano de inicio", () => {
  assert.equal(aucFromGregorianYearStart(2026), 2779);
  assert.equal(gregorianYearStartFromAuc(2779), 2026);
  assert.equal(gregorianYearStartFromAuc(1), -752);
});

test("formateadores UTC conservan años tempranos sin convertirlos a 1901", () => {
  const long = formatGregorian({ year: 1, month: 3, day: 1 }, "en-US");
  const short = formatGregorianShort({ year: 1, month: 3, day: 1 }, true, "en-US");

  assert.match(long, /March/);
  assert.match(long, /\b1\b/);
  assert.doesNotMatch(long, /1901/);
  assert.match(short, /Mar/);
  assert.doesNotMatch(short, /1901/);
});

test("getLocalTodayParts usa explícitamente los componentes locales", () => {
  const fakeNow = {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 15
  };

  assert.deepEqual(getLocalTodayParts(fakeNow), { year: 2026, month: 8, day: 15 });
});

test("monthGregorianRange devuelve fronteras completas incluso cuando cruza año", () => {
  assert.deepEqual(monthGregorianRange(2779, 1), {
    first: { year: 2026, month: 3, day: 1 },
    last: { year: 2026, month: 3, day: 28 }
  });

  assert.deepEqual(monthGregorianRange(2779, 11), {
    first: { year: 2026, month: 12, day: 6 },
    last: { year: 2027, month: 1, day: 2 }
  });
});
