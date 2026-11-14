# Lunar Landing Site Navigator

**NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator**

> If I change the site or the date, how much sunlight and communication time do I gain or lose?

Herramienta web (ES/EN) para comparar **dónde y cuándo** aterrizar en el polo sur lunar. Para cada sitio y fecha muestra dónde están el **Sol** (energía) y la **Tierra** (comunicación directa) respecto del horizonte **real**, y cuánto se gana o pierde al cambiar de escenario.

## Qué hace
- **Respuesta primero:** al comparar A con B, la diferencia de horas de luz, de contacto, de noche más larga y de tiempo sin contacto aparece arriba, en grande, junto con una frase simple.
- **Escena 3D del sitio:** 24 × 24 km de terreno real LRO/LOLA, el módulo, el Sol con sombras rasantes y la Tierra con su fase real. Las etiquetas dicen en palabras si cada cuerpo está visible o tapado por el relieve. Tiene una línea de tiempo con reproducción.
- **Ventanas de operación** de todos los escenarios, alineadas desde el aterrizaje.
- **Mapa del cielo:** el horizonte de 360° desplegado, con los recorridos del Sol y la Tierra.
- **Energía del módulo:** simulación de batería y paneles con la luz real del escenario. Responde si el módulo sobrevive la noche más larga.
- **Calendario de ventanas 2028** (9 sitios × 366 días), **ranking**, **★ mejor fecha**, **exportación a CSV** y **enlace para compartir**.
- **Recorrido guiado** de 6 pasos para docentes, sobre la misma vista y con los mismos datos.
- Opción **«Sin relieve»** para mostrar cuánto cambia el resultado según el terreno.

## Datos y pipeline (`scripts/`)
| Paso | Fuente | Salida |
|---|---|---|
| Regiones | Polígonos oficiales de las 9 regiones de Artemis III, USGS (McClernan 2024, [doi:10.5066/P1MEQ6UK](https://doi.org/10.5066/P1MEQ6UK)) | `public/data/artemis3-regions.geojson` |
| Horizonte real | LRO/LOLA `LDEM_80S_80M` ([PDS](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/)): 720 azimuts, hasta 250 km, con curvatura, observador a 2 m | `public/data/horizons.json` |
| Punto representativo | Grilla de 1 km dentro de cada región; se elige el punto con más horas de Sol y Tierra a la vez en 2028 | `horizons.json` |
| Sol y Tierra | NASA/JPL Horizons API (DE441), Az/El topocéntricos sobre la Luna con la altura real del terreno, cada hora de 2028 | `public/data/ephem-2028.json` |
| Terreno 3D y mapa | Recortes LOLA de 24 km por sitio y relieve sombreado del polo | `public/data/terrain/*.bin`, `south-pole-hillshade.png` |

```bash
node scripts/fetch-horizons.mjs
```

```bash
python3 scripts/lola_horizon.py /ruta/ldem_80s_80m.img
```

```bash
node scripts/fetch-horizons.mjs
```

```bash
python3 scripts/terrain_tiles.py /ruta/ldem_80s_80m.img
```

## Ejecutar

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
```

## Limitaciones
- Obstáculos menores a 80 m: no incluidos.
- Eclipses: no incluidos.
- Presupuesto de enlace y relés: no incluidos.
- Energía: el modelo es didáctico.
- Herramienta educativa y de exploración, no de planificación operacional.

## Uso de IA
El código y los textos se desarrollaron con ayuda de asistentes de IA (Claude Code, ChatGPT). Los datos provienen solo de las fuentes citadas.

El simulador 3D anterior («Misión Polo Sur») quedó en la rama `legacy-mision-polo-sur-3d`.
