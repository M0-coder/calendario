# Calendario

Calendario web contemporáneo inspirado en la nomenclatura romana y estructurado en 13 meses de 28 días, más 1–2 Días del Año fuera de los meses y de la semana.

## Estado

La aplicación está en producción y `main` es la rama desplegable. Los cambios se desarrollan en ramas, pasan por CI y Preview de Vercel, y solo después se integran a `main`.

- Producción: https://calendario-virid.vercel.app
- Plataforma: Vercel
- Integración: GitHub ↔ Vercel
- Runtime de herramientas: Node 22.x fijado en `package.json`
- Runtime de la aplicación: web estática, sin dependencias externas

## Contrato del calendario

- El ciclo comienza el 1 de marzo gregoriano.
- 13 meses × 28 días = 364 días regulares.
- Los 364 días forman 52 semanas exactas de lunes a domingo.
- Cada mes comienza en lunes y termina en domingo.
- Los 1–2 Días del Año restantes no pertenecen a ningún mes ni a ninguna semana; por eso 1 Martius vuelve a ser lunes en cada ciclo.
- El año se expresa como AUC mediante la equivalencia aritmética definida en el motor.
- `Mercedonius` es reutilizado como mes XIII fijo por decisión de esta reconstrucción; no se presenta como calendario romano histórico literal.

## Ingeniería

El núcleo de dominio vive en `src/calendar.js` y no depende del DOM. `src/app.js` consume ese contrato para la interfaz.

CI ejecuta comprobación sintáctica, pruebas unitarias y cobertura. La deuda pendiente y los gates de estabilidad están documentados en `docs/ENGINEERING.md`.
