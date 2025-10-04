# 🚨 SOLUCIÓN RÁPIDA - Error 500 del Backend

## ⚡ Solución en 3 Pasos

### Paso 1: Ejecutar Script de Reinicio

**Haz doble click en este archivo:**
```
REINICIAR-BACKEND.bat
```

Este script:
- ✅ Mata todos los procesos de Node.js
- ✅ Libera el puerto 5173
- ✅ Inicia el backend limpiamente

---

### Paso 2: Verificar que Inició Correctamente

En la ventana que se abre, deberías ver:
```
🚀 SpaceNow! backend escuchando en http://localhost:5173
```

Si ves este mensaje = ✅ **Backend funcionando**

---

### Paso 3: Probar el Asistente IA

1. Abre `frontend/ui/html/index.html`
2. Abre la consola del navegador (F12)
3. Ejecuta:
   ```javascript
   fetch('http://localhost:5173/api/ai/health')
     .then(r => r.json())
     .then(console.log)
   ```

**Esperado:**
```json
{
  "success": true,
  "geminiConfigured": true,
  "message": "API de Gemini está configurada y lista para usar"
}
```

4. Click en el botón del asistente (🤖)
5. Haz una pregunta
6. ¡Debería funcionar!

---

## 🔧 Si el Script No Funciona

### Opción Manual:

#### 1. Abrir Task Manager (Ctrl + Shift + Esc)
- Busca "Node.js" o "node.exe"
- Click derecho → End Task
- Cierra todos los procesos de Node

#### 2. Abrir PowerShell COMO ADMINISTRADOR
```powershell
# Ir a la carpeta del proyecto
cd C:\Users\docta\Desktop\Github\SpaceApp-NASA\backend

# Iniciar el backend
npm start
```

#### 3. Dejar la ventana abierta
- NO cierres la ventana de PowerShell
- Debe quedar corriendo el servidor

---

## 🐛 Troubleshooting

### Error: "Puerto 5173 ocupado"

**Solución A: Cambiar puerto**

Edita `backend/.env`:
```env
PORT=3000
```

Y en `frontend/ui/js/ai-assistant.js` línea 7:
```javascript
const BACKEND_URL = 'http://localhost:3000/api/ai';
```

**Solución B: Matar proceso manualmente**
```powershell
# Encuentra el PID del proceso
netstat -ano | findstr :5173

# Mata el proceso (reemplaza PID con el número que aparece)
taskkill /F /PID [PID]
```

---

### Error: "GEMINI_API_KEY no está configurada"

Verifica `backend/.env`:
```powershell
cat backend\.env
```

Debe contener:
```env
GEMINI_API_KEY=AIzaSyA6hkZD4gBxgrWpO55iL77G8_Dgu7kyMnM
```

---

### Error: "Cannot find module './routes/ai.js'"

Verifica que el archivo existe:
```powershell
ls backend\routes\ai.js
```

Si no existe, algo salió mal. Avísame.

---

### Backend inicia pero sigue error 500

Verifica los logs en la consola del backend. Busca líneas rojas con errores.

Los errores más comunes:
- `SyntaxError`: Error de sintaxis en el código
- `MODULE_NOT_FOUND`: Falta algún archivo
- `TypeError`: Problema con tipos de datos

Copia el error completo y avísame.

---

## 📋 Checklist Completo

Marca cada paso cuando lo completes:

- [ ] Script `REINICIAR-BACKEND.bat` ejecutado
- [ ] Backend muestra: "🚀 SpaceNow! backend escuchando..."
- [ ] `/api/ai/health` responde con `geminiConfigured: true`
- [ ] Frontend abre sin errores de consola
- [ ] Asistente IA abre al hacer click
- [ ] Asistente responde preguntas

---

## 🎯 Archivo del Script

El archivo `REINICIAR-BACKEND.bat` contiene:

```batch
@echo off
echo Deteniendo procesos de Node.js existentes...
taskkill /F /IM node.exe

echo Esperando 2 segundos...
timeout /t 2

echo Iniciando backend...
cd backend
npm start
```

---

## 💡 Tip: Mantén el Backend Corriendo

- NO cierres la ventana del backend mientras usas la aplicación
- Si necesitas detenerlo: `Ctrl + C` en la ventana
- Para reiniciar: ejecuta `REINICIAR-BACKEND.bat` nuevamente

---

## ✅ Una Vez Funcionando

Cuando todo esté funcionando:

1. **Prueba el asistente con diferentes preguntas:**
   - "¿Qué es el clima espacial?"
   - "¿Qué es una fulguración solar?"
   - "¿Hay peligro ahora?"
   - "Explícame las tormentas geomagnéticas"

2. **Verifica que use IA real:**
   - Las respuestas deben ser naturales y detalladas
   - Debe mencionar datos actuales si los hay
   - Debe usar emojis y comparaciones

3. **Prepara tu demo para el concurso** 🚀

---

¿Problemas? Ejecuta el script y comparte el mensaje de error exacto.
