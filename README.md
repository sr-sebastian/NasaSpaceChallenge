# Lunar Landing Site Navigator

**NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator**

> If I change the site or the date, how much sunlight and communication time do I gain or lose?

Herramienta web (ES/EN) para comparar **dónde y cuándo** aterrizar en el polo sur lunar. Para cada sitio y fecha muestra dónde están el **Sol** (energía) y la **Tierra** (comunicación directa) respecto del horizonte, y cuánto se gana o pierde al cambiar de escenario.

## Funcionalidades
- **Hasta 4 escenarios** (sitio + fecha + estadía de 3 a 28 días), comparados contra un escenario base. Cada uno muestra horas de Sol, de Tierra y de ambos, la noche más larga y el mayor apagón de radio, con su delta y una frase en lenguaje simple.
- **Ventanas de operación**: líneas de tiempo alineadas desde el aterrizaje, con un cursor horario.
- **Cielo desde el sitio**: panorama de azimut contra elevación con las trayectorias del Sol y la Tierra sobre el horizonte.
- **Calendario 2028**: mapa de calor de 9 sitios × 366 días. Un clic elige la fecha.
- **Ranking** de las 9 regiones para la fecha elegida, **★ Mejor fecha** automática por sitio, **exportación a CSV** y **enlace para compartir**.
- **Modo docente**: el simulador 3D original («Misión Polo Sur»), que usa un modelo simplificado.

## Datos
- **NASA/JPL Horizons API** (DE441): azimut y elevación aparentes del Sol (10) y la Tierra (399), sin atmósfera, calculados de forma topocéntrica en la superficie lunar (`coord@301`), cada hora durante 2028. Se regeneran con `node scripts/fetch-horizons.mjs` y quedan en `public/data/ephem-2028.json`.
- **Sitios**: un punto representativo aproximado dentro de cada una de las 9 regiones candidatas de Artemis III (NASA, 2024). Ver `scripts/regions.mjs`.
- **Limitación**: el horizonte es geométrico y ajustable. El relieve real de LRO/LOLA es el próximo paso.

## Ejecutar

```bash
pnpm install
pnpm dev
```

## Uso de IA
El código y los textos se desarrollaron con ayuda de asistentes de IA (Claude Code, ChatGPT). Los datos provienen solo de las fuentes citadas.
