import {
  load, save, uid, parse, migrate, dayKey, addDays, dueCards, grade, logReview, streak, mastery, INTERVALS, BOXES,
} from './store.js';

/* ---------- Utilidades ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = (s) => String(s).replace(/\s+/g, ' ').trim();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const ICON = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
};

const EMOJIS = ['📐', '⚡', '⚗️', '📖', '🧮', '🔬', '🧬', '🌍', '💻', '📝', '🎯', '📚'];
const BOX_NAMES = ['', 'täglich', 'alle 2 Tage', 'alle 4 Tage', 'alle 8 Tage', 'alle 16 Tage'];

// Texto de tarjeta → HTML: $…$ y $$…$$ con KaTeX, **negrita** y saltos de línea.
function rich(text) {
  const parts = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    parts.push({ text: text.slice(last, m.index) });
    parts.push({ tex: m[1] ?? m[2], display: m[1] != null });
    last = re.lastIndex;
  }
  parts.push({ text: text.slice(last) });
  // Una fórmula centrada ya ocupa su propia línea: quita el salto de línea pegado a ella.
  parts.forEach((p, i) => {
    if (p.text == null) return;
    if (parts[i - 1]?.display) p.text = p.text.replace(/^[ \t]*\n/, '');
    if (parts[i + 1]?.display) p.text = p.text.replace(/\n[ \t]*$/, '');
  });
  const plain = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  return parts.map((p) => (p.text != null ? plain(p.text) : math(p.tex, p.display))).join('');
}

function math(tex, display) {
  if (!window.katex) return `<span class="math-error">${esc(tex)}</span>`;
  try {
    return window.katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'html', strict: false });
  } catch {
    return `<span class="math-error">${esc(tex)}</span>`;
  }
}

/* ---------- Estado ---------- */

let state;
let undoSnap = null;

const el = {
  topbar: $('#topbar'),
  title: $('#title'),
  today: $('#today'),
  summary: $('#summary'),
  ringFill: $('#ringFill'),
  ringPct: $('#ringPct'),
  progressText: $('#progressText'),
  progressSub: $('#progressSub'),
  deckList: $('#deckList'),
  deckCount: $('#deckCount'),
  empty: $('#empty'),
  composer: $('#composer'),
  studyBtn: $('#studyBtn'),
  studyLabel: $('#studyLabel'),
  review: $('#review'),
  stage: $('#stage'),
  actions: $('#reviewActions'),
  reviewDeck: $('#reviewDeck'),
  reviewCount: $('#reviewCount'),
  reviewBar: $('#reviewBar'),
  toast: $('#toast'),
  toastText: $('#toastText'),
  toastUndo: $('#toastUndo'),
  layer: $('#sheetLayer'),
  backdrop: $('#backdrop'),
  sheet: $('#sheet'),
  importInput: $('#importInput'),
};

const findDeck = (id) => state.decks.find((d) => d.id === id);
const findCard = (id) => state.cards.find((c) => c.id === id);
const deckCards = (id) => state.cards.filter((c) => c.deckId === id);

function mutate(label, fn) {
  undoSnap = { label, json: JSON.stringify(state) };
  fn();
  save(state);
}

function undo() {
  if (!undoSnap) return;
  state = migrate(JSON.parse(undoSnap.json));
  undoSnap = null;
  save(state);
  hideToast();
  render();
  toast('Rückgängig gemacht');
}

/* ---------- Pantalla de inicio ---------- */

function boxBar(cards) {
  if (!cards.length) return '';
  const counts = [0, 0, 0, 0, 0, 0];
  for (const c of cards) counts[c.box]++;
  return counts.slice(1).map((n, i) => (n ? `<i class="b${i + 1}" style="width:${(n / cards.length) * 100}%"></i>` : '')).join('');
}

function deckHTML(d, today) {
  const cards = deckCards(d.id);
  const due = cards.filter((c) => c.due <= today).length;
  const pct = Math.round(mastery(cards) * 100);
  return `<li><button class="deck" data-id="${d.id}">
    <span class="badge" aria-hidden="true">${esc(d.emoji)}</span>
    <span class="deck-text">
      <span class="deck-name">${esc(d.name)}</span>
      <span class="deck-sub">${plural(cards.length, 'Karte', 'Karten')}${cards.length ? ` · ${pct} % gelernt` : ''}</span>
      ${cards.length ? `<span class="mini-bar">${boxBar(cards)}</span>` : ''}
    </span>
    ${due ? `<span class="due" aria-label="${due} fällig">${due}</span>` : cards.length ? `<span class="due zero" aria-label="Nichts fällig">${ICON.check}</span>` : ''}
    <span class="chev">${ICON.chevron}</span>
  </button></li>`;
}

function render() {
  const today = dayKey();
  el.today.textContent = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  el.deckList.innerHTML = state.decks.map((d) => deckHTML(d, today)).join('');
  el.deckCount.textContent = state.decks.length || '';
  el.empty.hidden = state.decks.length > 0;
  el.empty.innerHTML = '<strong>Noch keine Stapel</strong>Lege mit „Neuer Stapel“ dein erstes Fach an.';

  const due = dueCards(state, null, today).length;
  const done = state.log[today]?.n || 0;
  const days = streak(state, today);
  const total = state.cards.length;
  const pct = !total ? 0 : due ? Math.round((done / (done + due)) * 100) : 100;
  el.ringFill.style.strokeDashoffset = String(119.38 * (1 - pct / 100));
  el.ringPct.textContent = `${pct}%`;
  el.summary.classList.toggle('complete', total > 0 && due === 0);
  el.progressText.textContent = !total ? 'Noch keine Karten'
    : due ? `${plural(due, 'Karte', 'Karten')} fällig`
      : done ? 'Für heute alles geschafft' : 'Heute ist nichts fällig';
  el.progressSub.textContent = `Heute ${done} wiederholt · ${days ? `🔥 ${plural(days, 'Tag', 'Tage')} in Folge` : 'Starte deine Serie'}`;

  el.studyBtn.classList.toggle('idle', !due);
  el.studyLabel.textContent = due ? `Lernen · ${due} fällig` : 'Heute nichts fällig';
}

/* ---------- Aviso con deshacer ---------- */

let toastTimer = null;
function toast(text, { undo: canUndo = false, ms = 3200 } = {}) {
  el.toastText.textContent = text;
  el.toastUndo.hidden = !canUndo;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, canUndo ? Math.max(ms, 4500) : ms);
}
function hideToast() {
  clearTimeout(toastTimer);
  el.toast.classList.remove('show');
}

/* ---------- Hojas inferiores ---------- */

let sheetToken = 0;
let sheetOnClose = null;

function openSheet(html, { onClose } = {}) {
  const prev = sheetOnClose;
  sheetOnClose = null;
  prev?.();
  sheetToken++;
  el.sheet.innerHTML = html;
  el.sheet.scrollTop = 0;
  el.layer.hidden = false;
  void el.layer.offsetWidth;
  el.layer.classList.add('open');
  sheetOnClose = onClose || null;
  return el.sheet;
}

function closeSheet() {
  const cb = sheetOnClose;
  sheetOnClose = null;
  const token = ++sheetToken;
  document.activeElement?.blur?.();
  el.layer.classList.remove('open');
  setTimeout(() => { if (token === sheetToken) { el.layer.hidden = true; el.sheet.innerHTML = ''; } }, 360);
  cb?.();
}

function confirmSheet({ title, message, confirm, destructive = true }) {
  return new Promise((resolve) => {
    let answer = false;
    const sheet = openSheet(
      `<div class="confirm">
        <h3>${esc(title)}</h3>
        <p>${esc(message)}</p>
        <button class="big${destructive ? ' destructive' : ' primary'}" data-ok>${esc(confirm)}</button>
        <button class="big" data-cancel>Abbrechen</button>
      </div>`,
      { onClose: () => resolve(answer) },
    );
    $('[data-ok]', sheet).onclick = () => { answer = true; closeSheet(); };
    $('[data-cancel]', sheet).onclick = () => closeSheet();
  });
}

/* ---------- Mazo ---------- */

function openDeck(id) {
  const d = findDeck(id);
  if (!d) return;
  const today = dayKey();
  const cards = deckCards(id);
  const due = cards.filter((c) => c.due <= today).length;
  const counts = [0, 0, 0, 0, 0, 0];
  for (const c of cards) counts[c.box]++;

  const sheet = openSheet(
    `<div class="sheet-head">
      <h2>${esc(d.emoji)} ${esc(d.name)}</h2>
      <div class="actions"><button class="pill" data-edit>Bearbeiten</button></div>
    </div>
    <p class="sheet-sub">${plural(cards.length, 'Karte', 'Karten')} · ${due} fällig · ${Math.round(mastery(cards) * 100)} % gelernt</p>
    <div class="boxes">${counts.slice(1).map((n, i) => `<div><b>${n}</b><i class="b${i + 1}"></i><small>Box ${i + 1}</small></div>`).join('')}</div>
    <p class="legend">Gewusst → eine Box weiter. Nicht gewusst → zurück in Box 1.</p>
    ${due ? `<button class="wide-btn" data-study>${ICON.play}Lernen · ${due} fällig</button>`
      : cards.length ? `<button class="wide-btn quiet" data-practice>Freies Üben (ohne Wertung)</button>` : ''}
    <div class="section-head">
      <h2 class="section-title">Karten <span class="count">${cards.length || ''}</span></h2>
      <button class="text-btn" data-add>Neue Karte</button>
    </div>
    <div data-cards>${cards.length
      ? cards.map((c) => `<button class="card-row" data-card="${c.id}"><span class="content">${rich(c.front)}</span><span class="box-dot b${c.box}" title="Box ${c.box}">${c.box}</span></button>`).join('')
      : '<p class="muted" style="margin:8px 2px">Noch keine Karten. Tippe auf „Neue Karte“.</p>'}</div>`,
  );

  $('[data-edit]', sheet).onclick = () => openDeckEditor(id);
  $('[data-add]', sheet).onclick = () => openCardEditor({ deckId: id, onDone: () => openDeck(id) });
  const s = $('[data-study]', sheet);
  if (s) s.onclick = () => { closeSheet(); startReview({ deckId: id }); };
  const p = $('[data-practice]', sheet);
  if (p) p.onclick = () => { closeSheet(); startReview({ deckId: id, practice: true }); };
  $('[data-cards]', sheet).addEventListener('click', (e) => {
    const row = e.target.closest('[data-card]');
    if (row) openCardEditor({ cardId: row.dataset.card, onDone: () => openDeck(id) });
  });
}

function openDeckEditor(id = null) {
  const d = id ? findDeck(id) : null;
  let emoji = d?.emoji || EMOJIS[0];
  let deleted = false;
  let cancelled = false;
  const sheet = openSheet(
    `<div class="sheet-head">
      <h2>${d ? 'Stapel bearbeiten' : 'Neuer Stapel'}</h2>
      <button class="pill accent" data-done>Fertig</button>
    </div>
    <input class="field" name="name" value="${esc(d?.name || '')}" placeholder="Name, z. B. Biologie" maxlength="40" autocapitalize="sentences" enterkeyhint="done">
    <div class="field-label">Symbol</div>
    <div class="chips">${EMOJIS.map((e) => `<button type="button" class="chip emoji${e === emoji ? ' sel' : ''}" data-emoji="${e}">${e}</button>`).join('')}</div>
    ${d ? `<button class="danger-btn" data-delete>Stapel löschen</button>` : ''}`,
    { onClose: apply },
  );
  const name = $('[name="name"]', sheet);
  if (!d) setTimeout(() => name.focus(), 350);
  name.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); name.blur(); } });
  $('.chips', sheet).addEventListener('click', (e) => {
    const chip = e.target.closest('[data-emoji]');
    if (!chip) return;
    emoji = chip.dataset.emoji;
    sheet.querySelectorAll('[data-emoji]').forEach((c) => c.classList.toggle('sel', c === chip));
  });
  $('[data-done]', sheet).onclick = () => {
    if (!clean(name.value)) { name.classList.remove('shake'); void name.offsetWidth; name.classList.add('shake'); name.focus(); return; }
    closeSheet();
  };
  const del = $('[data-delete]', sheet);
  if (del) del.onclick = async () => {
    cancelled = true; // la confirmación sustituye a esta hoja; no guardar cambios a medias
    const n = deckCards(d.id).length;
    const ok = await confirmSheet({ title: `„${d.name}“ löschen?`, message: `Der Stapel und ${plural(n, 'Karte', 'Karten')} werden gelöscht.`, confirm: 'Stapel löschen' });
    if (!ok) { openDeckEditor(d.id); return; }
    deleted = true;
    mutate(`„${d.name}“ gelöscht`, () => {
      state.decks = state.decks.filter((x) => x.id !== d.id);
      state.cards = state.cards.filter((c) => c.deckId !== d.id);
    });
    render();
    toast(`„${d.name}“ gelöscht`, { undo: true });
  };

  function apply() {
    if (cancelled || deleted) return;
    const value = clean(name.value);
    if (!value) { if (d) openDeck(d.id); return; }
    if (d) {
      if (value !== d.name || emoji !== d.emoji) {
        mutate('Stapel geändert', () => { d.name = value; d.emoji = emoji; });
        render();
      }
      openDeck(d.id);
    } else {
      const deck = { id: uid(), name: value, emoji, created: Date.now() };
      mutate(`„${value}“ angelegt`, () => state.decks.push(deck));
      render();
      openDeck(deck.id);
    }
  }
}

/* ---------- Editor de tarjeta ---------- */

function openCardEditor({ cardId = null, deckId = null, onDone } = {}) {
  const c = cardId ? findCard(cardId) : null;
  if (cardId && !c) return;
  if (!state.decks.length) { toast('Lege zuerst einen Stapel an'); openDeckEditor(); return; }
  let deck = c?.deckId || deckId || state.decks[0].id;
  let deleted = false;
  let again = false;

  const sheet = openSheet(
    `<div class="sheet-head">
      <h2>${c ? 'Karte bearbeiten' : 'Neue Karte'}</h2>
      <button class="pill accent" data-done>Fertig</button>
    </div>
    <div class="field-label">Stapel</div>
    <div class="chips" data-decks>${state.decks.map((d) => `<button type="button" class="chip${d.id === deck ? ' sel' : ''}" data-deck="${d.id}">${esc(d.emoji)} ${esc(d.name)}</button>`).join('')}</div>
    <div class="field-label">Vorderseite · Frage</div>
    <textarea class="field text-field" name="front" rows="3" placeholder="z. B. Ableitung von $f(x) = x^2$?" maxlength="2000" autocapitalize="sentences">${esc(c?.front || '')}</textarea>
    <div class="preview" data-preview="front"></div>
    <div class="field-label">Rückseite · Antwort</div>
    <textarea class="field text-field" name="back" rows="3" placeholder="z. B. $f'(x) = 2x$" maxlength="4000" autocapitalize="sentences">${esc(c?.back || '')}</textarea>
    <div class="preview" data-preview="back"></div>
    <p class="hint">Formeln zwischen <code>$…$</code>, zentriert mit <code>$$…$$</code>. Fett mit <code>**Wort**</code>. Beispiel: <code>$n = \\frac{m}{M}$</code></p>
    ${c ? `<p class="hint" style="margin-top:10px">Box ${c.box} (${BOX_NAMES[c.box]}) · nächste Wiederholung: ${formatDue(c.due)}</p>
      <button class="danger-btn" data-delete>Karte löschen</button>`
      : `<button class="wide-btn quiet" data-again>Speichern und nächste Karte</button>`}`,
    { onClose: apply },
  );

  const front = $('[name="front"]', sheet);
  const back = $('[name="back"]', sheet);
  const previews = { front: $('[data-preview="front"]', sheet), back: $('[data-preview="back"]', sheet) };
  const grow = (t) => { t.style.height = 'auto'; t.style.height = `${Math.max(92, t.scrollHeight)}px`; };
  const update = (t) => {
    grow(t);
    // Vista previa solo cuando hay algo que formatear.
    previews[t.name].innerHTML = /\$|\*\*/.test(t.value) ? rich(t.value) : '';
  };
  [front, back].forEach((t) => { t.addEventListener('input', () => update(t)); requestAnimationFrame(() => update(t)); });
  if (!c) setTimeout(() => front.focus(), 350);

  $('[data-decks]', sheet).addEventListener('click', (e) => {
    const chip = e.target.closest('[data-deck]');
    if (!chip) return;
    deck = chip.dataset.deck;
    sheet.querySelectorAll('[data-deck]').forEach((x) => x.classList.toggle('sel', x === chip));
  });
  const shake = () => { front.classList.remove('shake'); void front.offsetWidth; front.classList.add('shake'); front.focus(); };
  $('[data-done]', sheet).onclick = () => { if (!c && !front.value.trim() && back.value.trim()) { shake(); return; } closeSheet(); };
  const againBtn = $('[data-again]', sheet);
  if (againBtn) againBtn.onclick = () => { if (!front.value.trim()) { shake(); return; } again = true; closeSheet(); };
  const del = $('[data-delete]', sheet);
  if (del) del.onclick = () => { deleted = true; closeSheet(); };

  function apply() {
    const f = front.value.trim();
    const b = back.value.trim();
    if (deleted) {
      mutate('Karte gelöscht', () => { state.cards = state.cards.filter((x) => x.id !== c.id); });
      toast('Karte gelöscht', { undo: true });
    } else if (c) {
      if (!f) toast('Die Vorderseite darf nicht leer sein');
      else if (f !== c.front || b !== c.back || deck !== c.deckId) {
        mutate('Karte geändert', () => { c.front = f; c.back = b; c.deckId = deck; });
        toast('Gespeichert');
      }
    } else if (f) {
      const card = { id: uid(), deckId: deck, front: f, back: b, box: 1, due: dayKey(), reviews: 0, lapses: 0, last: null, created: Date.now() };
      mutate('Karte angelegt', () => state.cards.push(card));
      toast(`Karte in „${findDeck(deck)?.name}“ gespeichert`, { undo: true });
    }
    render();
    if (again) openCardEditor({ deckId: deck, onDone });
    else onDone?.();
  }
}

function formatDue(key) {
  const today = dayKey();
  if (key <= today) return 'heute';
  if (key === addDays(today, 1)) return 'morgen';
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

/* ---------- Repaso ---------- */

let session = null;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startReview({ deckId = null, practice = false } = {}) {
  const pool = practice ? deckCards(deckId) : dueCards(state, deckId);
  if (!pool.length) { toast('Für heute ist nichts fällig 🎉'); return; }
  // Primero las cajas bajas (lo que más cuesta), mezclado dentro de cada caja.
  const ids = shuffle(pool.slice()).sort((a, b) => a.box - b.box).map((c) => c.id);
  session = { deckId, practice, queue: ids, total: ids.length, finished: 0, firstTry: 0, answered: new Set(), flipped: false };
  el.reviewDeck.textContent = `${deckId ? findDeck(deckId)?.name : 'Alle Stapel'}${practice ? ' · Freies Üben' : ''}`;
  el.review.hidden = false;
  document.documentElement.classList.add('review-open');
  showCard();
}

function showCard() {
  const c = findCard(session.queue[0]);
  if (!c) { session.queue.shift(); return session.queue.length ? showCard() : finishReview(); }
  session.flipped = false;
  const deck = findDeck(c.deckId);
  const again = session.answered.has(c.id);
  el.reviewCount.textContent = `${Math.min(session.finished + 1, session.total)} / ${session.total}`;
  el.reviewBar.style.width = `${(session.finished / session.total) * 100}%`;
  $('#reviewEdit').style.visibility = '';
  el.stage.innerHTML = `<div class="flip enter" id="flip" role="button" tabindex="0" aria-label="Karte umdrehen">
    <div class="face front">
      <div class="face-label">Frage${session.deckId ? '' : ` · ${esc(deck?.name || '')}`}<span class="box-tag">${again ? 'Nochmal' : `Box ${c.box}`}</span></div>
      <div class="face-body"><div class="content">${rich(c.front)}</div></div>
      <div class="face-hint">Tippen zum Umdrehen</div>
    </div>
    <div class="face back" aria-hidden="true">
      <div class="face-label">Antwort</div>
      <div class="face-body"><div class="content q-mini">${rich(c.front)}</div><div class="content">${c.back ? rich(c.back) : '<span class="muted">Keine Antwort eingetragen</span>'}</div></div>
    </div>
  </div>`;
  el.actions.innerHTML = `<button class="big-btn plain" data-flip>Antwort zeigen</button>`;
  $('#flip').addEventListener('click', flip);
  $('[data-flip]', el.actions).onclick = flip;
}

function flip() {
  if (!session) return;
  const card = $('#flip');
  session.flipped = !session.flipped;
  card.classList.remove('enter');
  card.classList.toggle('flipped', session.flipped);
  card.querySelector('.front').setAttribute('aria-hidden', String(session.flipped));
  card.querySelector('.back').setAttribute('aria-hidden', String(!session.flipped));
  if (session.flipped && !el.actions.querySelector('[data-yes]')) {
    el.actions.innerHTML = `<button class="big-btn no" data-no>${ICON.cross}Nicht gewusst</button>
      <button class="big-btn yes" data-yes>${ICON.check}Gewusst</button>`;
    $('[data-no]', el.actions).onclick = () => answer(false);
    $('[data-yes]', el.actions).onclick = () => answer(true);
  }
}

function answer(known) {
  if (!session || !session.flipped) return;
  const id = session.queue.shift();
  const c = findCard(id);
  // Solo la primera respuesta de la sesión mueve la tarjeta de caja; las repeticiones son práctica.
  if (c && !session.answered.has(id)) {
    session.answered.add(id);
    if (known) session.firstTry++;
    if (!session.practice) {
      grade(c, known);
      logReview(state, known);
      save(state);
    }
  }
  if (known) session.finished++;
  else session.queue.push(id); // lo que no sabías vuelve al final de esta misma sesión
  if (session.queue.length) showCard();
  else finishReview();
}

function finishReview() {
  const s = session;
  const pct = s.total ? Math.round((s.firstTry / s.total) * 100) : 0;
  const days = streak(state);
  el.reviewCount.textContent = `${s.total} / ${s.total}`;
  el.reviewBar.style.width = '100%';
  $('#reviewEdit').style.visibility = 'hidden';
  el.stage.innerHTML = `<div class="done-screen">
    <div class="ring"><svg viewBox="0 0 44 44"><circle class="ring-track" cx="22" cy="22" r="19"/><circle class="ring-fill" id="doneRing" cx="22" cy="22" r="19"/></svg><span class="ring-pct">${pct}%</span></div>
    <h2>Geschafft!</h2>
    <p>${plural(s.total, 'Karte', 'Karten')} wiederholt · ${s.firstTry} beim ersten Mal gewusst</p>
    ${s.practice ? '<p>Freies Üben – deine Boxen bleiben unverändert.</p>' : days ? `<div class="streak-pill">🔥 ${plural(days, 'Tag', 'Tage')} in Folge</div>` : ''}
  </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => { const r = $('#doneRing'); if (r) r.style.strokeDashoffset = String(119.38 * (1 - pct / 100)); }));
  el.actions.innerHTML = `<button class="big-btn yes" data-close>Fertig</button>`;
  $('[data-close]', el.actions).onclick = closeReview;
  session.done = true;
}

function closeReview() {
  session = null;
  el.review.hidden = true;
  el.stage.innerHTML = '';
  document.documentElement.classList.remove('review-open');
  render();
}

/* ---------- Estadísticas ---------- */

function openStats() {
  const today = dayKey();
  const done = state.log[today]?.n || 0;
  const days = streak(state, today);
  const due = dueCards(state, null, today).length;
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const key = addDays(today, -i);
    const [y, m, d] = key.split('-').map(Number);
    week.push({ n: state.log[key]?.n || 0, label: new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(new Date(y, m - 1, d)).slice(0, 2) });
  }
  const max = Math.max(1, ...week.map((w) => w.n));
  const totalReviews = Object.values(state.log).reduce((s, l) => s + l.n, 0);
  const totalOk = Object.values(state.log).reduce((s, l) => s + l.ok, 0);

  openSheet(
    `<div class="sheet-head"><h2>Statistik</h2><button class="pill accent" data-done>Fertig</button></div>
    <div class="stat-grid">
      <div class="stat"><b>${done}</b><span>heute wiederholt</span></div>
      <div class="stat hot"><b>${days}</b><span>${days === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
      <div class="stat"><b>${due}</b><span>noch fällig</span></div>
    </div>
    <h3 class="section-title">Letzte 7 Tage</h3>
    <div class="week">${week.map((w, i) => `<div><em>${w.n || ''}</em><i class="${w.n ? 'on' : ''}" style="height:${(w.n / max) * 56}px"></i><small>${i === 6 ? 'Heute' : esc(w.label)}</small></div>`).join('')}</div>
    <h3 class="section-title">Fortschritt je Fach</h3>
    ${state.decks.map((d) => {
      const cards = deckCards(d.id);
      return `<div class="subj"><div class="subj-top"><span>${esc(d.emoji)} ${esc(d.name)}</span><b>${Math.round(mastery(cards) * 100)} %</b></div>
        <div class="progress">${boxBar(cards)}</div></div>`;
    }).join('') || '<p class="muted">Noch keine Stapel.</p>'}
    <p class="legend" style="margin-top:12px">${Array.from({ length: BOXES }, (_, i) => `<span class="box-dot b${i + 1}" style="display:inline-grid;margin-right:4px">${i + 1}</span>${BOX_NAMES[i + 1]}`).join(' &nbsp; ')}</p>
    <p class="footnote">Insgesamt ${totalReviews} Wiederholungen${totalReviews ? `, ${Math.round((totalOk / totalReviews) * 100)} % gewusst` : ''}.<br>Ein Fach ist zu 100 % gelernt, wenn alle Karten in Box 5 liegen.</p>`,
  );
  $('[data-done]', el.sheet).onclick = closeSheet;
}

/* ---------- Menú, tema y copia de seguridad ---------- */

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('karteikarten.theme', t); } catch { /* sin almacenamiento */ }
  requestAnimationFrame(() => {
    $('meta[name="theme-color"]').content = getComputedStyle(document.body).backgroundColor;
  });
}

function openMenu() {
  const t = state.settings.theme;
  const sheet = openSheet(
    `<div class="sheet-head"><h2>Optionen</h2><button class="pill accent" data-done>Fertig</button></div>
    <div class="group-box" style="margin-top:4px">
      <button class="opt" data-act="deck"><span class="grow">Neuer Stapel<small>Ein weiteres Fach anlegen</small></span></button>
      <button class="opt" data-act="card"><span class="grow">Neue Karte</span></button>
    </div>
    <div class="group-box">
      <div class="opt stack"><span>Erscheinungsbild<small>Auto folgt der Einstellung deines iPhones</small></span>
        <div class="seg">${[['auto', 'Auto'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<button data-theme="${v}" class="${t === v ? 'sel' : ''}">${l}</button>`).join('')}</div>
      </div>
    </div>
    <div class="group-box">
      <button class="opt" data-act="export"><span class="grow">Sicherung exportieren<small>Alle Stapel, Karten und Statistiken als Datei</small></span></button>
      <button class="opt" data-act="import"><span class="grow">Sicherung importieren<small>Eine exportierte .json-Datei laden</small></span></button>
    </div>
    <div class="group-box">
      <button class="opt" data-act="undo" ${undoSnap ? '' : 'disabled'}><span class="grow">Rückgängig<small>${undoSnap ? esc(undoSnap.label) : 'Nichts rückgängig zu machen'}</small></span></button>
      <button class="opt danger" data-act="reset" ${state.cards.length ? '' : 'disabled'}><span class="grow">Lernfortschritt zurücksetzen<small>Alle Karten zurück in Box 1, die Karten bleiben</small></span></button>
    </div>
    <p class="footnote">Deine Daten bleiben nur auf diesem Gerät – ohne Konto und ohne Server.<br>Exportiere ab und zu eine Sicherung.</p>`,
  );
  $('[data-done]', sheet).onclick = closeSheet;
  sheet.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    state.settings.theme = b.dataset.theme;
    save(state);
    applyTheme();
    sheet.querySelectorAll('[data-theme]').forEach((x) => x.classList.toggle('sel', x === b));
  }));
  sheet.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => menuAction(b.dataset.act)));
}

async function menuAction(act) {
  if (act === 'deck') return openDeckEditor();
  if (act === 'card') return openCardEditor();
  if (act === 'export') { closeSheet(); return exportData(); }
  if (act === 'import') { el.importInput.value = ''; el.importInput.click(); return; }
  if (act === 'undo') { closeSheet(); undo(); return; }
  if (act === 'reset') {
    const ok = await confirmSheet({ title: 'Lernfortschritt zurücksetzen?', message: 'Alle Karten kommen zurück in Box 1 und sind heute fällig. Deine Karten und die Statistik bleiben.', confirm: 'Zurücksetzen' });
    if (!ok) return;
    const today = dayKey();
    mutate('Fortschritt zurückgesetzt', () => { for (const c of state.cards) { c.box = 1; c.due = today; } });
    render();
    toast('Alle Karten in Box 1', { undo: true });
  }
}

async function exportData() {
  const data = { app: 'karteikarten', version: 1, exportedAt: new Date().toISOString(), decks: state.decks, cards: state.cards, log: state.log, settings: state.settings };
  const name = `karteikarten-${dayKey()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  // En el iPhone, la hoja de compartir permite «In Dateien sichern».
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Karteikarten-Sicherung' }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(`${name} gespeichert`);
}

async function importFile(file) {
  let data;
  try { data = parse(await file.text()); } catch { data = null; }
  if (!data) { closeSheet(); toast('Diese Datei ist keine gültige Sicherung'); return; }
  data = migrate({ ...data, settings: state.settings });
  const sheet = openSheet(
    `<div class="confirm">
      <h3>Sicherung importieren</h3>
      <p>${plural(data.decks.length, 'Stapel', 'Stapel')} mit ${plural(data.cards.length, 'Karte', 'Karten')}. Du kannst deine jetzigen Karten ersetzen oder die neuen hinzufügen.</p>
      <button class="big destructive" data-mode="replace">Alles ersetzen</button>
      <button class="big primary" data-mode="merge">Hinzufügen</button>
      <button class="big" data-mode="">Abbrechen</button>
    </div>`,
  );
  sheet.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    closeSheet();
    if (!mode) return;
    if (mode === 'replace') {
      mutate('Import (ersetzt)', () => { state.decks = data.decks; state.cards = data.cards; state.log = data.log; });
    } else {
      mutate('Import (hinzugefügt)', () => {
        const deckIds = new Set(state.decks.map((d) => d.id));
        const cardIds = new Set(state.cards.map((c) => c.id));
        // Un mazo con el mismo nombre se une al existente.
        const byName = new Map(state.decks.map((d) => [d.name.toLowerCase(), d.id]));
        const remap = new Map();
        for (const d of data.decks) {
          const same = byName.get(d.name.toLowerCase());
          if (same) remap.set(d.id, same);
          else {
            const id = deckIds.has(d.id) ? uid() : d.id;
            remap.set(d.id, id);
            state.decks.push({ ...d, id });
          }
        }
        for (const c of data.cards) {
          if (cardIds.has(c.id)) continue;
          state.cards.push({ ...c, deckId: remap.get(c.deckId) });
        }
        for (const [day, l] of Object.entries(data.log)) {
          if (!state.log[day]) state.log[day] = l;
        }
      });
    }
    render();
    toast(`${plural(data.cards.length, 'Karte', 'Karten')} importiert`, { undo: true });
  }));
}

/* ---------- Eventos ---------- */

function bind() {
  el.deckList.addEventListener('click', (e) => {
    const row = e.target.closest('.deck');
    if (row) openDeck(row.dataset.id);
  });
  el.summary.addEventListener('click', openStats);
  $('#statsBtn').addEventListener('click', openStats);
  $('#addCardBtn').addEventListener('click', () => openCardEditor());
  $('#newDeckBtn').addEventListener('click', () => openDeckEditor());
  $('#menuBtn').addEventListener('click', openMenu);
  el.studyBtn.addEventListener('click', () => {
    if (dueCards(state).length) startReview();
    else toast('Für heute bist du fertig 🎉 Freies Üben findest du im Stapel.');
  });
  el.toastUndo.addEventListener('click', undo);
  el.backdrop.addEventListener('click', closeSheet);
  el.importInput.addEventListener('change', () => { const f = el.importInput.files?.[0]; if (f) importFile(f); });

  $('#reviewClose').addEventListener('click', closeReview);
  $('#reviewEdit').addEventListener('click', () => {
    const id = session?.queue[0];
    if (!id) return;
    openCardEditor({ cardId: id, onDone: () => { if (!session) return; if (findCard(id)) { const was = session.flipped; showCard(); if (was) flip(); } else showCard(); } });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!el.layer.hidden) closeSheet();
      else if (session) closeReview();
      return;
    }
    if (!session || session.done || !el.layer.hidden || e.target.closest?.('input, textarea')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!session.flipped) flip(); else answer(true); }
    else if (session.flipped && (e.key === 'ArrowRight' || e.key === 'j')) answer(true);
    else if (session.flipped && (e.key === 'ArrowLeft' || e.key === 'n')) answer(false);
  });

  // Título compacto en la barra superior al desplazarse.
  const onScroll = () => el.topbar.classList.toggle('scrolled', el.title.getBoundingClientRect().bottom < el.topbar.offsetHeight);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Teclado de iOS: mover las hojas por encima del teclado.
  const vv = window.visualViewport;
  if (vv) {
    const onVV = () => {
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      document.documentElement.style.setProperty('--kb', `${kb}px`);
      document.documentElement.classList.toggle('kb-open', kb > 60);
    };
    vv.addEventListener('resize', onVV);
    vv.addEventListener('scroll', onVV);
  }

  const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--composer-h', `${el.composer.offsetHeight - 18}px`));
  ro.observe(el.composer);

  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

  document.addEventListener('visibilitychange', () => {
    // Si iOS suspende la app, asegura la última escritura; al volver, puede ser otro día.
    if (document.visibilityState === 'hidden') save(state);
    else if (!session) render();
  });
}

/* ---------- Inicio ---------- */

async function init() {
  state = await load();
  if (!state.savedAt) save(state);
  applyTheme();
  render();
  bind();
  navigator.storage?.persist?.().catch(() => {});
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service Worker nicht registriert', err));
  }
}

init();
