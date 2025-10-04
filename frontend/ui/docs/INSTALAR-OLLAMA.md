# 🤖 Instalar Ollama - IA Local 100% Gratis

## 🎯 ¿Por qué Ollama?

✅ **100% GRATIS** - Sin límites, sin API keys
✅ **PRIVADO** - Tus datos nunca salen de tu PC
✅ **RÁPIDO** - Corre localmente, sin depender de internet
✅ **POTENTE** - Modelos como Llama 3, Mistral, Gemma
✅ **FÁCIL** - Instalación en 2 minutos

---

## 📥 Instalación (Windows)

### Paso 1: Descargar Ollama

**Visita:** https://ollama.com/download

Descarga el instalador para Windows (OllamaSetup.exe)

### Paso 2: Instalar

1. Ejecuta `OllamaSetup.exe`
2. Sigue el asistente (Next, Next, Install)
3. Espera 1-2 minutos

### Paso 3: Verificar Instalación

Abre PowerShell y ejecuta:

```powershell
ollama --version
```

Deberías ver algo como: `ollama version 0.x.x`

---

## 🚀 Descargar Modelo de IA

Ollama necesita descargar un modelo de IA la primera vez.

**Modelo recomendado para tu proyecto:**

```powershell
ollama pull llama3.2:3b
```

Este comando descarga Llama 3.2 (3 mil millones de parámetros):
- **Tamaño:** ~2GB
- **Velocidad:** Muy rápido
- **Calidad:** Excelente para educación
- **Requisitos:** 8GB RAM mínimo

### Modelos alternativos:

#### Si tu PC tiene poca RAM (4-8GB):
```powershell
ollama pull phi3:mini
```
- Tamaño: 2.3GB
- Más ligero y rápido

#### Si quieres más calidad (PC potente, 16GB+ RAM):
```powershell
ollama pull llama3.2:7b
```
- Tamaño: 4.7GB
- Respuestas más detalladas

---

## ✅ Probar que Funciona

### Opción 1: Desde PowerShell

```powershell
ollama run llama3.2:3b
```

Escribe una pregunta en inglés:
```
>>> What is space weather?
```

Si responde, ¡funciona! Presiona `Ctrl + D` para salir.

### Opción 2: Desde tu Backend

```powershell
cd C:\Users\docta\Desktop\Github\SpaceApp-NASA\backend
node test-ollama.js
```

---

## 🔧 Configuración Automática

Ollama corre automáticamente en segundo plano después de instalarse.

**Puerto por defecto:** `http://localhost:11434`

**Verifica que esté corriendo:**

```powershell
curl http://localhost:11434/api/tags
```

Si responde con JSON, está funcionando.

---

## 🎯 Integración con tu Proyecto

Tu backend **YA ESTÁ CONFIGURADO** para usar Ollama:

1. **Prioridad 1:** Intenta Ollama (local, gratis)
2. **Prioridad 2:** Si Ollama no está, usa Gemini (cloud)

### Flujo automático:

```
Usuario pregunta
    ↓
Backend intenta Ollama (localhost:11434)
    ↓
¿Ollama responde?
    SÍ → Usa respuesta de Ollama ✅
    NO → Intenta Gemini (si hay API key) ✅
```

---

## 🚀 Cómo Usar

### 1. Asegúrate que Ollama esté corriendo

```powershell
# Verificar servicio
Get-Process ollama

# Si no está corriendo, iniciarlo
ollama serve
```

### 2. Inicia tu backend

```powershell
cd backend
npm run dev
```

### 3. Usa el asistente

Abre `frontend/ui/html/index.html` y haz preguntas al chatbot.

---

## 📊 Comparación de Opciones

| Característica | Ollama (Local) | Gemini (Cloud) |
|----------------|----------------|----------------|
| **Costo** | 100% Gratis | Gratis (límites) |
| **Velocidad** | Muy rápido | Depende de internet |
| **Privacidad** | 100% privado | Datos en la nube |
| **Límites** | Sin límites | 15 req/min |
| **Requisitos** | 8GB RAM | API key |
| **Internet** | No necesario | Necesario |
| **Setup** | 5 minutos | 2 minutos |

---

## 💡 Comandos Útiles de Ollama

### Ver modelos instalados:
```powershell
ollama list
```

### Descargar otro modelo:
```powershell
ollama pull mistral
ollama pull gemma2
```

### Eliminar un modelo (liberar espacio):
```powershell
ollama rm llama3.2:3b
```

### Ver uso de memoria:
```powershell
ollama ps
```

### Detener Ollama:
```powershell
ollama stop
```

---

## 🐛 Solución de Problemas

### "ollama: command not found"

Reinicia PowerShell después de instalar.

### "connection refused"

Ollama no está corriendo. Ejecuta:
```powershell
ollama serve
```

### Respuestas muy lentas

Tu modelo es muy pesado para tu PC. Usa uno más ligero:
```powershell
ollama pull phi3:mini
```

Y actualiza el modelo en `backend/services/geminiAPI.js` línea 9:
```javascript
const OLLAMA_MODEL = 'phi3:mini';
```

### Error de memoria

Tu PC no tiene suficiente RAM. Opciones:
1. Cierra otras aplicaciones
2. Usa un modelo más pequeño (`phi3:mini`)
3. Usa Gemini como fallback

---

## ✅ Checklist de Instalación

- [ ] Ollama descargado desde https://ollama.com/download
- [ ] Ollama instalado
- [ ] Comando `ollama --version` funciona
- [ ] Modelo descargado: `ollama pull llama3.2:3b`
- [ ] Ollama corriendo: `ollama serve`
- [ ] Backend reiniciado
- [ ] Asistente probado y funcionando

---

## 🎓 Para el Concurso NASA

**Menciona esto en tu presentación:**

> "Nuestro asistente educativo usa **Ollama**, una IA de código abierto que corre localmente, garantizando privacidad y sin costos. Como fallback, también soporta Google Gemini en la nube."

**Ventajas para el concurso:**
- ✅ Sin dependencias de servicios externos
- ✅ Funciona sin internet (después de instalar)
- ✅ 100% gratuito y escalable
- ✅ Privacidad de datos garantizada

---

## 🚀 Próximos Pasos

1. ✅ Instala Ollama
2. ✅ Descarga el modelo (`llama3.2:3b`)
3. ✅ Reinicia el backend
4. ✅ Prueba el asistente
5. ✅ ¡Listo para el concurso! 🌟

---

## 📚 Recursos

- **Web oficial:** https://ollama.com
- **Modelos disponibles:** https://ollama.com/library
- **Documentación:** https://github.com/ollama/ollama/blob/main/docs/api.md

---

¿Problemas? Comparte el error específico y te ayudo. 🤝
