# Engineering Doctrine — Calendario

## Alcance actual

Calendario es una web estática, sin backend y sin dependencias de runtime. El núcleo de dominio es un motor determinista de conversión entre fecha gregoriana y un calendario reconstruido de 13 meses × 28 días.

## Especificación del ciclo

- El año reconstruido comienza el **1 de marzo gregoriano**.
- Los meses 1–13 tienen exactamente **28 días** cada uno: 364 días regulares.
- Los 364 días regulares forman **52 semanas exactas**.
- La semana reconstruida se define de **lunes a domingo**.
- Cada `1 Martius` es lunes; por construcción, cada mes empieza en lunes y termina en domingo.
- Los días solares restantes quedan **fuera de los meses y fuera de la semana**.
  - Ciclo normal: 1 Día del Año.
  - Ciclo que cruza un 29 de febrero antes del siguiente 1 de marzo: 2 Días del Año.
- El año AUC se calcula como `año gregoriano de inicio + 753`.
- La interfaz gregoriana admite años `0001–9999`.
- Fechas de enero y febrero pertenecen al ciclo reconstruido iniciado en marzo del año gregoriano anterior.
- `Mercedonius` se utiliza como nombre del mes XIII fijo en esta reconstrucción. Esto no pretende afirmar que el calendario romano histórico tuviera un Mercedonius permanente de 28 días.

## Invariantes obligatorios

1. `1 Martius` coincide con `1 de marzo` y con lunes reconstruido.
2. Cada cambio de mes ocurre exactamente cada 28 días.
3. El día 364 del ciclo es `28 Mercedonius`, semana 52, domingo reconstruido.
4. Ningún Día del Año pertenece a un mes ni a una semana.
5. Conversión `reconstruido → gregoriano → reconstruido` debe conservar mes, día y AUC.
6. La lógica de fechas usa UTC internamente para evitar deriva por zona horaria/DST.
7. Los años gregorianos `0001–0099` deben conservar su valor literal y no sufrir la coerción histórica de `Date.UTC` a `1900–1999`.
8. AUC debe ser un entero mayor o igual que 1.

## Matriz de ingeniería

| Área | Gate | Estado |
|---|---|---|
| Arquitectura | dominio desacoplado de UI | implementado |
| Compilación / parseo | `node --check` | implementado |
| Pruebas unitarias | invariantes, fronteras y regresiones | implementado |
| Reversibilidad exhaustiva | todos los días regulares en ciclos representativos | implementado |
| Pruebas instrumentadas | navegador real | pendiente |
| Cobertura | reporte de `node --test --experimental-test-coverage` | implementado, umbral pendiente |
| Análisis estático | sintaxis + revisión de API del dominio | parcial |
| CI | GitHub Actions, permisos mínimos | implementado |
| Seguridad | CSP + headers + cero secretos | implementado |
| Reproducibilidad | Node 22, cero dependencias externas | implementado |
| Mutation testing | matar mutantes del motor | pendiente antes de v1 estable |
| Deuda técnica | registrada en este documento | activa |
| Evidencia de ejecución | CI verde sobre HEAD exacto + Preview Vercel | exigida por PR |

## Regresiones selladas

### R-01 — Semana anual vs. semana mensual

La UI no puede presentar `semana 1–4` como si fuera la semana del año. El dominio deriva la semana desde `dayOfCycle`, con rango 1–52.

### R-02 — Años 0001–0099

No se usa `Date.UTC(year, ...)` para construir fechas del dominio porque JavaScript remapea años `0–99` a `1900–1999`. La construcción usa `setUTCFullYear` y validación posterior.

### R-03 — Días del Año visibles

La vista anual debe representar también los 1–2 Días del Año. Ocultarlos produce una vista de 364 días que contradice el ciclo solar real de 365/366 días.

### R-04 — Semántica accesible del día actual

`aria-current="date"` pertenece al día actual, no al contenedor del mes. Las abreviaturas de días de semana deben ser inequívocas (`L M X J V S D`) y conservar nombres accesibles completos.

## Deuda técnica explícita

### D-01 — Browser tests

La lógica de dominio está cubierta por tests de Node, pero falta comprobar DOM, navegación y formulario en Chromium/WebKit/Firefox.

### D-02 — Umbral de cobertura

El workflow produce cobertura, pero todavía no falla por debajo de un porcentaje acordado. Debe fijarse un umbral antes de declarar el motor v1 estable.

### D-03 — Mutation testing

Antes de v1 estable se exigirá mutation score explícito sobre `src/calendar.js`.

### D-04 — Validación histórica

La web diferencia deliberadamente hechos históricos de decisiones de reconstrucción. Las afirmaciones históricas extensas deberán incorporar fuentes verificables.

## Gate de merge

No fusionar a `main` si:

- falla cualquier prueba unitaria;
- HEAD exacto no tiene CI verde;
- Vercel Preview no corresponde al HEAD auditado;
- la conversión de fronteras de mes/año no está verificada;
- existe una regresión crítica de accesibilidad o layout;
- se introduce una dependencia sin justificarla y fijarla reproduciblemente.
