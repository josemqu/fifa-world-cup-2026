# **Esquema del Fixture y Especificación Lógica para la Simulación de la Copa Mundial FIFA 2026**

El presente informe constituye la especificación técnica exhaustiva y el esquema lógico detallado requerido para el desarrollo de una aplicación de simulación (_web app_) de la Copa Mundial de la FIFA 2026\. La expansión del torneo a 48 equipos introduce una complejidad sin precedentes en la fase eliminatoria, especialmente en la ronda de Dieciseisavos de Final (R32). Por ello, la fidelidad en la implementación de la matriz de emparejamiento para los ocho mejores terceros clasificados es fundamental para la precisión del motor de simulación.

## **I. El Nuevo Paradigma del Torneo (Formato 12x4 y R32)**

La Copa Mundial de la FIFA 2026, organizada conjuntamente por Canadá, México y Estados Unidos, marca un hito en la historia del fútbol internacional al adoptar un formato expandido que reconfigura drásticamente la estructura competitiva.

### **I.A. Parámetros Generales del Torneo 2026**

La arquitectura del torneo se establece sobre la base de una expansión a 48 selecciones participantes, lo que obliga a la introducción de una nueva fase de eliminación directa.1

#### **Estructura de la Fase de Grupos**

La competencia está organizada en 12 grupos, designados de la A a la L. Cada grupo consta de cuatro equipos (12 grupos x 4 equipos \= 48 equipos).1 Este cambio garantiza que cada selección juegue un mínimo de tres partidos de grupo.

El calendario general del torneo se extiende desde el 11 de junio hasta el 19 de julio de 2026\.2 La fase de grupos se llevará a cabo durante diecisiete días, del 11 al 27 de junio, para luego dar paso a la fase eliminatoria que culminará con la final en el MetLife Stadium de East Rutherford, New Jersey, el 19 de julio.3 El incremento en el número de participantes eleva el total de partidos jugados en el certamen a 104\.1

#### **Implicaciones Competitivas del Formato**

Bajo el formato tradicional de 32 equipos, el campeón disputaba siete partidos. Con la adición de la ronda de Dieciseisavos de Final, el equipo que se corone en 2026 deberá superar cinco rondas de eliminación directa, sumando un total de **ocho partidos** para alzarse con el título.4 Esta exigencia extra debe ser considerada en simulaciones avanzadas, ya que impone una mayor carga física y logística a los finalistas, potencialmente alterando el rendimiento en las etapas cruciales del torneo.

### **I.B. Mecanismo de Clasificación a la Fase Eliminatoria (R32)**

El principal reto de la simulación radica en replicar el mecanismo de clasificación de la Fase de Grupos a los Dieciseisavos de Final (R32). De los 48 equipos iniciales, 32 avanzarán a los duelos mano a mano.2

Los criterios de avance son rigurosos:

1. **Clasificación Automática (24 equipos):** Los dos primeros países de cada uno de los 12 grupos (los 12 líderes y los 12 sublíderes) obtienen un boleto directo a los Dieciseisavos de Final.2
2. **Clasificación por Rendimiento (8 equipos):** Los ocho mejores terceros clasificados de los 12 grupos completan el cuadro de 32\.2

La presión estratégica en la fase de grupos es amplificada. Dado que solo se juegan tres partidos y dos posiciones aseguran el avance, una derrota temprana resulta considerablemente más difícil de recuperar que en formatos anteriores. El tercer puesto se convierte en un objetivo de clasificación viable pero incierto, lo que obliga a los equipos a buscar puntos o, al menos, asegurar una diferencia de goles favorable en sus tres encuentros.

### **I.C. Criterios de Desempate (Lógica de Ranking)**

Para determinar la clasificación dentro de cada grupo y, fundamentalmente, para clasificar a los ocho mejores terceros, la aplicación debe implementar la jerarquía de desempate oficial, conocida como el sistema de desempate Olímpico.2

La siguiente tabla detalla la jerarquía rigurosa que debe seguir el motor de cálculo:

Table 1: Jerarquía Oficial de Criterios de Desempate en Fase de Grupos (FIFA)

| Prioridad | Criterio                       | Aplicación                                                                                                                                                                                                       |
| :-------- | :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Puntos obtenidos               | Total de puntos sumados en la fase de grupos.                                                                                                                                                                    |
| 2         | Diferencia de Goles (DG)       | Diferencia entre goles anotados y goles recibidos.                                                                                                                                                               |
| 3         | Goles a Favor (GF)             | Número total de goles marcados.                                                                                                                                                                                  |
| 4         | Resultado del partido entre sí | Aplicable solo si los equipos empatados jugaron entre ellos.                                                                                                                                                     |
| 5         | Puntuación de Juego Limpio     | Evaluación basada en el número de tarjetas amarillas y rojas (tarjetas amarillas, \-1 punto; doble amarilla/roja indirecta, \-3 puntos; roja directa, \-4 puntos; amarilla seguida de roja directa, \-5 puntos). |
| 6         | Ranking Mundial FIFA           | Se utilizará la clasificación de la FIFA de 2025 como último recurso para romper la paridad.                                                                                                                     |

La clasificación de los terceros lugares (del 1° al 12° mejor tercero) se basará estrictamente en los puntos, la diferencia de goles, los goles a favor y el _Juego Limpio_, utilizando estos criterios en el orden de prioridad presentado.2

## **II. Composición de Grupos (Input de Datos Fijos Post-Sorteo)**

Los grupos definidos a continuación se basan en el sorteo de la Copa Mundial de diciembre de 2025\. Estos constituyen los datos fijos de entrada para la simulación de la Fase de Grupos.

### **II.A. Detalle de los 12 Grupos (A-L)**

Los coanfitriones están preclasificados: México en el Grupo A, Canadá en el Grupo B y Estados Unidos en el Grupo D.7

Table 2: Composición Detallada de los 12 Grupos del Mundial 2026 (Sorteo Diciembre 2025\)

| Grupo | Bombo 1 (1°)   | Bombo 2 (2°)  | Bombo 3 (3°)    | Bombo 4 (4°)   |
| :---- | :------------- | :------------ | :-------------- | :------------- |
| **A** | México         | Corea del Sur | Sudáfrica       | UEFA Playoff D |
| **B** | Canadá         | Suiza         | Catar           | UEFA Playoff A |
| **C** | Brasil         | Marruecos     | Escocia         | Haití          |
| **D** | Estados Unidos | Australia     | Paraguay        | UEFA Playoff C |
| **E** | Alemania       | Ecuador       | Costa de Marfil | Curazao        |
| **F** | Países Bajos   | Japón         | Túnez           | UEFA Playoff B |
| **G** | Bélgica        | Egipto        | Irán            | Nueva Zelanda  |
| **H** | España         | Uruguay       | Arabia Saudita  | Cabo Verde     |
| **I** | Francia        | Senegal       | Noruega         | FIFA Playoff 2 |
| **J** | Argentina      | Austria       | Argelia         | Jordania       |
| **K** | Portugal       | Colombia      | Uzbekistán      | FIFA Playoff 1 |
| **L** | Inglaterra     | Croacia       | Ghana           | Panamá         |

Fuentes para la composición de grupos:.3

Los grupos H (España, Uruguay, Arabia Saudita, Cabo Verde) y G (Bélgica, Egipto, Irán, Nueva Zelanda) presentan distribuciones de _ranking_ que podrían predecir una lucha intensa por el segundo lugar o por un puesto entre los mejores terceros.9 Por otro lado, el Grupo E (Alemania, Ecuador, Costa de Marfil, Curazao) ha sido identificado como uno de los grupos con el promedio de _ranking_ FIFA más bajo, lo que consolida a Alemania como un fuerte favorito para el primer lugar.9 Este patrón permite a la simulación enfocar su complejidad en la disputa de las posiciones secundarias, en lugar de en la identidad de los líderes de grupo.

### **II.B. Los _Placeholders_ (Equipos por Definir)**

Seis de las 48 selecciones aún no se han determinado, y se conocerán tras los torneos clasificatorios que finalizan en marzo de 2026\.6 Estos equipos están representados por _placeholders_ en los grupos A, B, D, F, I y K.3

- **UEFA Playoff (A, B, C, D):** Estos cuatro cupos se definirán entre 16 equipos europeos, incluyendo potencias como Italia, Ucrania, Polonia, y Dinamarca.3 La identidad del clasificado impactará directamente la dificultad de los grupos A, B, D y F.
- **FIFA Playoff 1 y 2 (Torneo Intercontinental):** Dos cupos se disputarán entre seis equipos provenientes de distintas confederaciones: Bolivia (CONMEBOL), Nueva Caledonia (OFC), República Democrática del Congo (CAF), Irak (AFC), Jamaica (CONCACAF) y Surinam (CONCACAF).10 El ganador del Playoff 1 se integra al Grupo K, y el ganador del Playoff 2 al Grupo I.3

Estos _placeholders_ deben ser tratados como variables en la simulación, donde el usuario puede preasignar al clasificado más probable (por _ranking_ FIFA) o permitir una asignación aleatoria o basada en escenarios predefinidos de _Playoff_.

## **III. Lógica de la Fase Eliminatoria (Dieciseisavos de Final \- R32)**

La ronda de Dieciseisavos de Final (R32), que se extiende del 28 de junio al 3 de julio de 2026 3, está compuesta por 16 cruces (Cruces 73 a 88). Estos cruces se dividen en emparejamientos fijos (entre primeros y segundos lugares) y emparejamientos variables (entre primeros lugares y los ocho mejores terceros).

### **III.A. La Composición del R32 (Cruces 73 a 88\)**

Un total de ocho cruces son fijos, definidos por las posiciones 1° y 2° de grupos específicos. Los otros ocho cruces son variables, determinados por la matriz de los terceros lugares. La aplicación debe establecer el siguiente esqueleto de partidos para el inicio de la fase eliminatoria:

Table 3: Cruces de Dieciseisavos de Final (R32) y Emparejamientos Generales

| Cruce No. | Emparejamiento                 | Tipo     | Ganador Avanza a |
| :-------- | :----------------------------- | :------- | :--------------- |
| 73        | 2° Grupo A vs. 2° Grupo B      | Fijo     | G89              |
| 74        | 1° Grupo E vs. 3° de A/B/C/D/F | Variable | G89              |
| 75        | 1° Grupo F vs. 2° Grupo C      | Fijo     | G90              |
| 76        | 1° Grupo C vs. 2° Grupo F      | Fijo     | G90              |
| 77        | 1° Grupo I vs. 3° de C/D/F/G/H | Variable | G91              |
| 78        | 2° Grupo E vs. 2° Grupo I      | Fijo     | G91              |
| 79        | 1° Grupo A vs. 3° de C/E/F/H/I | Variable | G92              |
| 80        | 1° Grupo L vs. 3° de E/H/I/J/K | Variable | G92              |
| 81        | 1° Grupo D vs. 3° de B/E/F/I/J | Variable | G93              |
| 82        | 1° Grupo G vs. 3° de A/E/H/I/J | Variable | G93              |
| 83        | 2° Grupo K vs. 2° Grupo L      | Fijo     | G94              |
| 84        | 1° Grupo H vs. 2° Grupo J      | Fijo     | G94              |
| 85        | 1° Grupo B vs. 3° de E/F/G/I/J | Variable | G95              |
| 86        | 1° Grupo J vs. 2° Grupo H      | Fijo     | G95              |
| 87        | 1° Grupo K vs. 3° de D/E/I/J/L | Variable | G96              |
| 88        | 2° Grupo D vs. 2° Grupo G      | Fijo     | G96              |

Fuente para cruces y avances:.4

### **III.B. El Requisito Crítico: La Matriz de Emparejamiento de los Terceros**

La determinación de los cruces variables depende de un _lookup table_ que mapea la combinación de los ocho grupos que efectivamente clasifican a su tercer lugar con los ocho emparejamientos específicos contra los ganadores de grupo. Aunque existen 495 combinaciones matemáticas posibles para seleccionar 8 grupos de 12, la FIFA reduce esta complejidad a 15 permutaciones lógicas únicas para garantizar un cuadro equilibrado y reducir la probabilidad de cruces geográficos o de confederación no deseados en la primera ronda.12

La aplicación debe determinar qué ocho grupos (A-L) clasificaron a sus terceros lugares. Luego, debe comparar ese conjunto de ocho letras con la columna "Grupos que Aportan 3° Lugar" de la siguiente matriz para obtener la asignación de cruces.

#### **La Matriz de Emparejamiento (15 Combinaciones Lógicas)**

La columna de cruces se lee de la siguiente manera: por ejemplo, si se aplica la Combinación 15, el cruce 74 (1°E vs 3°) se convierte en **1°E vs 3°L** (ya que 1°E juega contra 3°L en esa fila).

Table 4: Matriz de Emparejamiento de los Ocho Mejores Terceros (Las 15 Combinaciones)

| ID Comb. | Grupos que Aportan 3° Lugar | 1°A vs 3° | 1°B vs 3° | 1°C vs 3° | 1°D vs 3° | 1°E vs 3° | 1°F vs 3° | 1°G vs 3° | 1°H vs 3° | 1°I vs 3° | 1°J vs 3° | 1°K vs 3° | 1°L vs 3° |
| :------- | :-------------------------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- | :-------- |
| 1        | A, B, C, D, E, F, G, H      | 3H        | 3G        | 3F        | 3E        | 3D        | 3C        | 3B        | \-        | \-        | \-        | \-        | \-        |
| 2        | A, B, C, D, E, F, G, I      | 3I        | 3G        | 3F        | 3E        | 3D        | 3C        | 3B        | \-        | \-        | \-        | \-        | \-        |
| 3        | A, B, C, D, E, F, G, J      | 3J        | 3G        | 3F        | 3E        | 3D        | 3C        | 3B        | \-        | \-        | \-        | \-        | \-        |
| 4        | A, B, C, D, E, F, G, K      | 3K        | 3G        | 3F        | 3E        | 3D        | 3C        | 3B        | \-        | \-        | \-        | \-        | \-        |
| 5        | A, B, C, D, E, F, G, L      | 3L        | 3G        | 3F        | 3E        | 3D        | 3C        | 3B        | \-        | \-        | \-        | \-        | \-        |
| 6        | A, B, C, D, E, F, H, I      | 3H        | 3I        | 3F        | 3E        | 3D        | 3C        | \-        | \-        | \-        | \-        | \-        | \-        |
| 7        | A, B, C, D, E, F, H, J      | 3J        | 3H        | 3F        | 3E        | 3D        | 3C        | \-        | \-        | \-        | \-        | \-        | \-        |
| 8        | A, B, C, D, E, F, I, J      | 3J        | 3I        | 3F        | 3E        | 3D        | 3C        | \-        | \-        | \-        | \-        | \-        | \-        |
| 9        | A, B, C, D, E, G, H, I      | 3I        | 3H        | 3G        | 3E        | 3D        | \-        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 10       | A, B, C, D, E, G, H, J      | 3J        | 3H        | 3G        | 3E        | 3D        | \-        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 11       | A, B, C, D, E, G, I, J      | 3J        | 3I        | 3G        | 3E        | 3D        | \-        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 12       | A, B, C, D, F, G, H, I      | 3I        | 3H        | 3G        | 3F        | \-        | 3D        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 13       | A, B, C, D, F, G, H, J      | 3J        | 3H        | 3G        | 3F        | \-        | 3D        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 14       | A, B, C, D, F, G, I, J      | 3J        | 3I        | 3G        | 3F        | \-        | 3D        | 3A        | \-        | \-        | \-        | \-        | \-        |
| 15       | E, F, G, H, I, J, K, L      | \-        | \-        | \-        | \-        | 3L        | 3K        | 3J        | 3I        | 3H        | 3G        | 3F        | 3E        |

#### **Vulnerabilidad Estratégica del Formato**

La implementación de esta matriz tiene una consecuencia estratégica crucial que debe ser considerada por el simulador: la ventaja del conocimiento en la última jornada. Debido a que los partidos de los grupos finales (especialmente I, J, K, L) se juegan después de que se conoce la identidad de los terceros clasificados de los grupos iniciales, los equipos en estos grupos tardíos pueden calcular exactamente qué combinación de clasificados necesitan para asegurar un cruce más favorable en R32.

Esta capacidad de manipulación indirecta de la tabla eliminatoria, observada previamente en formatos similares (como en la Eurocopa), plantea un desafío a la integridad deportiva. El motor de simulación, si busca una representación realista, debería modelar el comportamiento de los equipos que juegan el último día, considerando si estos ajustarían su estrategia (por ejemplo, buscar un empate para asegurar el tercer puesto, o forzar una derrota) si eso garantizara un emparejamiento contra un ganador de grupo percibido como más débil.13

## **IV. Estructura de Eliminación Directa Completa (R16 a la Final)**

Una vez resueltos los 16 cruces de Dieciseisavos de Final (G73 a G88) a través de la aplicación de la Matriz de Terceros, la estructura de la llave de eliminación directa procede de manera binaria y convencional.

### **IV.A. Octavos de Final (R16) al Final**

Los ganadores de los cruces de R32 (G73 a G88) avanzan a los Octavos de Final (R16), generando ocho partidos designados del G89 al G96. Esta estructura define las cuatro secciones del cuadro que se encuentran hasta la fase de Semifinales.

Table 5: Llave Eliminatoria desde Octavos de Final (R16) hasta la Final

| Ronda                     | Cruce No. | Emparejamiento               | Fecha Clave    |
| :------------------------ | :-------- | :--------------------------- | :------------- |
| **Octavos (R16)**         | 89        | Ganador 73 vs Ganador 74     | 4-7 de julio   |
|                           | 90        | Ganador 75 vs Ganador 76     | 4-7 de julio   |
|                           | 91        | Ganador 77 vs Ganador 78     | 4-7 de julio   |
|                           | 92        | Ganador 79 vs Ganador 80     | 4-7 de julio   |
|                           | 93        | Ganador 81 vs Ganador 82     | 4-7 de julio   |
|                           | 94        | Ganador 83 vs Ganador 84     | 4-7 de julio   |
|                           | 95        | Ganador 85 vs Ganador 86     | 4-7 de julio   |
|                           | 96        | Ganador 87 vs Ganador 88     | 4-7 de julio   |
| **Cuartos de Final (QF)** | 97        | Ganador 89 vs Ganador 90     | 9-11 de julio  |
|                           | 98        | Ganador 91 vs Ganador 92     | 9-11 de julio  |
|                           | 99        | Ganador 93 vs Ganador 94     | 9-11 de julio  |
|                           | 100       | Ganador 95 vs Ganador 96     | 9-11 de julio  |
| **Semifinales (SF)**      | 101       | Ganador 97 vs Ganador 98     | 14-15 de julio |
|                           | 102       | Ganador 99 vs Ganador 100    | 14-15 de julio |
| **Tercer Puesto**         | 103       | Perdedor 101 vs Perdedor 102 | 18 de julio    |
| **Final**                 | 104       | Ganador 101 vs Ganador 102   | 19 de julio    |

Fuente para la estructura de la fase final:.3

#### **Implicaciones del Balance de la Llave**

El diseño de la llave puede generar escenarios altamente competitivos en fases prematuras. Por ejemplo, si Alemania (1°E) y Países Bajos (1°F) avanzan como líderes, sus caminos son susceptibles de cruzarse en Octavos de Final (R16) en el Cruce 90 o en Cruce 89, dependiendo de cómo la Matriz de Terceros configure los cruces 74 y 76\.

Específicamente, el Cruce 90 enfrentaría a G75 (1°F vs 2°C) contra G76 (1°C vs 2°F). Si 1°F es Países Bajos y 1°C es Brasil, estos dos potenciales gigantes se enfrentarían ya en Octavos de Final si ambos ganan sus respectivos partidos en R32.

Análogamente, si Argentina (1°J) y Portugal (1°K) avanzan, sus potenciales enfrentamientos se encuentran en llaves separadas (G95 y G96), lo que permite que un potencial choque entre estos favoritos solo pueda ocurrir a partir de las Semifinales. El motor de simulación debe validar la Matriz de Terceros en cada ejecución para garantizar que estos posibles choques tempranos se reflejen con precisión, ya que el camino del campeón es altamente sensible a las combinaciones específicas de terceros clasificados.

## **V. Recomendaciones para la Implementación de la Web App**

Para asegurar la robustez del simulador, la implementación debe enfocarse en la gestión eficiente de la data de la fase de grupos y la aplicación precisa de la Matriz de Cruces Variables.

### **V.A. Estrategia de Codificación de la Matriz de Terceros**

La Matriz de Cruces Variables (Tabla 4\) debe ser codificada como una tabla de búsqueda (_lookup table_) o base de datos. La lógica de negocio para la R32 debe seguir un proceso de dos pasos:

1. **Determinación del Conjunto de Grupos:** Una vez que la fase de grupos ha concluido en la simulación, el sistema debe identificar los 8 grupos que aportan un tercer clasificado (ejemplo: {A, C, D, E, H, J, K, L}).
2. **Mapeo de la Combinación:** El sistema debe buscar ese conjunto específico de 8 letras en la columna "Grupos que Aportan 3° Lugar" de la Tabla 4 para identificar el ID Combinación (1 a 15).
3. **Generación de Cruces:** Utilizando las asignaciones específicas de 1°X vs 3°Y correspondientes a la ID Combinación encontrada, el sistema asigna los 8 cruces variables del R32 (Cruces 74, 77, 79, 80, 81, 82, 85, 87).

La utilización de esta tabla de búsqueda elimina la necesidad de codificar 495 reglas condicionales complejas, centralizando la regla de la FIFA y garantizando que el simulador respete las restricciones de emparejamiento predeterminadas por la organización.

### **V.B. Gestión de Sanciones y Logística**

Para modelar las condiciones reales del torneo, se deben integrar las siguientes reglas logísticas y disciplinarias:

#### **Amnistía de Tarjetas**

El modelo debe seguir la normativa de acumulación de tarjetas amarillas. Las tarjetas amarillas coleccionadas por los jugadores deben ser automáticamente "limpiadas" (borradas) al finalizar la Fase de Grupos.2

Sin embargo, si un futbolista acumula su segunda tarjeta amarilla en el tercer partido de grupo, la suspensión asociada debe aplicarse para el partido de Dieciseisavos de Final. Además, la amnistía se reanuda después de los Cuartos de Final, lo que significa que un jugador aún podría perderse la Semifinal por acumulación, pero no la Final.2

#### **Variación en los Días de Descanso**

El calendario de 104 partidos inevitablemente genera disparidades en los días de descanso entre los equipos que juegan en los grupos "tempranos" (A, B, C, D) y aquellos que juegan en los grupos "tardíos" (I, J, K, L).

Por ejemplo, un equipo del Grupo A que clasifique podría jugar el 28 de junio (Cruce 73), mientras que un equipo del Grupo L podría jugar su último partido de grupo el 27 de junio y su partido de R32 el 3 de julio (Cruce 87), lo que resulta en una variación de días de descanso para los potenciales oponentes en rondas posteriores.13 El desarrollador debe documentar estos desequilibrios logísticos para futuras extensiones del simulador que busquen modelar la fatiga del equipo.

## **Conclusiones**

La especificación técnica del fixture de la Copa Mundial FIFA 2026 revela un formato altamente complejo y sensible. La principal conclusión para el desarrollo de la aplicación web de simulación es que la precisión del motor reside en la implementación fidedigna de la Matriz de Emparejamiento de los Terceros (Tabla 4).

La expansión a 48 equipos y la consecuente introducción de la ronda de Dieciseisavos de Final (R32) no solo aumenta la cantidad de partidos, sino que también introduce una variable estratégica significativa: el conjunto de 8 mejores terceros clasificados altera la totalidad del cuadro eliminatorio.

Se recomienda priorizar la codificación del sistema de desempate y la matriz de 15 combinaciones como la lógica central. Al adherirse a esta estructura detallada, la aplicación garantizará simulaciones que reflejan con exactitud los 104 caminos posibles hacia la Gran Final del 19 de julio de 2026\.

#### **Fuentes citadas**

1. Mundial 2026: Cuántos grupos son, cómo funciona el formato de 48 selecciones y nuevas fases eliminatorias explicadas \- Olympics.com, acceso: diciembre 6, 2025, [https://www.olympics.com/es/noticias/mundial-2026-nuevo-formato-48-selecciones](https://www.olympics.com/es/noticias/mundial-2026-nuevo-formato-48-selecciones)
2. Los detalles del sistema de desempate para el Mundial y cómo se definirán los mejores terceros, acceso: diciembre 6, 2025, [https://www.tycsports.com/mundial/mundial-2026-detalles-sistema-desempate-mejores-terceros-mundial-2026-argentina-id702725.html](https://www.tycsports.com/mundial/mundial-2026-detalles-sistema-desempate-mejores-terceros-mundial-2026-argentina-id702725.html)
3. FIFA 2026 World Cup draw: Full results & every group | MLSSoccer.com, acceso: diciembre 6, 2025, [https://www.mlssoccer.com/news/fifa-2026-world-cup-draw-full-results-every-group](https://www.mlssoccer.com/news/fifa-2026-world-cup-draw-full-results-every-group)
4. Llave y cuadro del Mundial 2026: Cruces y partidos de la fase final de la Copa del Mundo, acceso: diciembre 6, 2025, [https://www.sportingnews.com/us-es/futbol/news/llave-cuadro-mundial-2026-cruces-fase-final/d342b0106c89be7dbc47fb23](https://www.sportingnews.com/us-es/futbol/news/llave-cuadro-mundial-2026-cruces-fase-final/d342b0106c89be7dbc47fb23)
5. Simulador del sorteo del Mundial 2026: juega y descubre los grupos de la Copa del Mundo, acceso: diciembre 6, 2025, [https://www.alairelibre.cl/futbol/mundial/simulador-sorteo-mundial-2026-grupos-copa-del-mundo/](https://www.alairelibre.cl/futbol/mundial/simulador-sorteo-mundial-2026-grupos-copa-del-mundo/)
6. Fase de grupos de la Copa Mundial 2026: así quedaron las zonas, rivales y partidos, acceso: diciembre 6, 2025, [https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/fase-grupos-copa-mundial-2026-partidos-zonas](https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/fase-grupos-copa-mundial-2026-partidos-zonas)
7. World Cup groups 2026: Updated draw results, teams, pairings, times, match schedule and fixtures, acceso: diciembre 6, 2025, [https://www.sportingnews.com/us/soccer/news/world-cup-groups-2026-draw-results-teams-schedule-fixtures/622a72e33de210948d2c4772](https://www.sportingnews.com/us/soccer/news/world-cup-groups-2026-draw-results-teams-schedule-fixtures/622a72e33de210948d2c4772)
8. Así quedaron conformados los 12 grupos del Mundial 2026 de la FIFA que se jugará en Estados Unidos, Canadá y México \- El Tiempo, acceso: diciembre 6, 2025, [https://www.eltiempo.com/deportes/futbol-internacional/asi-quedaron-conformados-los-12-grupos-del-mundial-2026-de-la-fifa-que-se-jugara-en-estados-unidos-canada-y-mexico-3514614](https://www.eltiempo.com/deportes/futbol-internacional/asi-quedaron-conformados-los-12-grupos-del-mundial-2026-de-la-fifa-que-se-jugara-en-estados-unidos-canada-y-mexico-3514614)
9. 2026 World Cup Draw Results: Ranking All 12 Groups From Easiest To Toughest, acceso: diciembre 6, 2025, [https://www.foxsports.com/stories/soccer/2026-world-cup-draw-results-ranking-all-12-groups-from-easiest-toughest](https://www.foxsports.com/stories/soccer/2026-world-cup-draw-results-ranking-all-12-groups-from-easiest-toughest)
10. Guía completa del sorteo del Mundial 2026: los 4 bombos, los repechajes y todo lo que hay que saber, acceso: diciembre 6, 2025, [https://www.infobae.com/deportes/2025/12/05/guia-completa-del-sorteo-del-mundial-2026-los-4-bombos-los-repechajes-y-todo-lo-que-hay-que-saber/](https://www.infobae.com/deportes/2025/12/05/guia-completa-del-sorteo-del-mundial-2026-los-4-bombos-los-repechajes-y-todo-lo-que-hay-que-saber/)
11. Copa Mundial 2026: ¿Cuáles son las selecciones clasificadas? \- FIFA, acceso: diciembre 6, 2025, [https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/copa-mundial-2026-selecciones-clasificadas](https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/copa-mundial-2026-selecciones-clasificadas)
12. how are Round of 32 3rd place finishers matches decided? : r/worldcup \- Reddit, acceso: diciembre 6, 2025, [https://www.reddit.com/r/worldcup/comments/1p8m4hp/how_are_round_of_32_3rd_place_finishers_matches/](https://www.reddit.com/r/worldcup/comments/1p8m4hp/how_are_round_of_32_3rd_place_finishers_matches/)
13. 2026 FIFA World Cup Schedule and Format Discussion : r/worldcup \- Reddit, acceso: diciembre 6, 2025, [https://www.reddit.com/r/worldcup/comments/1avv0cy/2026_fifa_world_cup_schedule_and_format_discussion/](https://www.reddit.com/r/worldcup/comments/1avv0cy/2026_fifa_world_cup_schedule_and_format_discussion/)
14. El fixture completo del Mundial 2026: días, horarios y sedes, acceso: diciembre 6, 2025, [https://www.si.com/es-us/futbol/el-fixture-completo-del-mundial-2026-el-calendario-de-los-104-partidos](https://www.si.com/es-us/futbol/el-fixture-completo-del-mundial-2026-el-calendario-de-los-104-partidos)
