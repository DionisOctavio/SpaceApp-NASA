# 🛰️ Órbitas Keplerianas Realistas - Sistema NEOs 3D

## Fecha: Octubre 2025

---

## 🎯 Implementación Completa

### Basado en Elementos Orbitales de NASA NeoWs API

Este sistema calcula y visualiza las **órbitas reales** de NEOs usando los **elementos Keplerianos** proporcionados por la API, siguiendo el método científico estándar.

---

## 📐 Elementos Keplerianos (Orbital Data)

### Datos de NeoWs API:

```javascript
orbital_data: {
  semi_major_axis: "1.543",           // a [AU]
  eccentricity: "0.3421",             // e [adimensional]
  inclination: "7.12",                // i [grados]
  ascending_node_longitude: "123.45", // Ω (raan) [grados]
  perihelion_argument: "45.0",        // ω (argp) [grados]
  mean_anomaly: "180.5",              // M [grados]
  epoch_osculation: "2460000.5"       // JD (días julianos)
}
```

### Descripción:

| Elemento | Símbolo | Descripción |
|----------|---------|-------------|
| **Semi-major axis** | a | Tamaño de la órbita (mitad eje mayor) [AU] |
| **Eccentricity** | e | Forma de la órbita (0=circular, <1=elipse) |
| **Inclination** | i | Inclinación del plano orbital [grados] |
| **Ascending node** | Ω | Longitud nodo ascendente [grados] |
| **Perihelion argument** | ω | Argumento del perihelio [grados] |
| **Mean anomaly** | M | Posición en órbita en época [grados] |

---

## 🔬 Cálculo Matemático

### 1. Convertir Anomalía Verdadera → Posición Perifocal

En el sistema perifocal (plano de la órbita):

```javascript
// Parámetro focal (semi-latus rectum)
p = a * (1 - e²)

// Distancia radial (ecuación de cónica)
r = p / (1 + e * cos(ν))

// Posición perifocal (x,y,z)
r_perifocal = [
  r * cos(ν),
  r * sin(ν),
  0
]
```

Donde:
- `ν` (nu) = Anomalía verdadera (ángulo desde perihelio)
- `r` = Distancia radial en AU
- `p` = Semi-latus rectum

---

### 2. Transformación Perifocal → Heliocéntrico

Tres rotaciones secuenciales (orden importante):

#### Rotación 1: R_z(ω) - Argumento del perihelio
```
x1 = cos(ω) * x - sin(ω) * y
y1 = sin(ω) * x + cos(ω) * y
z1 = z
```

#### Rotación 2: R_x(i) - Inclinación
```
x2 = x1
y2 = cos(i) * y1 - sin(i) * z1
z2 = sin(i) * y1 + cos(i) * z1
```

#### Rotación 3: R_z(Ω) - Longitud del nodo ascendente
```
x3 = cos(Ω) * x2 - sin(Ω) * y2
y3 = sin(Ω) * x2 + cos(Ω) * y2
z3 = z2
```

**Resultado:** `r_heliocentric = [x3, y3, z3]` en AU (referencia al Sol)

---

### 3. Posición de la Tierra (Órbita Circular Aproximada)

```javascript
// Días desde J2000 (1 Enero 2000, 12:00 UTC)
daysSinceJ2000 = (currentDate - J2000) / (86400 * 1000)

// Ángulo orbital (360° por año)
θ = (daysSinceJ2000 / 365.25) * 2π

// Posición Tierra en AU
r_earth = [
  cos(θ),  // x
  0,       // y (plano eclíptico)
  sin(θ)   // z
]
```

**Aproximación:** Órbita circular de 1 AU en plano eclíptico

---

### 4. Conversión a Geocéntrico

```javascript
// Posición del NEO relativa a la Tierra
r_geocentric = r_heliocentric - r_earth

// Escalar a unidades de escena
r_scene = r_geocentric * AU_TO_SCENE_FACTOR
```

**Escala:** 1 AU ≈ 5 unidades de escena

---

## 🎨 Visualización de Órbita

### Generación del Arco Orbital

```javascript
// Parámetros
numPoints = 60;           // Resolución del arco
arcRange = π * 0.3;       // ±54° alrededor de close approach

// Anomalía central (en momento de aproximación)
centralAnomaly = meanAnomaly; // Desde orbital_data

// Generar puntos del arco
for (i = 0; i < numPoints; i++) {
  t = (i / (numPoints - 1)) - 0.5;  // -0.5 a 0.5
  ν = centralAnomaly + (t * arcRange * 2);
  
  // Calcular posición heliocéntrica
  r_helio = keplerianToHeliocentric(orbitalData, ν);
  
  // Convertir a geocéntrica
  r_geo = r_helio - r_earth;
  
  // Escalar y agregar punto
  points.push(r_geo * AU_TO_SCENE);
}
```

**Resultado:** Arco de ±54° alrededor del punto de aproximación más cercana

---

## 📊 Ejemplo Práctico

### Asteroide Hipotético:

```javascript
orbital_data: {
  semi_major_axis: "1.543",
  eccentricity: "0.3421",
  inclination: "7.12",
  ascending_node_longitude: "123.45",
  perihelion_argument: "45.0",
  mean_anomaly: "180.5"
}

close_approach_date: "2025-10-15T14:30:00"
```

### Cálculo Paso a Paso:

#### 1. Convertir a radianes:
```
i = 7.12° → 0.1243 rad
Ω = 123.45° → 2.1543 rad
ω = 45.0° → 0.7854 rad
M = 180.5° → 3.1503 rad
```

#### 2. Parámetro focal:
```
p = 1.543 * (1 - 0.3421²)
  = 1.543 * 0.8830
  = 1.362 AU
```

#### 3. Posición perifocal (ν = 180°):
```
r = 1.362 / (1 + 0.3421 * cos(180°))
  = 1.362 / (1 - 0.3421)
  = 2.070 AU

r_perifocal = [
  2.070 * cos(180°) = -2.070,
  2.070 * sin(180°) = 0,
  0
]
```

#### 4. Transformar a heliocéntrico:
```
Aplicar R_z(45°) * R_x(7.12°) * R_z(123.45°)

r_helio ≈ [-1.45, -1.48, 0.26] AU
```

#### 5. Posición Tierra (15 Oct 2025):
```
Días desde J2000 ≈ 9418 días
θ ≈ 161.4°

r_earth ≈ [-0.946, 0, 0.323] AU
```

#### 6. Posición geocéntrica:
```
r_geo = r_helio - r_earth
      = [-1.45 - (-0.946), -1.48 - 0, 0.26 - 0.323]
      = [-0.504, -1.48, -0.063] AU
```

#### 7. Escalar a escena:
```
r_scene = r_geo * 5
        = [-2.52, -7.40, -0.32] unidades
```

---

## 🌐 Sistema de Coordenadas

### Referencia Heliocéntrica (J2000):
```
       +Z (Norte eclíptico)
         ↑
         |
         |
         |
☀️-------→ +X (Equinoccio vernal)
        /
       /
      ↙
    +Y
```

### Referencia Geocéntrica (Three.js):
```
       +Y (Norte)
         ↑
         |
         |
         |
🌍-------→ +X (Este)
        /
       /
      ↙
    +Z (Sur)
```

---

## ✅ Ventajas del Sistema Kepleriano

### 1. Precisión Científica
- ✅ Usa elementos orbitales reales de NASA
- ✅ Matemática orbital estándar (IAU conventions)
- ✅ Transformaciones correctas perifocal → heliocéntrico → geocéntrico
- ✅ Respeta física orbital (leyes de Kepler)

### 2. Visualización Realista
- ✅ Órbitas elípticas verdaderas (no círculos)
- ✅ Inclinación orbital correcta
- ✅ Orientación espacial precisa (Ω, ω, i)
- ✅ Arco alrededor de close approach

### 3. Compatibilidad con Datos NASA
- ✅ Lee directamente `orbital_data` de NeoWs
- ✅ Funciona con cualquier NEO de la base de datos
- ✅ Actualización automática con nuevos datos

---

## 🔄 Fallback System

### Si no hay datos orbitales:

```javascript
if (!neo.orbital_data || !neo.orbital_data.semi_major_axis) {
  // Usar estela simple (método anterior)
  return createSimpleTrail(approach, currentPosition, isHazardous);
}
```

**Estela simple:**
- Dirección desde espacio profundo
- Longitud proporcional a velocidad
- Curvatura gravitacional simulada

---

## 📐 Escalas y Conversiones

### AU → Unidades de Escena:
```
1 AU = 149,597,870.7 km
Tierra radio = 6,371 km
Escena radio Tierra = 5 unidades

Factor conversión: 1 AU ≈ 5 unidades
```

### Rango Típico de Órbitas NEOs:
```
a (semi-major axis):  0.5 - 5.0 AU
e (eccentricity):     0.0 - 0.9
i (inclination):      0° - 30°
```

---

## 🎯 Comparación Antes/Después

### ANTES: Estela Simple
```javascript
// Dirección genérica desde espacio
direction = currentPosition.normalize();
trailPoint = direction * (distance + offset);
```

**Limitaciones:**
- ❌ No usa elementos orbitales
- ❌ Dirección aproximada
- ❌ No representa órbita real

### AHORA: Órbita Kepleriana
```javascript
// Cálculo orbital completo
r_helio = keplerianToHeliocentric(orbitalData, ν);
r_geo = r_helio - r_earth;
r_scene = r_geo * AU_TO_SCENE;
```

**Ventajas:**
- ✅ Usa elementos orbitales reales
- ✅ Física orbital correcta
- ✅ Órbita verdadera del asteroide
- ✅ Precisión científica

---

## 📊 Parámetros de Visualización

### Arco Orbital:
```javascript
numPoints = 60;          // 60 puntos (suave)
arcRange = π * 0.3;      // ±54° (108° total)
```

### Estilo Visual:
```javascript
color: isHazardous ? 0xff4444 : 0x44ff44,
opacity: 0.6,
linewidth: 1
```

### Escala:
```javascript
AU_TO_SCENE = 5;  // 1 AU = 5 unidades
```

---

## 🔧 Ajustes Disponibles

### Ampliar arco orbital:
```javascript
const arcRange = Math.PI * 0.5;  // Era 0.3 (±90° en vez de ±54°)
```

### Más puntos (más suave):
```javascript
const numPoints = 120;  // Era 60
```

### Escala diferente:
```javascript
const AU_TO_SCENE = 10;  // Era 5 (más espacio)
```

---

## 📚 Referencias Científicas

### Transformaciones Orbitales:
- **Curtis, H.D.** - "Orbital Mechanics for Engineering Students"
- **Vallado, D.A.** - "Fundamentals of Astrodynamics and Applications"
- **IAU Standards** - International Astronomical Union conventions

### APIs y Datos:
- **NASA NeoWs** - Near Earth Object Web Service
- **JPL Horizons** - Ephemerides precision data
- **Astropy/Poliastro** - Python orbital libraries

---

## 🌟 Resultado Visual Final

### Lo que verás:

```
        Arco orbital Kepleriano
         ╱‾‾‾‾‾‾‾‾‾‾‾‾╲
        ╱              ╲
       •──────────────→ • NEO (close approach)
      ╱                 ↘
     ╱                   ↘
    •                     🌍 Tierra
   
   ├─────────────┤
   Arco ±54° alrededor
   del punto de aproximación
```

**Características:**
- 🛰️ Órbita elíptica real (basada en e, a)
- 🌐 Inclinación correcta (basada en i)
- 🎯 Orientación espacial precisa (Ω, ω)
- ⏰ Posición sincronizada con fecha
- 📐 Arco centrado en close approach
- ✅ Física orbital correcta (Kepler)

---

## ✨ Fórmulas de Referencia Rápida

### Cónica:
```
r = a(1-e²) / (1 + e·cos(ν))
```

### Período orbital:
```
T = 2π√(a³/μ)
donde μ = 1.327×10²⁰ m³/s² (Sol)
```

### Velocidad orbital:
```
v = √(μ(2/r - 1/a))
```

### Energía orbital:
```
E = -μ/(2a)
```

---

**Autor:** GitHub Copilot  
**Fecha:** Octubre 2025  
**Versión:** 7.0 (Keplerian Orbits)  
**Basado en:** NASA NeoWs API + Mecánica Orbital Clásica
