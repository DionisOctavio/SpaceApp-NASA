# Visualización 3D de Tormentas Geomagnéticas

## 🌍 Descripción General

La nueva funcionalidad de visualización 3D permite ver las tormentas geomagnéticas representadas como auroras sobre un modelo interactivo de la Tierra en tiempo real.

## ✨ Características Principales

### Visualización Interactiva
- **Globo terrestre 3D** con rotación automática
- **Controles de mouse** para rotar y hacer zoom
- **Atmósfera simulada** con efecto de brillo
- **Iluminación realista** con sombras

### Representación de Tormentas
- **Anillos de aurora** en regiones polares (70°N y 70°S)
- **Colores según intensidad Kp**:
  - 🔵 Azul cian (Kp 0-3): Tranquilo/Inestable
  - 🟡 Amarillo (Kp 4): Activo
  - 🟠 Naranja (Kp 5): Tormenta menor
  - 🔴 Rojo (Kp 6-7): Tormenta severa
  - 🟣 Púrpura (Kp 8-9): Tormenta extrema

### Animaciones Dinámicas
- **Pulsación de auroras** simulando la actividad geomagnética
- **Rotación suave** de los anillos aurorales
- **Transiciones animadas** al cambiar entre tormentas

## 🎮 Controles de Usuario

### Navegación 3D
- **Arrastrar mouse**: Rotar la Tierra
- **Scroll/rueda**: Zoom in/out
- **Botón "Pausar rotación"**: Detener/reanudar rotación automática
- **Botón "Vista inicial"**: Resetear cámara y rotación

### Integración con Datos
- **Sincronización automática** con datos de tormentas cargadas
- **Resaltado de tormenta seleccionada** en la lista
- **Contador en tiempo real** de tormentas activas

## 🛠️ Implementación Técnica

### Tecnologías Utilizadas
- **Three.js** (WebGL) para renderizado 3D
- **Canvas HTML5** para la superficie de dibujo
- **Geometría esférica** para la Tierra (64 segmentos)
- **Anillos geométricos** para las auroras

### Estructura del Código

```javascript
// Principales componentes:
- initEarthVisualization()     // Inicialización de la escena 3D
- createAuroraRing()          // Creación de anillos de aurora
- updateAuroraVisualizations() // Actualización con datos reales
- animate()                   // Loop de animación continua
```

### Optimizaciones
- **Reutilización de geometrías** para mejor rendimiento
- **Control de FPS** mediante `requestAnimationFrame`
- **Limitación de zoom** para mantener experiencia consistente
- **Gestión de memoria** al limpiar auroras antiguas

## 📊 Interpretación Visual

### Ubicación de Auroras
- **Polo Norte (70°N)**: Siempre visible para tormentas Kp ≥ 3
- **Polo Sur (70°S)**: Visible solo para tormentas intensas Kp ≥ 5

### Intensidad Visual
- **Opacidad**: Proporcional al índice Kp (0.2 a 0.8)
- **Tamaño del anillo**: Fijo, pero con efecto de pulsación
- **Velocidad de animación**: Constante para todas las tormentas

### Estados de Visualización
- **Sin tormentas**: Solo la Tierra con atmósfera
- **Tormentas activas**: Anillos aurorales visibles
- **Tormenta seleccionada**: Aurora resaltada con mayor opacidad

## 🔧 Configuración y Personalización

### Parámetros Ajustables
```javascript
// En el código JavaScript:
const EARTH_RADIUS = 2;           // Radio de la Tierra
const AURORA_LATITUDE = 70;       // Latitud de auroras (grados)
const ROTATION_SPEED = 0.005;     // Velocidad de rotación
const PULSE_SPEED = 0.05;         // Velocidad de pulsación
```

### Estilos CSS Personalizables
- `.earth-container`: Dimensiones y aspecto del contenedor
- `.earth-btn`: Apariencia de botones de control
- `.earth-info`: Estilo del contador de tormentas

## 🚀 Casos de Uso

### Para Científicos
- **Monitoreo visual** de actividad geomagnética global
- **Correlación temporal** entre eventos y ubicación
- **Identificación rápida** de intensidades críticas

### Para Educación
- **Comprensión intuitiva** de fenómenos geomagnéticos
- **Visualización de conceptos** abstractos de física espacial
- **Herramienta interactiva** para presentaciones

### Para el Público General
- **Seguimiento de auroras** potencialmente visibles
- **Comprensión del impacto** de tormentas solares
- **Experiencia visual atractiva** de datos científicos

## 🔍 Futuras Mejoras Potenciales

### Funcionalidades Avanzadas
- **Texturas terrestres reales** (continentes, océanos)
- **Trayectorias de satélites** afectados
- **Predicción temporal** de tormentas futuras
- **Sonido ambiente** sincronizado con actividad

### Datos Adicionales
- **Índices regionales** (AE, Dst, SYM-H)
- **Información de CME** (Eyecciones de Masa Coronal)
- **Estados de comunicaciones** (HF, GPS)
- **Niveles de radiación** espacial

### Optimizaciones
- **Carga progresiva** de texturas
- **Nivel de detalle** adaptativo según zoom
- **Caché de animaciones** para mejor rendimiento
- **Modo de bajo consumo** para dispositivos móviles

---

*Desarrollado como parte del sistema SpaceNow! para monitoreo de clima espacial*