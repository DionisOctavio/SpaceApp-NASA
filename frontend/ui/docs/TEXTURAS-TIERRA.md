# 🌍 Texturas de la Tierra - Fuentes y Referencias

## Texturas Utilizadas

### 1. **NASA Blue Marble**
- **Fuente**: NASA's Visible Earth
- **Descripción**: Imagen compuesta de la Tierra sin nubes tomada por el satélite MODIS de la NASA
- **Resolución**: Alta resolución (2048x1024 o superior)
- **URL actual**: `https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg`
- **Licencia**: Dominio público (NASA)

### 2. **Earth Topology (Bump Map)**
- **Fuente**: Topografía terrestre
- **Descripción**: Mapa de elevación que muestra montañas, valles y relieve terrestre
- **Uso**: Crea profundidad visual en la superficie
- **URL actual**: `https://unpkg.com/three-globe/example/img/earth-topology.png`

### 3. **Earth Water (Specular Map)**
- **Fuente**: Mapa de océanos
- **Descripción**: Define áreas de agua para efectos de brillo/reflexión
- **Uso**: Los océanos reflejan más luz que los continentes
- **URL actual**: `https://unpkg.com/three-globe/example/img/earth-water.png`

## Fuentes Alternativas de Alta Calidad

### NASA Visible Earth
- **URL**: https://visibleearth.nasa.gov/
- **Colección**: Blue Marble
- **Formatos**: JPEG, TIFF, PNG
- **Resoluciones**: Desde 500m hasta 86400x43200 pixels (8K+)

### Texturas Específicas Recomendadas:

#### Blue Marble Next Generation (2004)
```
https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
```
- 5400x2700 pixels
- Topografía + batimetría
- Sin nubes

#### Blue Marble 2012
```
https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg
```
- 2048x1024 pixels
- Ideal para Three.js (potencia de 2)

#### Earth at Night (opcional para efectos)
```
https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg
```
- Luces nocturnas de ciudades
- Efecto impresionante

### Texturas de Nubes en Tiempo Real

#### GOES Satellite (Actualizadas cada hora)
```
https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/5424x5424.jpg
```
- Imágenes reales del satélite GOES-16
- Se actualizan constantemente
- Requiere procesamiento para mapear a esfera

## Implementación Actual

### Configuración en Three.js:
```javascript
const textureLoader = new THREE.TextureLoader();

// Textura principal (Blue Marble)
const earthTexture = textureLoader.load('URL_BLUE_MARBLE');

// Mapa de relieve
const bumpTexture = textureLoader.load('URL_TOPOLOGY');
bumpScale: 0.3  // Ajusta la profundidad del relieve

// Mapa especular (brillo de océanos)
const specularTexture = textureLoader.load('URL_WATER');
specular: new THREE.Color(0x333333)
shininess: 25
```

## Alternativas Profesionales

### 1. **Cesium Ion** (Mencionado por el usuario)
- **URL**: https://cesium.com/
- **Descripción**: Plataforma 3D profesional con streaming de datos geoespaciales
- **Características**:
  - Terreno 3D real con elevación
  - Imágenes satelitales de Bing/Sentinel
  - Streaming optimizado
  - Nivel de detalle (LOD) automático
- **Limitación**: Requiere API key y puede ser complejo de integrar

### 2. **Three-Globe Library**
- **URL**: https://github.com/vasturiano/three-globe
- **Descripción**: Wrapper de Three.js específico para globos terrestres
- **Incluye**:
  - Texturas de la NASA pre-configuradas
  - Nubes animadas
  - Atmósfera realista
  - Puntos y arcos 3D
- **Ventaja**: Fácil integración, optimizado

### 3. **Natural Earth Data**
- **URL**: https://www.naturalearthdata.com/
- **Descripción**: Mapas vectoriales y raster de dominio público
- **Uso**: Alternativa de alta calidad

## Optimización

### Para Web:
- Usar texturas 2048x1024 (balance calidad/rendimiento)
- Formato JPEG para tamaño reducido
- Cargar progresivamente (placeholder → HD)

### Para Mejor Calidad:
- 4096x2048 para pantallas 4K
- PNG para transparencias (nubes)
- Múltiples capas (día/noche, estaciones)

## Texturas Descargables Directas

### JPL Solar System Simulator
```
https://space.jpl.nasa.gov/
```
- Texturas planetarias oficiales
- Incluye todos los planetas

### Solar System Scope
```
https://www.solarsystemscope.com/textures/
```
- Texturas libres de alta resolución
- Tierra, Luna, planetas
- 2K, 4K, 8K disponibles

## Nuestra Configuración Actual

Estamos usando las texturas del paquete `three-globe` que están hosteadas en unpkg.com:
- ✅ Blue Marble de la NASA
- ✅ Mapa topográfico
- ✅ Mapa de agua para especular
- ✅ Atmósfera procedural
- ✅ Fallback a textura procedural si falla la carga

## Mejoras Futuras Sugeridas

1. **Cargar nubes dinámicas** desde NOAA/GOES
2. **Añadir luces nocturnas** (ciudades)
3. **Ciclo día/noche** según hora real
4. **Texturas estacionales** (nieve en invierno)
5. **Integrar Cesium** para terreno 3D real (opcional)

## Referencias

- NASA Visible Earth: https://visibleearth.nasa.gov/
- Three.js Globe: https://github.com/vasturiano/three-globe
- Blue Marble: https://visibleearth.nasa.gov/collection/1484/blue-marble
- NOAA GOES: https://www.goes.noaa.gov/
- JPL Solar System: https://space.jpl.nasa.gov/

---

**Nota**: Todas las imágenes de la NASA son de dominio público y pueden usarse libremente.
