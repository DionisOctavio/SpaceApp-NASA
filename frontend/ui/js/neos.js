/**
 * SpaceNow! - NEOs Visualization with Three.js
 * 3D Interactive Earth with Near Earth Objects
 */

// ========== IMPORTS ==========
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { addItem as addHistItem, getByType as getHistByType, removeItem as removeHistItem, clearType as clearHistType } from '../../infra/util/historyStore.js';

// ========== GLOBAL STATE ==========
const state = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  sun: null,          // ☀️ Sol en el centro
  earth: null,        // 🌍 Tierra orbitando el Sol
  earthOrbit: null,   // Órbita de la Tierra
  neos: [],
  neoObjects: [],
  selectedNeo: null,
  isRotating: true,
  showOrbits: true,
  showEarthOrbit: true,
  animationId: null,
  currentDate: new Date(), // Fecha actual para posicionar la Tierra
  AU_TO_SCENE: 30      // Escala: 1 AU = 30 unidades (más espacio)
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  createSun();         // ☀️ Primero el Sol
  createEarthOrbit();  // Órbita de la Tierra
  createEarth();       // 🌍 Tierra en su órbita
  // After Earth is created, set the initial camera focus to Earth (user requested Earth-centric focus)
  if (state.earth && state.controls) {
    try {
      state.controls.target.copy(state.earth.position);
      // Place camera relative to Earth so the Earth is centered and visible
      const offset = new THREE.Vector3(0, 3, 8);
      state.camera.position.copy(state.earth.position).add(offset);
      state.controls.update();
      console.log('🔵 Initial camera focus set to Earth at', state.earth.position);
    } catch (e) {
      console.warn('Could not set initial focus to Earth:', e);
    }
  }
  setupEventListeners();
  setDefaultDates();
  updateStatus('Listo. Sistema heliocéntrico cargado. Selecciona fechas para cargar NEOs.');
  initNeoHistory();
});

// ========== THREE.JS SETUP ==========
function initThreeJS() {
  const canvas = document.getElementById('earth-canvas');
  const container = canvas.parentElement;

  // Scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x000000);

  // Camera (ajustada para vista heliocéntrica)
  state.camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    2000  // Mayor distancia para ver todo el sistema
  );
  state.camera.position.set(0, 50, 100); // Vista elevada del sistema solar

  // Renderer (optimized settings)
  state.renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" // Use GPU efficiently
  });
  state.renderer.setSize(container.clientWidth, container.clientHeight);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit to 2x for performance

  // Lights (optimized: fewer lights)
  // Lighting (se creará con el Sol)
  // (No crear luces aquí, se crearán en createSun)

  // Add stars background
  createStarfield();

  // OrbitControls (ajustados para sistema heliocéntrico)
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.05;
  state.controls.minDistance = 10;   // Más cerca del Sol
  state.controls.maxDistance = 200;  // Ver todo el sistema
  state.controls.enablePan = false;
  state.controls.target.set(0, 0, 0); // Apuntar al Sol (centro)

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

// ========== CREATE SUN (HELIOCENTRIC CENTER) ==========
function createSun() {
  // Sol en el centro de la escena (origen 0,0,0)
  const sunGeometry = new THREE.SphereGeometry(3, 32, 32); // Radio 3 unidades
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    emissive: 0xffaa00,
    emissiveIntensity: 1
  });
  
  state.sun = new THREE.Mesh(sunGeometry, sunMaterial);
  state.sun.position.set(0, 0, 0);
  state.scene.add(state.sun);
  
  // Luz puntual principal desde el Sol (más intensa)
  const sunLight = new THREE.PointLight(0xffffff, 3.5, 500);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = false;
  state.scene.add(sunLight);
  state.sun.userData.mainLight = sunLight;
  
  // Luz direccional adicional desde el Sol hacia la Tierra
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(0, 0, 0);
  state.scene.add(directionalLight);
  state.sun.userData.directionalLight = directionalLight;
  
  // Luz ambiental más brillante para iluminar mejor
  const ambientLight = new THREE.AmbientLight(0x606060, 0.6);
  state.scene.add(ambientLight);
  
  console.log('☀️ Sun created at heliocentric origin with enhanced lighting');
  updateStatus('☀️ Sol creado en el centro del sistema.');
}

// ========== CREATE EARTH ORBIT LINE ==========
function createEarthOrbit() {
  const orbitPoints = [];
  const numPoints = 256; // Más puntos para círculo más suave (antes 128)
  const orbitRadius = state.AU_TO_SCENE; // 1 AU
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;
    orbitPoints.push(new THREE.Vector3(x, 0, z));
  }
  
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x4488ff,     // Azul más brillante
    opacity: 0.5,        // Más visible (antes 0.3)
    transparent: true,
    linewidth: 2         // Línea más gruesa
  });
  
  state.earthOrbit = new THREE.Line(orbitGeometry, orbitMaterial);
  state.scene.add(state.earthOrbit);
  
  console.log('🔵 Earth orbit created at 1 AU');
}

// ========== CREATE EARTH ==========
function createEarth() {
  // Optimized geometry
  const geometry = new THREE.SphereGeometry(1, 32, 32); // Radio 1 unidad (escala relativa)
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';
  
  // Use direct GitHub raw URLs
  const earthTexture = textureLoader.load(
    'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
    () => {
      console.log('✓ Earth texture loaded');
      updateStatus('🌍 Tierra renderizada con texturas reales.');
    },
    undefined,
    (error) => {
      console.error('❌ Error loading Earth texture:', error);
      createProceduralEarth();
    }
  );
  
  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    shininess: 15,
    specular: 0x333333,  // Reflejo especular en océanos
    bumpScale: 0.005     // Añade profundidad
  });

  state.earth = new THREE.Mesh(geometry, material);
  
  // Posicionar la Tierra en su órbita (calcular posición actual)
  updateEarthPosition();
  
  state.scene.add(state.earth);
  
  // Luz adicional que ilumina la Tierra directamente
  const earthLight = new THREE.PointLight(0xffffff, 0.8, 100);
  state.earth.add(earthLight);
  earthLight.position.set(5, 5, 5);
  state.earth.userData.earthLight = earthLight;

  // Optional: Add cloud layer
  const cloudsGeometry = new THREE.SphereGeometry(1.02, 16, 16);
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,      // Más visibles
    depthWrite: false,
    shininess: 10
  });
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  state.earth.add(clouds);
  state.earth.userData.clouds = clouds;
  
  console.log('🌍 Earth created in heliocentric orbit');
}

// ========== UPDATE EARTH POSITION ==========
function updateEarthPosition() {
  if (!state.earth) return;
  
  // Calcular posición de la Tierra basada en fecha actual
  const earthPosAU = getEarthPosition(state.currentDate);
  
  // Convertir de AU a unidades de escena
  state.earth.position.set(
    earthPosAU.x * state.AU_TO_SCENE,
    earthPosAU.y * state.AU_TO_SCENE,
    earthPosAU.z * state.AU_TO_SCENE
  );
}

// Fallback procedural Earth if textures fail to load
function createProceduralEarth() {
  if (!state.earth) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Create Earth-like pattern
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1a4d7a');
  gradient.addColorStop(0.3, '#2a5f8f');
  gradient.addColorStop(0.5, '#1b5e20');
  gradient.addColorStop(0.7, '#2e7d32');
  gradient.addColorStop(1, '#1a4d7a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add continents-like patches
  ctx.fillStyle = '#2e7d32';
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 200 + 100;
    ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 150 + 50;
    ctx.ellipse(x, y, size, size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  state.earth.material.map = texture;
  state.earth.material.needsUpdate = true;
}

// ========== CREATE STARFIELD ==========
function createStarfield() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
  });

  // Optimized: 2000 stars instead of 5000
  const starsVertices = [];
  for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  state.scene.add(starField);
}

// ========== CREATE NEO OBJECTS ==========
function createNeoObjects(neosData) {
  // Clear existing NEOs
  state.neoObjects.forEach(obj => {
    state.scene.remove(obj.mesh);
    state.scene.remove(obj.label);
    if (obj.orbit) state.scene.remove(obj.orbit);
    if (obj.hitBox) state.scene.remove(obj.hitBox);
  });
  state.neoObjects = [];

  neosData.forEach((neo, index) => {
    const isHazardous = neo.is_potentially_hazardous_asteroid;
    
    // Get approach data
    const approach = neo.close_approach_data[0];
    
    // Create NEO sphere - TAMAÑO REALISTA ESCALADO
    const diameter = (neo.estimated_diameter.kilometers.estimated_diameter_min + 
                     neo.estimated_diameter.kilometers.estimated_diameter_max) / 2;
    
    // Escala realista: Tierra tiene radio 5 unidades = 6,371 km
    // Entonces 1 unidad = 1,274.2 km
    // Para hacer visibles los asteroides pequeños, usamos escala logarítmica
    const earthRadiusKm = 6371;
    const sceneEarthRadius = 5;
    const kmPerUnit = earthRadiusKm / sceneEarthRadius; // ~1274 km/unidad
    
    // Tamaño base realista
    let size = diameter / kmPerUnit;
    
    // Ajuste para visibilidad: escala logarítmica para objetos muy pequeños
    if (size < 0.01) {
      // Objetos muy pequeños (< 12.7 km): escala mayor para que sean visibles y clicables
      size = 0.01 + (Math.log10(diameter + 1) * 0.01);
    } else if (size > 0.3) {
      // Objetos grandes: limitar para evitar solapamiento
      size = 0.3 + (Math.log10(size) * 0.05);
    }
    
    // Asegurar rango mínimo y máximo
    size = Math.max(0.012, Math.min(0.4, size));
    
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: isHazardous ? 0xff4757 : 0x2ed573,
      emissive: isHazardous ? 0xff4757 : 0x2ed573,
      emissiveIntensity: 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // CALCULATE HELIOCENTRIC POSITION from orbital data
    const position = calculateNeoPosition(approach, index, neosData.length, neo);
    mesh.position.copy(position);

    mesh.userData = { 
      neo, 
      isHazardous, 
      approach,
      diameter,
      index,
      initialPosition: position.clone()
    };
    
    state.scene.add(mesh);

    // Create invisible hitbox para facilitar click (5x size, proporcional)
    const hitBoxGeometry = new THREE.SphereGeometry(size * 5, 6, 6);
    const hitBoxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      visible: false
    });
    const hitBox = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
    hitBox.position.copy(mesh.position);
  hitBox.userData = Object.assign({}, mesh.userData, { index });
    state.scene.add(hitBox);

    // Create orbit line with real Keplerian trajectory
    let orbitLine = null;
    if (state.showOrbits) {
      orbitLine = createRealOrbitLine(approach, position, isHazardous, neo);
      state.scene.add(orbitLine);
    }

    state.neoObjects.push({ mesh, orbit: orbitLine, hitBox, neo, index });
  });

  updateStatus(`${neosData.length} NEOs cargados con coordenadas reales.`);
  displayNeoList(neosData);
}

// ========== ORBITAL MECHANICS - KEPLERIAN ELEMENTS ==========

// Función para convertir grados a radianes
function degToRad(deg) {
  return parseFloat(deg) * Math.PI / 180;
}

// Función para calcular posición heliocéntrica desde elementos Keplerianos
function keplerianToHeliocentric(orbitalData, trueAnomaly) {
  // Extraer elementos orbitales (orbital_data de NeoWs API)
  const a = parseFloat(orbitalData.semi_major_axis);           // AU
  const e = parseFloat(orbitalData.eccentricity);              // adimensional
  const inc = degToRad(orbitalData.inclination);               // radianes
  const raan = degToRad(orbitalData.ascending_node_longitude); // radianes
  const argp = degToRad(orbitalData.perihelion_argument);      // radianes
  
  // Parámetro focal (semi-latus rectum)
  const p = a * (1 - e * e);
  
  // Distancia radial en la órbita (fórmula de cónica)
  const r = p / (1 + e * Math.cos(trueAnomaly));
  
  // Posición en sistema perifocal (órbita en su propio plano)
  const r_perifocal = new THREE.Vector3(
    r * Math.cos(trueAnomaly),
    r * Math.sin(trueAnomaly),
    0
  );
  
  // Matrices de rotación para transformar perifocal → heliocéntrico
  // Rotación 1: Rz(argp) - argumento del perihelio
  const cosArgp = Math.cos(argp);
  const sinArgp = Math.sin(argp);
  
  // Rotación 2: Rx(inc) - inclinación
  const cosInc = Math.cos(inc);
  const sinInc = Math.sin(inc);
  
  // Rotación 3: Rz(raan) - longitud del nodo ascendente
  const cosRaan = Math.cos(raan);
  const sinRaan = Math.sin(raan);
  
  // Aplicar rotaciones: R = Rz(raan) * Rx(inc) * Rz(argp) * r_perifocal
  // Primero Rz(argp)
  const x1 = cosArgp * r_perifocal.x - sinArgp * r_perifocal.y;
  const y1 = sinArgp * r_perifocal.x + cosArgp * r_perifocal.y;
  const z1 = r_perifocal.z;
  
  // Luego Rx(inc)
  const x2 = x1;
  const y2 = cosInc * y1 - sinInc * z1;
  const z2 = sinInc * y1 + cosInc * z1;
  
  // Finalmente Rz(raan)
  const x3 = cosRaan * x2 - sinRaan * y2;
  const y3 = sinRaan * x2 + cosRaan * y2;
  const z3 = z2;
  
  return new THREE.Vector3(x3, y3, z3); // Posición heliocéntrica en AU
}

// Función para calcular posición de la Tierra en fecha dada (órbita circular aproximada)
function getEarthPosition(date) {
  // Tierra: órbita circular de 1 AU, periodo 365.25 días
  // Anomalía media desde J2000 (1 Enero 2000, 12:00 UTC)
  const j2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (date.getTime() - j2000) / (1000 * 60 * 60 * 24);
  
  // Ángulo orbital (360° por año)
  const theta = (daysSinceJ2000 / 365.25) * 2 * Math.PI;
  
  // Posición en AU (órbita circular en plano eclíptico)
  return new THREE.Vector3(
    Math.cos(theta),   // x
    0,                 // y (plano eclíptico, sin inclinación)
    Math.sin(theta)    // z
  );
}

// ========== CALCULATE HELIOCENTRIC NEO POSITION ==========
function calculateNeoPosition(approach, index, total, neo) {
  // Intentar usar elementos orbitales Keplerianos si están disponibles
  if (neo && neo.orbital_data && neo.orbital_data.semi_major_axis) {
    // Usar anomalía media como aproximación de posición actual
    let trueAnomaly = 0;
    if (neo.orbital_data.mean_anomaly) {
      trueAnomaly = degToRad(parseFloat(neo.orbital_data.mean_anomaly));
    }
    
    // Calcular posición heliocéntrica en AU
    const helioPos = keplerianToHeliocentric(neo.orbital_data, trueAnomaly);
    
    // Escalar a unidades de escena (centrado en el Sol)
    return helioPos.multiplyScalar(state.AU_TO_SCENE);
  }
  
  // FALLBACK: Si no hay datos orbitales, calcular posición aproximada
  // basada en la distancia de aproximación a la Tierra
  
  const approachDate = new Date(approach.close_approach_date_full);
  const missDistanceLunar = parseFloat(approach.miss_distance.lunar);
  const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
  
  // Obtener posición de la Tierra en la fecha de aproximación
  const earthPosAU = getEarthPosition(approachDate);
  const earthPosScene = earthPosAU.clone().multiplyScalar(state.AU_TO_SCENE);
  
  // Distancia desde la Tierra (en unidades de escena)
  let distanceFromEarth;
  
  const earthRadius = 1; // Radio de la Tierra en escena (1 unidad)
  
  if (missDistanceLunar < 1) {
    distanceFromEarth = earthRadius + (missDistanceLunar * 2);
  } else if (missDistanceLunar < 10) {
    distanceFromEarth = earthRadius + 2 + (missDistanceLunar * 0.5);
  } else {
    distanceFromEarth = earthRadius + 7 + Math.log10(missDistanceLunar) * 2;
  }
  
  // Calcular ángulos basados en fecha y velocidad
  const dayOfYear = getDayOfYear(approachDate);
  const hour = approachDate.getHours();
  
  const longitudeDeg = ((dayOfYear / 365) * 360 + (hour / 24) * 15) % 360;
  const longitude = degToRad(longitudeDeg);
  
  const velocityNormalized = Math.min(velocityKmS / 50, 1);
  const latitudeVariation = (Math.random() - 0.5) * 2;
  const latitudeDeg = latitudeVariation * 30 * velocityNormalized;
  const latitude = degToRad(latitudeDeg);
  
  const spreadOffset = (index / total) * Math.PI * 0.1;
  const longitudeFinal = longitude + spreadOffset;
  
  // Posición relativa a la Tierra
  const x = distanceFromEarth * Math.cos(latitude) * Math.cos(longitudeFinal);
  const y = distanceFromEarth * Math.sin(latitude);
  const z = distanceFromEarth * Math.cos(latitude) * Math.sin(longitudeFinal);
  
  const relativePos = new THREE.Vector3(x, y, z);
  
  // Posición absoluta (heliocéntrica) = Posición Tierra + Posición relativa
  return earthPosScene.clone().add(relativePos);
}

// Helper: Get day of year from date
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// ========== CREATE KEPLERIAN ORBIT LINE (HELIOCENTRIC) ==========
function createKeplerianOrbitLine(neo, approach, currentPosition, isHazardous) {
  // Verificar si tenemos datos orbitales
  if (!neo.orbital_data || !neo.orbital_data.semi_major_axis) {
    console.warn('No orbital data available for NEO:', neo.name);
    return createSimpleTrail(approach, currentPosition, isHazardous);
  }
  
  const orbitalData = neo.orbital_data;
  const points = [];
  
  // Generar órbita completa alrededor del Sol (heliocéntrica)
  const numPoints = 256; // Más puntos para órbitas más suaves y detalladas (antes 128)
  
  // Calcular anomalía verdadera aproximada
  let centralAnomaly = 0;
  if (orbitalData.mean_anomaly) {
    centralAnomaly = degToRad(parseFloat(orbitalData.mean_anomaly));
  }
  
  // Dibujar órbita completa (0° a 360°)
  for (let i = 0; i <= numPoints; i++) {
    const trueAnomaly = (i / numPoints) * Math.PI * 2; // 0 a 2π
    
    // Calcular posición heliocéntrica en AU
    const helioPos = keplerianToHeliocentric(orbitalData, trueAnomaly);
    
    // Escalar a unidades de escena (centrado en el Sol)
    const scenePos = helioPos.clone().multiplyScalar(state.AU_TO_SCENE);
    
    points.push(scenePos);
  }
  
  // Crear geometría de la órbita
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: isHazardous ? 0xff4444 : 0x44ff44,
    transparent: true,
    opacity: 0.7,        // Más visible (antes 0.5)
    linewidth: 2         // Líneas más gruesas (antes 1)
  });
  
  const orbitLine = new THREE.Line(geometry, material);
  
  console.log(`  Órbita Kepleriana heliocéntrica: ${neo.name} (a=${orbitalData.semi_major_axis} AU, e=${orbitalData.eccentricity})`);
  
  return orbitLine;
}

// Fallback: Crear estela simple si no hay datos orbitales (heliocéntrica)
function createSimpleTrail(approach, currentPosition, isHazardous) {
  const points = [];
  const velocityKmS = parseFloat(approach.relative_velocity.kilometers_per_second);
  
  // Dirección desde el espacio profundo hacia posición actual
  const directionFromSun = currentPosition.clone().normalize();
  
  const maxTrailDistance = state.AU_TO_SCENE * 1.5; // 1.5 AU de estela (antes 0.5 AU) - Mucho más larga
  const velocityFactor = Math.min(velocityKmS / 20, 1);
  
  const trailLength = maxTrailDistance * velocityFactor;
  const segments = 40; // Más segmentos para estela más suave (antes 20)
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const trailOffset = trailLength * (1 - t);
    const trailPoint = directionFromSun.clone()
      .multiplyScalar(currentPosition.length() + trailOffset);
    
    // Pequeña curvatura para simular gravedad
    const curvature = Math.sin(t * Math.PI) * 2.0; // Curvatura más pronunciada (antes 0.5)
    trailPoint.y += curvature;
    
    points.push(trailPoint);
  }
  
  points.push(currentPosition.clone());
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: isHazardous ? 0xff4444 : 0x44ff44,
    transparent: true,
    opacity: 0.7,        // Más visible (antes 0.65)
    linewidth: 2         // Líneas más gruesas (antes 1)
  });
  
  return new THREE.Line(geometry, material);
}

// ========== CREATE TRAJECTORY TRAIL (ESTELA DESDE POSICIÓN ORBITAL) ==========
function createRealOrbitLine(approach, currentPosition, isHazardous, neo) {
  // Intentar usar órbita Kepleriana si está disponible
  if (neo && neo.orbital_data && neo.orbital_data.semi_major_axis) {
    return createKeplerianOrbitLine(neo, approach, currentPosition, isHazardous);
  }
  
  // Fallback a estela simple
  return createSimpleTrail(approach, currentPosition, isHazardous);
}

// ========== ANIMATION LOOP (OPTIMIZED) ==========
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
  state.animationId = requestAnimationFrame(animate);
  
  // Throttle to target FPS for better performance
  if (currentTime - lastTime < frameInterval) return;
  lastTime = currentTime;

  // Rotate Earth slowly on its axis
  if (state.isRotating && state.earth) {
    state.earth.rotation.y += 0.0005;
    
    // Rotate clouds slightly faster for realism
    if (state.earth.userData.clouds) {
      state.earth.userData.clouds.rotation.y += 0.0007;
    }
    
    // Update directional light to always point at Earth
    if (state.sun && state.sun.userData.directionalLight) {
      const dirLight = state.sun.userData.directionalLight;
      dirLight.target.position.copy(state.earth.position);
      dirLight.target.updateMatrixWorld();
    }
  }
  
  // Rotate Sun slowly (visual effect)
  if (state.sun) {
    state.sun.rotation.y += 0.0001;
  }

  // Mantener NEOs en posición fija (sin movimiento orbital)
  // Rotación MUY sutil (casi imperceptible)
  state.neoObjects.forEach((obj, idx) => {
    obj.mesh.rotation.y += 0.0003; // Muy lenta
    obj.mesh.rotation.x += 0.0002;
  });
  
  // Animar anillo de selección (efecto pulsante)
  if (state.selectedNeo && state.selectedNeo.selectionRing) {
    const ring = state.selectedNeo.selectionRing;
    const time = Date.now() * 0.002;

    // Pulsación de tamaño
    const scale = 1.0 + Math.sin(time) * 0.3;
    ring.scale.set(scale, scale, 1);

    // Pulsación de opacidad
    ring.material.opacity = 0.5 + Math.sin(time) * 0.3;

    // Rotación continua
    ring.rotation.z += 0.02;

    // Hacer que el anillo siempre mire a la cámara
    ring.lookAt(state.camera.position);

    // Animar brillo (glow) si existe
    if (state.selectedNeo.selectionGlow) {
      const glow = state.selectedNeo.selectionGlow;
      // Opacidad y escala pulsante para efecto centellante
      glow.material.opacity = 0.35 + Math.abs(Math.sin(time * 1.8)) * 0.45; // ~0.35-0.8
      const gscale = 1.0 + Math.sin(time * 2.2) * 0.12;
      glow.scale.set(gscale, gscale, gscale);
    }
  }

  state.controls.update();
  state.renderer.render(state.scene, state.camera);
}

// ========== EVENT HANDLERS ==========
function setupEventListeners() {
  // Date buttons
  document.getElementById('btn-today').addEventListener('click', () => loadDateRange(0, 0));
  document.getElementById('btn-7d').addEventListener('click', () => loadDateRange(0, 7));
  document.getElementById('btn-30d').addEventListener('click', () => loadDateRange(0, 30));
  document.getElementById('btn-load').addEventListener('click', loadCustomDateRange);

  // Filter checkboxes
  document.getElementById('filter-hazardous').addEventListener('change', applyFilters);
  document.getElementById('filter-all').addEventListener('change', applyFilters);

  // Viewer controls
  document.getElementById('btn-reset-view').addEventListener('click', resetView);
  document.getElementById('btn-toggle-rotation').addEventListener('click', toggleRotation);
  document.getElementById('btn-toggle-orbits').addEventListener('click', toggleOrbits);

  // Click detection on canvas
  const canvas = document.getElementById('earth-canvas');
  canvas.addEventListener('click', onCanvasClick);
}

// ========== DATE HANDLING ==========
function setDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  document.getElementById('neo-start').valueAsDate = today;
  document.getElementById('neo-end').valueAsDate = tomorrow;
}

function loadDateRange(startOffset, endOffset) {
  const start = new Date();
  start.setDate(start.getDate() + startOffset);
  
  const end = new Date();
  end.setDate(end.getDate() + endOffset);

  document.getElementById('neo-start').valueAsDate = start;
  document.getElementById('neo-end').valueAsDate = end;

  loadNeoData(formatDate(start), formatDate(end));
}

function loadCustomDateRange() {
  const startDate = document.getElementById('neo-start').value;
  const endDate = document.getElementById('neo-end').value;

  if (!startDate || !endDate) {
    updateStatus('Por favor selecciona ambas fechas.');
    return;
  }

  loadNeoData(startDate, endDate);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// ========== API CALLS ==========
async function loadNeoData(startDate, endDate) {
  updateStatus('🔄 Cargando datos de NEOs...');

  try {
    // Use port 5173 (or check process.env.PORT)
    const response = await fetch(`http://23.21.211.125:5173/api/neo/feed?start_date=${startDate}&end_date=${endDate}`);
    
    if (!response.ok) throw new Error('Error al cargar datos');

    const data = await response.json();
    
    // Parse NEO data
    const neosArray = [];
    Object.values(data.near_earth_objects).forEach(dateNeos => {
      neosArray.push(...dateNeos);
    });

    state.neos = neosArray;
    applyFilters();

  } catch (error) {
    console.error('Error loading NEO data:', error);
    updateStatus('❌ Error al cargar datos. Verifica que el servidor esté corriendo en puerto 5173.');
  }
}

// ========== FILTERS ==========
function applyFilters() {
  const showHazardous = document.getElementById('filter-hazardous').checked;
  const showAll = document.getElementById('filter-all').checked;

  let filtered = state.neos;

  if (showHazardous && !showAll) {
    filtered = state.neos.filter(neo => neo.is_potentially_hazardous_asteroid);
  } else if (!showHazardous && !showAll) {
    filtered = [];
  }

  createNeoObjects(filtered);
}

// ========== VIEWER CONTROLS ==========
function resetView() {
  // Preferir vista centrada en la Tierra
  if (state.earth) {
    const earthPos = state.earth.position.clone();
    const camOffset = new THREE.Vector3(0, 3, 8);
    state.camera.position.copy(earthPos).add(camOffset);
    state.controls.target.copy(earthPos);
  } else {
    // Fallback heliocéntrico
    state.camera.position.set(0, 50, 100);
    state.controls.target.set(0, 0, 0);
  }
  state.controls.reset();
}

function toggleRotation() {
  state.isRotating = !state.isRotating;
  const btn = document.getElementById('btn-toggle-rotation');
  btn.classList.toggle('active', state.isRotating);
}

function toggleOrbits() {
  state.showOrbits = !state.showOrbits;
  const btn = document.getElementById('btn-toggle-orbits');
  btn.classList.toggle('active', state.showOrbits);

  // Recreate NEOs with/without orbits
  const filtered = getFilteredNeos();
  createNeoObjects(filtered);
}

function getFilteredNeos() {
  const showHazardous = document.getElementById('filter-hazardous').checked;
  const showAll = document.getElementById('filter-all').checked;

  if (showHazardous && !showAll) {
    return state.neos.filter(neo => neo.is_potentially_hazardous_asteroid);
  } else if (!showHazardous && !showAll) {
    return [];
  }
  return state.neos;
}

// ========== CLICK DETECTION ==========
function onCanvasClick(event) {
  const canvas = document.getElementById('earth-canvas');
  const rect = canvas.getBoundingClientRect();
  
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, state.camera);

  // Use hitboxes for easier clicking
  const hitBoxes = state.neoObjects.map(obj => obj.hitBox).filter(Boolean);
  const intersects = raycaster.intersectObjects(hitBoxes);

  if (intersects.length > 0) {
    const clickedBox = intersects[0].object;
    const neoData = clickedBox.userData.neo;
    const index = clickedBox.userData.index;
    console.debug('[onCanvasClick] intersected hitbox index=', index, 'neo=', neoData?.name || neoData?.id);
    // Usar la misma función que el click en la lista
    window.selectNeoFromList(index);
  }
}

// ========== UI UPDATES ==========
function displayNeoList(neos) {
  const panel = document.getElementById('neo-details-panel');
  const summary = document.getElementById('info-summary');
  
  if (!neos || neos.length === 0) {
    summary.innerHTML = '';
    panel.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🌌</div>
        <p>No se encontraron NEOs para este rango de fechas.</p>
      </div>
    `;
    return;
  }

  // Summary stats
  const hazardous = neos.filter(n => n.is_potentially_hazardous_asteroid).length;
  const safe = neos.length - hazardous;
  
  summary.innerHTML = `
    <div class="summary-stats">
      <div class="summary-stat hazardous">
        <span class="summary-icon">🔴</span>
        <span class="summary-value">${hazardous}</span>
        <span class="summary-label">Peligrosos</span>
      </div>
      <div class="summary-stat safe">
        <span class="summary-icon">🟢</span>
        <span class="summary-value">${safe}</span>
        <span class="summary-label">Seguros</span>
      </div>
      <div class="summary-stat total">
        <span class="summary-icon">📊</span>
        <span class="summary-value">${neos.length}</span>
        <span class="summary-label">Total</span>
      </div>
    </div>
  `;

  let html = '<div class="neos-list">';
  
  neos.forEach((neo, index) => {
    const approach = neo.close_approach_data[0];
    const isHazardous = neo.is_potentially_hazardous_asteroid;
    const diameter = ((neo.estimated_diameter.kilometers.estimated_diameter_min + 
                      neo.estimated_diameter.kilometers.estimated_diameter_max) / 2).toFixed(3);
    const distance = parseFloat(approach.miss_distance.lunar).toFixed(2);
    const velocity = parseFloat(approach.relative_velocity.kilometers_per_second).toFixed(2);
    const date = new Date(approach.close_approach_date_full).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // use a stable id for selection to avoid index mismatches
    const safeId = (neo.id || neo.neo_reference_id || neo.name || ('neo_' + index)).toString().replace(/'/g, "\\'");
    html += `
      <div class="neo-list-item ${isHazardous ? 'hazardous' : 'safe'}" data-index="${index}" data-neo-id='${safeId}'>
        <div class="neo-list-header">
          <span class="neo-list-icon">${isHazardous ? '🔴' : '🟢'}</span>
          <div class="neo-list-title">
            <h5>${neo.name.replace(/[()]/g, '')}</h5>
            <span class="neo-list-subtitle">${isHazardous ? 'Potencialmente Peligroso' : 'No Peligroso'} · ${date}</span>
          </div>
        </div>
        <div class="neo-list-stats">
          <div class="neo-list-stat">
            <span class="stat-icon">📏</span>
            <span>${diameter} km</span>
          </div>
          <div class="neo-list-stat">
            <span class="stat-icon">🌍</span>
            <span>${distance} LD</span>
          </div>
          <div class="neo-list-stat">
            <span class="stat-icon">⚡</span>
            <span>${velocity} km/s</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  panel.innerHTML = html;
  // Attach click listeners programmatically (more robust than inline onclick)
  panel.querySelectorAll('.neo-list-item').forEach(item => {
    item.addEventListener('click', (ev) => {
      const id = item.dataset.neoId || item.dataset.index;
      if (id) window.selectNeoById(id);
    });
  });
  // Re-render history if open
  renderNeoHistory();
}

// Global function for onclick
window.selectNeoFromList = function(index) {
  console.debug('[selectNeoFromList] requested index:', index, 'state.neoObjects.length=', state.neoObjects.length);
  const neoObj = state.neoObjects[index];
  if (!neoObj) {
    console.warn('[selectNeoFromList] no neoObj found at index', index);
    return;
  }

  // Deseleccionar NEO anterior (si tiene mesh/material válidos)
  if (state.selectedNeo && state.selectedNeo.mesh && state.selectedNeo.mesh.material) {
    try {
      // Restaurar color original
      const wasHazardous = state.selectedNeo.neo?.is_potentially_hazardous_asteroid;
      const origColor = wasHazardous ? 0xff4757 : 0x2ed573;
      state.selectedNeo.mesh.material.color.setHex(origColor);
      if (state.selectedNeo.mesh.material.emissive) state.selectedNeo.mesh.material.emissive.setHex(origColor);
      state.selectedNeo.mesh.material.emissiveIntensity = 0.7;
    } catch (e) {
      console.warn('[selectNeoFromList] error restoring previous selection material:', e);
    }

    // Remover anillo de selección si existe
    if (state.selectedNeo.selectionRing) {
      state.scene.remove(state.selectedNeo.selectionRing);
      state.selectedNeo.selectionRing = null;
    }
    // Remover brillo (glow) si existe
    if (state.selectedNeo.selectionGlow) {
      state.scene.remove(state.selectedNeo.selectionGlow);
      state.selectedNeo.selectionGlow = null;
    }
    // Restaurar escala si fue escalado
    if (state.selectedNeo.mesh.userData && state.selectedNeo.mesh.userData._originalScale) {
      state.selectedNeo.mesh.scale.copy(state.selectedNeo.mesh.userData._originalScale);
      state.selectedNeo.mesh.userData._originalScale = null;
    }
  }

  // Seleccionar nuevo NEO
  state.selectedNeo = neoObj;

  // Aplicar resaltado solo si el mesh y material existen
  if (neoObj.mesh && neoObj.mesh.material) {
    try {
      neoObj.mesh.material.color.setHex(0xffff00);
      if (neoObj.mesh.material.emissive) neoObj.mesh.material.emissive.setHex(0xffaa00);
      neoObj.mesh.material.emissiveIntensity = 1.5;
  // Guardar y aplicar escala para destacar el objeto (más conservador)
  if (!neoObj.mesh.userData._originalScale) neoObj.mesh.userData._originalScale = neoObj.mesh.scale.clone();
  // Reduce scale multiplier from 1.6 -> 1.25 for subtler emphasis
  neoObj.mesh.scale.multiplyScalar(1.25);
    } catch (e) {
      console.warn('[selectNeoFromList] error applying selection material/scale:', e);
    }
  } else {
    console.warn('[selectNeoFromList] neoObj.mesh or material missing for index', index, neoObj);
  }
  
  // Crear anillo pulsante y glow alrededor del NEO seleccionado solo si mesh existe
  if (neoObj.mesh) {
    // Ring size proportional to object size
  // Smaller ring sizes to be less obtrusive
  const ringOuter = Math.max(neoObj.mesh.geometry.parameters.radius * 1.8, 0.25);
  const ringInner = Math.max(ringOuter - 0.06, 0.16);
    const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(neoObj.mesh.position);
    state.scene.add(ring);
    neoObj.selectionRing = ring;

    // Crear glow
    // Slightly smaller glow and lower base opacity
    const glowRadius = Math.max(neoObj.mesh.geometry.parameters.radius * 1.6, 0.35);
    const glowGeo = new THREE.SphereGeometry(glowRadius, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffff66, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(neoObj.mesh.position);
    state.scene.add(glow);
    neoObj.selectionGlow = glow;
  }
  
  // Focus camera on NEO
  const targetPos = neoObj.mesh.position;
  // Smoothly move camera to a position that frames the NEO while keeping Earth in view
  // Compute vector from Earth to NEO and place camera slightly offset along that vector
  const earthPos = state.earth ? state.earth.position.clone() : new THREE.Vector3(0,0,0);
  const dir = new THREE.Vector3().subVectors(targetPos, earthPos).normalize();
  const distanceToNeo = Math.max(3, neoObj.mesh.geometry.parameters.radius * 6);
  const newCamPos = targetPos.clone().add(dir.clone().multiplyScalar(distanceToNeo));
  // If dir is zero (on Earth), fallback to small offset
  if (newCamPos.length() === 0) newCamPos.set(targetPos.x + 3, targetPos.y + 3, targetPos.z + 6);
  state.camera.position.copy(newCamPos);
  state.controls.target.copy(targetPos);
  state.controls.update();
  
  // Show details
  displayNeoDetails(neoObj.neo, index);
  highlightNeoInList(index);
};

// New helper: select by stable id (id, neo_reference_id or name)
window.selectNeoById = function(id) {
  if (!id) return;
  console.debug('[selectNeoById] id:', id, 'state.neoObjects.length=', state.neoObjects.length);
  // Find index in state.neoObjects by matching known identifiers
  const idx = state.neoObjects.findIndex(o => {
    const n = o.neo || {};
    return (n.id && String(n.id) === String(id))
      || (n.neo_reference_id && String(n.neo_reference_id) === String(id))
      || (n.name && String(n.name) === String(id));
  });
  if (idx === -1) {
    console.warn('[selectNeoById] could not find NEO with id', id);
    return;
  }
  // Call existing index-based selector
  window.selectNeoFromList(idx);
};

function highlightNeoInList(index) {
  // Remove previous highlights
  document.querySelectorAll('.neo-list-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Highlight selected
  const item = document.querySelector(`.neo-list-item[data-index="${index}"]`);
  if (item) {
    item.classList.add('selected');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function displayNeoDetails(neo, index) {
  highlightNeoInList(index);
  // Ensure there is a container element `#neo-detail-extra` placed in a sensible host.
  // Preferred hosts in order: #neo-details-panel, #neos-info, .neos-info, .container, document.body
  let target = document.getElementById('neo-detail-extra');
  const preferredHosts = [
    document.getElementById('neo-details-panel'),
    document.getElementById('neos-info'),
    document.querySelector('.neos-info'),
    document.querySelector('.container'),
    document.body
  ];

  // If the element already exists but is not inside a preferred host, move it to the best available host.
  if (target) {
    const currentParent = target.parentElement;
    const bestHost = preferredHosts.find(h => h && (!currentParent || !h.contains(currentParent)) );
    if (bestHost && currentParent !== bestHost) {
      bestHost.appendChild(target);
    }
  } else {
    // Create it and append to the first available preferred host
    const extra = document.createElement('div');
    extra.id = 'neo-detail-extra';
    extra.style.marginTop = '.75rem';
    const host = preferredHosts.find(h => h) || document.body;
    host.appendChild(extra);
    target = extra;
  }
  // If this NEO should be shown outside the regular detail card (e.g. 2021 SZ4), render an external info box
  const outsideId = 'neo-outside-info';
  const showOutside = typeof neo.name === 'string' && /2021\s*SZ4/i.test(neo.name);
  const outsideExisting = document.getElementById(outsideId);
  if (showOutside) {
    // Build external info content and place it above the details panel
    const approach = neo.close_approach_data && neo.close_approach_data[0] || {};
    const missLunar = approach.miss_distance? Number(approach.miss_distance.lunar).toFixed(2):'?';
    const vel = approach.relative_velocity? Number(approach.relative_velocity.kilometers_per_second).toFixed(2):'?';
    const dia = (neo.estimated_diameter?.meters?.estimated_diameter_max||0).toFixed(0);
    const date = approach.close_approach_date_full || approach.close_approach_date || 'N/D';
    const html = `
      <div style="display:flex;flex-direction:column;gap:.25rem;">
        <strong style="font-size:1rem;">${neo.name.replace(/[()]/g,'')}</strong>
        <div style="font-size:.85rem;color:var(--color-text-secondary);">Fecha: ${date}</div>
        <div style="font-size:.85rem;color:var(--color-text-secondary);">Distancia: ${missLunar} LD</div>
        <div style="font-size:.85rem;color:var(--color-text-secondary);">Velocidad: ${vel} km/s</div>
        <div style="font-size:.85rem;color:var(--color-text-secondary);">Diámetro: ${dia} m</div>
        <div style="font-size:.85rem;color:var(--color-text-secondary);">Peligroso: ${neo.is_potentially_hazardous_asteroid? 'Sí':'No'}</div>
      </div>`;
    if (outsideExisting) {
      outsideExisting.innerHTML = html;
    } else {
      const summary = document.getElementById('info-summary');
      const box = document.createElement('div');
      box.id = outsideId;
      box.style.cssText = 'margin-bottom:.6rem;padding:.6rem;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,0.02);';
      box.innerHTML = html;
      if (summary && summary.parentElement) summary.parentElement.insertBefore(box, summary);
      else document.body.insertBefore(box, document.body.firstChild);
    }
    // Do not render inside the regular detail card for this NEO
    const container = document.getElementById('neo-detail-extra');
    if (container) container.innerHTML = '';
    return;
  } else {
    // Remove external box if present for other NEOs
    if (outsideExisting && outsideExisting.parentElement) outsideExisting.parentElement.removeChild(outsideExisting);
  }
  const approach = neo.close_approach_data && neo.close_approach_data[0] || {};
  const missLunar = approach.miss_distance? Number(approach.miss_distance.lunar).toFixed(2):'?';
  const vel = approach.relative_velocity? Number(approach.relative_velocity.kilometers_per_second).toFixed(2):'?';
  const dia = (neo.estimated_diameter?.meters?.estimated_diameter_max||0).toFixed(0);
  const date = approach.close_approach_date_full || approach.close_approach_date || 'N/D';
  const container = document.getElementById('neo-detail-extra');
  container.innerHTML = `
    <div style="border:1px solid rgba(255,255,255,.12);padding:.6rem .7rem;border-radius:8px;background:rgba(255,255,255,.04);">
      <div style="display:flex;align-items:flex-start;gap:.75rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:220px;">
          <h4 style="margin:.1rem 0 .4rem;font-size:.85rem;">${neo.name.replace(/[()]/g,'')}</h4>
          <p style="margin:.15rem 0;font-size:.6rem;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin:.15rem 0;font-size:.6rem;"><strong>Distancia:</strong> ${missLunar} LD</p>
          <p style="margin:.15rem 0;font-size:.6rem;"><strong>Velocidad:</strong> ${vel} km/s</p>
          <p style="margin:.15rem 0;font-size:.6rem;"><strong>Diámetro:</strong> ${dia} m</p>
          <p style="margin:.15rem 0;font-size:.6rem;"><strong>Peligroso:</strong> ${neo.is_potentially_hazardous_asteroid? 'Sí':'No'}</p>
          ${neo.nasa_jpl_url? `<p style=\"margin:.3rem 0 .2rem;\"><a class=\"gst-source-link\" href=\"${neo.nasa_jpl_url}\" target=\"_blank\" rel=\"noopener\">🔗 Ficha JPL</a></p>`:''}
        </div>
        <div class="inline-action-bar" style="flex:1;justify-content:flex-end;min-width:120px;">
          <button id="neo-save-inline" class="quick-load-btn btn-compact" style="font-size:.55rem;">💾 Guardar</button>
        </div>
      </div>
    </div>`;
  container.querySelector('#neo-save-inline')?.addEventListener('click', ()=> addCurrentNEOToHistory(neo));
}

// ================= HISTORY (NEO) =================
const NEO_HISTORY_TYPE = 'neo';
let neoHistoryList, neoHistoryStatus, neoHistoryCollapsible;

function initNeoHistory(){
  if(document.getElementById('neo-history-wrapper')){
    neoHistoryList = document.getElementById('neo-history-list');
    neoHistoryStatus = document.getElementById('neo-history-status');
    neoHistoryCollapsible = document.getElementById('neo-history-panel');
    return;
  }
  const container = document.querySelector('.container') || document.body;
  // Asegurar título h1 al inicio
  let titleEl = document.getElementById('neo-page-title');
  if(!titleEl){
    titleEl = document.createElement('h1');
    titleEl.id = 'neo-page-title';
    titleEl.textContent = 'Near Earth Objects (NEOs)';
    titleEl.style.margin = '0 0 .65rem';
    container.prepend(titleEl);
  }
  const wrapper = document.createElement('div');
  wrapper.id = 'neo-history-wrapper';
  wrapper.style.margin = '0 0 1rem';
  wrapper.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.55rem;">
      <button id="neo-history-toggle" class="quick-load-btn btn-compact" style="font-size:.6rem;">🗂 Histórico <span id=\"neo-history-badge\" class=\"badge-count\" aria-label=\"NEOs guardados\">0</span></button>
      <button id="neo-history-clear" class="quick-load-btn btn-compact" style="font-size:.6rem;">🧹 Limpiar</button>
    </div>
    <div id="neo-history-panel" style="margin-top:.55rem;border:1px solid rgba(255,255,255,.12);padding:.6rem .65rem;border-radius:8px;background:rgba(255,255,255,.04);display:none;">
      <div id="neo-history-status" style="font-size:.55rem;opacity:.8;margin-bottom:.25rem;"></div>
      <ul id="neo-history-list" style="list-style:none;padding:0;margin:0;display:grid;gap:.35rem;"></ul>
      <div style="margin-top:.45rem;font-size:.5rem;opacity:.55;line-height:1.25;">Persistencia local (este navegador). Guarda distancia, velocidad, diámetro y fuente JPL.</div>
    </div>`;
  titleEl.insertAdjacentElement('afterend', wrapper);
  neoHistoryList = wrapper.querySelector('#neo-history-list');
  neoHistoryStatus = wrapper.querySelector('#neo-history-status');
  neoHistoryCollapsible = wrapper.querySelector('#neo-history-panel');
  const btnToggle = wrapper.querySelector('#neo-history-toggle');
  const btnClear = wrapper.querySelector('#neo-history-clear');
  btnToggle?.addEventListener('click',()=>{
    const open = neoHistoryCollapsible.style.display !== 'none';
    neoHistoryCollapsible.style.display = open? 'none':'block';
    if(!open) renderNeoHistory();
  });
  btnClear?.addEventListener('click',()=>{
    if(confirm('¿Vaciar histórico de NEOs?')){ clearType(NEO_HISTORY_TYPE); renderNeoHistory(); flashNeoHist('🗑 Vacío'); }
  });
}

function flashNeoHist(msg){
  if(!neoHistoryStatus) return; neoHistoryStatus.textContent=msg; neoHistoryStatus.style.transition='none'; neoHistoryStatus.style.opacity='1'; requestAnimationFrame(()=>{ neoHistoryStatus.style.transition='opacity .8s'; neoHistoryStatus.style.opacity='0'; });
}

function normalizeNEO(raw){
  const approach = raw.close_approach_data && raw.close_approach_data[0] || {};
  const date = approach.close_approach_date_full || approach.close_approach_date || raw.orbital_data?.first_observation_date || null;
  return {
    id: raw.id || raw.neo_reference_id || raw.name || Date.now()+'',
    type: NEO_HISTORY_TYPE,
    date,
    label: `${(raw.name||'NEO').replace(/[()]/g,'')} • ${approach.miss_distance? Number(approach.miss_distance.lunar).toFixed(2)+' LD':''}`,
    intensity: raw.estimated_diameter?.meters?.estimated_diameter_max || null,
    sourceUrl: raw.nasa_jpl_url || null,
    extra: {
      absMag: raw.absolute_magnitude_h,
      hazard: raw.is_potentially_hazardous_asteroid,
      missDistanceKm: approach.miss_distance?.kilometers,
      relativeVelocity: approach.relative_velocity?.kilometers_per_second
    },
    savedAt: Date.now()
  };
}

function renderNeoHistory(){
  if(!neoHistoryList) return; const items = getHistByType(NEO_HISTORY_TYPE); neoHistoryList.innerHTML='';
  const badge = document.getElementById('neo-history-badge'); if(badge) badge.textContent = items.length;
  if(items.length===0){ neoHistoryList.innerHTML='<li style="font-size:.55rem;opacity:.6;">(vacío)</li>'; return; }
  items.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  for(const item of items){
    const li = document.createElement('li');
    li.style.cssText='background:rgba(255,255,255,.05);padding:.45rem .55rem;border-radius:6px;display:flex;flex-direction:column;gap:.25rem;';
    li.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">
      <div style="flex:1;min-width:0;">
        <strong style="font-size:.6rem;">${(item.date||'').replace('T',' ').replace('Z','')}</strong>
        <div style="font-size:.55rem;line-height:1.15;margin-top:.15rem;">${item.label}</div>
        ${item.sourceUrl? `<a class=\"gst-source-link\" style=\"font-size:.5rem;\" href=\"${item.sourceUrl}\" target=\"_blank\" rel=\"noopener\">🔗 Fuente</a>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:.3rem;">
        <button class="quick-load-btn btn-compact" data-id="${item.id}" data-act="load" style="font-size:.5rem;">📥</button>
        <button class="quick-load-btn btn-compact" data-id="${item.id}" data-act="del" style="font-size:.5rem;">✖</button>
      </div>
    </div>`;
    neoHistoryList.appendChild(li);
  }
  neoHistoryList.querySelectorAll('button[data-act=del]').forEach(btn=> btn.addEventListener('click',()=>{ removeHistItem(btn.dataset.id); renderNeoHistory(); flashNeoHist('❌ Eliminado'); }));
  neoHistoryList.querySelectorAll('button[data-act=load]').forEach(btn=> btn.addEventListener('click',()=>{ const id=btn.dataset.id; const it=getHistByType(NEO_HISTORY_TYPE).find(x=>x.id===id); if(it){ flashNeoHist('📥 Cargado'); } }));
}

function addCurrentNEOToHistory(raw){ const added = addHistItem(normalizeNEO(raw)); flashNeoHist(added? '✅ Guardado':'ℹ️ Ya existía'); renderNeoHistory(); }

function updateStatus(message) {
  document.getElementById('neos-status').textContent = message;
}

function onWindowResize() {
  const container = document.getElementById('earth-canvas').parentElement;
  state.camera.aspect = container.clientWidth / container.clientHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(container.clientWidth, container.clientHeight);
}
