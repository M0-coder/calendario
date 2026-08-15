import {
  parseISODate,
  reconstructedToGregorian,
  reconstructedYearDayCount,
  reconstructedYearDayToGregorian
} from "./calendar.js";
import {
  LUNAR_SUPPORTED_YEARS,
  approximateNextPrimaryPhase,
  moonStateAt,
  moonStateForGregorian,
  primaryMoonPhaseForGregorianDay
} from "./moon.js";

function ensureMoonStyles() {
  if (document.querySelector('link[data-lunar-styles="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./moon.css";
  link.dataset.lunarStyles = "true";
  document.head.append(link);
}

function formatAge(days) {
  return `${days.toFixed(1).replace(".", ",")} días aprox.`;
}

function formatNext(next) {
  return next
    ? `${next.symbol} ${next.name} · ≈${next.daysApprox.toFixed(1).replace(".", ",")} días`
    : "—";
}

function ensureHeroSide() {
  let side = document.querySelector(".hero-side");
  if (side) return side;
  const ledger = document.querySelector(".hero-ledger");
  if (!ledger) throw new Error("No se encontró .hero-ledger");
  side = document.createElement("div");
  side.className = "hero-side";
  ledger.before(side);
  side.append(ledger);
  return side;
}

function ensureMoonCard() {
  let card = document.querySelector("#moon-card");
  if (card) return card;
  card = document.createElement("section");
  card.id = "moon-card";
  card.className = "moon-card";
  card.setAttribute("aria-labelledby", "moon-card-title");
  card.innerHTML = `
    <div class="moon-card-head">
      <span class="moon-disc" id="moon-symbol" aria-hidden="true">🌑</span>
      <div><span class="kicker">LUNA · ESTADO ASTRONÓMICO</span><strong id="moon-card-title">—</strong></div>
    </div>
    <div class="moon-metrics">
      <div><span>Iluminación</span><strong id="moon-illumination">—</strong></div>
      <div><span>Tendencia</span><strong id="moon-trend">—</strong></div>
      <div><span>Edad lunar</span><strong id="moon-age">—</strong></div>
      <div><span>Próxima principal</span><strong id="moon-next">—</strong></div>
    </div>
    <p class="moon-note">Capa astronómica independiente del ciclo XIII × XXVIII. Rango validado ${LUNAR_SUPPORTED_YEARS.min}–${LUNAR_SUPPORTED_YEARS.max}.</p>`;
  ensureHeroSide().append(card);
  return card;
}

function renderMoonToday() {
  ensureMoonCard();
  const now = new Date();
  const state = moonStateAt(now);
  if (!state.supported) {
    document.querySelector("#moon-card-title").textContent = "Fuera del rango validado";
    for (const id of ["moon-illumination", "moon-trend", "moon-age", "moon-next"]) {
      document.querySelector(`#${id}`).textContent = "—";
    }
    return;
  }
  document.querySelector("#moon-symbol").textContent = state.symbol;
  document.querySelector("#moon-card-title").textContent = state.phaseName;
  document.querySelector("#moon-illumination").textContent = `${state.illuminationPercent}%`;
  document.querySelector("#moon-trend").textContent = state.trend;
  document.querySelector("#moon-age").textContent = formatAge(state.ageDaysApprox);
  document.querySelector("#moon-next").textContent = formatNext(approximateNextPrimaryPhase(now));
}

function ensureConversionMoon() {
  let line = document.querySelector("#conversion-moon");
  if (line) return line;
  line = document.createElement("span");
  line.id = "conversion-moon";
  line.className = "conversion-moon";
  document.querySelector("#conversion-secondary")?.after(line);
  return line;
}

function renderConversionMoon() {
  const line = ensureConversionMoon();
  try {
    const parts = parseISODate(document.querySelector("#gregorian-input").value);
    const state = moonStateForGregorian(parts);
    if (!state.supported) {
      line.textContent = `Luna: disponible entre ${LUNAR_SUPPORTED_YEARS.min} y ${LUNAR_SUPPORTED_YEARS.max}`;
      return;
    }
    line.textContent = `${state.symbol} ${state.phaseName} · ${state.illuminationPercent}% iluminada · ${state.trend} · edad ${formatAge(state.ageDaysApprox)}`;
  } catch {
    line.textContent = "";
  }
}

function setMarker(dayElement, phase) {
  if (!phase || dayElement.querySelector(".moon-marker")) return;
  const marker = document.createElement("span");
  marker.className = "moon-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.textContent = phase.symbol;
  dayElement.append(marker);
  const currentLabel = dayElement.getAttribute("aria-label") || dayElement.textContent;
  dayElement.setAttribute("aria-label", `${currentLabel}, ${phase.name}`);
}

function renderCalendarMoonMarkers() {
  const auc = Number.parseInt(document.querySelector("#view-year")?.textContent || "", 10);
  if (!Number.isInteger(auc)) return;
  const cards = [...document.querySelectorAll("#calendar-grid .month-card")];
  cards.forEach((card, monthIndex) => {
    [...card.querySelectorAll(".calendar-day")].forEach((dayElement, dayIndex) => {
      const gregorian = reconstructedToGregorian({ auc, month: monthIndex + 1, day: dayIndex + 1 });
      setMarker(dayElement, primaryMoonPhaseForGregorianDay(gregorian));
    });
  });
  const yearDayCount = reconstructedYearDayCount(auc);
  const items = [...document.querySelectorAll("#year-days .year-day-item")];
  for (let yearDay = 1; yearDay <= Math.min(yearDayCount, items.length); yearDay += 1) {
    const gregorian = reconstructedYearDayToGregorian({ auc, yearDay });
    setMarker(items[yearDay - 1], primaryMoonPhaseForGregorianDay(gregorian));
  }
}

function bootLunarLayer() {
  ensureMoonStyles();
  renderMoonToday();
  ensureConversionMoon();
  queueMicrotask(() => {
    renderConversionMoon();
    renderCalendarMoonMarkers();
  });
  document.querySelector("#converter-form")?.addEventListener("submit", () => queueMicrotask(renderConversionMoon));
  const yearLabel = document.querySelector("#view-year");
  if (yearLabel) {
    new MutationObserver(() => queueMicrotask(renderCalendarMoonMarkers)).observe(yearLabel, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
}

bootLunarLayer();
