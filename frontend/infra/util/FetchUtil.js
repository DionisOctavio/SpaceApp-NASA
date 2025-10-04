// frontend/infra/util/FetchUtil.js
export class FetchUtil {
  static BASE_URL = "http://localhost:5173/api"; 

  static async get(path) {
    const url = `${this.BASE_URL}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { "Accept": "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
