# Engineering Doctrine — Calendario

## Alcance v0.1

La primera versión es una web estática, sin backend y sin dependencias de runtime. El núcleo de dominio es un motor determinista de conversión entre fecha gregoriana y un calendario reconstruido de 13 meses × 28 días.

## Especificación del ciclo

- El año reconstruido comienza el **1 de marzo gregoriano**.
- Los meses 1–13 tienen exactamente **28 días** cada uno: 364 días regulares.
- Los días solares restantes quedan **fuera de los meses**.
  - Ciclo normal: 1 Día del Año.
  - Ciclo que cruza un 29 de febrero antes del siguiente 1 de marzo: 2 Días del Año.
- El año AUC se calcula como `año gregoriano de inicio + 753`.
- Fechas de enero y febrero pertenecen al ciclo reconstruido iniciado en marzo del año gregoriano anterior.
- `Mercedonius` se utiliza como nombre del mes XIII fijo en esta reconstrucción. Esto no pretende afirmar que el calendario romano histórico tuviera un Mercedonius permanente de 28 días.

## Invariantes obligatorios

1. `1 Martius` coincide con `1 de marzo`.
2. Cada cambio de mes ocurre exactamente cada 28 días.
3. El día 364 del ciclo es `28 Mercedonius`.
4. Ningún Día del Año pertenece a un mes.
5. Conversión `reconstruido → gregoriano → reconstruido` debe conservar mes, día y AUC.
6. La lógica de fechas usa UTC internamente para evitar deriva por zona horaria/DST.

## Matriz de ingeniería

| Área | Gate v0.1 | Estado inicial |
|---|---|---|
| Arquitectura | dominio desacoplado de UI | implementado |
| Compilación / parseo | `node --check` | implementado |
| Pruebas unitarias | invariantes y fronteras | implementado |
| Pruebas instrumentadas | navegador real | pendiente |
| Cobertura | reporte de `node --test --experimental-test-coverage` | implementado, umbral pendiente |
| Análisis estático | sintaxis + revisión de API del dominio | parcial |
| CI | GitHub Actions, permisos mínimos | implementado |
| Seguridad | CSP + headers + cero secretos | implementado |
| Reproducibilidad | Node 22, cero dependencias externas | implementado |
| Mutation testing | matar mutantes del motor | pendiente antes de v1 estable |
| Deuda técnica | registrada en este documento | activa |
| Evidencia de ejecución | CI verde sobre HEAD exacto | pendiente hasta ejecución |

## Deuda técnica explícita

### D-01 — Browser tests

La lógica de dominio está cubierta por tests de Node, pero falta comprobar DOM, navegación y formulario en Chromium/WebKit/Firefox.

### D-02 — Umbral de cobertura

El workflow produce cobertura, pero v0.1 aún no falla por debajo de un porcentaje acordado. Debe fijarse un umbral antes de declarar el motor estable.

### D-03 — Mutation testing

No se introduce Stryker u otra dependencia hasta que el contrato matemático esté revisado. Antes de v1 estable se exigirá mutation score explícito sobre `src/calendar.js`.

### D-04 — Validación histórica

La web diferencia deliberadamente hechos históricos de decisiones de reconstrucción. Las afirmaciones históricas deberán incorporar fuentes primarias/secundarias verificables antes de publicar una sección histórica extensa.

## Criterio de salida de la rama v0.1

No fusionar a `main` si:

- falla cualquier prueba unitaria;
- HEAD exacto no tiene CI verde;
- la conversión de fronteras de mes/año no está verificada;
- el deployment preview presenta errores de consola o layout crítico;
- se introduce una dependencia sin justificarla y fijarla reproduciblemente.
