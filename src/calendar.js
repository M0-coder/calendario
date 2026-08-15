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
  { number: 13, latin: "Mercedonius", meaning: "intercalar / merces" }
]);

export function isGregorianLeapYear(year) {
  if (!Number.isInteger(year)) throw new RangeError("El año gregoriano debe ser entero");
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function utcDate(year, month, day) {
  if (![year, month, day].every(Number.isInteger)) {
    throw new RangeError("La fecha gregoriana debe usar valores enteros");
  }

  // Date.UTC interpreta 0–99 como 1900–1999. setUTCFullYear evita esa
  // excepción histórica de JavaScript y conserva correctamente esos años.
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

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
  const numericYear = Number(year);
  if (numericYear < 1) throw new RangeError("La interfaz gregoriana comienza en el año 0001");

  const date = utcDate(numericYear, Number(month), Number(day));
  return toParts(date);
}

export function reconstructedYearStartGregorianYear({ year, month }) {
  return month >= 3 ? year : year - 1;
}

export function aucFromGregorianYearStart(gregorianYearStart) {
  if (!Number.isInteger(gregorianYearStart)) {
    throw new RangeError("El año gregoriano de inicio debe ser entero");
  }

  const auc = gregorianYearStart + 753;
  if (auc < 1) throw new RangeError("La fecha queda antes de 1 AUC");
  return auc;
}

export function gregorianYearStartFromAuc(auc) {
  if (!Number.isInteger(auc) || auc < 1) {
    throw new RangeError("El año AUC debe ser un entero mayor o igual que 1");
  }
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

export function reconstructedYearDayCount(auc) {
  const startYear = gregorianYearStartFromAuc(auc);
  const start = utcDate(startYear, 3, 1);
  const nextStart = utcDate(startYear + 1, 3, 1);
  const cycleLength = Math.round((nextStart.getTime() - start.getTime()) / DAY_MS);
  return cycleLength - 364;
}

export function reconstructedYearDayToGregorian({ auc, yearDay = 1 }) {
  if (!Number.isInteger(yearDay) || yearDay < 1 || yearDay > 2) {
    throw new RangeError("El Día del Año debe ser 1 o 2");
  }

  const availableYearDays = reconstructedYearDayCount(auc);
  if (yearDay > availableYearDays) {
    throw new RangeError("Ese ciclo no contiene un segundo Día del Año");
  }

  const startYear = gregorianYearStartFromAuc(auc);
  const start = utcDate(startYear, 3, 1);
  const result = new Date(start.getTime() + (363 + yearDay) * DAY_MS);
  return toParts(result);
}

export function reconstructedWeekInfo(reconstructed) {
  if (!reconstructed || reconstructed.kind !== "month-day") {
    throw new RangeError("Los Días del Año están fuera de la semana reconstruida");
  }

  return {
    weekOfYear: Math.ceil(reconstructed.dayOfCycle / 7),
    weekday: ((reconstructed.dayOfCycle - 1) % 7) + 1
  };
}

export function formatGregorian({ year, month, day }, locale = "es-PE") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(utcDate(year, month, day));
}

export function formatGregorianShort({ year, month, day }, includeYear = false, locale = "es-PE") {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {})
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
