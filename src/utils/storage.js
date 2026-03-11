// utils/storage.js — localStorage helpers
const PREFIX = 'langflow_';
const STORE_KEYS = {
  config: 'langflow_config',
  words: 'langflow_words',
  cards: 'langflow_cards',
  progress: 'langflow_progress',
};

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignore quota/storage errors */ }
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  getUsage() {
    let total = 0;
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIX)) total += (localStorage.getItem(k) || '').length * 2;
    }
    return total; // bytes
  },
  exportAll() {
    const data = {
      config: readRaw(STORE_KEYS.config),
      words: readRaw(STORE_KEYS.words),
      cards: readRaw(STORE_KEYS.cards),
      progress: readRaw(STORE_KEYS.progress),
    };
    return JSON.stringify(data, null, 2);
  },
  importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (data.config) localStorage.setItem(STORE_KEYS.config, JSON.stringify(data.config));
    if (data.words) localStorage.setItem(STORE_KEYS.words, JSON.stringify(data.words));
    if (data.cards) localStorage.setItem(STORE_KEYS.cards, JSON.stringify(data.cards));
    if (data.progress) localStorage.setItem(STORE_KEYS.progress, JSON.stringify(data.progress));
  }
};
