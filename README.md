# Misión Polo Sur 3D

Simulador educativo 3D para comparar luz solar, comunicación directa con la Tierra y supervivencia energética en cinco sitios del polo sur lunar.

## Ejecutar

```bash
pnpm install
pnpm dev
```

Para generar la versión de producción:

```bash
pnpm build
pnpm preview
```

## Arquitectura

- `src/lib/ephemeris.ts`: modelo horario simplificado e interfaz `EphemerisProvider`.
- `src/lib/terrain.ts`: relieve procedural determinístico y horizonte geométrico.
- `src/lib/sim.ts`: simulación pura, pronóstico de 720 horas y comparación automática.
- `src/scene`: escena React Three Fiber, terreno, cielo y módulo.
- `src/ui`: preparación, HUD y resultado.

## Sustituir por datos reales

Para JPL Horizons, implementá `EphemerisProvider` con un JSON precalculado por sitio y hora, y cambiá `simplifiedEphemeris` en `sim.ts`. Para LOLA, reemplazá `terrainHeight` por muestreo bilineal de un recorte DEM conservando el sistema local X/Z en metros. La simulación y la escena comparten esas funciones, así que la visibilidad seguirá siendo coherente.

> El modelo incluido está simplificado y se ofrece con fines educativos. No debe usarse para navegación ni planificación operacional real.
