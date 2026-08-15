const DAY_MS = 86_400_000;

export const MONTHS = Object.freeze([
  { number: 1, latin: "Martius", meaning: "Marte" },
  { number: 2, latin: "Aprilis", meaning: "origen incierto" },
  { number: 3, latin: "Maius", meaning: "Maia" },
  { number: 4, latin: "Iunius", meaning: "Juno" },
  { number: 5, latin: "Quintilis", meaning: "quinto" },
  { number: 6, latin: "Sextilis", meaning: "sexto" },
  { number: 7, latin: "September", meaning: "séptimo" },
  { number: 8, latin: "October", meaning: "octavo" },
  { number: 9, latin: "November", meaning: "noveno" },
  { number: 10, latin: "December", meaning: "décimo" },
  { number: 11, latin: "Ianuarius", meaning: "Jano" },
  { number: 12, latin: "Februarius", meaning: "purificación" },
  { number: 13, latin: "Mercedonius", meaning: "intercalar / pago" }
]);

export function isGregorianLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function utcDate(year, month, day) {
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError("Fecha gregoriana inválida");
  }

  return date;
}

function toParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

export function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError("Usa el formato AAAA-MM-DD");

  const [, year, month, day] = match;
  const date = utcDate(Number(year), Number(month), Number(day));
  return toParts(date);
}

export function reconstructedYearStartGregorianYear({ year, month }) {
  return month >= 3 ? year : year - 1;
}

export function aucFromGregorianYearStart(gregorianYearStart) {
  return gregorianYearStart + 753;
}

export function gregorianYearStartFromAuc(auc) {
  if (!Number.isInteger(auc)) throw new RangeError("El año AUC debe ser entero");
  return auc - 753;
}

export function gregorianToReconstructed({ year, month, day }) {
  const target = utcDate(year, month, day);
  const startYear = reconstructedYearStartGregorianYear({ year, month });
  const start = utcDate(startYear, 3, 1);
  const nextStart = utcDate(startYear + 1, 3, 1);
  const dayIndex = Math.round((target.getTime() - start.getTime()) / DAY_MS);
  const cycleLength = Math.round((nextStart.getTime() - start.getTime()) / DAY_MS);
  const auc = aucFromGregorianYearStart(startYear);

  if (dayIndex < 0 || dayIndex >= cycleLength) {
    throw new RangeError("Fecha fuera del ciclo reconstruido");
  }

  if (dayIndex >= 364) {
    return {
      kind: "year-day",
      auc,
      startYear,
      dayOfCycle: dayIndex + 1,
      yearDay: dayIndex - 363,
      cycleLength
    };
  }

  const monthIndex = Math.floor(dayIndex / 28);
  const reconstructedDay = (dayIndex % 28) + 1;
  const monthData = MONTHS[monthIndex];

  return {
    kind: "month-day",
    auc,
    startYear,
    dayOfCycle: dayIndex + 1,
    month: monthData.number,
    monthName: monthData.latin,
    monthMeaning: monthData.meaning,
    day: reconstructedDay,
    cycleLength
  };
}

export function reconstructedToGregorian({ auc, month, day }) {
  if (!Number.isInteger(month) || month < 1 || month > 13) {
    throw new RangeError("El mes debe estar entre 1 y 13");
  }
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new RangeError("El día debe estar entre 1 y 28");
  }

  const startYear = gregorianYearStartFromAuc(auc);
  const start = utcDate(startYear, 3, 1);
  const offset = (month - 1) * 28 + (day - 1);
  const result = new Date(start.getTime() + offset * DAY_MS);
  return toParts(result);
}

export function reconstructedYearDayToGregorian({ auc, yearDay = 1 }) {
  if (!Number.isInteger(yearDay) || yearDay < 1 || yearDay > 2) {
    throw new RangeError("El Día del Año debe ser 1 o 2");
  }

  const startYear = gregorianYearStartFromAuc(auc);
  const start = utcDate(startYear, 3, 1);
  const nextStart = utcDate(startYear + 1, 3, 1);
  const cycleLength = Math.round((nextStart.getTime() - start.getTime()) / DAY_MS);
  const availableYearDays = cycleLength - 364;

  if (yearDay > availableYearDays) {
    throw new RangeError("Ese ciclo no contiene un segundo Día del Año");
  }

  const result = new Date(start.getTime() + (363 + yearDay) * DAY_MS);
  return toParts(result);
}

export function formatGregorian({ year, month, day }, locale = "es-PE") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(utcDate(year, month, day));
}

export function getLocalTodayParts(now = new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  };
}

export function monthGregorianRange(auc, month) {
  const first = reconstructedToGregorian({ auc, month, day: 1 });
  const last = reconstructedToGregorian({ auc, month, day: 28 });
  return { first, last };
}
