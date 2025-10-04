// historyStore.js - almacenamiento unificado de fenómenos espaciales
// Tipos previstos: 'gst','flare','cme','neo','hss','sep','rbe','ips'
// Cada item normalizado: { id, type, startTime, endTime?, label, intensity?, sourceUrl?, savedAt, extra? }

const STORAGE_KEY = 'space_history_v1';

function _loadRaw() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { items: [] }; } catch { return { items: [] }; }
}
function _saveRaw(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function getAll() { return _loadRaw().items; }
export function getByType(type) { return getAll().filter(it => it.type === type); }

export function addItem(item) {
  if (!item || !item.id || !item.type) return false;
  const data = _loadRaw();
  // evitar duplicado por (type,id,startTime)
  if (data.items.some(i => i.type === item.type && i.id === item.id && i.startTime === item.startTime)) return false;
  data.items.push(item);
  // mantener orden por startTime desc si existe
  data.items.sort((a,b)=> new Date(b.startTime||0) - new Date(a.startTime||0));
  _saveRaw(data);
  return true;
}

export function removeItem(type, idxOrId) {
  const data = _loadRaw();
  const before = data.items.length;
  data.items = data.items.filter((it,i)=> {
    if (typeof idxOrId === 'number') { return !(it.type===type && i===idxOrId); }
    return !(it.type===type && it.id === idxOrId);
  });
  if (data.items.length !== before) _saveRaw(data);
}

export function clearType(type) {
  const data = _loadRaw();
  const before = data.items.length;
  data.items = data.items.filter(it => it.type !== type);
  if (data.items.length !== before) _saveRaw(data);
}

export function migrateEnhance(enhancer) {
  const data = _loadRaw();
  let changed = false;
  data.items = data.items.map(it => {
    const updated = enhancer(it) || it;
    if (updated !== it) changed = true;
    return updated;
  });
  if (changed) _saveRaw(data);
}
