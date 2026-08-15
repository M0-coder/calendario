import {
  MONTHS,
  formatGregorian,
  getLocalTodayParts,
  gregorianToReconstructed,
  monthGregorianRange,
  parseISODate
} from "./calendar.js";

const dayNames = ["L", "M", "M", "J", "V", "S", "D"];
const calendarGrid = document.querySelector("#calendar-grid");
const converterForm = document.querySelector("#converter-form");
const gregorianInput = document.querySelector("#gregorian-input");
const conversionPrimary = document.querySelector("#conversion-primary");
const conversionSecondary = document.querySelector("#conversion-secondary");
const prevYearButton = document.querySelector("#prev-year");
const nextYearButton = document.querySelector("#next-year");
const currentYearButton = document.querySelector("#current-year");
const viewYearLabel = document.querySelector("#view-year");

let current;
let viewAuc;

function toISO({ year, month, day }) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatShort(parts) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short"
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
}

function formatPosition(reconstructed) {
  if (reconstructed.kind === "year-day") {
    return `Día del Año ${reconstructed.yearDay}`;
  }
  return `Mes ${reconstructed.month} de 13`;
}

function formatWeek(reconstructed) {
  if (reconstructed.kind === "year-day") return "Fuera de las semanas";
  const week = Math.ceil(reconstructed.day / 7);
  const weekday = ((reconstructed.day - 1) % 7) + 1;
  return `Semana ${week} · día ${weekday}/7`;
}

function renderToday() {
  const today = getLocalTodayParts();
  const reconstructed = gregorianToReconstructed(today);

  document.querySelector("#today-gregorian").textContent = formatGregorian(today);
  document.querySelector("#today-auc").textContent = reconstructed.auc;
  document.querySelector("#today-position").textContent = formatPosition(reconstructed);
  document.querySelector("#today-week").textContent = formatWeek(reconstructed);
  document.querySelector("#cycle-progress-label").textContent =
    `Día ${reconstructed.dayOfCycle} de ${reconstructed.cycleLength}`;
  document.querySelector("#cycle-progress-fill").style.width =
    `${(reconstructed.dayOfCycle / reconstructed.cycleLength) * 100}%`;

  if (reconstructed.kind === "month-day") {
    document.querySelector("#today-day").textContent = reconstructed.day;
    document.querySelector("#today-month").textContent = reconstructed.monthName.toUpperCase();
  } else {
    document.querySelector("#today-day").textContent = reconstructed.yearDay;
    document.querySelector("#today-month").textContent = "DÍA DEL AÑO";
  }

  return reconstructed;
}

function createMonthCard(month, auc, activeDate) {
  const range = monthGregorianRange(auc, month.number);
  const card = document.createElement("article");
  const isCurrent =
    activeDate.kind === "month-day" &&
    activeDate.auc === auc &&
    activeDate.month === month.number;

  card.className = `month-card${isCurrent ? " is-current" : ""}`;
  if (isCurrent) card.setAttribute("aria-current", "date");

  const days = Array.from({ length: 28 }, (_, index) => index + 1)
    .map((day) => {
      const active = isCurrent && activeDate.day === day;
      return `<span class="calendar-day${active ? " is-today" : ""}">${day}</span>`;
    })
    .join("");

  card.innerHTML = `
    <div class="month-card-head">
      <span class="month-number">${toRoman(month.number)}</span>
      <div>
        <h3>${month.latin}</h3>
        <p>${month.meaning}</p>
      </div>
    </div>
    <div class="month-range">${formatShort(range.first)} — ${formatShort(range.last)}</div>
    <div class="weekday-row" aria-hidden="true">
      ${dayNames.map((name) => `<span>${name}</span>`).join("")}
    </div>
    <div class="days-grid">${days}</div>
  `;

  return card;
}

function toRoman(value) {
  const numerals = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];
  let remainder = value;
  let output = "";

  for (const [number, numeral] of numerals) {
    while (remainder >= number) {
      output += numeral;
      remainder -= number;
    }
  }
  return output;
}

function renderMonths(auc) {
  calendarGrid.replaceChildren();
  for (const month of MONTHS) {
    calendarGrid.append(createMonthCard(month, auc, current));
  }
}

function renderYear() {
  viewYearLabel.textContent = `${viewAuc} AUC`;
  renderMonths(viewAuc);
}

function renderConversion(parts) {
  const reconstructed = gregorianToReconstructed(parts);

  if (reconstructed.kind === "month-day") {
    conversionPrimary.textContent = `${reconstructed.day} ${reconstructed.monthName} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Mes ${reconstructed.month}/13 · semana ${Math.ceil(reconstructed.day / 7)} · día ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
  } else {
    conversionPrimary.textContent = `Día del Año ${reconstructed.yearDay} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Fuera de los 13 meses · día ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
  }
}

function boot() {
  const today = getLocalTodayParts();
  current = renderToday();
  viewAuc = current.auc;
  renderYear();
  gregorianInput.value = toISO(today);
  renderConversion(today);
}

prevYearButton.addEventListener("click", () => {
  viewAuc -= 1;
  renderYear();
});

nextYearButton.addEventListener("click", () => {
  viewAuc += 1;
  renderYear();
});

currentYearButton.addEventListener("click", () => {
  viewAuc = current.auc;
  renderYear();
});

converterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const parts = parseISODate(gregorianInput.value);
    const reconstructed = gregorianToReconstructed(parts);
    renderConversion(parts);
    viewAuc = reconstructed.auc;
    renderYear();
  } catch (error) {
    conversionPrimary.textContent = "Fecha inválida";
    conversionSecondary.textContent = error instanceof Error ? error.message : "No se pudo convertir";
  }
});

boot();
