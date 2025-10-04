# 🚀 SpaceNow! - Monitor de Clima Espacial

![SpaceNow Logo](frontend/ui/img/logo.png)

**SpaceNow!** es una aplicación web moderna para el monitoreo en tiempo real del clima espacial, incluyendo tormentas geomagnéticas, llamaradas solares, eyecciones de masa coronal y objetos cercanos a la Tierra.

## ✨ Características Principales

### 🤖 Asistente IA Educativo (NUEVO)
- **Chatbot inteligente** con IA real (Google Gemini)
- **Análisis de datos en tiempo real** de todas las APIs de NASA
- **Respuestas educativas** adaptadas para niños y público general
- **Sistema de alertas automático** basado en severidad de eventos
- **Explicaciones simples** con comparaciones cotidianas y emojis
- **Sin costo** - API gratuita de Google (15 requests/minuto)
- **Modo fallback** con respuestas predefinidas si no hay API key

### 🌍 Visualización 3D de Tormentas Geomagnéticas
- **Globo terrestre interactivo** con representación visual de auroras
- **Anillos aurorales dinámicos** que muestran la intensidad Kp en tiempo real
- **Controles intuitivos** para rotación, zoom y navegación 3D
- **Colores codificados** según la severidad de las tormentas
- **Animaciones suaves** con efectos de pulsación y rotación

### 📊 Monitoreo de Eventos Espaciales
- **Tormentas Geomagnéticas (GST)** con índice Kp en tiempo real
- **Llamaradas Solares** con clasificación por intensidad
- **Eyecciones de Masa Coronal (CME)** con análisis de impacto
- **Objetos Cercanos a la Tierra (NEO)** con datos orbitales
- **Imagen Astronómica del Día (APOD)** de la NASA

### 🎛️ Interfaz Moderna
- **Diseño responsivo** optimizado para desktop y móvil
- **Dashboard interactivo** con métricas en tiempo real
- **Visualizaciones dinámicas** con gráficos y timelines
- **Modo oscuro** optimizado para observación nocturna

## 🏗️ Arquitectura del Proyecto

```
SpaceNow!/
├── backend/                 # Servidor Node.js/Express
│   ├── routes/             # Endpoints de API
│   ├── services/           # Servicios de NASA API
│   └── utils/              # Utilidades y helpers
├── frontend/               # Cliente web
│   ├── infra/              # Capa de infraestructura
│   │   ├── repository/     # Acceso a datos
│   │   └── service/        # Lógica de negocio
│   └── ui/                 # Interfaz de usuario
│       ├── html/           # Páginas web
│       ├── css/            # Estilos
│       ├── js/             # JavaScript módulos
│       └── docs/           # Documentación
└── docs/                   # Documentación del proyecto
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 16+ 
- NPM o Yarn
- Clave API de NASA (opcional, pero recomendada)
- **Clave API de Google Gemini** (opcional, para IA real en el asistente)

### Configuración Rápida con Script Automático (Windows)
```bash
# Ejecuta el script de inicio automático
START.bat
```
Este script:
- Verifica Node.js y npm
- Instala dependencias del backend
- Inicia el servidor automáticamente
- Abre la aplicación en tu navegador

### Configuración Manual del Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu clave API de NASA
npm start
```

### Configuración del Frontend
```bash
# En otra terminal, desde la raíz del proyecto
python -m http.server 8000
# O usar cualquier servidor web estático
```

### Variables de Entorno
```env
NASA_API_KEY=tu_clave_api_aqui
PORT=3000
NODE_ENV=development
```

### Configurar IA Real (Opcional pero Recomendado)
Para activar el asistente con IA real:

1. **Obtén tu API key de Google Gemini** (GRATIS)
   - Visita: https://aistudio.google.com/app/apikey
   - Crea tu API key (no requiere tarjeta de crédito)

2. **Configura la API key**
   - Abre `frontend/ui/js/ai-assistant.js`
   - Reemplaza `'TU_API_KEY_AQUI'` con tu key en la línea 8

3. **¡Listo!** Recarga la página y el asistente usará IA real

📖 **Ver guía completa:** [CONFIGURAR-IA.md](CONFIGURAR-IA.md)

## 🎮 Uso de la Aplicación

### Navegación Principal
- **Inicio**: Dashboard general con resumen de actividad
- **Tormentas**: Monitor detallado de tormentas geomagnéticas con visualización 3D
- **Llamaradas**: Análisis de llamaradas solares
- **CMEs**: Seguimiento de eyecciones de masa coronal
- **NEOs**: Objetos cercanos a la Tierra

### Controles de la Visualización 3D
- **Arrastrar**: Rotar la Tierra manualmente
- **Scroll**: Acercar/alejar la vista
- **Pausar Rotación**: Detener/reanudar rotación automática
- **Vista Inicial**: Resetear cámara a posición original

### Uso del Asistente IA Educativo
- **Botón flotante** en la esquina inferior derecha (icono de robot)
- **Click** para abrir el panel de chat
- **Preguntas sugeridas**: Click en botones de acción rápida
- **Chat libre**: Escribe tu pregunta y presiona Enter

**Preguntas de ejemplo:**
- "¿Qué es el clima espacial?"
- "¿Qué es una fulguración solar?"
- "¿Hay peligro ahora?"
- "¿Qué eventos hay actualmente?"
- "Explícame las tormentas geomagnéticas"

### Interpretación de Colores (Índice Kp)
- 🔵 **Azul** (0-3): Condiciones tranquilas
- 🟡 **Amarillo** (4): Actividad geomagnética
- 🟠 **Naranja** (5): Tormenta geomagnética menor
- 🔴 **Rojo** (6-7): Tormenta severa
- 🟣 **Púrpura** (8-9): Tormenta extrema

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **NASA DONKI API** para datos de clima espacial
- **Caché en memoria** para optimización
- **CORS** habilitado para desarrollo

### Frontend
- **JavaScript ES6+** con módulos nativos
- **Three.js** para visualización 3D
- **Google Gemini AI** para asistente educativo
- **CSS Grid & Flexbox** para layout responsive
- **Fetch API** para comunicación con backend

### APIs Externas
- **NASA DONKI** (Space Weather Database)
- **NASA NEO** (Near Earth Object Web Service)
- **NASA APOD** (Astronomy Picture of the Day)

## 📈 Funcionalidades Técnicas

### Optimizaciones de Rendimiento
- **Caché de API** con TTL configurable
- **Renderizado 3D optimizado** con reutilización de geometrías
- **Lazy loading** de recursos pesados
- **Debouncing** en controles interactivos

### Gestión de Estados
- **Estado reactivo** sin frameworks pesados
- **Persistencia local** de configuraciones
- **Manejo de errores** con feedback visual
- **Retry automático** en fallos de conexión

### Accesibilidad
- **ARIA labels** en elementos interactivos
- **Soporte de teclado** para navegación
- **Contraste optimizado** para visibilidad
- **Responsive design** para dispositivos móviles

## 🔧 Configuración Avanzada

### Personalización de la Visualización 3D
```javascript
// En gst.js, ajustar parámetros:
const EARTH_RADIUS = 2;           // Radio de la Tierra
const AURORA_LATITUDE = 70;       // Latitud de auroras
const ROTATION_SPEED = 0.005;     // Velocidad de rotación
const PULSE_SPEED = 0.05;         // Velocidad de pulsación
```

### Intervalos de Actualización
```javascript
// Cache TTL en routes/donki.js:
setCache(key, out, 60_000);  // 60 segundos para GST
setCache(key, out, 30_000);  // 30 segundos para flares/CMEs
```

## 📝 Documentación Adicional

- **[Configurar IA Real](CONFIGURAR-IA.md)** - Guía para activar el asistente con Google Gemini
- [Visualización 3D de Tormentas](frontend/ui/docs/VISUALIZACION-3D-GST.md)
- [Objetos Cercanos a la Tierra](frontend/ui/docs/NEOs-README.md)
- [Optimizaciones de Rendimiento](frontend/ui/docs/OPTIMIZACIONES.md)
- [Changelog](frontend/ui/docs/CHANGELOG.md)

## 🤝 Contribución

### Desarrollo Local
```bash
git clone [url-del-repositorio]
cd spacenow
npm install
npm run dev
```

### Estructura de Commits
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Cambios de formato/estilo
- `refactor:` Refactorización de código

### Reportar Issues
Por favor incluye:
- Descripción detallada del problema
- Pasos para reproducir
- Navegador y versión
- Screenshots si aplica

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Reconocimientos

- **NASA** por proporcionar APIs públicas de clima espacial
- **Three.js** por la excelente librería de 3D web
- **Comunidad open source** por las herramientas utilizadas

---

**SpaceNow!** - Manteniendo un ojo en el clima espacial 🌌

*Desarrollado con ❤️ para la comunidad científica y entusiastas del espacio*