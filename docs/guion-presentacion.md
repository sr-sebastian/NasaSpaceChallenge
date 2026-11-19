# Guion de la presentación

Para las 7 diapositivas de *Lunar Landing Site Navigator*. Duración: unos **3 minutos y medio**, o **4 minutos y medio** con la demo en vivo. El reparto entre las cuatro personas del equipo es una sugerencia; cámbienlo si quieren.

Las diapositivas están en inglés y el guion en español. Si presentan en inglés, cada bloque se traduce casi literal.

---

## 1 · Portada (15 s) · Bruno

> Hola, somos Prilililis Espaciales: Bruno, Pilar, Rodrigo y Francisco. Trabajamos en el desafío *Lunar Landing Site Navigator*, que pregunta dónde y cuándo conviene aterrizar en el polo sur de la Luna, el lugar al que apunta Artemis III.

**Clave:** presentarse rápido y nombrar el desafío. Nada más.

---

## 2 · El desafío (35 s) · Bruno

> En el polo sur de la Luna el Sol nunca sube más de unos pocos grados. Va dando la vuelta al horizonte, rasante, y cualquier montaña proyecta sombras de kilómetros.
>
> Eso genera dos problemas. Izquierda: **energía**. Si una cresta tapa el Sol, los paneles dejan de cargar, y la pregunta no es solo cuántas horas de luz hay, sino cuánto dura la noche más larga y si la batería la aguanta.
>
> Derecha: **comunicación**. La Tierra también está baja, y una montaña cercana puede cortar la línea de vista directa durante días.
>
> Por eso decimos que elegir un sitio es también elegir un momento: el mismo lugar puede ser excelente una semana y malo la siguiente.

**Clave:** la frase del título, «un sitio de aterrizaje también es una decisión de tiempo». Es la idea que tiene que quedar.

---

## 3 · Nuestra solución (35 s) · Pilar

> Hicimos una herramienta web que responde la pregunta de la consigna: si cambio el sitio o la fecha, ¿cuánto gano o pierdo de luz y de comunicación?
>
> Elegís hasta cuatro escenarios entre las nueve regiones candidatas de Artemis III, con fechas de 2028, y la app te dice la diferencia en horas: «ganás 43 horas de luz y perdés 37 de comunicación».
>
> Para entender el porqué, tiene una vista 3D con el terreno real, un mapa del cielo de 360° y líneas de tiempo hora por hora, que muestran dónde están el Sol y la Tierra respecto del horizonte real.
>
> En el mapa ven los dos sitios que vamos a comparar: Malapert, más lejos del polo, y de Gerlache Rim 2, casi en el polo.

**Clave:** señalar los dos puntos del mapa, porque reaparecen en la diapositiva 5.

### Demo en vivo (opcional, 60 s) · Pilar

Hacerla solo si hay buena conexión. Abran la app **antes** de empezar, en inglés, con el ejemplo por defecto, y tengan capturas de respaldo.

1. **Respuesta arriba:** «Esto es lo primero que ves: cambiar de Malapert a de Gerlache el 7 de octubre te da 43 horas más de luz pero 37 menos de contacto».
2. **Ver módulo y ▶:** «Este es el terreno real medido por la sonda LRO. El módulo orienta sus paneles al Sol y su antena a la Tierra. Al avanzar el tiempo, el Sol pasa detrás de la montaña y el módulo entra en hibernación».
3. **Calendario:** «Y acá está todo 2028, día por día, para los nueve sitios: las celdas más intensas son las mejores ventanas».

---

## 4 · Datos y método (35 s) · Rodrigo

> Todo sale de datos públicos y trazables.
>
> - Las **9 regiones** son las que NASA anunció en 2024, con los polígonos oficiales de USGS. Dentro de cada una elegimos el punto con más horas de Sol y Tierra a la vez.
> - El **terreno** es de LOLA, el altímetro láser de la sonda LRO de la NASA, con píxeles de 80 metros.
> - Las **posiciones del Sol y la Tierra** las da JPL Horizons, el sistema de efemérides de la NASA, hora por hora durante todo 2028.
> - Para cada sitio trazamos el horizonte en **720 direcciones**, hasta 250 km, teniendo en cuenta la curvatura de la Luna.
>
> La regla es simple: el Sol o la Tierra están visibles cuando su centro supera ese horizonte real.

**Clave:** decir «NASA» en cada fuente. El requisito del concurso es usar datos de la NASA, y acá se ve que todo el cálculo depende de ellos.

---

## 5 · Lo que muestra el modelo (35 s) · Rodrigo

> Y esto es lo que encontramos. Comparemos los dos puntos durante todo 2028.
>
> Malapert ve la Tierra el **100 %** del tiempo: está orientado hacia ella y es alto. Pero tiene Sol solo el 54 %.
>
> de Gerlache Rim 2, casi en el polo, tiene Sol el **69 %**: quince puntos más. Pero pierde la Tierra cuatro de cada diez horas.
>
> No existe el sitio perfecto: hay un compromiso entre energía y comunicación. Nuestra herramienta lo hace visible y lo pone en números.
>
> Una aclaración honesta: son promedios anuales en dos puntos elegidos por nosotros. Cada misión concreta depende de su fecha, y para eso está el calendario.

**Clave:** la frase «más luz puede significar menos contacto con la Tierra». Y la aclaración final suma credibilidad ante el jurado.

---

## 6 · Por qué importa (25 s) · Francisco

> ¿Para quién es?
>
> Para **planificadores**: discuten el compromiso entre energía y comunicación mirando el mismo escenario, con los mismos números.
>
> Para **docentes**: la app trae un recorrido guiado que explica por qué el Sol no sube en el polo, cómo el relieve cambia las horas de luz y qué le pasa a la batería de noche.
>
> Y para el **público**: es una forma de explorar la Luna con datos reales de la NASA, sin necesitar saber de órbitas.
>
> La idea es convertir datos orbitales en una decisión que cualquiera pueda explicar.

---

## 7 · Alcance y próximos pasos (30 s) · Francisco

> Queremos ser claros sobre el alcance. **Hoy** la herramienta compara escenarios con datos trazables, con terreno 3D, mapa del cielo, búsqueda de la mejor fecha, exportación a CSV, recorrido guiado y enlaces para compartir. Está publicada y el código es abierto.
>
> **Lo que sigue**, antes de usarla para decisiones reales: terreno con más detalle que 80 metros, enlaces de radio, satélites relé y eclipses, y validar los modelos de energía y térmico.
>
> Es un prototipo útil con un límite claro. Gracias. ¿Preguntas?

**Clave:** terminar en «gracias» y mostrar el código QR o el link a la app, si lo tienen.

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

- Abrir la app y dejarla cargada en una pestaña, en inglés, con el ejemplo por defecto.
- Tener capturas de respaldo de la respuesta, la vista 3D y el calendario por si falla la conexión.
- Ensayar con cronómetro: 3 min 30 s sin demo.
- Confirmar que el logo de NASA Space Apps de las diapositivas venga de la plantilla oficial del evento. Las reglas no permiten contenido generado que use o modifique marcas de la NASA.
