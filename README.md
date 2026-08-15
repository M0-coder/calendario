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

## Capa lunar

La Luna se calcula como una capa astronómica separada: no modifica la aritmética XIII × XXVIII. `src/moon.js` expone las ocho fases, tendencia creciente/menguante, iluminación, edad lunar aproximada y las fases principales que se marcan en la vista anual.

La capa lunar trabaja en un rango operativo 1700–2100 y tiene regresiones contrastadas con fases principales oficiales de U.S. Naval Observatory. El método, sus límites y las anclas de prueba están documentados en `docs/LUNAR.md`.

## Ingeniería

El núcleo del calendario vive en `src/calendar.js`; la astronomía lunar vive en `src/moon.js`. Ninguno depende del DOM. `src/app.js` y `src/moon-ui.js` consumen esos contratos para la interfaz.

CI ejecuta comprobación sintáctica, pruebas unitarias y cobertura. La deuda pendiente y los gates de estabilidad están documentados en `docs/ENGINEERING.md`.
