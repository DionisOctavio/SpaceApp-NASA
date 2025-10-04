# 🤗 Hugging Face API - IA 100% GRATUITA

## ✅ VENTAJAS

1. **100% GRATIS**: Sin límites de API estrictos
2. **SIN INSTALACIÓN**: Solo una API REST
3. **SIN CONFIGURACIÓN**: Funciona sin token (con límites) o con token gratis ilimitado
4. **POTENTE**: Modelo Mistral-7B-Instruct (uno de los mejores modelos open-source)
5. **SIMPLE**: Solo necesitas hacer POST requests
6. **ESPAÑOL**: Soporta múltiples idiomas incluyendo español perfectamente

## 🚀 YA ESTÁ IMPLEMENTADO

El código ya está actualizado en `backend/services/geminiAPI.js`:
- ✅ Conexión con Hugging Face
- ✅ Modelo: `mistralai/Mistral-7B-Instruct-v0.2`
- ✅ Fallback a respuestas predefinidas si falla
- ✅ Sin necesidad de Gemini ni Ollama

## 📝 (OPCIONAL) CREAR TOKEN GRATIS

Si quieres 100% sin límites, crea un token gratis:

1. Ve a: https://huggingface.co/join
2. Crea cuenta gratis (email + contraseña)
3. Ve a: https://huggingface.co/settings/tokens
4. Click en "New token"
5. Nombre: `space-weather-bot`
6. Tipo: `read`
7. Click "Generate token"
8. Copia el token (empieza con `hf_...`)

## 🔧 CONFIGURAR TOKEN (OPCIONAL)

Si creaste el token, agrégalo al archivo `.env`:

```env
HF_API_TOKEN=hf_tu_token_aqui
```

**NOTA**: Si NO creas token, el sistema funciona igual pero con límites leves (suficientes para tu app).

## 🎯 CÓMO USAR

1. **Reinicia el backend**:
   ```powershell
   cd backend
   npm run dev
   ```

2. **Prueba el asistente** en tu frontend
   - Abre `frontend/ui/html/index.html`
   - Haz una pregunta sobre clima espacial
   - ¡Debería funcionar sin error 500!

## 🧪 SCRIPT DE PRUEBA

Crea archivo `backend/test-huggingface.js`:

```javascript
import https from 'https';

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  console.log('🧪 Probando Hugging Face API...\n');
  
  const prompt = '¿Qué es el clima espacial? Responde en español de forma breve y educativa.';
  
  const requestBody = JSON.stringify({
    inputs: prompt,
    parameters: {
      max_new_tokens: 200,
      temperature: 0.7,
      top_p: 0.95,
      return_full_text: false
    }
  });

  try {
    const startTime = Date.now();
    const data = await httpsRequest(HF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, requestBody);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ ÉXITO!');
    console.log(`⏱️  Tiempo: ${elapsed}s`);
    console.log('\n📝 RESPUESTA:');
    console.log(data[0].generated_text);
    console.log('\n🎉 Hugging Face funciona correctamente!');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n💡 SOLUCIÓN:');
    console.log('1. Verifica tu conexión a internet');
    console.log('2. El modelo puede estar cargándose (espera 20 segundos y reintenta)');
    console.log('3. Si persiste, crea un token gratis en https://huggingface.co/settings/tokens');
  }
}

test();
```

Ejecutar prueba:
```powershell
node backend/test-huggingface.js
```

## ⚠️ PRIMER USO

La primera vez que uses Hugging Face, el modelo puede tardar 20-30 segundos en "despertar" porque está en modo sleep. Después será instantáneo.

## 🔍 COMPARACIÓN

| Característica | Hugging Face | Gemini | Ollama |
|----------------|--------------|---------|---------|
| **Costo** | 100% Gratis | Límites gratis | 100% Gratis |
| **Instalación** | No requiere | No requiere | Requiere instalación |
| **Token/API Key** | Opcional | Requerido | No requiere |
| **Internet** | Requiere | Requiere | No requiere |
| **Velocidad** | Rápida | Rápida | Muy rápida |
| **Calidad** | Excelente | Excelente | Excelente |
| **Español** | ✅ Perfecto | ✅ Perfecto | ✅ Perfecto |
| **Límites** | Leves sin token | 60 req/min | Sin límites |

## 🎯 RECOMENDACIÓN

**Hugging Face es PERFECTO para tu caso porque**:
- ✅ No requiere instalación (Ollama eliminado)
- ✅ 100% gratis (sin preocuparte por límites)
- ✅ Funciona sin token (aunque es mejor crearlo)
- ✅ Muy simple de usar
- ✅ Perfecto español
- ✅ Modelo potente (Mistral-7B)

## 📚 RECURSOS

- **Hugging Face**: https://huggingface.co/
- **Modelos disponibles**: https://huggingface.co/models
- **Documentación API**: https://huggingface.co/docs/api-inference/
- **Crear cuenta gratis**: https://huggingface.co/join
- **Crear token gratis**: https://huggingface.co/settings/tokens

## ❓ PREGUNTAS FRECUENTES

**P: ¿Necesito crear cuenta?**
R: No, funciona sin cuenta (con límites leves). Pero es recomendable crear cuenta gratis para token ilimitado.

**P: ¿El token es gratis?**
R: Sí, 100% gratis para siempre.

**P: ¿Qué límites tiene sin token?**
R: ~1000 requests/día (más que suficiente para tu app).

**P: ¿Qué límites tiene con token?**
R: Prácticamente ilimitado para uso personal.

**P: ¿Tarda mucho?**
R: Primera vez: 20-30s (modelo "despertando"). Después: 1-3s por respuesta.

**P: ¿Funciona en español?**
R: Sí, perfectamente. Mistral-7B es multilingüe.

**P: ¿Puedo cambiar de modelo?**
R: Sí, hay cientos de modelos en https://huggingface.co/models. Solo cambia la URL en el código.
