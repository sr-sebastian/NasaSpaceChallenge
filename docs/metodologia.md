# Metodología

Este documento explica de dónde salen los números que muestra el Navigator y qué tan confiables son.

## 1. Sitios

NASA publicó en octubre de 2024 nueve regiones candidatas para el alunizaje de Artemis III: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 y Slater Plain. Cada una mide unos 20 × 20 km, salvo Mons Mouton Plateau, que mide unos 67 × 67 km.

NASA no publica coordenadas de las regiones en sus comunicados. Los polígonos oficiales están en el conjunto de datos de USGS *Down Selected Artemis III Candidate Landing Site Navigational Grids* (McClernan 2024, doi:10.5066/P1MEQ6UK). Usamos el archivo `A3_9regions-lonlat-simplified` de esa publicación y lo verificamos contra las grillas LGRS de 1 km de cada región: los centros calculados con los dos archivos coinciden con diferencias de centésimas de grado.

### Punto representativo

Una región de 400 km² no tiene una sola respuesta: dos puntos separados por 500 m pueden tener horizontes muy distintos. Al principio usamos el centro geométrico de cada polígono, pero en Malapert ese punto cae en una ladera: a 320 m el terreno sube 24 m y tapa el horizonte norte, justo donde está la Tierra.

Por eso, dentro de cada polígono evaluamos una grilla de puntos cada 1 km (2 km en Mons Mouton Plateau) y elegimos el punto con más horas en las que el Sol y la Tierra están visibles a la vez durante 2028. Los empates se resuelven por la suma de horas de Sol y de Tierra, y después por altura. Es el mismo criterio que usaría un planificador que busca un lugar con energía y comunicación al mismo tiempo. El punto elegido no es un sitio de aterrizaje oficial.

## 2. Posición del Sol y de la Tierra

Usamos la API de NASA/JPL Horizons con efemérides DE441:

- `CENTER='coord@301'`: observador sobre la superficie lunar, en las coordenadas del punto y a la altura real del terreno según LOLA.
- `QUANTITIES='4'`: azimut y elevación aparentes.
- `APPARENT='AIRLESS'`: sin refracción, porque la Luna no tiene atmósfera.
- Paso de una hora, del 1 de enero al 31 de diciembre de 2028 (8784 valores por cuerpo y por sitio).

Guardamos el azimut en décimas de grado y la elevación en centésimas, como enteros, para que el archivo pese 1,4 MB.

## 3. Horizonte real

El polo sur lunar tiene montañas de varios kilómetros, y el Sol nunca sube más de unos pocos grados. Por eso el relieve decide casi todo.

Usamos el modelo digital de elevación LRO/LOLA `LDEM_80S_80M`: proyección polar estereográfica, 80 m por píxel, de 80°S a 90°S. Verificamos la orientación de la grilla con accidentes conocidos: los pisos de Shackleton, Shoemaker, Faustini y Cabeus dan valores profundos, y las cumbres de Malapert y Mons Mouton dan entre 5 y 6,6 km sobre el radio de referencia.

Para cada sitio:

1. Ubicamos al observador 2 m sobre el terreno, la altura típica de una antena o un panel de un módulo.
2. Trazamos 720 direcciones, una cada 0,5° de azimut.
3. En cada dirección muestreamos el terreno cada 80 m hasta 10 km, y después con pasos crecientes hasta 250 km, con interpolación bilineal.
4. Para cada muestra calculamos el ángulo de elevación teniendo en cuenta la curvatura lunar:

   `elevación = atan2(r_t·cos θ − r_o, r_t·sin θ)`

   donde `r_o` y `r_t` son los radios del observador y del terreno, y `θ = d / R` es el ángulo central.
5. La máscara de horizonte es el máximo de esos ángulos en cada dirección.

Un cuerpo es **visible** cuando la elevación de su centro supera la máscara en su azimut. Para la luz, la escena 3D atenúa la intensidad según la fracción del disco solar (0,53°) que asoma, así el amanecer y el atardecer se ven graduales.

La opción «Sin relieve» usa un horizonte de 0° y sirve para mostrar cuánto cambia el resultado.

## 4. Métricas

Para un escenario (sitio, día de aterrizaje y estadía de *N* horas) calculamos:

- **Horas de Sol:** horas con el centro del Sol sobre el horizonte.
- **Horas de Tierra:** horas con línea de vista directa a la Tierra.
- **Sol y Tierra:** horas con las dos condiciones a la vez.
- **Noche más larga:** la racha continua más larga sin Sol. Es lo que tiene que aguantar la batería sola.
- **Mayor tiempo sin contacto:** la racha continua más larga sin la Tierra.

La comparación muestra la diferencia de cada métrica entre el escenario elegido y el escenario base (A). En las noches y en los cortes, que haya menos horas es mejor, y los colores lo reflejan.

## 5. Modelo de energía

Es un modelo didáctico para comparar sitios, no para dimensionar un módulo real:

- Paneles verticales que siguen al Sol en azimut. En el polo, el Sol está siempre a pocos grados de altura, así que un panel vertical recibe casi toda la luz. Entregan su potencia nominal cuando el Sol está visible.
- Consumo constante en operación (150, 250 o 400 W) y 80 W en hibernación, que corresponden a los calefactores de supervivencia.
- Hibernación automática cuando no hay Sol y la batería baja del 25 %.
- La batería empieza al 90 %.
- Datos: 40 MB por hora en operación, enviados a 200 MB por hora mientras hay línea de vista con la Tierra.

## 6. Validación

Visibilidad anual en 2028 en el punto representativo de cada región:

| Región | Punto (lat, lon) | Altura | Sol LOLA | Tierra LOLA | Ambos LOLA | Sol plano | Tierra plano | Horizonte máx. |
|---|---|---|---|---|---|---|---|---|
| Peak Near Cabeus B | -83.574°, -68.498° | 4579 m | 55 % | 80 % | 44 % | 49 % | 63 % | 5.4° |
| Haworth | -86.299°, -23.299° | 2655 m | 51 % | 74 % | 38 % | 50 % | 69 % | 10.6° |
| Malapert Massif | -85.959°, 2.104° | 5124 m | 54 % | 100 % | 54 % | 51 % | 72 % | 6.9° |
| Mons Mouton Plateau | -84.512°, 38.663° | 6638 m | 56 % | 100 % | 56 % | 52 % | 74 % | 4.1° |
| Mons Mouton | -85.376°, 31.594° | 6346 m | 49 % | 96 % | 48 % | 52 % | 72 % | 10.4° |
| Nobile Rim 1 | -85.209°, 36.024° | 6733 m | 58 % | 82 % | 47 % | 52 % | 72 % | 2.6° |
| Nobile Rim 2 | -84.099°, 57.774° | 1537 m | 51 % | 82 % | 42 % | 52 % | 69 % | 12.8° |
| de Gerlache Rim 2 | -88.469°, -67.855° | 1569 m | 69 % | 60 % | 44 % | 49 % | 56 % | 3.1° |
| Slater Plain | -87.273°, 127.629° | 528 m | 64 % | 50 % | 35 % | 51 % | 45 % | 0.6° |

Qué muestran estas cifras:

- **Malapert tiene la Tierra visible el 100 % del año**, lo que coincide con la razón por la que el macizo se propone desde hace décadas como sitio de comunicaciones. Un test automático lo verifica.
- **El relieve puede sumar horas.** Desde una cumbre, el horizonte cae por debajo de 0° en muchas direcciones, así que el Sol y la Tierra siguen visibles cuando están apenas debajo del horizonte geométrico. Por eso en varias cumbres el relieve real da más horas que el horizonte plano. En sitios bajos o rodeados de crestas pasa lo contrario.
- **Hay un compromiso entre energía y comunicación.** de Gerlache Rim 2, cerca del polo, tiene la mayor fracción de Sol, pero ve la Tierra solo el 60 % del tiempo. Malapert ve siempre la Tierra, pero tiene noches más largas. Esa es la pregunta de la consigna.

## 7. Limitaciones

- No incluye obstáculos menores a la resolución del DEM (80 m): rocas, cráteres chicos ni pendientes locales. El parche de piedras y cráteres de la escena 3D es ilustrativo y no participa en los cálculos.
- La visibilidad usa el centro del disco: no calcula penumbra parcial, salvo para la intensidad visual de la luz.
- No modela eclipses, presupuesto de enlace, relés ni potencia térmica.
- Para elegir el punto representativo se usaron las efemérides de un punto de la región: el error es menor a 0,4° en 20 km. Las métricas finales se calculan con efemérides exactas del punto elegido.
- Las efemérides cubren 2028.
