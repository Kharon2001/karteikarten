// Persistencia local: IndexedDB como almacén principal y localStorage como copia
// de respaldo síncrona. Al cargar se usa la copia más reciente de las dos.
// También contiene el sistema Leitner (5 cajas) y las estadísticas.

import { SEED_DECKS } from './seed.js';

const DB_NAME = 'karteikarten';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'karteikarten.state.v1';
const SCHEMA = 1;

// Días hasta la próxima repetición según la caja (1–5).
export const INTERVALS = [0, 1, 2, 4, 8, 16];
export const BOXES = 5;

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Fechas (siempre en hora local, como 'AAAA-MM-DD') ---------- */

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

/* ---------- Leitner ---------- */

export const isDue = (card, today = dayKey()) => card.due <= today;

export function dueCards(state, deckId = null, today = dayKey()) {
  return state.cards.filter((c) => (!deckId || c.deckId === deckId) && isDue(c, today));
}

// Sabida: sube una caja. No sabida: vuelve a la caja 1 (mañana otra vez).
export function grade(card, known, today = dayKey()) {
  card.box = known ? Math.min(BOXES, card.box + 1) : 1;
  card.due = addDays(today, INTERVALS[card.box]);
  card.reviews = (card.reviews || 0) + 1;
  if (!known) card.lapses = (card.lapses || 0) + 1;
  card.last = today;
}

export function logReview(state, known, today = dayKey()) {
  const day = (state.log[today] ||= { n: 0, ok: 0 });
  day.n++;
  if (known) day.ok++;
}

// Días seguidos con al menos un repaso. Si hoy aún no has repasado, la racha de ayer sigue viva.
export function streak(state, today = dayKey()) {
  let day = state.log[today]?.n ? today : addDays(today, -1);
  let n = 0;
  while (state.log[day]?.n) { n++; day = addDays(day, -1); }
  return n;
}

// 0 = todo en la caja 1, 1 = todo en la caja 5.
export function mastery(cards) {
  if (!cards.length) return 0;
  return cards.reduce((s, c) => s + (c.box - 1), 0) / (cards.length * (BOXES - 1));
}

/* ---------- IndexedDB ---------- */

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('IndexedDB nicht verfügbar'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blockiert'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

async function idbGet() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

export function parse(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return data && Array.isArray(data.decks) && Array.isArray(data.cards) ? data : null;
  } catch {
    return null;
  }
}

export async function load() {
  let fromIdb = null;
  let fromLs = null;
  try { fromIdb = parse(await idbGet()); } catch { /* sin IndexedDB: seguimos con localStorage */ }
  try { fromLs = parse(localStorage.getItem(LS_KEY)); } catch { /* almacenamiento bloqueado */ }
  const newest = [fromIdb, fromLs].filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
  return newest ? migrate(newest) : seed();
}

let writeChain = Promise.resolve();

export function save(state) {
  state.savedAt = Date.now();
  const json = JSON.stringify(state);
  try { localStorage.setItem(LS_KEY, json); } catch { /* lleno o bloqueado */ }
  // Encadenar escrituras para que nunca se apliquen fuera de orden.
  writeChain = writeChain.then(() => idbSet(json)).catch((err) => console.warn('IndexedDB: Speichern fehlgeschlagen', err));
  return writeChain;
}

// Normaliza datos propios o importados: rellena campos que falten y descarta basura.
export function migrate(data) {
  const today = dayKey();
  data.schema = SCHEMA;
  data.settings = { theme: 'auto', ...(data.settings || {}) };
  data.log = data.log && typeof data.log === 'object' ? data.log : {};
  data.decks = data.decks
    .filter((d) => d && d.id && typeof d.name === 'string')
    .map((d) => ({ id: String(d.id), name: d.name, emoji: d.emoji || '📚', created: d.created || Date.now() }));
  const deckIds = new Set(data.decks.map((d) => d.id));
  data.cards = data.cards
    .filter((c) => c && c.id && deckIds.has(String(c.deckId)) && typeof c.front === 'string')
    .map((c) => ({
      id: String(c.id),
      deckId: String(c.deckId),
      front: c.front,
      back: typeof c.back === 'string' ? c.back : '',
      box: Math.min(BOXES, Math.max(1, Number(c.box) || 1)),
      due: /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : today,
      reviews: Number(c.reviews) || 0,
      lapses: Number(c.lapses) || 0,
      last: c.last || null,
      created: c.created || Date.now(),
    }));
  return data;
}

export function seed() {
  const now = Date.now();
  const today = dayKey();
  const decks = [];
  const cards = [];
  for (const d of SEED_DECKS) {
    const deck = { id: uid(), name: d.name, emoji: d.emoji, created: now };
    decks.push(deck);
    for (const [front, back] of d.cards) {
      cards.push({ id: uid(), deckId: deck.id, front, back, box: 1, due: today, reviews: 0, lapses: 0, last: null, created: now });
    }
  }
  return { schema: SCHEMA, decks, cards, log: {}, settings: { theme: 'auto' }, savedAt: 0 };
}
