import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), "utf8");
}

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function cssVariable(css, name) {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  assert.ok(match, `No se encontró --${name}`);
  return match[1];
}

test("HTML contiene todos los puntos de montaje requeridos por app.js", async () => {
  const html = await read("index.html");
  const requiredIds = [
    "calendar-grid", "year-days", "converter-form", "gregorian-input",
    "conversion-primary", "conversion-secondary", "prev-year", "next-year",
    "current-year", "view-year", "today-gregorian", "today-auc",
    "today-position", "today-week", "cycle-progress-label", "cycle-progress",
    "today-day", "today-month"
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

test("texto pequeño clave mantiene contraste WCAG AA", async () => {
  const styles = await read("styles.css");
  const additions = await read("ui-additions.css");
  const paper = cssVariable(styles, "paper");
  const muted = cssVariable(styles, "muted");
  const heroRule = /\.hero-status-rule\s*\{[^}]*color:\s*(#[0-9a-fA-F]{6})/s.exec(additions);
  assert.ok(heroRule, "Falta el color auditado de .hero-status-rule");
  assert.ok(contrastRatio(muted, paper) >= 4.5, "--muted no alcanza 4.5:1 sobre --paper");
  assert.ok(contrastRatio(heroRule[1], paper) >= 4.5, ".hero-status-rule no alcanza 4.5:1");
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

test("la capa lunar se carga localmente y no depende de APIs externas", async () => {
  const app = await read("src/app.js");
  const moonUi = await read("src/moon-ui.js");
  const moon = await read("src/moon.js");
  const moonCss = await read("moon.css");

  assert.match(app, /import "\.\/moon-ui\.js"/);
  assert.match(moonUi, /from "\.\/moon\.js"/);
  assert.match(moonUi, /link\.href = "\.\/moon\.css"/);
  assert.match(moonUi, /primaryMoonPhaseForGregorianDay/);
  assert.doesNotMatch(moonUi, /\bfetch\s*\(/);
  assert.doesNotMatch(moon, /https?:\/\//);
  assert.match(moonCss, /\.moon-marker/);
});
