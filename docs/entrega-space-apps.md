# Entrega en Space Apps

La entrega se hace desde la página del equipo en spaceappschallenge.org, con la cuenta de quien administra el equipo. Abajo están los pasos y, después, el texto en inglés para pegar en cada campo.

## Plazo

**Cierre: 15 de noviembre de 2026, 23:59 en la hora local del evento de quien es dueño del equipo** (Team Owner). Fuente: [nasa/spaceapps#1916](https://github.com/nasa/spaceapps/discussions/1916).

## Reglas que hay que cumplir

Fuente: discusiones oficiales del repositorio de Space Apps ([#1916](https://github.com/nasa/spaceapps/discussions/1916), [#2123](https://github.com/nasa/spaceapps/discussions/2123)) y la [guía de entrega](https://www.spaceappschallenge.org/resources/project-submission-guide/).

| Regla | Estado |
|---|---|
| Usar al menos un recurso de la NASA (requisito para el juzgamiento global) | Cumplido: Horizons, LRO/LOLA y las regiones de Artemis III |
| Citar todas las fuentes: datos, recursos, herramientas, código, texto e imágenes | Cumplido: `docs/fuentes.md` |
| Declarar el uso de IA («Super Intelligence», SI) y marcar dónde y cómo se usó, con marca visible o metadatos | Cumplido: campo del formulario, pie de la app, metadatos `ai-assistance` en `index.html`, README y `fuentes.md`. **El video también tiene que llevar una leyenda visible** (ver guion) |
| El contenido generado no puede usar ni modificar marcas o elementos de diseño de la NASA | Cumplido: la app no usa logos de la NASA; el logo es propio. No pongan el logo de la NASA en el video ni en las diapositivas |
| El video o las diapositivas no se suben al sitio de Space Apps: va un enlace público | Pendiente: subir el demo |
| El demo sigue la estructura de la guía, empezando por «Lead us in: What challenge does your project address?» | Pendiente: el guion de abajo ya arranca así |

## Pasos

1. Entrar a <https://www.spaceappschallenge.org>, ir a la **página del equipo → pestaña Project** y tocar el botón azul **edit**, a la derecha. Si no aparece, usar la flecha amarilla para expandir la página.
2. Verificar que el repositorio sea **público**: <https://github.com/sr-sebastian/NasaSpaceChallenge>.
3. Verificar que la app publicada abra: <https://sr-sebastian.github.io/NasaSpaceChallenge/>.
4. Grabar el **demo** con el guion de abajo y subirlo a un enlace público: YouTube como «No listado» o Google Drive con acceso por enlace. Confirmen el largo máximo en la guía de entrega.
5. Completar los campos con los textos de abajo.
6. Revisar que todas las personas del equipo estén agregadas.
7. Enviar antes del cierre.

## Campos del formulario

| Campo | Qué poner |
|---|---|
| Project name | `Lunar Landing Site Navigator` |
| High-level summary | Sección «High-level summary» de abajo |
| Link to project demo | Enlace al video o a las diapositivas |
| Link to final project | `https://sr-sebastian.github.io/NasaSpaceChallenge/` (y el repo `https://github.com/sr-sebastian/NasaSpaceChallenge` si hay un campo para el código) |
| Project details | Sección «Project details» |
| Use of artificial intelligence | Sección «Use of artificial intelligence» |
| NASA data | Sección «NASA data» |
| Space agency partner data | No usamos datos de agencias socias. Si el campo es obligatorio: `None.` |
| References | Sección «Other data and references» y, si entra, la lista de software de `fuentes.md` |
| Tags | `Moon`, `Artemis`, `lunar south pole`, `LOLA`, `JPL Horizons`, `3D visualization`, `mission planning`, `education` |

## Guion del demo (30 segundos)

Grabar la app publicada en pantalla completa, en inglés (botón EN), con el ejemplo que abre por defecto (Malapert contra de Gerlache Rim 2, 7 de octubre de 2028). La primera toma responde «What challenge does your project address?», como pide la guía. Durante todo el video, dejar en una esquina la leyenda **«Code written with AI assistance (Claude Code, ChatGPT). All data: NASA/JPL, LRO LOLA, USGS.»** para cumplir la regla de marcar el uso de IA.

| Tiempo | Imagen | Texto en pantalla o narración |
|---|---|---|
| 0–4 s | Vista aérea del macizo Malapert | «Challenge: where and when to land at the lunar south pole, where the Sun never climbs more than a few degrees.» |
| 4–9 s | «Look at the Sun»: el módulo, el Sol rasante y las sombras largas | «Real LRO/LOLA terrain decides when there is power and when Earth is in view.» |
| 9–15 s | Barra de respuesta: +43 h de luz, −37 h de comunicación | «Switch site or date and see what you gain or lose, in hours.» |
| 15–21 s | Play: el tiempo avanza y aparece «Lander: Hibernating» | «A power model shows whether the lander survives the longest night.» |
| 21–27 s | Calendario 2028: clic en una celda | «A calendar of every 2028 landing window across the nine Artemis III regions.» |
| 27–30 s | Título de la app y la URL | «NASA/JPL Horizons · LRO LOLA · USGS. Lunar Landing Site Navigator.» |

## Textos para pegar

Borrador en inglés. Revísenlo antes de enviar.

## Project name

Lunar Landing Site Navigator

## High-level summary

At the lunar south pole the Sun never rises more than a few degrees and Earth hangs just above the horizon, so a ridge a few kilometres away can cut power or communications for days. Our Navigator lets anyone compare where and when to land at the nine Artemis III candidate regions. For each site and hour it uses NASA/JPL Horizons ephemerides and the real LRO/LOLA horizon to show whether the Sun and Earth are visible, then answers the challenge question directly: switching from one site or date to another, how many hours of sunlight and of direct contact with Earth do you gain or lose, and how long is the longest night the battery must survive.

## Project details

**What it does.** The user sets up to four scenarios (site, landing date, stay length). The page opens with the answer: the change in sunlight hours, Earth-contact hours, longest night and longest blackout compared with the base scenario, plus one plain-language sentence. Below it, a 3D view puts the user next to a lander on 24 km of real LOLA terrain. The lander's solar wings track the Sun and its antenna points at Earth, and on-screen markers say in words whether each body is visible or hidden behind terrain. Hour-by-hour timelines, a 360° sky map, a lander power simulation, a calendar of 2028 landing windows for all nine regions, CSV export and shareable links complete the tool. A six-step guided tour turns the same view into a classroom lesson. The app is in English and Spanish.

**How it works.** A Python pipeline traces 720 horizon directions out to 250 km from the LOLA 80 m DEM for each site, with lunar curvature. Inside each official USGS region polygon it evaluates a 1 km grid and keeps the point with the most hours of simultaneous Sun and Earth visibility. Horizons then provides hourly topocentric azimuth and elevation of the Sun and Earth for each chosen point at its real height. The browser compares those angles with the horizon mask, so every number and every image comes from the same data.

**Benefits.** Mission planners get a fast trade study between energy and communication. Teachers and the public get an intuitive picture of why the south pole is hard: low Sun, long shadows and Earth wobbling near the horizon.

**Tools.** TypeScript, React, Vite, three.js (react-three-fiber), Python (NumPy, Pillow), GitHub Pages.

**What we found.** Terrain matters in both directions. From high summits the horizon dips below 0°, so Malapert Massif keeps Earth in view all year and gets more sunlight than a flat horizon would predict. Sites near the pole such as de Gerlache Rim 2 get the most sunlight but lose Earth for long periods. The trade-off changes from week to week, which the calendar makes visible.

## NASA data

Full classified source list: [`fuentes.md`](fuentes.md).

- NASA/JPL Horizons API (DE441 ephemerides): https://ssd.jpl.nasa.gov/api/horizons.api
- LRO/LOLA polar gridded elevation data, LDEM_80S_80M (NASA PDS Geosciences Node): https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
- NASA Artemis III candidate landing regions (October 2024 update): https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/

## Space agency partner data

None.

## Other data and references

- USGS Astrogeology, McClernan, M. T. (2024). *Down Selected Artemis III Candidate Landing Site Navigational Grids.* doi:10.5066/P1MEQ6UK

## Use of artificial intelligence

We used AI coding assistants (Claude Code and ChatGPT) to help write and refactor code and interface text. The team reviewed and tested the output. All data comes from the NASA, JPL and USGS sources listed above. No data, imagery, results or conclusions were generated by AI.
