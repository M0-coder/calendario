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

function renderToday() {
  const today = getLocalTodayParts();
  const reconstructed = gregorianToReconstructed(today);

  document.querySelector("#today-gregorian").textContent = formatGregorian(today);
  document.querySelector("#today-auc").textContent = reconstructed.auc;

  if (reconstructed.kind === "month-day") {
    document.querySelector("#today-day").textContent = reconstructed.day;
    document.querySelector("#today-month").textContent = reconstructed.monthName.toUpperCase();
    document.querySelector("#today-note").textContent =
      `Mes ${reconstructed.month} de 13 · día ${reconstructed.dayOfCycle} del ciclo de ${reconstructed.cycleLength} días.`;
  } else {
    document.querySelector("#today-day").textContent = reconstructed.yearDay;
    document.querySelector("#today-month").textContent = "DÍA DEL AÑO";
    document.querySelector("#today-note").textContent =
      `Día solar fuera de los 13 meses · día ${reconstructed.dayOfCycle} del ciclo.`;
  }

  return reconstructed;
}

function createMonthCard(month, auc, current) {
  const range = monthGregorianRange(auc, month.number);
  const card = document.createElement("article");
  const isCurrent =
    current.kind === "month-day" && current.auc === auc && current.month === month.number;

  card.className = `month-card${isCurrent ? " is-current" : ""}`;
  if (isCurrent) card.setAttribute("aria-current", "date");

  const days = Array.from({ length: 28 }, (_, index) => index + 1)
    .map((day) => {
      const active = isCurrent && current.day === day;
      return `<span class="calendar-day${active ? " is-today" : ""}">${day}</span>`;
    })
    .join("");

  card.innerHTML = `
    <div class="month-card-head">
      <span class="month-number">${String(month.number).padStart(2, "0")}</span>
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

function renderMonths(current) {
  calendarGrid.replaceChildren();
  for (const month of MONTHS) {
    calendarGrid.append(createMonthCard(month, current.auc, current));
  }
}

function renderConversion(parts) {
  const reconstructed = gregorianToReconstructed(parts);

  if (reconstructed.kind === "month-day") {
    conversionPrimary.textContent = `${reconstructed.day} ${reconstructed.monthName} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Mes ${reconstructed.month}/13 · día ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
  } else {
    conversionPrimary.textContent = `Día del Año ${reconstructed.yearDay} · ${reconstructed.auc} AUC`;
    conversionSecondary.textContent =
      `Fuera de los meses · día ${reconstructed.dayOfCycle}/${reconstructed.cycleLength}`;
  }
}

function boot() {
  const today = getLocalTodayParts();
  const current = renderToday();
  renderMonths(current);
  gregorianInput.value = toISO(today);
  renderConversion(today);
}

converterForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const parts = parseISODate(gregorianInput.value);
    renderConversion(parts);
  } catch (error) {
    conversionPrimary.textContent = "Fecha inválida";
    conversionSecondary.textContent = error instanceof Error ? error.message : "No se pudo convertir";
  }
});

boot();
