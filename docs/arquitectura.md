# Arquitectura

La app es estática: React 19 + Vite + TypeScript, con la escena 3D en three.js (react-three-fiber, drei y postprocessing). No hay servidor. Todos los cálculos pesados se hacen una vez en `scripts/` y el navegador solo lee archivos de `public/data/`.

## Estructura

```
scripts/
  fetch-horizons.mjs     efemérides horarias del Sol y la Tierra (API de Horizons)
  lola_horizon.py        máscaras de horizonte, elección del punto representativo, relieve del mapa
  terrain_tiles.py       recortes de terreno de 24 km por sitio para la escena 3D
public/data/
  artemis3-regions.geojson       polígonos oficiales USGS
  horizons.json                  por sitio: punto, altura, polígono, máscara de 720 valores
  ephem-2028.json                Az/El del Sol y la Tierra, 8784 horas × 9 sitios
  terrain/<sitio>.bin            241 × 241 alturas int16 (100 m de separación)
  south-pole-hillshade.png/.json relieve sombreado para el mapa
src/
  main.tsx                       punto de entrada
  navigator/
    Navigator.tsx                página: estado, escenarios, paneles
    data.ts                      carga de datos, visibilidad, métricas, mejor fecha, calendario
    energy.ts                    modelo de batería y paneles
    tour.ts                      pasos del recorrido guiado
    Charts.tsx                   mapa del polo, ventanas, mapa del cielo, calendario, batería
    regions.ts                   las 9 regiones (generado desde horizons.json)
    i18n.ts                      textos en español e inglés
    Icon.tsx                     iconos de trazo
    nv.css                       sistema visual
    scene/
      SiteScene.tsx              lienzo 3D, luz, cámara, controles, marcadores, brújula
      ground.tsx                 malla LOLA, parche cercano con piedras, texturas
      Lander.tsx                 módulo con paneles que siguen al Sol y antena hacia la Tierra
    *.test.ts                    tests (vitest)
```

## Flujo de datos

1. `loadEphem()` descarga `ephem-2028.json` y `horizons.json`, y convierte cada máscara en un `Int16Array`.
2. `metrics(e, sitio, inicio, horas, terreno)` recorre las horas de la estadía y compara la elevación del cuerpo con la máscara en su azimut. Devuelve las horas de cada tipo, las rachas más largas y dos arreglos hora a hora (`sun`, `earth`).
3. Esos arreglos alimentan la línea de tiempo, el modelo de energía (`runEnergy`) y la comparación.
4. La escena 3D recibe el azimut, la elevación y el horizonte de la hora actual. Coloca el Sol y la Tierra con `dirFromAzEl` en un marco local: x = este, y = arriba, z = sur.
5. El estado (escenarios, estadía, terreno e idioma) se guarda en el hash de la URL, así un enlace copiado reproduce la misma comparación.

## Escena 3D

- **Terreno:** `PlaneGeometry` de 241 × 241 vértices con las alturas LOLA, incluida la caída por curvatura. El color depende de la pendiente, con una textura de regolito procedural.
- **Horizonte lejano:** un anillo a 30 km cuya silueta es exactamente la máscara LOLA. Lo que se ve en el horizonte coincide con lo que se calcula.
- **Parche cercano:** 500 m alrededor del módulo, con la misma triangulación que la malla grande para quedar cosido sin huecos. Suma microrrelieve, cráteres chicos y 420 piedras. Es solo visual.
- **Luz:** una luz direccional desde el Sol. El encuadre de su sombra se ajusta a la distancia de la cámara: de cerca da sombras nítidas del módulo, de lejos las de las montañas. La intensidad baja cuando el disco solar queda tapado.
- **Tierra:** un shader que la ilumina desde la dirección del Sol, así su fase es la real aunque el Sol esté oculto para el sitio.
- **Marcadores:** cada cuadro se proyectan las posiciones 3D a la pantalla y se mueven elementos HTML sin pasar por React. Fuera de cuadro aparece una flecha en el borde.
- **Controles:**
  - La rueda y el desplazamiento con dos dedos mueven la página.
  - El pellizco o Ctrl/⌘ + rueda acercan.
  - En pantallas táctiles, un dedo desplaza la página y dos dedos mueven la vista.
  - Las flechas y las teclas + y − funcionan con la vista enfocada.

## Regenerar los datos

Hace falta el DEM `ldem_80s_80m.img` (115 MB), del [PDS de LOLA](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/). Los scripts de Python usan numpy y Pillow.

1. Bajar las efemérides en algún punto de cada región:

   ```bash
   node scripts/fetch-horizons.mjs
   ```

2. Calcular las máscaras y elegir el mejor punto de cada región (tarda unos 6 minutos):

   ```bash
   python3 scripts/lola_horizon.py /ruta/a/ldem_80s_80m.img
   ```

3. Volver a bajar las efemérides, ahora exactas para los puntos elegidos:

   ```bash
   node scripts/fetch-horizons.mjs
   ```

4. Generar los recortes de terreno para la escena 3D:

   ```bash
   python3 scripts/terrain_tiles.py /ruta/a/ldem_80s_80m.img
   ```

Si cambian los puntos, hay que regenerar también `src/navigator/regions.ts`, que es una copia de los campos de `horizons.json` que la interfaz necesita al arrancar.

## Tests

```bash
pnpm test
```

Los tests verifican el modelo de energía, la integridad de los archivos de datos (9 sitios, 8784 horas, máscaras de 720 valores dentro de rangos físicos) y una prueba de plausibilidad: Malapert ve la Tierra más del 95 % del año.

## Publicación

`.github/workflows/pages.yml` compila y publica en GitHub Pages en cada push a `main`. `vite.config.ts` usa `base: './'`, así funciona en cualquier subruta.
