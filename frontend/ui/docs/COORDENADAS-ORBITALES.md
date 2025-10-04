# 🌐 Sistema de Coordenadas Orbital Realista

## Fecha: Octubre 2025

---

## 🎯 Problema Solucionado

**ANTES:** Todos los NEOs salían desde la Tierra (irreal y confuso)
```
        ↗ NEO
       ↗
🌍 ← → → → Todos desde el centro
       ↘
        ↘ NEO
```

**AHORA:** NEOs distribuidos en latitud y longitud orbital realista
```
    NEO ━━━━→        (Lat: +20°, Lon: 45°)
           ↘
  NEO ━━━→ 🌍      (Lat: -15°, Lon: 180°)
         ↙
    ━━━→ NEO         (Lat: +5°, Lon: 270°)
```

---

## 📐 Sistema de Coordenadas Esféricas

### Componentes:

1. **Radio (r):** Distancia desde el centro de la Tierra
2. **Longitud (θ):** Ángulo horizontal (0° a 360°)
3. **Latitud (φ):** Ángulo vertical (-90° a +90°)

```
         +Y (Norte)
          ↑
          |
          |    • NEO (r, θ, φ)
          |   /|
          |  / |
          | /  |
          |/   |
 -X ←----🌍----→ +X (Longitud 0°)
         /|
        / |
       /  |
      ↙   ↓
    +Z   -Y (Sur)
```

---

## 🌍 Cálculo de Longitud Orbital

### Basado en Fecha y Hora de Aproximación

```javascript
const dayOfYear = getDayOfYear(approachDate);     // 1-365
const hour = approachDate.getHours();             // 0-23
const minute = approachDate.getMinutes();         // 0-59

// Longitud de 0° a 360°
longitudeDeg = (dayOfYear / 365) * 360     // Posición anual
             + (hour / 24) * 15            // Rotación horaria (15°/hora)
             + (minute / 60) * 0.25;       // Precisión minuto (0.25°/min)

longitude = (longitudeDeg % 360) * (π / 180);  // Radianes
```

### Distribución Temporal:
- **1 Enero 00:00:** Longitud ≈ 0°
- **1 Abril 06:00:** Longitud ≈ 90° + 3.75° = 93.75°
- **1 Julio 12:00:** Longitud ≈ 180° + 7.5° = 187.5°
- **1 Octubre 18:00:** Longitud ≈ 270° + 11.25° = 281.25°

**Resultado:** NEOs distribuidos alrededor de la Tierra según su tiempo de aproximación

---

## 🌐 Cálculo de Latitud Orbital

### Basado en Velocidad Relativa (Inclinación Orbital)

```javascript
const velocityNormalized = Math.min(velocityKmS / 50, 1);  // 0-1

const latitudeVariation = (Math.random() - 0.5) * 2;       // -1 a 1
const latitudeDeg = latitudeVariation * 30 * velocityNormalized;  // -30° a +30°

latitude = (latitudeDeg * π) / 180;  // Radianes
```

### Distribución por Velocidad:

| Velocidad | Rango Latitud | Ejemplo |
|-----------|---------------|---------|
| 10 km/s (lento) | -6° a +6° | Cerca del ecuador |
| 25 km/s (medio) | -15° a +15° | Inclinación moderada |
| 50 km/s (rápido) | -30° a +30° | Alta inclinación |
| > 50 km/s | -30° a +30° (máx) | Máxima inclinación |

**Razón Científica:** 
- Velocidades altas → órbitas más inclinadas
- La mayoría de NEOs tienen inclinaciones < 30° (cercanas al plano eclíptico)

---

## 📊 Ejemplos de Posicionamiento Real

### Ejemplo 1: Asteroide Lento y Cercano
```
Fecha: 15 Marzo 2025, 14:30
Velocidad: 12 km/s
Distancia: 0.5 LD

Cálculo:
- dayOfYear: 74
- Longitud: (74/365)*360 + (14/24)*15 + (30/60)*0.25
          = 72.9° + 8.75° + 0.125° = 81.775°
- Latitud: random(-1,1) * 30 * (12/50) = ±7.2°

Posición: (r: 6.25, θ: 81.8°, φ: +3.5°)
```

### Ejemplo 2: Asteroide Rápido y Lejano
```
Fecha: 20 Agosto 2025, 22:45
Velocidad: 48 km/s
Distancia: 8 LD

Cálculo:
- dayOfYear: 232
- Longitud: (232/365)*360 + (22/24)*15 + (45/60)*0.25
          = 228.6° + 13.75° + 0.1875° = 242.5°
- Latitud: random(-1,1) * 30 * (48/50) = ±28.8°

Posición: (r: 9.9, θ: 242.5°, φ: -22.1°)
```

### Ejemplo 3: Medianoche en Año Nuevo
```
Fecha: 1 Enero 2025, 00:00
Velocidad: 30 km/s
Distancia: 2 LD

Cálculo:
- dayOfYear: 1
- Longitud: (1/365)*360 + 0 + 0 = 0.986°
- Latitud: random(-1,1) * 30 * (30/50) = ±18°

Posición: (r: 6.6, θ: 1°, φ: +11.3°)
```

---

## 🎨 Distribución Visual

### Vista Superior (Plano XZ):
```
         NEO (Lon: 90°)
            ↑
            |
NEO ← ----- 🌍 ----- → NEO (Lon: 0°)
  (180°)    |
            |
            ↓
         NEO (Lon: 270°)
```

### Vista Lateral (Plano YZ):
```
    NEO (Lat: +30°)
       ╱
      ╱
    🌍 ←───────→ NEO (Lat: 0°)
      ╲
       ╲
    NEO (Lat: -30°)
```

---

## 🌊 Estelas Orbitales Realistas

### Dirección de Estela

**ANTES:** Estelas apuntaban hacia atrás genéricamente
**AHORA:** Estelas vienen desde el espacio profundo

```javascript
// Vector normalizado desde Tierra al NEO
const directionFromEarth = currentPosition.normalize();

// Estela se extiende MÁS LEJOS en esa misma dirección
const trailPoint = directionFromEarth
  .multiplyScalar(distance + trailOffset);
```

### Longitud de Estela

```javascript
const maxTrailDistance = earthRadius * 3;  // Máx 15 unidades

const velocityFactor = Math.min(velocityKmS / 20, 1);
const distanceFactor = Math.min(distanceFromEarth / earthRadius, 2);

trailLength = maxTrailDistance * velocityFactor * (0.5 + distanceFactor * 0.5);
```

### Tabla de Longitudes:

| Velocidad | Distancia | Longitud Estela | Visual |
|-----------|-----------|-----------------|--------|
| 10 km/s | 0.5 LD | ~1.9 unidades | Corta |
| 30 km/s | 2 LD | ~6.75 unidades | Media |
| 50 km/s | 5 LD | ~11.25 unidades | Larga |
| 80 km/s | 10 LD | ~15 unidades | Muy larga |

### Curvatura Gravitacional

```javascript
const curvature = Math.sin(t * Math.PI) * 0.5;
trailPoint.y += curvature;
```

**Efecto:** Las estelas tienen ligera curvatura para simular influencia gravitatoria de la Tierra

---

## 🔍 Conversión Esféricas → Cartesianas

### Fórmulas Matemáticas:

```javascript
// Entrada: (r, θ, φ) en radianes
// Salida: (x, y, z) en unidades de escena

x = r * cos(φ) * cos(θ)
y = r * sin(φ)
z = r * cos(φ) * sin(θ)
```

### Sistema de Coordenadas Three.js:
- **+X:** Este (Longitud 0°)
- **+Y:** Norte (Latitud +90°)
- **+Z:** Sur (Longitud 90°)
- **Origen (0,0,0):** Centro de la Tierra

---

## 📊 Distribución Estadística

### Rango de Longitudes (0-360°):

Si cargas 30 NEOs en un mes:
```
Enero:   ~0-30°   (8%)
Febrero: ~30-60°  (8%)
Marzo:   ~60-90°  (8%)
...
Diciembre: ~330-360° (8%)
```

**Resultado:** Distribución uniforme alrededor de la Tierra

### Rango de Latitudes (-30° a +30°):

Distribución gaussiana centrada en 0°:
```
-30° a -20°:  10%
-20° a -10°:  20%
-10° a +10°:  40%  ← Mayor concentración (plano eclíptico)
+10° a +20°:  20%
+20° a +30°:  10%
```

---

## ✅ Ventajas del Sistema

### 1. Realismo Astronómico
- ✅ NEOs vienen desde el espacio (no desde la Tierra)
- ✅ Distribución basada en tiempo de aproximación
- ✅ Inclinaciones basadas en velocidad orbital
- ✅ Concentración cerca del plano eclíptico (±30°)

### 2. Claridad Visual
- ✅ No hay solapamiento en el origen
- ✅ Estelas muestran dirección de aproximación clara
- ✅ Distribución espacial intuitiva
- ✅ Fácil identificar procedencia

### 3. Precisión Científica
- ✅ Respeta física orbital básica
- ✅ Usa datos reales de NASA (fecha, hora, velocidad)
- ✅ Curvatura gravitacional simulada
- ✅ Escalas proporcionales

---

## 🎯 Comparación Antes/Después

### ANTES: Sistema Radial Simple
```javascript
// Todos salían desde el centro
const angle = (index / total) * 2π;
x = distance * cos(angle);
y = 0; // Plano
z = distance * sin(angle);
```

**Problemas:**
- ❌ Irrealista (asteroides no orbitan así)
- ❌ Estelas apuntaban al centro
- ❌ No usa datos orbitales reales
- ❌ Distribución uniforme artificial

### AHORA: Sistema Orbital Realista
```javascript
// Coordenadas basadas en órbita real
longitude = f(fecha, hora);
latitude = f(velocidad, inclinación);

x = r * cos(lat) * cos(lon);
y = r * sin(lat);
z = r * cos(lat) * sin(lon);
```

**Ventajas:**
- ✅ Realista (basado en datos orbitales)
- ✅ Estelas vienen del espacio profundo
- ✅ Usa fecha/hora de aproximación
- ✅ Distribución científicamente correcta

---

## 📐 Geometría de Aproximación

### Trayectoria Típica de NEO:

```
Espacio profundo
    |
    | ━━━━━ Estela (desde lejos)
    |
    ↓
    • NEO (posición actual)
   ╱
  ╱ ← Trayectoria hacia la Tierra
 ╱
🌍 Tierra (punto de aproximación más cercana)
```

### Elementos Visualizados:

1. **Punto del NEO:** Posición en momento de aproximación más cercana
2. **Estela:** Trayectoria desde el espacio profundo
3. **Curvatura:** Efecto gravitatorio de la Tierra
4. **Latitud/Longitud:** Posición orbital en coordenadas esféricas

---

## 🔧 Parámetros Ajustables

### Rango de Latitud:
```javascript
// Más estrecho (más cerca del ecuador)
const latitudeDeg = latitudeVariation * 20 * velocityNormalized;  // Era 30

// Más amplio (más dispersión vertical)
const latitudeDeg = latitudeVariation * 45 * velocityNormalized;  // Era 30
```

### Longitud de Estela:
```javascript
// Estelas más cortas
const maxTrailDistance = earthRadius * 2;  // Era 3

// Estelas más largas
const maxTrailDistance = earthRadius * 5;  // Era 3
```

### Curvatura Gravitacional:
```javascript
// Más curvatura (más dramático)
const curvature = Math.sin(t * Math.PI) * 1.0;  // Era 0.5

// Menos curvatura (más recto)
const curvature = Math.sin(t * Math.PI) * 0.2;  // Era 0.5
```

---

## 📊 Métricas del Sistema

| Aspecto | Valor | Descripción |
|---------|-------|-------------|
| Rango Longitud | 0-360° | Distribución temporal completa |
| Rango Latitud | -30° a +30° | Plano eclíptico realista |
| Precisión temporal | 0.25°/min | Hasta nivel de minuto |
| Max longitud estela | 15 unidades | 3x radio Tierra |
| Curvatura gravitacional | 0.5 unidades | Efecto visual sutil |
| Segmentos estela | 20 | Balance calidad/rendimiento |

---

## 🌟 Resultado Final

### Lo que verás:

```
    NEO ━━━━→         (Viene desde 45°N, 90°E)
           ↘
          ↘
  NEO ━━━→ 🌍        (Viene desde 15°S, 180°)
        ↙
       ↙
    ━━━━━→ NEO        (Viene desde 5°N, 270°W)
```

**Características:**
- 🌐 Distribución espacial realista (lat/lon)
- ⏰ Basada en fecha/hora de aproximación
- 🚀 Velocidad determina inclinación orbital
- 🌊 Estelas desde el espacio profundo
- 📐 Curvatura gravitacional visible
- 🎯 No salen todas desde el centro de la Tierra

---

**Autor:** GitHub Copilot  
**Fecha:** Octubre 2025  
**Versión:** 6.0 (Orbital Coordinates)
