import {
  MONTHS,
  formatGregorian,
  formatGregorianShort,
  getLocalTodayParts,
  gregorianToReconstructed,
  monthGregorianRange,
  parseISODate,
  reconstructedWeekInfo,
  reconstructedYearDayCount,
  reconstructedYearDayToGregorian
} from "./calendar.js";

const weekdayNames = [
  { short: "L", full: "Lunes" },
  { short: "M", full: "Martes" },
  { short: "X", full: "Miércoles" },
  { short: "J", full: "Jueves" },
  { short: "V", full: "Viernes" },
  { short: "S", full: "Sábado" },
  { short: "D", full: "Domingo" }
];

const calendarGrid = document.querySelector("#calendar-grid");
const yearDaysContainer = document.querySelector("#year-days");
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

function formatRange(range) {
  const includeYear = range.first.year !== range.last.year;
  return `${formatGregorianShort(range.first, includeYear)} — ${formatGregorianShort(range.last, includeYear)}`;
}

function formatPosition(reconstructed) {
  if (reconstructed.kind === "year-day") {
    return `Día del Año ${reconstructed.yearDay}`;
  }
  return `Mes ${reconstructed.month} de 13`;
}

function formatWeek(reconstructed) {
  if (reconstructed.kind === "year-day") return "Fuera de las 52 semanas";
  const { weekOfYear, weekday } = reconstructedWeekInfo(reconstructed);
  return `Semana ${weekOfYear}/52 · día ${weekday}/7`;
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
  card.setAttribute("aria-label", `${month.latin}, mes ${month.number} de 13, ${auc} AUC`);

  const days = Array.from({ length: 28 }, (_, index) => index + 1)
    .map((day) => {
      const active = isCurrent && activeDate.day === day;
      const weekday = weekdayNames[(day - 1) % 7];
      const currentAttribute = active ? ' aria-current="date"' : "";
      return `<span class="calendar-day${active ? " is-today" : ""}" aria-label="${day} ${month.latin}, ${weekday.full}"${currentAttribute}>${day}</span>`;
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
    <div class="month-range">${formatRange(range)}</div>
    <div class="weekday-row" aria-label="Semana reconstruida de lunes a domingo">
      ${weekdayNames.map(({ short, full }) => `<span aria-label="${full}" title="${full}">${short}</span>`).join("")}
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

function renderYearDays(auc) {
  yearDaysContainer.replaceChildren();
  const count = reconstructedYearDayCount(auc);

  const intro = document.createElement("div");
  intro.className = "year-days-intro";
  intro.innerHTML = `
    <span class="kicker">FUERA DE LOS MESES · FUERA DE LA SEMANA</span>
    <strong>${count === 1 ? "1 Día del Año" : "2 Días del Año"}</strong>
    <p>Estos días completan el ciclo solar sin desplazar el lunes de 1 Martius ni las 52 semanas regulares.</p>
  `;
  yearDaysContainer.append(intro);

  const days = document.createElement("div");
  days.className = "year-days-list";

  for (let yearDay = 1; yearDay <= count; yearDay += 1) {
    const gregorian = reconstructedYearDayToGregorian({ auc, yearDay });
    const active = current.kind === "year-day" && current.auc === auc && current.yearDay === yearDay;
    const item = document.createElement("div");
    item.className = `year-day-item${active ? " is-today" : ""}`;
    if (active) item.setAttribute("aria-current", "date");
    item.innerHTML = `
      <span>DÍA DEL AÑO ${yearDay}</span>
      <strong>${formatGregorian(gregorian)}</strong>
      <small>sin día de semana</small>
    `;
    days.append(item);
  }

  yearDaysContainer.append(days);
}

function renderYear() {
  viewYearLabel.textContent = `${viewAuc} AUC`;
  prevYearButton.disabled = viewAuc <= 1;
  renderMonths(viewAuc);
  renderYearDays(viewAuc);
}

function renderConversion(parts) {
  const reconstructed = gregorianToReconstructed(parts);

  if (reconstructed.kind === "month-day") {
    const { weekOfYear, weekday } = reconstructedWeekInfo(reconstructed);
    conversionPrimary.textContent = `${reconstructed.day} ${reconstructed.monthName} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Mes ${reconstructed.month}/13 · semana ${weekOfYear}/52 · día ${weekday}/7 · ciclo ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
  } else {
    conversionPrimary.textContent = `Día del Año ${reconstructed.yearDay} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Fuera de los 13 meses y de las 52 semanas · ciclo ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
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
  if (viewAuc <= 1) return;
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
