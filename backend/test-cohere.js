import https from 'https';

const COHERE_API_KEY = process.env.COHERE_API_KEY || 'tu_api_key_aqui';
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

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
  console.log('🧪 Probando Cohere API...\n');
  
  if (COHERE_API_KEY === 'tu_api_key_aqui') {
    console.log('❌ ERROR: No has configurado COHERE_API_KEY');
    console.log('\n📝 PASOS:');
    console.log('1. Ve a https://dashboard.cohere.com/api-keys');
    console.log('2. Crea una cuenta gratis');
    console.log('3. Copia tu API Key');
    console.log('4. Agrega al archivo backend/.env:');
    console.log('   COHERE_API_KEY=tu_api_key_aqui');
    console.log('5. Vuelve a ejecutar este script\n');
    return;
  }
  
  const prompt = '¿Qué es el clima espacial? Responde en español de forma breve y educativa.';
  
  const requestBody = JSON.stringify({
    message: prompt,
    temperature: 0.7,
    max_tokens: 200
  });

  try {
    console.log('🔑 API Key configurada: ' + COHERE_API_KEY.substring(0, 10) + '...');
    console.log('🚀 Enviando request a Cohere...\n');
    
    const startTime = Date.now();
    const data = await httpsRequest(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`
      }
    }, requestBody);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('✅ ÉXITO!');
    console.log(`⏱️  Tiempo: ${elapsed}s`);
    console.log('\n📝 RESPUESTA:');
    console.log(data.text);
    console.log('\n🎉 Cohere funciona correctamente!');
    console.log('\n💡 SIGUIENTE PASO:');
    console.log('Reinicia tu backend: cd backend && npm run dev');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n💡 SOLUCIÓN:');
    console.log('1. Verifica que tu API key sea correcta');
    console.log('2. Ve a https://dashboard.cohere.com/api-keys');
    console.log('3. Copia tu Trial Key y agrégala a backend/.env');
    console.log('4. Asegúrate de tener conexión a internet');
  }
}

test();
