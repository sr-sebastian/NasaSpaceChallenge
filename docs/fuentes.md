# Fuentes

Todas las fuentes que usa el proyecto, agrupadas según las categorías del formulario de Space Apps: datos de la NASA, datos de otras agencias, referencias, software y uso de IA. Para cada una se indica qué se tomó, dónde se usa en el repositorio y sus condiciones de uso.

## 1. Datos de la NASA

### 1.1 Efemérides del Sol y de la Tierra: NASA/JPL Horizons

| | |
|---|---|
| **Organismo** | NASA Jet Propulsion Laboratory (JPL), Solar System Dynamics Group |
| **Servicio** | Horizons System, API: <https://ssd.jpl.nasa.gov/api/horizons.api> |
| **Documentación** | <https://ssd-api.jpl.nasa.gov/doc/horizons.html> · <https://ssd.jpl.nasa.gov/horizons/> |
| **Efemérides** | DE441 (Park, R. S., Folkner, W. M., Williams, J. G. y Boggs, D. H., 2021, *The Astronomical Journal* 161:105, doi:[10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414)) |
| **Qué se pidió** | Azimut y elevación aparentes sin atmósfera (`QUANTITIES='4'`, `APPARENT='AIRLESS'`) del Sol (`10`) y de la Tierra (`399`), vistos desde un punto de la superficie lunar (`CENTER='coord@301'`, coordenadas geodésicas y altura del terreno), cada hora del 1/1/2028 al 31/12/2028 |
| **En el repo** | `scripts/fetch-horizons.mjs` → `public/data/ephem-2028.json` |
| **Se usa para** | Visibilidad hora por hora, métricas, mapa del cielo, posición del Sol y la Tierra en la escena 3D, fase de la Tierra |
| **Condiciones** | Servicio público de la NASA/JPL |

### 1.2 Relieve del polo sur: LRO / LOLA

| | |
|---|---|
| **Organismo** | NASA, misión Lunar Reconnaissance Orbiter (LRO), instrumento Lunar Orbiter Laser Altimeter (LOLA). Distribuido por el NASA Planetary Data System (PDS), Geosciences Node (Washington University in St. Louis) |
| **Conjunto de datos** | LRO-L-LOLA-4-GDR-V1, producto polar `LDEM_80S_80M` (modelo de elevación de 80°S a 90°S, 80 m/píxel, proyección polar estereográfica) |
| **Descarga** | <https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/> (`ldem_80s_80m.img` + `.lbl`) |
| **Cita** | Smith, D. E. et al. (2010). *LRO-L-LOLA-4-GDR-V1*. NASA Planetary Data System. Instrumento descrito en Smith, D. E. et al. (2010), *Space Science Reviews* 150:209–241, doi:[10.1007/s11214-009-9512-y](https://doi.org/10.1007/s11214-009-9512-y) |
| **En el repo** | `scripts/lola_horizon.py` → `public/data/horizons.json` y `public/data/south-pole-hillshade.png`; `scripts/terrain_tiles.py` → `public/data/terrain/*.bin` |
| **Se usa para** | Máscaras de horizonte (720 azimuts, hasta 250 km), elección del punto representativo de cada región, terreno 3D de 24 km por sitio, relieve sombreado del mapa |
| **Condiciones** | Datos de la NASA, de dominio público |

El archivo de 115 MB no está en el repositorio; los scripts lo leen desde una ruta local.

### 1.3 Regiones candidatas de Artemis III

| | |
|---|---|
| **Organismo** | NASA, Artemis Program |
| **Fuente** | Comunicado *NASA Provides Update on Artemis III Moon Landing Regions* (28 de octubre de 2024): <https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/> |
| **Qué se tomó** | La lista de las 9 regiones: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 y Slater Plain |
| **En el repo** | Nombres e identificadores en `src/navigator/regions.ts` |

| | |
|---|---|
| **Fuente complementaria** | George, J., Rubio, R., Lawrence, S. y Curell, D. *Artemis III Site Selection Update: Downselection From Thirteen to Nine Candidate Regions*, resumen para la Lunar and Planetary Science Conference 2026. NASA Technical Reports Server, documento 20250011660: <https://ntrs.nasa.gov/citations/20250011660> |
| **Qué se tomó** | Los criterios de selección (iluminación, visibilidad de la Tierra, duración de superficie de 5,75 a 6,25 días), usados como contexto para las métricas y la estadía por defecto |

### 1.4 Consigna del desafío

| | |
|---|---|
| **Organismo** | NASA Space Apps Challenge 2026 |
| **Fuente** | *Lunar Landing Site Navigator*: <https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/> |
| **Qué se tomó** | El enunciado: comparar sitios y fechas de alunizaje en el polo sur según la posición del Sol (energía) y de la Tierra (comunicación) respecto del horizonte |

## 2. Datos de otras agencias

### 2.1 Polígonos oficiales de las regiones: USGS

| | |
|---|---|
| **Organismo** | U.S. Geological Survey (USGS), Astrogeology Science Center. No es la NASA ni una agencia espacial socia de Space Apps: es una agencia científica del gobierno de EE. UU. que trabaja con la NASA en cartografía planetaria |
| **Conjunto de datos** | McClernan, M. T. (2024). *Down Selected Artemis III Candidate Landing Site Navigational Grids*. U.S. Geological Survey data release, doi:[10.5066/P1MEQ6UK](https://doi.org/10.5066/P1MEQ6UK) |
| **Archivos usados** | `A3_9regions-lonlat-simplified` (polígonos de las 9 regiones en latitud/longitud) y, para verificar, las grillas LGRS de 1 km de cada región |
| **En el repo** | `public/data/artemis3-regions.geojson`; centroides y polígonos en `horizons.json` y `regions.ts` |
| **Se usa para** | Delimitar cada región y buscar dentro de ella el punto representativo; dibujar las regiones en el mapa |
| **Condiciones** | Datos del gobierno de EE. UU., de dominio público |

## 3. Referencias y antecedentes

No aportan datos al cálculo, pero se consultaron durante el diseño.

| Referencia | Para qué se consultó |
|---|---|
| *Umbra: Lunar Landing Site Navigator*, proyecto independiente para el mismo desafío: <https://umbra-lunar-navigator.turfyheart.chatgpt.site> | Antecedente: tomamos de ahí la combinación Horizons + LOLA, la altura del observador de 2 m y la idea de alinear las ventanas de operación desde el aterrizaje. El código, el diseño, el criterio para elegir el punto de cada región y el resto de las funciones son propios |
| NASA Space Apps, guía de entrega: <https://www.spaceappschallenge.org/resources/project-submission-guide/> | Requisitos de la entrega (datos usados, declaración de uso de IA) |
| NASA Space Apps, premios: <https://www.spaceappschallenge.org/awards/> | Criterios de evaluación |

## 4. Software y recursos

### 4.1 Aplicación web

| Paquete | Versión | Uso | Licencia |
|---|---|---|---|
| [React](https://react.dev) y React DOM | 19.2 | Interfaz | MIT |
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Lenguaje | Apache-2.0 |
| [Vite](https://vite.dev) + @vitejs/plugin-react | 7.2 / 5.1 | Compilación y servidor de desarrollo | MIT |
| [three.js](https://threejs.org) | 0.181 | Motor 3D | MIT |
| [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) | 9.4 | three.js en React | MIT |
| [@react-three/drei](https://github.com/pmndrs/drei) | 10.7 | Controles de órbita y estrellas | MIT |
| [postprocessing](https://github.com/pmndrs/postprocessing) + [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) | 6.37 / 3.0 | Resplandor del Sol y viñeta | Zlib / MIT |
| [Vitest](https://vitest.dev) | 4.0 | Tests | MIT |

### 4.2 Procesamiento de datos

| Herramienta | Uso | Licencia |
|---|---|---|
| [Node.js](https://nodejs.org) | Descarga de efemérides (`fetch-horizons.mjs`) | MIT |
| [Python](https://www.python.org) 3 | Pipeline LOLA | PSF |
| [NumPy](https://numpy.org) | Trazado de horizontes, recortes de terreno | BSD-3-Clause |
| [Pillow](https://python-pillow.org) | Imagen del relieve sombreado | MIT-CMU (HPND) |

### 4.3 Tipografías

| Fuente | Uso | Licencia |
|---|---|---|
| [Archivo](https://fonts.google.com/specimen/Archivo) (Omnibus-Type), vía Google Fonts | Títulos y textos | SIL Open Font License 1.1 |
| [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono), vía Google Fonts | Datos y números | SIL Open Font License 1.1 |

### 4.4 Recursos gráficos propios

Iconos, modelo 3D del módulo, texturas de regolito, aislamiento térmico y celdas solares, textura de la Tierra, piedras y cráteres del entorno cercano: hechos para este proyecto, generados por código en `src/navigator/Icon.tsx` y `src/navigator/scene/`. No se usaron imágenes ni modelos de terceros.

### 4.5 Publicación

[GitHub Pages](https://pages.github.com) con GitHub Actions (`.github/workflows/pages.yml`).

## 5. Uso de inteligencia artificial

| Herramienta | Empresa | Uso |
|---|---|---|
| Claude Code | Anthropic | Ayuda para escribir y reorganizar código, scripts de datos, textos de la interfaz y documentación |
| ChatGPT / Codex | OpenAI | Ayuda para escribir código y textos en la primera versión |

El equipo revisó y probó el resultado. Ningún dato, imagen, resultado ni conclusión fue generado por IA: todos los números salen de las fuentes de las secciones 1 y 2.

## 6. Cómo citar los datos

> Ephemerides: NASA/JPL Horizons System, DE441. Terrain: LRO LOLA LDEM_80S_80M, NASA Planetary Data System. Candidate regions: NASA (2024), polygons from McClernan, M. T. (2024), USGS data release, doi:10.5066/P1MEQ6UK.
