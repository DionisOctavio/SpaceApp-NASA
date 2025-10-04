// backend/utils/fetchWithRetry.js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetchWithRetry(url, { method, headers, params, body }, { retries, backoffBase, timeoutMs })
 * - Reintenta 429/5xx respetando Retry-After si existe.
 * - Tiene timeout por petición usando AbortController.
 * - Soporta `params` para querystring.
 */
export async function fetchWithRetry(url, options = {}, retryCfg = {}) {
  const {
    params,
    headers = {},
    method = 'GET',
    body,
    // timeout configurable por ENV o por argumento:
    timeoutMs = Number(process.env.NASA_TIMEOUT_MS || retryCfg.timeoutMs || 12000),
    ...rest
  } = options || {};

  const q = new URLSearchParams(params || {}).toString();
  const fullUrl = q ? `${url}?${q}` : url;

  const retries = Number(retryCfg.retries ?? 2);
  const backoffBase = Number(retryCfg.backoffBase ?? 800);

  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(fullUrl, {
        method,
        headers: {
          'User-Agent': 'SpaceNow-AstroFeed/1.0 (+https://nasa.gov)',
          'Accept': 'application/json',
          ...headers,
        },
        body,
        signal: controller.signal,
        redirect: 'follow',
        ...rest,
      });

      clearTimeout(timer);

      if (res.ok) return res;

      const retryAfterMs =
        (Number(res.headers.get('retry-after')) || 0) * 1000 || backoffBase * (attempt + 1);

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await sleep(retryAfterMs);
        continue;
      }

      // Propagar error de estado
      const text = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status} - ${text || res.statusText}`);
      err.status = res.status;
      throw err;
    } catch (e) {
      clearTimeout(timer);

      // Si fue timeout/abort, marca el error informativo
      if (e?.name === 'AbortError') {
        e.message = `Timeout after ${timeoutMs}ms for ${fullUrl}`;
      }

      lastErr = e;
      if (attempt < retries) {
        await sleep(backoffBase * (attempt + 1));
        continue;
      }
      throw lastErr;
    }
  }
}
