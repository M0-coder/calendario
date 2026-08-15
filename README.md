# Calendario

Calendario web experimental inspirado en la nomenclatura del calendario romano y estructurado en 13 meses de 28 días.

## Estado

Repositorio inicializado. La implementación se desarrolla fuera de `main` y se integra únicamente después de revisión y evidencia de pruebas.

## Doctrina de ingeniería

Antes de considerar una versión desplegable se exige alcance explícito de arquitectura, compilación, pruebas unitarias, cobertura, análisis estático, CI, seguridad, reproducibilidad, mutation testing, deuda técnica y evidencia de ejecución.

## Vercel

La integración GitHub ↔ Vercel está conectada. Las ramas de trabajo generan Preview Deployments automáticos y `main` es la rama de producción. El runtime de Node queda fijado por `package.json` en `22.x`, que prevalece sobre la selección del proyecto en Vercel.
