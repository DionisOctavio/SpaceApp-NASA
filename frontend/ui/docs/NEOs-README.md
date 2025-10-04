# 🌍 NEOs - Visualización 3D de Asteroides Cercanos

## Descripción

Visualización 3D interactiva de Near Earth Objects (NEOs) usando Three.js. Muestra asteroides cercanos a la Tierra con sus órbitas y permite seleccionarlos para ver información detallada.

## Características

### 🎮 Controles Interactivos
- **Click izquierdo + arrastrar**: Rotar la vista
- **Scroll**: Zoom in/out
- **Click en asteroide**: Seleccionar y ver detalles

### 🎯 Botones de Control
- **🔄 Resetear vista**: Vuelve a la posición inicial de la cámara
- **⏯️ Pausar/Reanudar**: Controla la rotación automática de la Tierra
- **🛸 Órbitas**: Muestra/oculta las trayectorias de los asteroides

### 📅 Filtros de Fecha
- **Hoy**: Carga NEOs para el día actual
- **7 días**: Carga NEOs para los próximos 7 días
- **30 días**: Carga NEOs para los próximos 30 días
- **Personalizado**: Selecciona fechas específicas

### 🔴 Filtros de Peligrosidad
- **Potencialmente peligrosos (PHA)**: Solo asteroides con riesgo potencial
- **Todos los NEOs**: Muestra todos los asteroides detectados

## Información Mostrada

### Para cada asteroide:
- 📏 **Diámetro estimado** (min - max en km)
- ⚡ **Velocidad relativa** (km/s)
- 🌍 **Distancia de aproximación** (Distancias Lunares)
- 📅 **Fecha de aproximación más cercana**
- 🎯 **Datos detallados de aproximación**
  - Distancia en km, UA
  - Velocidad en km/h
  - Cuerpo orbitante

## Colores

- 🔴 **Rojo**: Asteroides potencialmente peligrosos (PHA)
- 🟢 **Verde**: Asteroides no peligrosos

## API

Utiliza el servicio **NeoWs** (Near Earth Object Web Service) de la NASA:
- Endpoint: `/api/neo/feed`
- Parámetros: `start_date`, `end_date` (formato: YYYY-MM-DD)

## Tecnologías

- **Three.js**: Renderizado 3D
- **OrbitControls**: Control de cámara interactivo
- **NASA NeoWs API**: Datos de asteroides en tiempo real

## Notas

1. El tamaño de los asteroides en el mapa está escalado para visualización (no es a escala real)
2. Las órbitas son aproximaciones simplificadas
3. La distancia se muestra en Distancias Lunares (1 LD = 384,400 km)
4. Los datos se actualizan según el rango de fechas seleccionado

## Limitaciones de la API

- Máximo 7 días por consulta (limitación de NASA API)
- Caché de 60 segundos para mejorar rendimiento
- Requiere conexión al backend en puerto 5173
