import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

test("HTML contiene todos los puntos de montaje requeridos por app.js", async () => {
  const html = await read("index.html");
  const requiredIds = [
    "calendar-grid",
    "year-days",
    "converter-form",
    "gregorian-input",
    "conversion-primary",
    "conversion-secondary",
    "prev-year",
    "next-year",
    "current-year",
    "view-year",
    "today-gregorian",
    "today-auc",
    "today-position",
    "today-week",
    "cycle-progress-label",
    "cycle-progress",
    "today-day",
    "today-month"
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Falta #${id} en index.html`);
  }
});

test("el HTML compartido no se etiqueta como Preview ni Producción", async () => {
  const html = await read("index.html");

  assert.doesNotMatch(html, /PR #\d+\s*·\s*Preview/i);
  assert.doesNotMatch(html, />\s*(Preview|Producción)\s*</i);
  assert.match(html, /href=["']\.\/styles\.css["']/);
  assert.match(html, /href=["']\.\/ui-additions\.css["']/);
  assert.match(html, /Reconstrucción contemporánea · AUC/);
});

test("el progreso usa elemento nativo y no depende de estilos inline bajo CSP", async () => {
  const html = await read("index.html");
  const app = await read("src/app.js");

  assert.match(html, /<progress\s+id=["']cycle-progress["']/);
  assert.doesNotMatch(html, /cycle-progress-fill/);
  assert.doesNotMatch(app, /\.style\./);
  assert.match(app, /cycleProgress\.value\s*=\s*reconstructed\.dayOfCycle/);
});

test("la entrada gregoriana y el parser comparten el rango 0001–9999", async () => {
  const html = await read("index.html");
  assert.match(html, /min=["']0001-01-01["']/);
  assert.match(html, /max=["']9999-12-31["']/);
});

test("vercel.json es JSON válido y conserva aislamiento mínimo", async () => {
  const config = JSON.parse(await read("vercel.json"));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));

  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin");
  assert.equal(headers["Cross-Origin-Resource-Policy"], "same-origin");
});

test("la UI usa abreviatura inequívoca para miércoles y no reconstruye fechas con Date.UTC", async () => {
  const app = await read("src/app.js");
  const calendar = await read("src/calendar.js");

  assert.match(app, /short: "X", full: "Miércoles"/);
  assert.doesNotMatch(calendar, /Date\.UTC\s*\(/);
});
