const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
const SUN_DISTANCE_KM = 149_598_000;
export const SYNODIC_MONTH_DAYS = 29.530588853;
export const LUNAR_SUPPORTED_YEARS = Object.freeze({ min: 1700, max: 2100 });

export const MOON_PHASES = Object.freeze([
  { index: 0, name: "Luna nueva", symbol: "🌑", primary: true, target: 0 },
  { index: 1, name: "Creciente", symbol: "🌒", primary: false, target: 0.125 },
  { index: 2, name: "Cuarto creciente", symbol: "🌓", primary: true, target: 0.25 },
  { index: 3, name: "Gibosa creciente", symbol: "🌔", primary: false, target: 0.375 },
  { index: 4, name: "Luna llena", symbol: "🌕", primary: true, target: 0.5 },
  { index: 5, name: "Gibosa menguante", symbol: "🌖", primary: false, target: 0.625 },
  { index: 6, name: "Cuarto menguante", symbol: "🌗", primary: true, target: 0.75 },
  { index: 7, name: "Menguante", symbol: "🌘", primary: false, target: 0.875 }
]);

const PRIMARY_PHASES = MOON_PHASES.filter(({ primary }) => primary);

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function rightAscension(longitude, latitude) {
  const eclipticObliquity = RAD * 23.4397;
  return Math.atan2(
    Math.sin(longitude) * Math.cos(eclipticObliquity) - Math.tan(latitude) * Math.sin(eclipticObliquity),
    Math.cos(longitude)
  );
}

function declination(longitude, latitude) {
  const eclipticObliquity = RAD * 23.4397;
  return Math.asin(
    Math.sin(latitude) * Math.cos(eclipticObliquity) +
      Math.cos(latitude) * Math.sin(eclipticObliquity) * Math.sin(longitude)
  );
}

function daysSinceJ2000(date) {
  return date.getTime() / 86_400_000 - 0.5 + J1970 - J2000;
}

function sunCoordinates(days) {
  const anomaly = RAD * (357.5291 + 0.98560028 * days);
  const center = RAD * (
    1.9148 * Math.sin(anomaly) +
    0.02 * Math.sin(2 * anomaly) +
    0.0003 * Math.sin(3 * anomaly)
  );
  const perihelion = RAD * 102.9372;
  const longitude = anomaly + center + perihelion + Math.PI;
  return {
    ra: rightAscension(longitude, 0),
    dec: declination(longitude, 0)
  };
}

function moonCoordinates(days) {
  const longitudeMean = RAD * (218.316 + 13.176396 * days);
  const anomaly = RAD * (134.963 + 13.064993 * days);
  const distanceArgument = RAD * (93.272 + 13.22935 * days);
  const longitude = longitudeMean + RAD * 6.289 * Math.sin(anomaly);
  const latitude = RAD * 5.128 * Math.sin(distanceArgument);
  return {
    ra: rightAscension(longitude, latitude),
    dec: declination(longitude, latitude),
    distance: 385001 - 20905 * Math.cos(anomaly)
  };
}

function utcDateTime({ year, month, day }, hour = 12) {
  if (![year, month, day, hour].every(Number.isInteger)) throw new RangeError("Fecha lunar inválida");
  const date = new Date(0);
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError("Fecha lunar inválida");
  }
  return date;
}

function lunarGeometry(date) {
  const days = daysSinceJ2000(date);
  const sun = sunCoordinates(days);
  const moon = moonCoordinates(days);
  const elongation = Math.acos(clamp(
    Math.sin(sun.dec) * Math.sin(moon.dec) +
      Math.cos(sun.dec) * Math.cos(moon.dec) * Math.cos(sun.ra - moon.ra)
  ));
  const incidence = Math.atan2(
    SUN_DISTANCE_KM * Math.sin(elongation),
    moon.distance - SUN_DISTANCE_KM * Math.cos(elongation)
  );
  const positionAngle = Math.atan2(
    Math.cos(sun.dec) * Math.sin(sun.ra - moon.ra),
    Math.sin(sun.dec) * Math.cos(moon.dec) -
      Math.cos(sun.dec) * Math.sin(moon.dec) * Math.cos(sun.ra - moon.ra)
  );
  const illumination = (1 + Math.cos(incidence)) / 2;
  const phase = (0.5 + 0.5 * incidence * (positionAngle < 0 ? -1 : 1) / Math.PI + 1) % 1;
  return { illumination, phase };
}

function circularDistance(a, b) {
  const direct = Math.abs(a - b) % 1;
  return Math.min(direct, 1 - direct);
}

function phaseForFraction(phase) {
  return MOON_PHASES[Math.round(phase * 8) % 8];
}

function supportForDate(date) {
  const year = date.getUTCFullYear();
  return year >= LUNAR_SUPPORTED_YEARS.min && year <= LUNAR_SUPPORTED_YEARS.max;
}

function trendForPhase(phase) {
  const atNewMoon = circularDistance(phase, 0) < 0.015;
  const atFullMoon = circularDistance(phase, 0.5) < 0.015;
  if (atNewMoon || atFullMoon) return "transición";
  return phase < 0.5 ? "creciente" : "menguante";
}

export function moonStateAt(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new RangeError("Fecha lunar inválida");
  if (!supportForDate(date)) {
    return {
      supported: false,
      range: LUNAR_SUPPORTED_YEARS,
      message: `Capa lunar validada entre ${LUNAR_SUPPORTED_YEARS.min} y ${LUNAR_SUPPORTED_YEARS.max}`
    };
  }

  const { illumination, phase } = lunarGeometry(date);
  const phaseData = phaseForFraction(phase);
  return {
    supported: true,
    phase,
    phaseIndex: phaseData.index,
    phaseName: phaseData.name,
    symbol: phaseData.symbol,
    primary: phaseData.primary,
    trend: trendForPhase(phase),
    illumination,
    illuminationPercent: Math.round(illumination * 100),
    ageDaysApprox: phase * SYNODIC_MONTH_DAYS
  };
}

export function moonStateForGregorian(parts) {
  return moonStateAt(utcDateTime(parts, 12));
}

export function approximateNextPrimaryPhase(date) {
  const state = moonStateAt(date);
  if (!state.supported) return null;

  let selected = null;
  for (const phaseData of PRIMARY_PHASES) {
    let delta = (phaseData.target - state.phase + 1) % 1;
    if (delta < 1e-6) delta = 1;
    if (!selected || delta < selected.delta) selected = { phaseData, delta };
  }

  return {
    name: selected.phaseData.name,
    symbol: selected.phaseData.symbol,
    daysApprox: selected.delta * SYNODIC_MONTH_DAYS
  };
}

export function primaryMoonPhaseForGregorianDay(parts) {
  const currentDate = utcDateTime(parts, 12);
  const current = moonStateAt(currentDate);
  if (!current.supported) return null;

  const nearest = PRIMARY_PHASES.reduce((best, phaseData) => {
    const distance = circularDistance(current.phase, phaseData.target);
    return !best || distance < best.distance ? { phaseData, distance } : best;
  }, null);

  const previous = moonStateAt(new Date(currentDate.getTime() - 86_400_000));
  const next = moonStateAt(new Date(currentDate.getTime() + 86_400_000));
  if (!previous.supported || !next.supported) return null;

  const previousDistance = circularDistance(previous.phase, nearest.phaseData.target);
  const nextDistance = circularDistance(next.phase, nearest.phaseData.target);
  if (nearest.distance <= previousDistance && nearest.distance < nextDistance) {
    return {
      name: nearest.phaseData.name,
      symbol: nearest.phaseData.symbol,
      phaseIndex: nearest.phaseData.index
    };
  }
  return null;
}
