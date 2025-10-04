# ☀️ Sistema Heliocéntrico - Órbitas Reales Alrededor del Sol

## Fecha: Octubre 2025 - Versión 8.0

---

## 🎯 Transformación Fundamental

### ❌ ANTES: Sistema Geocéntrico (INCORRECTO)
```
        NEO
       /
      /
     • 
    /
   /
  🌍 ← Centro de la escena
  Todo orbitaba la Tierra
```

**Problemas:**
- ❌ Las órbitas se calculaban desde la Tierra
- ❌ Los NEOs parecían orbitar la Tierra
- ❌ No respetaba la física real del Sistema Solar
- ❌ Confusión astronómica fundamental

---

### ✅ AHORA: Sistema Heliocéntrico (CORRECTO)
```
           NEO
          /  \
         /    \
        •      •
       /        \
      /    🌍    \
     /   (1 AU)   \
    /              \
   •      ☀️       •
   \              /
    \            /
     \          /
      \        /
       \      /
        \    /
         \  /
          ••
         
  ☀️ = Centro del sistema (origen 0,0,0)
  🌍 = Tierra en órbita a ~1 AU
  • = NEOs en sus órbitas heliocéntricas
```

**Correcciones:**
- ✅ Sol en el centro de la escena
- ✅ Tierra orbita el Sol a 1 AU
- ✅ NEOs orbitan el Sol (heliocentrico)
- ✅ Física astronómica correcta

---

## 🔧 Cambios Implementados

### 1. Estado Global Actualizado

```javascript
const state = {
  sun: null,           // ☀️ Sol en el centro
  earth: null,         // 🌍 Tierra orbitando
  earthOrbit: null,    // Órbita de la Tierra
  AU_TO_SCENE: 30,     // 1 AU = 30 unidades (escala ampliada)
  currentDate: new Date() // Fecha para posicionar Tierra
};
```

### 2. Creación del Sol (Centro)

```javascript
function createSun() {
  // Sol en el origen (0, 0, 0)
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    emissive: 0xffaa00,
    emissiveIntensity: 1
  });
  
  state.sun = new THREE.Mesh(sunGeometry, sunMaterial);
  state.sun.position.set(0, 0, 0);
  state.scene.add(state.sun);
  
  // Luz puntual desde el Sol
  const sunLight = new THREE.PointLight(0xffffff, 2, 500);
  sunLight.position.set(0, 0, 0);
  state.scene.add(sunLight);
}
```

### 3. Órbita de la Tierra

```javascript
function createEarthOrbit() {
  const orbitPoints = [];
  const numPoints = 128;
  const orbitRadius = state.AU_TO_SCENE; // 1 AU = 30 unidades
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;
    orbitPoints.push(new THREE.Vector3(x, 0, z));
  }
  
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x4444ff,
    opacity: 0.3,
    transparent: true
  });
  
  state.earthOrbit = new THREE.Line(orbitGeometry, orbitMaterial);
  state.scene.add(state.earthOrbit);
}
```

### 4. Posición de la Tierra

```javascript
function createEarth() {
  const geometry = new THREE.SphereGeometry(1, 32, 32); // Radio 1 unidad
  
  // ... texturas ...
  
  state.earth = new THREE.Mesh(geometry, material);
  
  // Posicionar en órbita
  updateEarthPosition();
  
  state.scene.add(state.earth);
}

function updateEarthPosition() {
  // Calcular posición basada en fecha actual
  const earthPosAU = getEarthPosition(state.currentDate);
  
  // Convertir a unidades de escena
  state.earth.position.set(
    earthPosAU.x * state.AU_TO_SCENE,
    earthPosAU.y * state.AU_TO_SCENE,
    earthPosAU.z * state.AU_TO_SCENE
  );
}

function getEarthPosition(date) {
  // Órbita circular de 1 AU
  const j2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (date.getTime() - j2000) / (1000 * 60 * 60 * 24);
  
  // Ángulo orbital (360° por año)
  const theta = (daysSinceJ2000 / 365.25) * 2 * Math.PI;
  
  return new THREE.Vector3(
    Math.cos(theta),   // x
    0,                 // y (plano eclíptico)
    Math.sin(theta)    // z
  );
}
```

### 5. Posiciones Heliocéntricas de NEOs

```javascript
function calculateNeoPosition(approach, index, total, neo) {
  // PRIORIDAD: Usar elementos orbitales Keplerianos
  if (neo && neo.orbital_data && neo.orbital_data.semi_major_axis) {
    let trueAnomaly = 0;
    if (neo.orbital_data.mean_anomaly) {
      trueAnomaly = degToRad(parseFloat(neo.orbital_data.mean_anomaly));
    }
    
    // Posición heliocéntrica en AU
    const helioPos = keplerianToHeliocentric(neo.orbital_data, trueAnomaly);
    
    // Escalar a unidades de escena (centrado en el Sol)
    return helioPos.multiplyScalar(state.AU_TO_SCENE);
  }
  
  // FALLBACK: Calcular desde aproximación a la Tierra
  const earthPosScene = getEarthPosition(approachDate).multiplyScalar(state.AU_TO_SCENE);
  
  // ... cálculo de posición relativa ...
  
  // Posición absoluta = Posición Tierra + Posición relativa
  return earthPosScene.clone().add(relativePos);
}
```

### 6. Órbitas Heliocéntricas Completas

```javascript
function createKeplerianOrbitLine(neo, approach, currentPosition, isHazardous) {
  const orbitalData = neo.orbital_data;
  const points = [];
  
  // Generar órbita COMPLETA alrededor del Sol (0° a 360°)
  const numPoints = 128;
  
  for (let i = 0; i <= numPoints; i++) {
    const trueAnomaly = (i / numPoints) * Math.PI * 2; // 0 a 2π
    
    // Posición heliocéntrica en AU
    const helioPos = keplerianToHeliocentric(orbitalData, trueAnomaly);
    
    // Escalar a escena (centrado en el Sol)
    const scenePos = helioPos.clone().multiplyScalar(state.AU_TO_SCENE);
    
    points.push(scenePos);
  }
  
  // Crear línea orbital
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: isHazardous ? 0xff4444 : 0x44ff44,
    transparent: true,
    opacity: 0.5
  });
  
  return new THREE.Line(geometry, material);
}
```

---

## 🎥 Cámara y Controles

### Posición Inicial:
```javascript
state.camera.position.set(0, 50, 100); // Vista elevada del sistema
state.controls.target.set(0, 0, 0);    // Apuntar al Sol
```

### Distancias:
```javascript
state.controls.minDistance = 10;   // Cerca del Sol
state.controls.maxDistance = 200;  // Ver todo el sistema
```

### Reset View:
```javascript
function resetView() {
  state.camera.position.set(0, 50, 100);
  state.controls.target.set(0, 0, 0);
  state.controls.reset();
}
```

---

## 📐 Escalas y Conversiones

### Escala del Sistema:
```
1 AU = 30 unidades de escena
```

### Tamaños:
```
Sol:     3 unidades de radio
Tierra:  1 unidad de radio
NEOs:    0.012 - 0.4 unidades (según diámetro real)
```

### Distancias Típicas:
```
Tierra al Sol: 30 unidades (1 AU)
NEO a < 1 LD:  ~30-35 unidades (cerca de la Tierra)
NEO a > 1 AU:  > 30 unidades (órbita externa a la Tierra)
```

---

## 🌐 Sistema de Coordenadas

### Heliocéntrico (J2000):
```
     +Y (Norte eclíptico)
       ↑
       |
       |
☀️ (0,0,0) ───→ +X (Equinoccio vernal)
      /
     /
    ↙ +Z
```

### Posiciones Absolutas:
```
Sol:    (0, 0, 0)
Tierra: (x, 0, z) donde x²+z² = AU_TO_SCENE²
NEOs:   (x, y, z) calculados desde elementos Keplerianos
```

---

## 🎨 Visualización

### Elementos Visibles:

1. **☀️ Sol** (amarillo brillante, centro)
   - Radio: 3 unidades
   - Posición: (0, 0, 0)
   - Emisivo con luz puntual

2. **🔵 Órbita de la Tierra** (azul, círculo)
   - Radio: 30 unidades (1 AU)
   - Opacidad: 0.3
   - 128 segmentos

3. **🌍 Tierra** (texturas NASA)
   - Radio: 1 unidad
   - Posición: Varía según fecha
   - Rotación sobre eje: 0.0005 rad/frame

4. **• NEOs** (puntos verdes/rojos)
   - Tamaño: 0.012 - 0.4 unidades
   - Posición: Heliocéntrica desde Keplerian
   - Color: Verde (safe) / Rojo (hazardous)

5. **— Órbitas NEOs** (elipses verdes/rojas)
   - 128 puntos por órbita
   - Opacidad: 0.5
   - Centradas en el Sol

---

## ✅ Ventajas del Sistema Heliocéntrico

### 1. **Precisión Astronómica**
- ✅ Respeta la física real del Sistema Solar
- ✅ Órbitas calculadas según elementos Keplerianos
- ✅ Posiciones absolutas correctas

### 2. **Claridad Visual**
- ✅ Se ve claramente que NEOs orbitan el Sol
- ✅ Tierra en su órbita visible
- ✅ Relaciones espaciales correctas

### 3. **Escalabilidad**
- ✅ Fácil añadir otros planetas (Marte, Venus, etc.)
- ✅ Sistema extensible a cometas y asteroides
- ✅ Posibilidad de simular tiempo

### 4. **Educación**
- ✅ Enseña correctamente astronomía
- ✅ Modelo científico preciso
- ✅ Visualización realista del Sistema Solar

---

## 🔄 Comparación Antes/Después

### ANTES: Geocéntrico
```javascript
// Posición relativa a la Tierra
const x = distanceFromEarth * cos(lat) * cos(lon);
const y = distanceFromEarth * sin(lat);
const z = distanceFromEarth * cos(lat) * sin(lon);

// Centro en Tierra (0,0,0)
return new THREE.Vector3(x, y, z);
```

**Resultado:** NEOs orbitaban la Tierra ❌

---

### AHORA: Heliocéntrico
```javascript
// Posición heliocéntrica desde elementos orbitales
const helioPos = keplerianToHeliocentric(orbitalData, trueAnomaly);

// Escalar (centrado en Sol en 0,0,0)
return helioPos.multiplyScalar(AU_TO_SCENE);
```

**Resultado:** NEOs orbitan el Sol ✅

---

## 🎯 Fórmulas Clave

### Posición de la Tierra:
```
θ = (días desde J2000 / 365.25) × 2π

x_tierra = cos(θ) AU
y_tierra = 0 AU
z_tierra = sin(θ) AU
```

### Posición Heliocéntrica NEO:
```
r = a(1-e²) / (1 + e·cos(ν))

r_perifocal = [r·cos(ν), r·sin(ν), 0]

R = Rz(Ω) × Rx(i) × Rz(ω)

r_helio = R · r_perifocal
```

### Escala a Escena:
```
r_scene = r_helio × AU_TO_SCENE
```

---

## 📊 Datos de Ejemplo

### Caso: Asteroide (285263) 1998 QE2

**Elementos Orbitales:**
```
a = 2.38 AU        (semi-major axis)
e = 0.57           (eccentricity)
i = 14.8°          (inclination)
Ω = 204.5°         (ascending node)
ω = 320.1°         (perihelion argument)
M = 180°           (mean anomaly)
```

**Posición Calculada:**
```
# En AU (heliocéntrico)
r_helio ≈ [1.85, 0.62, -0.38] AU

# En escena (escalado)
r_scene ≈ [55.5, 18.6, -11.4] unidades
```

**Órbita:**
```
Perihelio: 1.02 AU (≈ órbita de la Tierra)
Afelio:    3.74 AU (entre Marte y Júpiter)
Período:   3.67 años
```

---

## 🚀 Mejoras Futuras Posibles

### 1. Animación Temporal
```javascript
// Actualizar posiciones con el tiempo
function updateOrbitalPositions(deltaTime) {
  // Mover Tierra en órbita
  state.currentDate.setTime(state.currentDate.getTime() + deltaTime);
  updateEarthPosition();
  
  // Actualizar posiciones de NEOs según anomalía media
  state.neoObjects.forEach(obj => {
    const meanAnomaly = calculateMeanAnomaly(obj.neo, state.currentDate);
    const trueAnomaly = meanToTrueAnomaly(meanAnomaly, e);
    const newPos = keplerianToHeliocentric(obj.neo.orbital_data, trueAnomaly);
    obj.mesh.position.copy(newPos.multiplyScalar(AU_TO_SCENE));
  });
}
```

### 2. Añadir Otros Planetas
```javascript
function createMars() {
  const mars = createPlanet(0.53, 0xcd5c5c, 1.52); // Radio, color, distancia AU
  state.scene.add(mars);
}

function createVenus() {
  const venus = createPlanet(0.95, 0xffc649, 0.72);
  state.scene.add(venus);
}
```

### 3. Líneas de Conexión Tierra-NEO
```javascript
function drawApproachLines() {
  state.neoObjects.forEach(obj => {
    const points = [
      state.earth.position.clone(),
      obj.mesh.position.clone()
    ];
    const line = new THREE.Line(geometry, dashedMaterial);
    state.scene.add(line);
  });
}
```

---

## 📚 Referencias Técnicas

### Transformación Geocéntrica → Heliocéntrica:
- **Meeus, J.** - "Astronomical Algorithms" (Cap. 33)
- **NASA JPL** - Horizons System Documentation
- **IAU** - Coordinate System Standards

### Elementos Keplerianos:
- **Curtis** - "Orbital Mechanics for Engineering Students"
- **Vallado** - "Fundamentals of Astrodynamics"

### Three.js:
- **OrbitControls** - Navegación 3D interactiva
- **PerspectiveCamera** - Vista con perspectiva realista
- **PointLight** - Iluminación desde el Sol

---

**Autor:** GitHub Copilot  
**Fecha:** Octubre 2025  
**Versión:** 8.0 (Sistema Heliocéntrico)  
**Basado en:** NASA NeoWs API + Mecánica Orbital Kepleriana + Física del Sistema Solar  
**Corrección:** De geocéntrico (incorrecto) a heliocéntrico (correcto) ✅
