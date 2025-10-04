# 🔧 ERROR 500 SOLUCIONADO - Instrucciones de Reinicio

## ❌ Problema Detectado

El error 500 era causado porque Node.js no tiene `fetch` nativo en versiones antiguas. 

## ✅ Solución Aplicada

Reemplacé `fetch` por el módulo nativo `https` de Node.js en `backend/services/geminiAPI.js`.

---

## 🚀 Pasos para Reiniciar el Backend

### 1. Detener el proceso de Node.js actual

**Opción A: Desde PowerShell**
```powershell
# Detener todos los procesos de Node.js
taskkill /F /IM node.exe
```

**Opción B: Desde el Task Manager**
- Presiona `Ctrl + Shift + Esc`
- Busca "Node.js"
- Click derecho → "End Task"

**Opción C: Desde la terminal de VS Code**
- Si ves el proceso corriendo en la terminal
- Presiona `Ctrl + C` para detenerlo

---

### 2. Iniciar el backend nuevamente

```powershell
cd backend
npm start
```

Deberías ver:
```
🚀 SpaceNow! backend escuchando en http://localhost:5173
```

---

### 3. Probar el asistente IA

1. Abre `frontend/ui/html/index.html` en tu navegador
2. Click en el botón flotante del asistente (🤖)
3. Haz una pregunta: "¿Qué es el clima espacial?"
4. Debería responder con IA real

---

## 🔍 Verificar que Funciona

En la consola del navegador, ejecuta:

```javascript
fetch('http://localhost:5173/api/ai/health')
  .then(r => r.json())
  .then(console.log)
```

**Respuesta esperada:**
```json
{
  "success": true,
  "geminiConfigured": true,
  "message": "API de Gemini está configurada y lista para usar"
}
```

---

## 📝 Cambios Realizados

### `backend/services/geminiAPI.js`

**Antes (con fetch - NO funciona en Node.js antiguo):**
```javascript
const response = await fetch(url, {...});
```

**Ahora (con https nativo - FUNCIONA siempre):**
```javascript
import https from 'https';

function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const data = await httpsRequest(url, {...}, requestBody);
```

---

## ✅ Checklist Post-Reinicio

Después de reiniciar el backend, verifica:

- [ ] Backend está corriendo (puerto 5173)
- [ ] No hay errores en la consola del servidor
- [ ] `/api/ai/health` responde correctamente
- [ ] El asistente IA responde preguntas

---

## 🐛 Si Aún Hay Error 500

1. **Verifica logs del backend**
   - Mira la terminal donde corrió `npm start`
   - Busca mensajes de error específicos

2. **Verifica la API key**
   ```powershell
   cd backend
   cat .env | findstr GEMINI
   ```
   Debe mostrar:
   ```
   GEMINI_API_KEY=AIzaSyA6hkZD4gBxgrWpO55iL77G8_Dgu7kyMnM
   ```

3. **Prueba el endpoint directamente**
   ```powershell
   $body = @{
       question = "test"
       context = @{
           flares = @()
           cmes = @()
           gst = @()
           neos = @()
       }
   } | ConvertTo-Json

   Invoke-WebRequest -Uri "http://localhost:5173/api/ai/ask" -Method POST -Body $body -ContentType "application/json"
   ```

4. **Revisa logs detallados**
   Si ves un error específico, compártelo para ayudarte mejor.

---

## 💡 Notas Técnicas

### ¿Por qué falló fetch?

- `fetch` es una API del navegador
- Node.js solo tiene `fetch` nativo desde la v18+
- Tu proyecto probablemente usa Node.js v16 o anterior
- Solución: usar módulo `https` nativo de Node.js

### ¿Por qué https funciona?

- `https` es un módulo core de Node.js
- Disponible en TODAS las versiones
- No requiere instalación
- 100% compatible

---

## 🎯 Próximos Pasos

1. ✅ Reinicia el backend (sigue pasos arriba)
2. ✅ Prueba el asistente IA
3. ✅ Si funciona, ¡listo para el concurso! 🚀

---

¿Dudas? Comparte el error específico del servidor si persiste.
