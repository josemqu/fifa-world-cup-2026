# 🏆 **Simulador Interactivo y Predicciones de la Copa Mundial de la FIFA 2026**

Una aplicación web de última generación para simular, predecir e interactuar con todo el desarrollo de la **Copa Mundial de la FIFA 2026** (organizada en Estados Unidos, México y Canadá). La aplicación combina herramientas de simulación matemática (Montecarlo), integración de resultados en tiempo real y una plataforma competitiva de pronósticos (Prode) entre usuarios.

---

## 🚀 **Características Clave de la Aplicación**

### 1. **Fixture Interactivo y Simulador Completo**
*   **Fase de Grupos (`/groups`):** Permite ingresar de forma interactiva los marcadores de los **104 partidos**. La aplicación calcula en tiempo real las posiciones de los 12 grupos (A-L), aplicando las reglas oficiales de desempate de la FIFA.
*   **Tabla de Terceros en Tiempo Real:** Muestra la tabla comparativa de los mejores terceros puestos en tiempo real y calcula de forma automática cuáles 8 selecciones avanzan a la fase de eliminación directa.
*   **Fase Eliminatoria (`/knockout`):** Representación visual interactiva en forma de llave (bracket) desde los Dieciseisavos de Final (R32) hasta la Final. Permite ingresar puntuaciones de tiempo regular, tiempo extra y tiros desde el punto penal.

### 2. **Motor de Predicciones Basado en Simulación de Montecarlo (`/predictions`)**
*   **10,000 Simulaciones en Segundo Plano:** El usuario puede correr un modelo predictivo basado en la simulación de Montecarlo para estimar la probabilidad de que cada equipo alcance los Dieciseisavos, Octavos, Cuartos, Semifinales, Final, y sea Campeón.
*   **Cómputo Eficiente con Web Workers (`simulation.worker.ts`):** Las pesadas iteraciones matemáticas se delegan a hilos del navegador en segundo plano (Web Workers), asegurando que la interfaz de usuario nunca se bloquee y mantenga una tasa de 60 FPS.
*   **Explorador de Cruces (Matchups Grid):** Una matriz interactiva que estima la probabilidad estadística de que cualquier pareja de selecciones se enfrente en la fase de eliminación directa.
*   **Metodología Transparente (`/predictions/metodologia`):** Detalla de manera matemática el modelo de simulación, la estimación del promedio de goles esperados y el uso de los puntos de clasificación FIFA.

### 3. **Plataforma de Pronósticos (Prode) (`/prode`)**
*   **Pronósticos de Usuarios:** Los usuarios pueden registrar de forma segura sus predicciones para todos los partidos del torneo.
*   **Creación y Unión a Grupos Privados:** Los usuarios pueden crear ligas privadas de predicciones compartiendo un código de invitación para competir cara a cara con amigos o colegas.
*   **Tabla de Posiciones Global y de Grupos (Leaderboards):** Sistema de puntos integrado que premia los aciertos en los resultados exactos (ej. 3 puntos) y en la tendencia/ganador (ej. 1 punto).
*   **Autenticación Fluida:** Integrado con Firebase Auth, permitiendo un inicio de sesión rápido mediante Google One Tap o correo electrónico.

### 4. **Sincronización de Resultados en Tiempo Real (Live Scores)**
*   **Integración con API-Football (`liveScores.ts`):** Sistema automatizado para sincronizar marcadores, estados de partidos (programado, en vivo, entretiempo, finalizado) y estadísticas del torneo real en curso.
*   **Automatización con Vercel Crons:** Las actualizaciones automáticas se gatillan de forma externa mediante rutas de API programadas con seguridad de token (`CRON_SECRET`) para actualizar la base de datos de MongoDB.

### 5. **Diseño Premium y UX Dinámico**
*   **Modo Claro y Oscuro:** Interfaz adaptativa elegante que prioriza la legibilidad visual y el diseño minimalista de alto contraste.
*   **Animaciones Fluidas (Framer Motion):** Transiciones suaves entre pestañas, modales de comparación y flujos de partidos.
*   **Gráficos Interactivos (Recharts):** Gráficos modernos de barras y distribución de probabilidad para entender de un vistazo las oportunidades de cada selección.

---

## 🛠️ **Arquitectura del Proyecto**

La base de código está estructurada bajo el paradigma de Next.js App Router:

```bash
src/
├── app/                  # Rutas y páginas principales (Home, Predictions, Prode, Admin, etc.)
│   ├── api/              # Rutas de API para base de datos (MongoDB) y sincronización en vivo
│   ├── admin/            # Dashboard de administración
│   ├── groups/           # Vista interactiva de la Fase de Grupos
│   ├── knockout/         # Vista del bracket de Eliminación Directa
│   └── predictions/      # Motor de simulación y gráficos
├── components/           # Componentes UI reutilizables (Countdown, Bracket, Tablas, etc.)
│   ├── ui/               # Componentes atómicos de interfaz de usuario
│   └── auth/             # Componentes de inicio de sesión y perfiles
├── context/              # Contextos de React para estado global (Auth, Tournament, Language)
├── data/                 # Datos estáticos iniciales del fixture, estadios y selecciones de 2026
├── hooks/                # Hooks personalizados
├── lib/                  # Clientes de servicios (Firebase Admin, MongoDB Connection)
├── services/             # Lógica de sincronización externa (Live Scores, mapeo de equipos)
├── utils/                # Utilidades lógicas y algoritmos de Montecarlo
└── workers/              # Hilos Web Worker para simulación pesada de torneos
```

---

## ⚙️ **Configuración y Desarrollo Local**

### **Requisitos Previos**
*   **Node.js** v20 o superior
*   **pnpm** (recomendado) o **npm**

### **Instalación**

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/fifa-world-cup-2026.git
    cd fifa-world-cup-2026
    ```

2.  **Instalar dependencias:**
    ```bash
    pnpm install
    # o bien: npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env.local` en la raíz del proyecto basándote en el archivo `.env.example` provisto:
    ```env
    # Firebase Frontend
    NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

    # MongoDB Atlas (Persistencia de Prode y Resultados Sincronizados)
    MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/mundial2026

    # Autenticación de Google One Tap
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com

    # API-Football (Para Sincronización en Vivo de Resultados)
    API_FOOTBALL_KEY=tu_api_football_key
    API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
    FIFA_WC_LEAGUE_ID=1
    FIFA_WC_SEASON=2026

    # Secretos de Seguridad para Rutas Cron
    CRON_SECRET=clave_secreta_para_cron
    ```

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    pnpm dev
    # o bien: npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación ejecutándose.

5.  **Construcción para Producción:**
    ```bash
    pnpm build
    pnpm start
    ```

---

## 📊 **Lógica de la Simulación Matemática (Montecarlo)**

La simulación estima la probabilidad de que un equipo avance asignando goles simulados a cada encuentro basados en la diferencia de fuerza relativa (determinada a través del **Ranking FIFA** actual y sus **Puntos Elo** oficiales):

1.  **Goles Esperados ($\lambda$):** La fuerza de ataque y defensa de cada selección es mapeada a una distribución donde se calculan los goles probables de cada equipo.
2.  **Generación de Marcadores:** Cada partido es simulado generando un marcador aleatorio que sigue una aproximación estadística en base a su nivel.
3.  **Resolución de Empates:** En fase eliminatoria, si el partido simulado resulta en empate, se simula tiempo extra y de ser necesario, una tanda de penales con probabilidad dependiente de la jerarquía de los equipos.
4.  **Agregación de Iteraciones:** El proceso se repite **10,000 veces**. Los resultados de cuántas veces cada equipo clasifica a cada ronda se consolidan en el porcentaje final expuesto al usuario.

---

## 📋 **Anexo Técnico: Especificación de Reglas y Lógica del Torneo 2026**

El torneo expandido de 48 selecciones introduce una estructura organizativa y de desempates que se encuentra totalmente programada en el motor de esta aplicación.

### **Fase de Grupos**
*   **Composición:** 12 grupos de 4 equipos (A a la L).
*   **Clasificación Directa:** Avanzan a Dieciseisavos de Final (R32) los 1° y 2° puestos de cada uno de los 12 grupos (24 equipos en total).
*   **Mejores Terceros:** Avanzan los **8 mejores terceros** lugares comparando sus estadísticas grupales (8 equipos en total).

### **Criterios de Desempate en Grupo (Jerarquía Oficial FIFA)**
Si dos o más equipos terminan empatados en puntos al finalizar sus tres partidos de grupo, el motor de posiciones los clasifica aplicando estrictamente el siguiente orden:

1.  **Mayor diferencia de goles (DG)** en todos los partidos del grupo.
2.  **Mayor cantidad de goles a favor (GF)** en todos los partidos del grupo.
3.  **Mayor cantidad de puntos** obtenidos en los partidos directos entre los equipos empatados (H2H).
4.  **Mayor diferencia de goles** en los partidos directos entre los equipos empatados.
5.  **Mayor cantidad de goles anotados** en los partidos directos entre los equipos empatados.
6.  **Puntuación de Juego Limpio (Fair Play):** Basado en acumulación de tarjetas:
    *   Tarjeta amarilla: $-1$ punto.
    *   Tarjeta roja indirecta (doble amarilla): $-3$ puntos.
    *   Tarjeta roja directa: $-4$ puntos.
    *   Tarjeta amarilla más tarjeta roja directa: $-5$ puntos.
7.  **Ranking Mundial de la FIFA** vigente al sorteo.

---

### 🧮 **La Matriz de Emparejamiento de Terceros (Las 15 Combinaciones Oficiales)**

Para la fase de **Dieciseisavos de Final (R32)**, los 8 grupos que clasifican a su tercer lugar determinan contra qué ganadores de grupo se enfrentarán en los cruces variables. Existe una lookup table interna basada en la especificación oficial de la FIFA que mapea cada una de las 15 combinaciones lógicas posibles:

| ID Comb. | Grupos que Aportan 3° Lugar | 1°A vs | 1°B vs | 1°C vs | 1°D vs | 1°E vs | 1°F vs | 1°G vs | 1°H vs | 1°I vs | 1°J vs | 1°K vs | 1°L vs |
| :------: | :------------------------- | :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: | :----: |
|  **1**   | A, B, C, D, E, F, G, H     |   3H   |   3G   |   3F   |   3E   |   3D   |   3C   |   3B   |   -    |   -    |   -    |   -    |   -    |
|  **2**   | A, B, C, D, E, F, G, I     |   3I   |   3G   |   3F   |   3E   |   3D   |   3C   |   3B   |   -    |   -    |   -    |   -    |   -    |
|  **3**   | A, B, C, D, E, F, G, J     |   3J   |   3G   |   3F   |   3E   |   3D   |   3C   |   3B   |   -    |   -    |   -    |   -    |   -    |
|  **4**   | A, B, C, D, E, F, G, K     |   3K   |   3G   |   3F   |   3E   |   3D   |   3C   |   3B   |   -    |   -    |   -    |   -    |   -    |
|  **5**   | A, B, C, D, E, F, G, L     |   3L   |   3G   |   3F   |   3E   |   3D   |   3C   |   3B   |   -    |   -    |   -    |   -    |   -    |
|  **6**   | A, B, C, D, E, F, H, I     |   3H   |   3I   |   3F   |   3E   |   3D   |   3C   |   -    |   -    |   -    |   -    |   -    |   -    |
|  **7**   | A, B, C, D, E, F, H, J     |   3J   |   3H   |   3F   |   3E   |   3D   |   3C   |   -    |   -    |   -    |   -    |   -    |   -    |
|  **8**   | A, B, C, D, E, F, I, J     |   3J   |   3I   |   3F   |   3E   |   3D   |   3C   |   -    |   -    |   -    |   -    |   -    |   -    |
|  **9**   | A, B, C, D, E, G, H, I     |   3I   |   3H   |   3G   |   3E   |   3D   |   -    |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **10**  | A, B, C, D, E, G, H, J     |   3J   |   3H   |   3G   |   3E   |   3D   |   -    |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **11**  | A, B, C, D, E, G, I, J     |   3J   |   3I   |   3G   |   3E   |   3D   |   -    |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **12**  | A, B, C, D, F, G, H, I     |   3I   |   3H   |   3G   |   3F   |   -    |   3D   |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **13**  | A, B, C, D, F, G, H, J     |   3J   |   3H   |   3G   |   3F   |   -    |   3D   |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **14**  | A, B, C, D, F, G, I, J     |   3J   |   3I   |   3G   |   3F   |   -    |   3D   |   3A   |   -    |   -    |   -    |   -    |   -    |
|  **15**  | E, F, G, H, I, J, K, L     |   -    |   -    |   -    |   -    |   3L   |   3K   |   3J   |   3I   |   3H   |   3G   |   3F   |   3E   |

El motor del simulador determina cuál de estas 15 combinaciones específicas coincide con los 8 grupos clasificados, asignando dinámicamente los rivales del cuadro eliminatorio en fracciones de milisegundo.

---

## 📜 **Licencia**

Este proyecto es de código abierto y está disponible bajo la Licencia MIT.
