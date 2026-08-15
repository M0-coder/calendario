# Capa lunar — contrato astronómico

## Principio

La Luna es una capa astronómica independiente del calendario reconstruido.

- `src/calendar.js` organiza el ciclo XIII × XXVIII, AUC y Días del Año.
- `src/moon.js` calcula el estado observable de la Luna.
- Ninguna fase lunar modifica meses, semanas, AUC ni la posición de una fecha dentro del calendario.

## Datos expuestos

Para una fecha compatible, la capa lunar devuelve:

- una de 8 fases: Luna nueva, Creciente, Cuarto creciente, Gibosa creciente, Luna llena, Gibosa menguante, Cuarto menguante y Menguante;
- tendencia: creciente, menguante o transición cerca de luna nueva/luna llena;
- fracción y porcentaje iluminado;
- edad lunar aproximada, expresada sobre un mes sinódico medio de 29.530588853 días;
- próxima fase principal aproximada;
- marcadores diarios para las cuatro fases principales.

## Convención temporal

- El panel "hoy" usa el instante real del navegador.
- Una fecha sin hora, como la del conversor o una celda del calendario, se evalúa a las 12:00 UTC para evitar ambigüedad de zona horaria en el estado diario.
- Los símbolos Unicode representan la categoría de fase. No pretenden reproducir la orientación aparente del terminador para un hemisferio concreto.

## Método

El motor usa un modelo geocéntrico compacto de posiciones solares y lunares de bajo orden para derivar elongación, ángulo de fase, iluminación y posición dentro de la lunación. Funciona completamente en el cliente y no consulta una API durante el uso normal.

No se presenta como una efeméride profesional. La próxima fase principal y la edad lunar se etiquetan como aproximadas.

## Rango operativo y evidencia

La interfaz lunar limita su **rango operativo a 1700–2100**. Fuera de ese intervalo el calendario XIII × XXVIII sigue funcionando, pero la capa lunar no devuelve valores astronómicos.

Ese intervalo coincide con el rango publicado por el servicio de fases lunares de U.S. Naval Observatory. Esto no significa que cada fecha de los cuatro siglos haya sido validada individualmente. La regresión automatizada actual está contrastada con fases principales oficiales de USNO alrededor de agosto y septiembre de 2026.

## Anclas de regresión

Los tests incluyen las cuatro fases principales publicadas por USNO alrededor de agosto de 2026:

- Luna nueva — 2026-08-12 17:37 UTC
- Cuarto creciente — 2026-08-20 02:46 UTC
- Luna llena — 2026-08-28 04:18 UTC
- Cuarto menguante — 2026-09-04 07:51 UTC

El modelo debe clasificar correctamente esas fases y permanecer cerca de sus fracciones de ciclo ideales 0, 0.25, 0.5 y 0.75.

## Fuentes de referencia

- U.S. Naval Observatory — Phases of the Moon and Percent of the Moon Illuminated: https://aa.usno.navy.mil/faq/moon_phases
- U.S. Naval Observatory — Dates of Primary Phases of the Moon: https://aa.usno.navy.mil/data/MoonPhases
- U.S. Naval Observatory — API Documentation: https://aa.usno.navy.mil/data/api.html
- NASA Science — synodic month / lunar month: https://science.nasa.gov/eclipses/glossary/
