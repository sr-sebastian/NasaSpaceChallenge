# Guion de la presentación

La presentación recorre el **repositorio de GitHub**, sin diapositivas: <https://github.com/sr-sebastian/NasaSpaceChallenge>. Dura unos **4 minutos**, con una demo de la app en el medio. El reparto entre las cuatro personas del equipo es una sugerencia.

El README está en inglés, porque es lo que leen los jurados. El guion está en español; si presentan en inglés, se traduce casi literal.

## Preparación (antes de empezar)

- Dos pestañas abiertas: el **repo** y la **app** (<https://sr-sebastian.github.io/NasaSpaceChallenge/>), ya cargada, en inglés, con el ejemplo por defecto.
- Zoom del navegador al 125 % para que se lea desde lejos.
- Si se cae la conexión, el README tiene capturas de todo: se puede hacer la presentación entera sin abrir la app.

---

## 1 · El problema · README, arriba (30 s) · Bruno

**En pantalla:** el título, la pregunta en cita y la imagen grande.

> Somos Prilililis Espaciales y trabajamos en el desafío *Lunar Landing Site Navigator*. La pregunta es esta, la que está arriba en el README: si cambio el sitio o la fecha de aterrizaje en el polo sur de la Luna, ¿cuánto tiempo gano o pierdo de luz y de comunicación?
>
> El polo sur importa porque es adonde apunta Artemis III. Y es difícil porque el Sol nunca sube más de unos pocos grados: cualquier montaña tapa el Sol, que da energía, o la Tierra, con la que hay que hablar.

**Clave:** leer la pregunta en voz alta. Es la consigna literal.

## 2 · La respuesta en una imagen (25 s) · Bruno

**En pantalla:** la captura grande (+43 h / −37 h).

> Esta es nuestra herramienta. Elegís dos escenarios, acá Malapert y de Gerlache Rim 2 el 7 de octubre de 2028, y lo primero que te dice es la respuesta en horas: ganás 43 horas de luz y perdés 37 de comunicación. Y la noche más larga baja de 43 horas a cero.

## 3 · El resultado principal (35 s) · Pilar

**En pantalla:** bajar a **«Key result»** y señalar la tabla.

> Mirando todo 2028, la diferencia es clara. Malapert ve la Tierra el cien por ciento del tiempo, pero tiene Sol solo la mitad. de Gerlache, casi en el polo, tiene mucho más Sol, pero pierde la Tierra cuatro de cada diez horas.
>
> No hay sitio perfecto: hay un compromiso entre energía y comunicación, y cambia semana a semana. Eso es lo que la herramienta hace visible.

**Clave:** la frase del título, «más luz puede significar menos contacto con la Tierra».

## 4 · Demo de la app (90 s) · Pilar

**En pantalla:** clic en **«▶ Open the live app»** (o pasar a la pestaña ya abierta).

1. **Respuesta arriba (10 s).** «Es lo mismo que vimos, pero en vivo: cambio el sitio o la fecha y los números se actualizan».
2. **View lander (25 s).** «Este es el terreno real del polo sur, medido por la sonda LRO de la NASA, sin exagerar el relieve. El módulo orienta los paneles al Sol y la antena a la Tierra. Estos carteles dicen si el Sol y la Tierra se ven o están tapados por la montaña».
3. **Aerial view (10 s).** «Desde arriba se ve el macizo Malapert y sus sombras de kilómetros».
4. **▶ Play (20 s).** «Avanzo el tiempo: el Sol pasa detrás del relieve, la batería baja y el módulo entra en hibernación. Abajo, la bitácora cuenta qué le pasa hora por hora».
5. **Calendario (15 s).** Bajar hasta el calendario. «Y acá está todo 2028, día por día, para los nueve sitios: las celdas más brillantes son las mejores ventanas de aterrizaje. Toco una y se carga como escenario».
6. **Volver a la pestaña del repo.**

**Si no hay conexión:** mostrar las capturas del README (módulo, vista aérea, energía, calendario) y decir lo mismo.

## 5 · Los datos (35 s) · Rodrigo

**En pantalla:** la tabla **«Data»** del README.

> Todo sale de datos públicos de la NASA. Las posiciones del Sol y la Tierra, hora por hora durante 2028, son de JPL Horizons, el sistema de efemérides de la NASA. El terreno es de LOLA, el altímetro láser de la sonda LRO, con píxeles de 80 metros. Y las nueve regiones son las que anunció NASA en 2024, con los polígonos oficiales de USGS.
>
> Para cada sitio calculamos el horizonte real en 720 direcciones, hasta 250 kilómetros, con la curvatura de la Luna. El Sol o la Tierra están visibles cuando superan ese horizonte.

**Clave:** decir «NASA» en cada fuente.

## 6 · Cómo está hecho (30 s) · Rodrigo

**En pantalla:** volver a la raíz del repo y abrir la carpeta **`scripts/`**; después, **`docs/`**.

> El cálculo es reproducible. En `scripts` están los tres pasos: bajar las efemérides de Horizons, calcular los horizontes con LOLA y generar el terreno 3D. Los datos procesados están en `public/data`, así la app no necesita servidor.
>
> En `docs` está todo documentado en español: la metodología con una tabla de validación de los nueve sitios, la arquitectura, una guía de uso para docentes y la lista completa de fuentes, separando cuáles son de la NASA.

**Opcional:** abrir `docs/fuentes.md` unos segundos.

## 7 · Alcance y cierre (25 s) · Francisco

**En pantalla:** la sección **«Limitations»** del README.

> Queremos ser claros con el alcance. Es un prototipo: la visibilidad es geométrica, no resolvemos detalles menores a 80 metros, no modelamos radio, relés ni eclipses, y el modelo de energía es didáctico. Lo siguiente sería sumar eso y validarlo.
>
> Pero hoy ya sirve para lo que pide el desafío: que un planificador, un docente o cualquier persona vea en segundos cuánto cambia la luz y la comunicación al elegir otro sitio u otra fecha. Gracias. ¿Preguntas?

---

## Preguntas probables del jurado

**¿Por qué 2028?**
Es el horizonte de las misiones Artemis al polo sur. El pipeline acepta cualquier año: hay que volver a pedir las efemérides a Horizons.

**¿Por qué esos puntos dentro de cada región?**
Una región mide unos 400 km², y dos puntos separados por 500 metros pueden tener horizontes muy distintos. Evaluamos una grilla de 1 km dentro de cada polígono oficial y elegimos el punto con más horas de Sol y Tierra a la vez. Al principio usamos el centro de cada región, pero en Malapert caía en una ladera que tapaba la Tierra.

**¿Cómo validaron los resultados?**
Primero verificamos la orientación del mapa de LOLA con cráteres y picos conocidos. Además, Malapert da Tierra visible el 100 % del año, que coincide con por qué se propone como sitio de comunicaciones desde hace décadas; un test automático lo comprueba. Y los dos archivos de USGS dan los mismos centros de región.

**¿Por qué el relieve a veces da más horas de Sol que un horizonte plano?**
Desde una cumbre, el horizonte cae por debajo de 0°, así que el Sol se ve aunque esté apenas debajo del horizonte geométrico. En sitios bajos pasa lo contrario.

**¿Qué tan real es el modelo de energía?**
Es didáctico: paneles verticales que siguen al Sol, consumo constante e hibernación a 80 W. Sirve para comparar sitios, no para dimensionar un módulo. Lo decimos en la app y en la diapositiva 7.

**¿Usaron inteligencia artificial?**
Sí, asistentes de programación (Claude Code y ChatGPT) para escribir código y textos, revisados por el equipo. Ningún dato ni resultado sale de una IA: todo viene de NASA, JPL y USGS. Está declarado en la app, en el README y en la entrega.

**¿Qué no modela?**
Rocas y relieve menores a 80 m, eclipses, el presupuesto de radio y los satélites relé. Está en «próximos pasos».

---

## Antes de presentar

- Ensayar con cronómetro: unos 4 minutos con la demo.
- Probar la app en la computadora y la red del evento.
- Tener el repo en la raíz y el README arriba de todo al empezar.
