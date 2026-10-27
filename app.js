/* Bozze per Vinted — app
   Open source (MIT). Non affiliata a Vinted.
   Tutto resta nel dispositivo: bozze e foto originali in IndexedDB.
   Esportazione: un pacchetto ZIP per articolo (scheda.json + scheda.txt + foto originali),
   pensato per essere caricato su Vinted da Claude (vedi PER-CLAUDE.md). */
(() => {
'use strict';
const VERSION = '1.0.0';
const FORMAT = 'bozze-vinted/1';
const PREVIEW = !!window.BV_PREVIEW;

/* ---------- Utilità ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHEV = '<span class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></span>';
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))).slice(0, 20);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms); }
function fmtBytes(b) { if (!b) return '0 MB'; if (b >= 1e9) return (b / 1e9).toFixed(2).replace('.', ',') + ' GB'; if (b >= 1e6) return (b / 1e6).toFixed(1).replace('.', ',') + ' MB'; return Math.max(1, Math.round(b / 1e3)) + ' kB'; }
function fmtPrice(n) { return n == null ? '' : n.toFixed(2).replace('.', ','); }
function slug(s, n = 40) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n).replace(/-+$/, ''); }
function safeRef(s) { return String(s || '').replace(/^#/, '').replace(/[^A-Za-z0-9_-]+/g, '').slice(0, 20); }
const extOf = t => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[t] || 'jpg');
const typeOfName = n => { const e = (n.split('.').pop() || '').toLowerCase(); return e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : e === 'gif' ? 'image/gif' : 'image/jpeg'; };
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
  }
}
const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

/* ---------- Archivio locale (IndexedDB, con ripiego in memoria) ---------- */
const STORES = ['drafts', 'photos', 'thumbs', 'meta'];
const store = (() => {
  let dbp = null, memory = null;
  const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res) => {
      let r;
      try { r = indexedDB.open('bozze-vinted', 1); } catch (e) { res(null); return; }
      r.onupgradeneeded = () => { const db = r.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: s === 'meta' ? 'k' : 'id' }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
      r.onblocked = () => res(null);
    }).then(db => { if (!db) memory = Object.fromEntries(STORES.map(s => [s, new Map()])); return db; });
    return dbp;
  }
  const keyOf = (s, v) => s === 'meta' ? v.k : v.id;
  return {
    get persistent() { return !memory; },
    async ready() { await open(); return !memory; },
    async get(s, key) { const db = await open(); if (!db) return memory[s].get(key); return reqP(db.transaction(s).objectStore(s).get(key)); },
    async all(s) { const db = await open(); if (!db) return [...memory[s].values()]; return reqP(db.transaction(s).objectStore(s).getAll()); },
    async count(s) { const db = await open(); if (!db) return memory[s].size; return reqP(db.transaction(s).objectStore(s).count()); },
    async put(s, v) { const db = await open(); if (!db) { memory[s].set(keyOf(s, v), v); return; } return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).put(v); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }); },
    async del(s, key) { const db = await open(); if (!db) { memory[s].delete(key); return; } return new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'); tx.objectStore(s).delete(key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
    /* scrive più record in una transazione: ops = [[store, 'put'|'del', valore|chiave], ...] */
    async batch(ops) {
      const db = await open();
      if (!db) { for (const [s, op, v] of ops) op === 'put' ? memory[s].set(keyOf(s, v), v) : memory[s].delete(v); return; }
      const names = [...new Set(ops.map(o => o[0]))];
      return new Promise((res, rej) => { const tx = db.transaction(names, 'readwrite'); for (const [s, op, v] of ops) op === 'put' ? tx.objectStore(s).put(v) : tx.objectStore(s).delete(v); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abort')); });
    }
  };
})();
/* Alcuni Safari vecchi non salvano Blob in IndexedDB: in quel caso si salva l'ArrayBuffer. */
async function blobRecord(id, extra, blob) {
  return { id, ...extra, blob, type: blob.type, size: blob.size };
}
async function putPhotoAndThumb(photoRec, thumbRec) {
  try { await store.batch([['photos', 'put', photoRec], ['thumbs', 'put', thumbRec]]); }
  catch (e) {
    const p2 = { ...photoRec, blob: undefined, buf: await photoRec.blob.arrayBuffer() };
    const t2 = { ...thumbRec, blob: undefined, buf: await thumbRec.blob.arrayBuffer() };
    await store.batch([['photos', 'put', p2], ['thumbs', 'put', t2]]);
  }
}
const recBlob = r => r ? (r.blob instanceof Blob ? r.blob : (r.buf ? new Blob([r.buf], { type: r.type || 'image/jpeg' }) : null)) : null;

/* ---------- Impostazioni ---------- */
const DEFAULTS = { condition: '', parcel: '', noBrand: '', descTemplate: '' };
let settings = { ...DEFAULTS, ...(window.BV_PRESET || {}) };
async function loadSettings() {
  try { const r = await store.get('meta', 'settings'); if (r && r.v) settings = { ...DEFAULTS, ...r.v }; } catch (e) {}
  // regole passate nel link: #regole=<base64url del JSON>
  const m = location.hash.match(/^#regole=([A-Za-z0-9_\-]+)/);
  if (m) {
    try {
      const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(b64)));
      const v = JSON.parse(json);
      settings = { ...DEFAULTS, ...pick(v, Object.keys(DEFAULTS)) };
      await store.put('meta', { k: 'settings', v: settings });
      toast('Valori di partenza importati dal link');
    } catch (e) { toast('Il link delle regole non è valido'); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
}
const pick = (o, keys) => Object.fromEntries(keys.filter(k => typeof o[k] === 'string').map(k => [k, o[k]]));
function applyTemplate(t, ref) { return (t || '').split('{ref}').join(ref || ''); }

/* ---------- Stato ---------- */
let drafts = new Map();
let cur = null, filter = 'all', selPhoto = -1;
const pending = new Map();           // draftId -> [{tmp, localUrl, state, err, file}]
const thumbUrls = new Map();          // photoId -> objectURL
const saveTimers = new Map();
let confirmCb = null, catStack = [], openSheetId = null;
let deferredInstall = null;

function normalize(d) {
  return {
    id: d.id, createdAt: d.createdAt || Date.now(), updatedAt: d.updatedAt || Date.now(),
    ref: d.ref || '', title: d.title || '', description: d.description || '',
    category: d.category && Array.isArray(d.category.path) ? d.category : null, brand: d.brand || '', size: d.size || '',
    condition: d.condition || '', colors: Array.isArray(d.colors) ? d.colors : [], materials: Array.isArray(d.materials) ? d.materials : [],
    price: typeof d.price === 'number' ? d.price : null, parcel: d.parcel || '', unisex: !!d.unisex,
    photos: Array.isArray(d.photos) ? d.photos.filter(p => p && p.id) : [],
    status: d.status === 'uploaded' ? 'uploaded' : 'active', uploadedAt: d.uploadedAt || null, exportedAt: d.exportedAt || null
  };
}
function needsSize(d) { return !!(d.category && d.category.sizeGroup && d.category.sizeGroup !== 'none'); }
function missing(d) {
  const m = [];
  if (!d.photos.length) m.push('Foto');
  if (!d.title.trim()) m.push('Titolo');
  if (!d.description.trim()) m.push('Descrizione');
  if (!d.category) m.push('Categoria');
  if (!d.brand) m.push('Brand');
  if (needsSize(d) && !d.size) m.push('Taglia');
  if (!d.condition) m.push('Condizioni');
  if (!d.colors.length) m.push('Colore');
  if (!(d.price >= LIMITS.priceMin)) m.push('Prezzo');
  if (!d.parcel) m.push('Pacco');
  return m;
}
function statusOf(d) {
  if (d.status === 'uploaded') return 'uploaded';
  if (missing(d).length) return 'draft';
  if (d.exportedAt && d.exportedAt >= d.updatedAt) return 'exported';
  return 'ready';
}
const STATUS_LABEL = { draft: 'Incompleta', ready: 'Pronta', exported: 'Esportata', uploaded: 'Su Vinted' };

/* ---------- Salvataggio ---------- */
function setSaveBadge(t, cls) { const b = $('#saveBadge'); b.textContent = t; b.className = 'savebadge' + (cls ? ' ' + cls : ''); }
async function persist(d) {
  clearTimeout(saveTimers.get(d.id)); saveTimers.delete(d.id);
  try {
    await store.put('drafts', JSON.parse(JSON.stringify(normalize(d))));
    if (cur && cur.id === d.id) setSaveBadge('Salvato ✓', 'ok');
  } catch (e) {
    if (cur && cur.id === d.id) setSaveBadge('Non salvato', 'err');
    toast(e && e.name === 'QuotaExceededError' ? 'Memoria del telefono piena: libera spazio o esporta ed elimina bozze' : 'Salvataggio non riuscito, riprovo');
    if (!(e && e.name === 'QuotaExceededError')) setTimeout(() => persist(d), 2000);
  }
}
function touch(d = cur, delay = 400) {
  if (!d) return; d.updatedAt = Date.now(); drafts.set(d.id, d);
  if (cur && cur.id === d.id) { setSaveBadge('Salvataggio…'); renderStatus(); }
  clearTimeout(saveTimers.get(d.id)); saveTimers.set(d.id, setTimeout(() => persist(d), delay));
}
function flushAll() { for (const id of [...saveTimers.keys()]) { const d = drafts.get(id); if (d) persist(d); } }

/* ---------- Miniature ---------- */
async function thumbUrl(id) {
  if (thumbUrls.has(id)) return thumbUrls.get(id);
  const r = await store.get('thumbs', id).catch(() => null);
  const b = recBlob(r); if (!b) return '';
  const u = URL.createObjectURL(b); thumbUrls.set(id, u); return u;
}
function dropThumb(id) { const u = thumbUrls.get(id); if (u) { URL.revokeObjectURL(u); thumbUrls.delete(id); } }
async function hydrate(img) { const id = img.dataset.tid; if (!id || img.dataset.done) return; img.dataset.done = '1'; const u = await thumbUrl(id); if (u) img.src = u; }
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); hydrate(e.target); } }), { rootMargin: '300px' }) : null;
function hydrateIn(root, lazy) { $$('img[data-tid]:not([data-done])', root).forEach(img => (lazy && io) ? io.observe(img) : hydrate(img)); }

/* ---------- Lista ---------- */
function renderList() {
  const arr = [...drafts.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const c = { all: arr.length, draft: 0, ready: 0, exported: 0, uploaded: 0 };
  arr.forEach(d => c[statusOf(d)]++);
  $('#cAll').textContent = c.all; $('#cDraft').textContent = c.draft; $('#cReady').textContent = c.ready; $('#cExp').textContent = c.exported; $('#cUp').textContent = c.uploaded;
  const sub = [c.ready && `${c.ready} pront${c.ready === 1 ? 'a' : 'e'} da esportare`, c.draft && `${c.draft} da completare`, c.exported && `${c.exported} esportat${c.exported === 1 ? 'a' : 'e'}`].filter(Boolean);
  $('#listSub').textContent = sub.length ? sub.join(' · ') : (c.all ? `${c.all} su Vinted` : 'Tutto salvato in questo telefono');
  const list = filter === 'all' ? arr : arr.filter(d => statusOf(d) === filter);
  const el = $('#cards');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><strong>${c.all ? 'Nessuna bozza qui' : 'Nessuna bozza ancora'}</strong>${c.all ? 'Cambia filtro per vedere le altre.' : 'Tocca <b>Nuova bozza</b> e compila il modulo come su Vinted: foto, titolo, descrizione, categoria, brand, taglia, condizioni, colore, prezzo e pacco.'}</div>`;
  } else {
    el.innerHTML = list.map(d => {
      const s = statusOf(d), ph = d.photos[0];
      const cat = d.category ? d.category.path[d.category.path.length - 1] : '';
      const meta = [cat, d.size, d.brand].filter(Boolean).join(' · ');
      return `<button class="card" data-id="${esc(d.id)}">
        <span class="cover">${ph ? `<img data-tid="${esc(ph.id)}" alt="">` : ''}${d.photos.length ? `<span class="n">${d.photos.length}</span>` : ''}</span>
        <span class="body">
          <span class="t${d.title ? '' : ' untitled'}">${esc(d.title || 'Senza titolo')}</span>
          <span class="m">${esc(meta) || '<i>categoria da scegliere</i>'}</span>
          <span class="foot"><span class="pill ${s}">${STATUS_LABEL[s]}</span>${d.price != null ? `<span class="p">${fmtPrice(d.price)} €</span>` : ''}${d.ref ? `<span class="ref">${esc(d.ref)}</span>` : ''}</span>
        </span></button>`;
    }).join('');
    hydrateIn(el, true);
  }
  renderBackupBanner(c.ready);
}
async function refreshMeter() {
  const photos = [...drafts.values()].reduce((a, d) => a + d.photos.length, 0);
  const bytes = [...drafts.values()].reduce((a, d) => a + d.photos.reduce((x, p) => x + (p.bytes || 0), 0), 0);
  const m = $('#meter');
  if (!drafts.size) { m.hidden = true; return; }
  m.hidden = false;
  let quota = 0, usage = 0;
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); quota = e.quota || 0; usage = e.usage || 0; } } catch (e) {}
  $('#meterTxt').textContent = `${photos} foto originali · ${fmtBytes(bytes)}` + (quota ? ` · spazio libero per l'app: ${fmtBytes(Math.max(0, quota - usage))}` : '');
  $('#meterBar').style.width = (quota ? Math.min(100, usage / quota * 100) : 0) + '%';
  const sb = $('#bannerStorage');
  if (quota && quota - usage < 600e6) { sb.hidden = false; sb.innerHTML = `<div><b>Spazio quasi finito.</b> Restano circa ${fmtBytes(quota - usage)} per le foto. Esporta le bozze pronte e poi eliminale, oppure libera memoria sul telefono.</div>`; }
  else sb.hidden = true;
}
function renderBackupBanner(ready) {
  const b = $('#bannerBackup');
  if (PREVIEW || ready < 10 || ss.get('bv-backup-off')) { b.hidden = true; return; }
  b.hidden = false; $('#backupTxt').innerHTML = `<b>${ready} bozze pronte non ancora esportate.</b> Esportarle le mette al sicuro e le prepara per Claude.`;
}

/* ---------- Editor ---------- */
const navOK = !PREVIEW && !!(window.history && history.pushState);
function openEditor(d, isNew) {
  cur = d; selPhoto = -1;
  $('#listView').hidden = true; $('#editorView').hidden = false; window.scrollTo(0, 0);
  setSaveBadge(isNew ? 'Nuova bozza' : 'Salvato ✓', isNew ? '' : 'ok');
  renderEditor();
  ss.set('bv-open', d.id);
  if (navOK) { try { history.pushState({ bv: 'editor' }, ''); } catch (e) {} }
  if (isNew) { drafts.set(d.id, d); touch(d, 50); }
}
function navBack() {
  if (navOK && history.state && history.state.bv === 'editor') history.back();
  else closeEditorNow();
}
async function closeEditorNow() {
  if (!cur) return;
  const d = cur;
  closeSheetNow();
  $('#editorView').hidden = true; $('#listView').hidden = false; window.scrollTo(0, 0);
  cur = null; ss.set('bv-open', '');
  const isEmpty = !d.title && !d.photos.length && !(pending.get(d.id) || []).length && !d.category && !d.brand && d.price == null && !d.ref && d.description === applyTemplate(settings.descTemplate, '');
  if (isEmpty) { clearTimeout(saveTimers.get(d.id)); saveTimers.delete(d.id); drafts.delete(d.id); try { await store.del('drafts', d.id); } catch (e) {} }
  else if (saveTimers.has(d.id)) await persist(d);
  renderList(); refreshMeter();
}
function setRow(id, val, swatch) {
  const v = $('#' + id + ' .v');
  if (val) { v.classList.remove('ph'); v.innerHTML = esc(val) + (swatch || ''); } else { v.classList.add('ph'); v.textContent = 'Seleziona'; }
}
function swatchHtml(hex, cls) { return `<span class="${cls} ${hex === 'multi' ? 'multi' : hex === 'clear' ? 'clear' : ''}" style="${hex.startsWith('#') ? 'background:' + hex : ''}"></span>`; }
function renderEditor() {
  const d = cur; if (!d) return;
  $('#fRef').value = d.ref;
  $('#fTitle').value = d.title; updCount('#cTitle', d.title.length, LIMITS.title);
  $('#fDesc').value = d.description; updCount('#cDesc', d.description.length, LIMITS.desc); autoGrow($('#fDesc'));
  setRow('rCategory', d.category ? d.category.path.join(' › ') : '');
  setRow('rBrand', d.brand);
  $('#rSize').hidden = !needsSize(d); setRow('rSize', d.size);
  setRow('rCondition', d.condition);
  setRow('rColor', d.colors.join(', '), d.colors.map(c => { const col = COLORS.find(x => x[0] === c); return col ? swatchHtml(col[1], 'sw') : ''; }).join(''));
  setRow('rMaterial', d.materials.join(', '));
  if (document.activeElement !== $('#fPrice')) $('#fPrice').value = d.price == null ? '' : fmtPrice(d.price);
  setRow('rParcel', d.parcel);
  $('#fUnisex').checked = d.unisex;
  const s = statusOf(d), box = $('#stateBox');
  box.hidden = !(s === 'uploaded' || d.exportedAt);
  if (s === 'uploaded') { $('#stateLbl').textContent = 'Caricata su Vinted'; $('#stateTxt').textContent = (d.uploadedAt ? 'Segnata il ' + new Date(d.uploadedAt).toLocaleDateString('it-IT') + '. ' : '') + 'Le modifiche fatte qui non arrivano su Vinted.'; }
  else if (d.exportedAt) { $('#stateLbl').textContent = 'Esportazione'; $('#stateTxt').textContent = 'Esportata il ' + new Date(d.exportedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) + (s === 'exported' ? '.' : '. L\'hai modificata dopo: esportala di nuovo.'); }
  $('#mUploadedTxt').textContent = d.status === 'uploaded' ? 'Riporta tra le bozze' : 'Segna come caricata su Vinted';
  renderPhotos(); renderStatus();
}
function updCount(sel, n, max) { const e = $(sel); e.textContent = n + '/' + max; e.classList.toggle('over', n >= max); }
function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.max(120, t.scrollHeight + 2) + 'px'; }
function renderStatus() {
  const d = cur; if (!d) return;
  const s = statusOf(d), m = missing(d), box = $('#statusTxt');
  const busy = (pending.get(d.id) || []).filter(p => p.state !== 'err').length;
  box.className = 'txt ' + s;
  if (busy) box.innerHTML = `<b>Salvo le foto…</b><span>${busy} in corso, non chiudere l'app.</span>`;
  else if (s === 'uploaded') box.innerHTML = '<b>Su Vinted</b><span>Questa bozza è già stata caricata.</span>';
  else if (s === 'exported') box.innerHTML = '<b>Esportata</b><span>Pronta per Claude.</span>';
  else if (s === 'ready') box.innerHTML = '<b>Pronta</b><span>Tutti i campi sono compilati.</span>';
  else box.innerHTML = `<b>Incompleta</b><span>Manca: ${esc(m.join(', '))}</span>`;
}
function renderPhotos() {
  const d = cur; if (!d) return;
  const pend = pending.get(d.id) || [];
  const grid = $('#photos'), n = d.photos.length, total = n + pend.length;
  $('#photoCount').textContent = total ? `· ${total}/${LIMITS.photos}` : '';
  $('#addBig').hidden = total > 0;
  grid.hidden = total === 0;
  if (selPhoto >= n) selPhoto = -1;
  grid.innerHTML = d.photos.map((p, i) => `<button class="tile${i === selPhoto ? ' sel' : ''}" data-i="${i}" aria-label="Foto ${i + 1}${i === 0 ? ', copertina' : ''}"><img data-tid="${esc(p.id)}" alt="">${i === 0 ? '<span class="tag">Copertina</span>' : ''}</button>`).join('')
    + pend.map((p, j) => `<button class="tile" data-p="${j}" aria-label="Foto in caricamento"><img src="${p.localUrl}" alt="">${p.state === 'err' ? `<span class="st err">${esc(p.err || 'Errore')}<br>tocca per togliere</span>` : '<span class="st"><span class="spin" aria-hidden="true"></span></span>'}</button>`).join('')
    + (total < LIMITS.photos ? `<button class="addtile" id="addMore"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Aggiungi</button>` : '');
  hydrateIn(grid, false);
  $('#photoActions').hidden = selPhoto < 0;
  if (selPhoto >= 0) { $('#paCover').disabled = selPhoto === 0; $('#paLeft').disabled = selPhoto === 0; $('#paRight').disabled = selPhoto === n - 1; }
  const info = $('#photoInfo');
  if (n) { const b = d.photos.reduce((a, p) => a + (p.bytes || 0), 0); info.hidden = false; info.textContent = `${n} foto originali · ${fmtBytes(b)}` + (d.photos.some(p => p.converted) ? ' · alcune convertite in JPG' : '') + (selPhoto < 0 && n > 1 ? ' · tocca una foto per spostarla' : ''); }
  else info.hidden = true;
}

/* ---------- Foto: salvataggio in originale ---------- */
const KEEP = new Set(['image/jpeg', 'image/png', 'image/webp']);
function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => rej(new Error('decode')); im.src = src; }); }
function toJpeg(im, maxPixels, q, maxSide) {
  const W = im.naturalWidth, H = im.naturalHeight;
  let s = 1; if (maxSide) s = Math.min(1, maxSide / Math.max(W, H)); if (maxPixels && W * H * s * s > maxPixels) s = Math.sqrt(maxPixels / (W * H));
  const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob(b => { c.width = c.height = 0; b ? res(b) : rej(new Error('canvas')); }, 'image/jpeg', q));
}
async function processImage(blobIn, nameHint) {
  let type = (blobIn.type || typeOfName(nameHint || '')).toLowerCase();
  const url = URL.createObjectURL(blobIn);
  try {
    let im;
    try { im = await loadImg(url); }
    catch (e) { throw Object.assign(new Error('decode'), { msg: /hei[cf]/i.test(type + ' ' + (nameHint || '')) ? 'Formato HEIC non letto: scegli JPG' : 'Foto non leggibile' }); }
    let blob = blobIn, converted = false;
    if (!KEEP.has(type)) { blob = await toJpeg(im, 16e6, 0.95); type = 'image/jpeg'; converted = true; }
    else if (!(blob instanceof Blob) || blob.type !== type) blob = blob.slice(0, blob.size, type);
    const thumb = await toJpeg(im, 0, 0.8, 480);
    return { blob, type, w: im.naturalWidth, h: im.naturalHeight, thumb, converted };
  } finally { URL.revokeObjectURL(url); }
}
let photoChain = Promise.resolve();
function addFiles(fileList) {
  const d = cur; if (!d) return;
  const files = Array.from(fileList || []).filter(f => f && f.size);
  const pend = pending.get(d.id) || []; pending.set(d.id, pend);
  const room = LIMITS.photos - d.photos.length - pend.length;
  if (files.length > room) toast(room > 0 ? `Massimo 20 foto: ne aggiungo ${room}` : 'Hai già 20 foto, il massimo di Vinted');
  const items = files.slice(0, Math.max(0, room)).map(f => ({ tmp: uid(), file: f, localUrl: URL.createObjectURL(f), state: 'wait' }));
  if (!items.length) return;
  pend.push(...items); renderPhotos(); renderStatus();
  askPersist();
  for (const it of items) photoChain = photoChain.then(() => saveOne(d, it)).catch(() => {});
  photoChain.then(() => { refreshMeter(); });
}
async function saveOne(d, it) {
  const pend = pending.get(d.id) || [];
  if (!pend.includes(it)) return;
  try {
    const r = await processImage(it.file, it.file.name);
    const id = uid();
    await putPhotoAndThumb(await blobRecord(id, { draftId: d.id }, r.blob), await blobRecord(id, {}, r.thumb));
    thumbUrls.set(id, URL.createObjectURL(r.thumb));
    d.photos.push({ id, w: r.w, h: r.h, bytes: r.blob.size, type: r.type, name: it.file.name || '', converted: r.converted || undefined });
    pend.splice(pend.indexOf(it), 1); URL.revokeObjectURL(it.localUrl);
    touch(d, 150);
  } catch (e) {
    it.state = 'err';
    it.err = e && e.msg ? e.msg : (e && e.name === 'QuotaExceededError' ? 'Memoria piena' : 'Non salvata');
  }
  if (cur === d) { renderPhotos(); renderStatus(); }
}
async function deletePhotoAt(i) {
  const d = cur; const p = d.photos[i]; if (!p) return;
  d.photos.splice(i, 1); selPhoto = -1; renderPhotos(); touch(d, 100);
  try { await store.batch([['photos', 'del', p.id], ['thumbs', 'del', p.id]]); } catch (e) {}
  dropThumb(p.id); refreshMeter();
}
let persistAsked = false;
async function askPersist() {
  if (persistAsked || PREVIEW) return; persistAsked = true;
  try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) {}
}

/* ---------- Fogli dal basso ---------- */
function openSheet(id) { closeSheetNow(); openSheetId = id; $('#scrim').classList.add('open'); $('#' + id).classList.add('open'); }
function closeSheetNow() { if (!openSheetId) return; $('#' + openSheetId).classList.remove('open'); $('#scrim').classList.remove('open'); openSheetId = null; }

function renderCat() {
  const q = $('#catSearch').value.trim().toLowerCase();
  const list = $('#catList'), crumb = $('#catCrumb');
  $('#catBack').style.visibility = catStack.length && !q ? 'visible' : 'hidden';
  if (q.length >= 2) {
    const words = q.split(/\s+/);
    const hits = LEAVES.filter(l => { const hay = l.path.join(' ').toLowerCase(); return words.every(w => hay.includes(w)); })
      .sort((a, b) => (b.label.toLowerCase().includes(q) - a.label.toLowerCase().includes(q))).slice(0, 80);
    crumb.textContent = hits.length ? `${hits.length} risultat${hits.length === 1 ? 'o' : 'i'}` : 'Nessuna categoria trovata';
    list.innerHTML = hits.map((l, i) => `<button class="opt" data-leaf="${i}"><span class="t">${esc(l.label)}<span class="path">${esc(l.path.slice(0, -1).join(' › '))}</span></span>${CHEV}</button>`).join('');
    $$('[data-leaf]', list).forEach(b => b.onclick = () => pickCat(hits[+b.dataset.leaf]));
    return;
  }
  let node = CATS; for (const k of catStack) node = node[k];
  crumb.textContent = catStack.length ? catStack.join(' › ') : 'Scegli la sezione';
  const entries = Object.entries(node);
  list.innerHTML = entries.map(([k, v], i) => { const leaf = typeof v === 'string'; const on = leaf && cur && cur.category && cur.category.path.join('/') === [...catStack, k].join('/'); return `<button class="opt" data-i="${i}"${leaf ? ` role="radio" aria-checked="${!!on}"` : ''}><span class="t">${esc(k)}</span>${leaf ? '<span class="radio"></span>' : CHEV}</button>`; }).join('');
  $$('[data-i]', list).forEach(b => b.onclick = () => { const [k, v] = entries[+b.dataset.i]; if (typeof v === 'string') pickCat({ label: k, path: [...catStack, k], sizeGroup: v }); else { catStack.push(k); renderCat(); $('.bd', $('#shCategory')).scrollTop = 0; } });
}
function pickCat(leaf) {
  const d = cur; const prev = d.category && d.category.sizeGroup;
  d.category = { path: leaf.path, sizeGroup: leaf.sizeGroup };
  if (prev !== leaf.sizeGroup && d.size && !(SIZES[leaf.sizeGroup] || []).includes(d.size)) d.size = '';
  if (leaf.sizeGroup === 'none') d.size = '';
  if (leaf.sizeGroup === 'one') d.size = 'Taglia unica';
  touch(); renderEditor(); closeSheetNow();
  if (needsSize(d) && !d.size) setTimeout(openSize, 260);
}
function openSize() {
  const d = cur; if (!d || !d.category) return; const opts = SIZES[d.category.sizeGroup] || [];
  $('#sizeList').innerHTML = opts.map((s, i) => `<button class="opt" role="radio" data-i="${i}" aria-checked="${d.size === s}"><span class="t">${esc(s)}</span><span class="radio"></span></button>`).join('');
  $$('#sizeList [data-i]').forEach(b => b.onclick = () => { d.size = opts[+b.dataset.i]; touch(); renderEditor(); closeSheetNow(); });
  openSheet('shSize');
}
function renderBrand() {
  const q = $('#brandSearch').value.trim(), ql = q.toLowerCase();
  const d = cur; const rows = [];
  const noBrand = settings.noBrand || 'Nessun brand';
  if (!q) rows.push({ label: settings.noBrand ? `Senza marca → ${settings.noBrand}` : 'Nessun brand', value: noBrand, special: true });
  const hits = BRANDS.filter(b => b !== 'Nessun brand' && (!ql || b.toLowerCase().includes(ql))).sort((a, b) => (b.toLowerCase().startsWith(ql) - a.toLowerCase().startsWith(ql))).slice(0, q ? 12 : 60);
  hits.forEach(b => rows.push({ label: b, value: b }));
  if (q && !BRANDS.some(b => b.toLowerCase() === ql)) rows.push({ label: `Usa «${q}» così com'è`, value: q, special: true });
  $('#brandList').innerHTML = rows.map((r, i) => `<button class="opt${r.special ? ' special' : ''}" role="radio" data-i="${i}" aria-checked="${d.brand === r.value}"><span class="t">${esc(r.label)}</span><span class="radio"></span></button>`).join('');
  $$('#brandList [data-i]').forEach(b => b.onclick = () => { d.brand = rows[+b.dataset.i].value; touch(); renderEditor(); closeSheetNow(); });
}
function renderColors() {
  const d = cur;
  $('#colorList').innerHTML = COLORS.map(([n, h], i) => `<button class="opt" role="checkbox" data-i="${i}" aria-checked="${d.colors.includes(n)}">${swatchHtml(h, 'sw')}<span class="t">${esc(n)}</span><span class="check"></span></button>`).join('');
  $$('#colorList [data-i]').forEach(b => b.onclick = () => {
    const n = COLORS[+b.dataset.i][0];
    if (d.colors.includes(n)) d.colors = d.colors.filter(x => x !== n);
    else if (d.colors.length >= LIMITS.colors) { toast('Vinted accetta al massimo 2 colori'); return; }
    else d.colors = [...d.colors, n];
    touch(); renderEditor(); b.setAttribute('aria-checked', d.colors.includes(n));
  });
}
function renderMaterials() {
  const d = cur;
  $('#materialList').innerHTML = MATERIALS.map((n, i) => `<button class="opt" role="checkbox" data-i="${i}" aria-checked="${d.materials.includes(n)}"><span class="t">${esc(n)}</span><span class="check"></span></button>`).join('');
  $$('#materialList [data-i]').forEach(b => b.onclick = () => {
    const n = MATERIALS[+b.dataset.i];
    if (d.materials.includes(n)) d.materials = d.materials.filter(x => x !== n);
    else if (d.materials.length >= LIMITS.materials) { toast('Vinted accetta al massimo 3 materiali'); return; }
    else d.materials = [...d.materials, n];
    touch(); renderEditor(); b.setAttribute('aria-checked', d.materials.includes(n));
  });
}
function renderRadioSheet(listId, data, get, set) {
  $('#' + listId).innerHTML = data.map(([n, desc], i) => `<button class="opt" role="radio" data-i="${i}" aria-checked="${get() === n}"><span class="t">${esc(n)}<small>${esc(desc)}</small></span><span class="radio"></span></button>`).join('');
  $$('#' + listId + ' [data-i]').forEach(b => b.onclick = () => { set(data[+b.dataset.i][0]); touch(); renderEditor(); closeSheetNow(); });
}
function askConfirm(title, text, okLabel, cb) { $('#confirmT').textContent = title; $('#confirmP').textContent = text; $('#confirmOk').textContent = okLabel; confirmCb = cb; openSheet('shConfirm'); }

/* ---------- Impostazioni ---------- */
async function renderSettings() {
  $('#sCondition').innerHTML = `<option value="">— nessuna —</option>` + CONDITIONS.map(c => `<option ${settings.condition === c[0] ? 'selected' : ''}>${esc(c[0])}</option>`).join('');
  $('#sParcel').innerHTML = `<option value="">— nessuna —</option>` + PARCELS.map(c => `<option ${settings.parcel === c[0] ? 'selected' : ''}>${esc(c[0])}</option>`).join('');
  $('#sNoBrand').value = settings.noBrand; $('#sTemplate').value = settings.descTemplate;
  $('#appVersion').textContent = 'Versione ' + VERSION + '.';
  const n = drafts.size, photos = [...drafts.values()].reduce((a, d) => a + d.photos.length, 0);
  $('#stDrafts').textContent = n; $('#stPhotos').textContent = photos;
  let usage = 0, quota = 0, persisted = null;
  try { const e = await navigator.storage.estimate(); usage = e.usage; quota = e.quota; } catch (e) {}
  try { persisted = await navigator.storage.persisted(); } catch (e) {}
  $('#stUsage').textContent = usage ? fmtBytes(usage) : '–';
  $('#stQuota').textContent = quota ? fmtBytes(Math.max(0, quota - usage)) : '–';
  $('#stPersist').textContent = !store.persistent ? 'No (solo anteprima)' : persisted === true ? 'Sì' : persisted === false ? (isStandalone() ? 'Non garantita' : 'Installa l\'app') : '–';
}

/* ---------- Esportazione ---------- */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
async function crcBlob(blob) {
  let crc = 0xFFFFFFFF; const CH = 4 * 1024 * 1024;
  for (let o = 0; o < blob.size; o += CH) { const u = new Uint8Array(await blob.slice(o, o + CH).arrayBuffer()); for (let i = 0; i < u.length; i++) crc = CRC_TABLE[(crc ^ u[i]) & 0xFF] ^ (crc >>> 8); }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function dosTime(dt) { return { time: (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1), date: ((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate() }; }
/* ZIP "store" (senza compressione: le foto restano byte per byte identiche) */
async function makeZip(entries) {
  const enc = new TextEncoder(), parts = [], central = []; let offset = 0;
  const { time, date } = dosTime(new Date());
  for (const e of entries) {
    const nb = enc.encode(e.name), size = e.blob.size, crc = await crcBlob(e.blob);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
    lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
    parts.push(lh.buffer, nb, e.blob);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
    ch.setUint16(28, nb.length, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
    central.push(ch.buffer, nb);
    offset += 30 + nb.length + size;
  }
  const cdSize = central.reduce((a, b) => a + b.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}
function packName(d) { const r = safeRef(d.ref) || ('bozza-' + d.id.slice(0, 6)); const s = slug(d.title, 40); return r + (s ? '_' + s : ''); }
function scheda(d, files) {
  const iso = t => t ? new Date(t).toISOString() : null;
  return {
    formato: FORMAT, app: 'Bozze per Vinted ' + VERSION, id: d.id,
    referenza: d.ref || null, titolo: d.title, descrizione: d.description,
    categoria: d.category ? d.category.path : null, gruppo_taglie: d.category ? d.category.sizeGroup : null,
    brand: d.brand || null, taglia: d.size || null, condizioni: d.condition || null,
    colori: d.colors, materiali: d.materials, prezzo: d.price, valuta: 'EUR', pacco: d.parcel || null, unisex: d.unisex,
    foto: files.map(f => f.file),
    foto_dettagli: files.map(f => ({ file: f.file, larghezza: f.w || null, altezza: f.h || null, byte: f.bytes || null, nome_originale: f.name || null })),
    completa: missing(d).length === 0, mancano: missing(d),
    stato: statusOf(d) === 'uploaded' ? 'caricata_su_vinted' : 'bozza',
    creata: iso(d.createdAt), modificata: iso(d.updatedAt), esportata: new Date().toISOString()
  };
}
function schedaTxt(s) {
  const L = [];
  L.push('BOZZA PER VINTED' + (s.referenza ? ' — ' + s.referenza : ''), '');
  L.push('Titolo: ' + s.titolo, '', 'Descrizione:', s.descrizione, '');
  L.push('Categoria: ' + (s.categoria ? s.categoria.join(' > ') : '—'));
  L.push('Brand: ' + (s.brand || '—'));
  L.push('Taglia: ' + (s.taglia || '—'));
  L.push('Condizioni: ' + (s.condizioni || '—'));
  L.push('Colori: ' + (s.colori.join(', ') || '—'));
  L.push('Materiali: ' + (s.materiali.join(', ') || '—'));
  L.push('Prezzo: ' + (s.prezzo != null ? s.prezzo.toFixed(2).replace('.', ',') + ' €' : '—'));
  L.push('Dimensioni del pacco: ' + (s.pacco || '—'));
  L.push('Unisex: ' + (s.unisex ? 'sì' : 'no'), '');
  L.push(`Foto (${s.foto.length}, in ordine; la prima è la copertina): ` + s.foto.join(', '));
  if (s.mancano.length) L.push('', 'ATTENZIONE, mancano: ' + s.mancano.join(', '));
  return L.join('\n') + '\n';
}
async function buildPack(d) {
  const files = [], entries = [];
  d.photos.forEach((p, i) => files.push({ ...p, file: 'foto-' + String(i + 1).padStart(2, '0') + '.' + extOf(p.type) }));
  const s = scheda(d, files);
  entries.push({ name: 'scheda.json', blob: new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }) });
  entries.push({ name: 'scheda.txt', blob: new Blob([schedaTxt(s)], { type: 'text/plain' }) });
  for (const f of files) {
    const r = await store.get('photos', f.id); const b = recBlob(r);
    if (!b) throw Object.assign(new Error('missing'), { msg: 'Foto mancante in «' + (d.title || 'bozza') + '»' });
    entries.push({ name: f.file, blob: b });
  }
  const zip = await makeZip(entries);
  return new File([zip], packName(d) + '.zip', { type: 'application/zip' });
}
const canShareFiles = (() => { try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.zip', { type: 'application/zip' })] })); } catch (e) { return false; } })();
let exp = { mode: 'select', sel: new Set(), groups: [] };
const GROUP_BYTES = 200e6, GROUP_MAX = 6;
function estSize(d) { return d.photos.reduce((a, p) => a + (p.bytes || 0), 0) + 4000; }
function openExport(onlyId) {
  if (onlyId) { exp = { mode: 'groups', sel: new Set([onlyId]), groups: [] }; makeGroups(); }
  else { exp = { mode: 'select', sel: new Set([...drafts.values()].filter(d => statusOf(d) === 'ready').map(d => d.id)), groups: [] }; }
  renderExport(); openSheet('shExport');
  if (exp.mode === 'groups') prepareGroup(0);
}
function makeGroups() {
  const list = [...drafts.values()].filter(d => exp.sel.has(d.id)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const groups = []; let g = null;
  for (const d of list) { const sz = estSize(d); if (!g || (g.ids.length >= GROUP_MAX) || (g.bytes + sz > GROUP_BYTES && g.ids.length)) { g = { ids: [], bytes: 0, state: 'idle', files: null, err: '' }; groups.push(g); } g.ids.push(d.id); g.bytes += sz; }
  exp.groups = groups;
}
function claudePrompt() {
  return `Ho delle bozze di annunci preparate con l'app «Bozze per Vinted» (formato ${FORMAT}). Sono pacchetti ZIP, uno per articolo, che ho salvato qui: [SCRIVI DOVE LI HAI SALVATI, es. Google Drive › Bozze Vinted].

Ogni ZIP contiene scheda.json (titolo, descrizione, categoria, brand, taglia, condizioni, colori, materiali, prezzo, dimensioni del pacco) e le foto originali foto-01.jpg, foto-02.jpg… già nell'ordine giusto (la 01 è la copertina).

Per ogni pacchetto, uno alla volta:
1. apri vinted.it/items/new nel mio Chrome (sono già connesso);
2. carica tutte le foto nell'ordine, senza ridurle o modificarle;
3. compila titolo, descrizione, categoria (segui esattamente il percorso della scheda), brand, taglia, condizioni, colori, materiali (solo se presenti), prezzo e dimensioni del pacco;
4. salva come BOZZA, non pubblicare;
5. aspetta circa 60 secondi prima del prossimo articolo.

Alla fine dimmi quali bozze sono state salvate e quali no, con la referenza di ciascuna.`;
}
function renderExport() {
  const body = $('#exportBody');
  if (exp.mode === 'select') {
    const all = [...drafts.values()].filter(d => d.photos.length).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const selList = all.filter(d => exp.sel.has(d.id));
    const bytes = selList.reduce((a, d) => a + estSize(d), 0);
    const nGroups = selList.length ? (() => { const save = exp.groups; makeGroups(); const n = exp.groups.length; exp.groups = save; return n; })() : 0;
    body.innerHTML = `
      <p>Ogni bozza diventa un pacchetto ZIP con le <b>foto originali</b> e una scheda con tutti i campi. Salva i pacchetti dove Claude potrà prenderli: una cartella di <b>Google Drive</b>, <b>iCloud Drive</b> o il <b>computer</b> (AirDrop, cavo). Sono anche il tuo backup.</p>
      ${PREVIEW ? '<div class="banner warn"><div>Nell\'anteprima l\'esportazione è disattivata. Funziona nell\'app installata.</div></div>' : ''}
      <div class="sel-all"><span>${selList.length} selezionat${selList.length === 1 ? 'a' : 'e'} · ${fmtBytes(bytes)}${nGroups ? ` · ${nGroups} invi${nGroups === 1 ? 'o' : 'i'}` : ''}</span><span class="links"><button id="xReady">Pronte</button> · <button id="xAll">Tutte</button> · <button id="xNone">Nessuna</button></span></div>
      <div id="xList">${all.length ? all.map(d => { const s = statusOf(d); return `<button class="opt" role="checkbox" data-id="${esc(d.id)}" aria-checked="${exp.sel.has(d.id)}"><span class="mini">${d.photos[0] ? `<img data-tid="${esc(d.photos[0].id)}" alt="">` : ''}</span><span class="t">${esc(d.title || 'Senza titolo')}<small>${esc([d.ref, STATUS_LABEL[s], d.photos.length + ' foto', fmtBytes(estSize(d))].filter(Boolean).join(' · '))}</small></span><span class="check"></span></button>`; }).join('') : '<p>Nessuna bozza con foto da esportare.</p>'}</div>
      <div style="padding:12px 4px"><button class="btn" id="xGo" style="width:100%" ${selList.length && !PREVIEW ? '' : 'disabled'}>Prepara ${selList.length || ''} pacchett${selList.length === 1 ? 'o' : 'i'}</button></div>
      <h4>Istruzioni per Claude</h4>
      <p>Quando i pacchetti sono salvati, apri Claude nel browser del computer (con Claude in Chrome e Vinted già connesso) e incolla questo messaggio, completando il punto tra parentesi.</p>
      <div class="prompt" id="xPrompt">${esc(claudePrompt())}</div>
      <div style="padding:4px 4px 12px"><button class="btn ghost" id="xCopy" style="width:100%">Copia istruzioni</button></div>
      <h4>Importa pacchetti</h4>
      <p>Per ripristinare un backup o spostare le bozze su un altro telefono: scegli uno o più pacchetti ZIP esportati da quest'app.</p>
      <div style="padding:4px 4px 16px"><button class="btn ghost" id="xImport" style="width:100%" ${PREVIEW ? 'disabled' : ''}>Importa pacchetti ZIP</button><input type="file" id="importInput" accept=".zip,application/zip,application/x-zip-compressed" multiple class="sr" tabindex="-1" aria-hidden="true"></div>`;
    hydrateIn(body, true);
    $$('#xList [data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id; exp.sel.has(id) ? exp.sel.delete(id) : exp.sel.add(id); const y = body.scrollTop; renderExport(); $('#exportBody').scrollTop = y; });
    $('#xReady').onclick = () => { exp.sel = new Set(all.filter(d => statusOf(d) === 'ready').map(d => d.id)); renderExport(); };
    $('#xAll').onclick = () => { exp.sel = new Set(all.map(d => d.id)); renderExport(); };
    $('#xNone').onclick = () => { exp.sel = new Set(); renderExport(); };
    $('#xGo').onclick = () => { makeGroups(); exp.mode = 'groups'; renderExport(); body.scrollTop = 0; prepareGroup(0); };
    $('#xCopy').onclick = async () => toast(await copyText(claudePrompt()) ? 'Istruzioni copiate' : 'Seleziona il testo e copialo a mano');
    $('#xImport').onclick = () => { const f = $('#importInput'); f.value = ''; f.click(); };
    $('#importInput').onchange = e => importZips(e.target.files);
    return;
  }
  // gruppi
  const total = exp.groups.length, done = exp.groups.filter(g => g.state === 'done').length;
  body.innerHTML = `
    <p>${canShareFiles ? 'Tocca <b>Condividi</b> per ogni invio e scegli dove salvare: <b>Salva su File</b> (iCloud Drive o «Sul mio iPhone»), <b>Drive</b>, oppure AirDrop verso il computer.' : 'Tocca <b>Scarica</b> per ogni invio: i pacchetti finiscono nella cartella Download.'} Usa sempre la stessa cartella.</p>
    <div class="sel-all"><span>${done} di ${total} invi${total === 1 ? 'o' : 'i'} completat${done === 1 ? 'o' : 'i'}</span><span><button id="xBack">Cambia selezione</button></span></div>
    ${exp.groups.map((g, i) => {
      const names = g.ids.map(id => drafts.get(id)).filter(Boolean).map(d => d.ref || d.title || 'bozza');
      let act = '';
      if (g.state === 'done') act = `<span class="done">Fatto ✓</span>${canShareFiles ? ` <button class="btn ghost small" data-share="${i}">Di nuovo</button>` : ''}`;
      else if (g.state === 'ready') act = canShareFiles ? `<button class="btn small" data-share="${i}">Condividi</button>` : `<button class="btn small" data-dl="${i}">Scarica</button>`;
      else if (g.state === 'busy') act = '<span class="spin dark" aria-label="Preparazione"></span>';
      else if (g.state === 'err') act = `<button class="btn ghost small" data-prep="${i}">Riprova</button>`;
      else act = `<button class="btn ghost small" data-prep="${i}">Prepara</button>`;
      return `<div class="grp"><div class="t"><b>Invio ${i + 1} · ${g.ids.length} pacchett${g.ids.length === 1 ? 'o' : 'i'} · ${fmtBytes(g.bytes)}</b><span>${esc(names.join(', '))}</span>${g.err ? `<span style="color:var(--danger);display:block">${esc(g.err)}</span>` : ''}</div>${act}</div>`;
    }).join('')}
    ${canShareFiles ? '<p>Su computer o Android puoi anche scaricarli: <button class="btn ghost small" id="xDlAll">Scarica qui</button></p>' : ''}
    <div style="padding:12px 4px 16px"><button class="btn ghost" id="xCopy2" style="width:100%">Copia istruzioni per Claude</button></div>`;
  $('#xBack').onclick = () => { exp.mode = 'select'; renderExport(); };
  $$('[data-prep]', body).forEach(b => b.onclick = () => prepareGroup(+b.dataset.prep));
  $$('[data-share]', body).forEach(b => b.onclick = () => shareGroup(+b.dataset.share));
  $$('[data-dl]', body).forEach(b => b.onclick = () => downloadGroup(+b.dataset.dl));
  const dlAll = $('#xDlAll'); if (dlAll) dlAll.onclick = async () => { for (let i = 0; i < exp.groups.length; i++) { const g = exp.groups[i]; if (g.state === 'done' && !g.files) g.state = 'idle'; await prepareGroup(i); await downloadGroup(i); } };
  $('#xCopy2').onclick = async () => toast(await copyText(claudePrompt()) ? 'Istruzioni copiate' : 'Seleziona il testo e copialo a mano');
}
let prepChain = Promise.resolve();
function prepareGroup(i) { prepChain = prepChain.then(() => doPrepare(i)).catch(() => {}); return prepChain; }
async function doPrepare(i) {
  const g = exp.groups[i]; if (!g || g.state === 'busy' || g.state === 'ready' || g.state === 'done' || PREVIEW) return;
  g.state = 'busy'; g.err = ''; if (openSheetId === 'shExport') renderExport();
  try {
    await Promise.all([...saveTimers.keys()].map(id => drafts.get(id) && persist(drafts.get(id))));
    const files = [];
    for (const id of g.ids) { const d = drafts.get(id); if (d) files.push(await buildPack(d)); await sleep(0); }
    g.files = files; g.state = 'ready';
  } catch (e) { g.state = 'err'; g.err = (e && e.msg) || 'Preparazione non riuscita'; }
  if (openSheetId === 'shExport' && exp.mode === 'groups') renderExport();
  // libera la memoria degli invii già fatti
  exp.groups.forEach((x, j) => { if (j < i && x.state === 'done') x.files = null; });
}
function markExported(g) {
  const t = Date.now();
  for (const id of g.ids) { const d = drafts.get(id); if (d) { d.exportedAt = Math.max(t, d.updatedAt || 0); persist(d); } }
  ls.set('bv-last-export', String(t));
  renderList(); if (cur) renderEditor();
}
async function shareGroup(i) {
  const g = exp.groups[i]; if (!g) return;
  if (!g.files) { g.state = 'idle'; prepareGroup(i); return; }
  try {
    await navigator.share({ files: g.files });
    g.state = 'done'; markExported(g);
    renderExport();
    const next = exp.groups.findIndex(x => x.state === 'idle');
    if (next >= 0) prepareGroup(next); else toast('Tutti i pacchetti sono stati esportati');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    g.err = 'Condivisione non riuscita: prova con Scarica'; renderExport();
  }
}
async function downloadGroup(i) {
  const g = exp.groups[i]; if (!g || !g.files) return;
  for (const f of g.files) {
    const u = URL.createObjectURL(f); const a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 120000); await sleep(600);
  }
  g.state = 'done'; markExported(g); renderExport();
  const next = exp.groups.findIndex(x => x.state === 'idle'); if (next >= 0) prepareGroup(next);
}

/* ---------- Importazione ---------- */
async function readZip(file) {
  const tailLen = Math.min(file.size, 65557);
  const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
  let eocd = -1; for (let i = tail.byteLength - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('notzip');
  const count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const dec = new TextDecoder(); const entries = new Map(); let p = 0;
  for (let i = 0; i < count && p + 46 <= cd.byteLength; i++) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true), csize = cd.getUint32(p + 20, true), nlen = cd.getUint16(p + 28, true), xlen = cd.getUint16(p + 30, true), clen = cd.getUint16(p + 32, true), lho = cd.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen));
    if (!/(^|\/)__MACOSX\//.test(name) && !name.endsWith('/')) entries.set(name, { method, csize, lho });
    p += 46 + nlen + xlen + clen;
  }
  async function blob(name, type) {
    const e = entries.get(name); if (!e) return null;
    const lh = new DataView(await file.slice(e.lho, e.lho + 30).arrayBuffer());
    const off = e.lho + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    const raw = file.slice(off, off + e.csize);
    if (e.method === 0) return new Blob([raw], { type });
    if (e.method === 8 && 'DecompressionStream' in window) { const s = raw.stream().pipeThrough(new DecompressionStream('deflate-raw')); return new Blob([await new Response(s).arrayBuffer()], { type }); }
    throw new Error('method');
  }
  return { entries, blob };
}
async function importZips(fileList) {
  const files = Array.from(fileList || []); if (!files.length) return;
  closeSheetNow(); askPersist();
  let ok = 0, skipped = 0, bad = 0, nPhotos = 0;
  for (let k = 0; k < files.length; k++) {
    toast(`Importo ${k + 1} di ${files.length}…`, 60000);
    try {
      const z = await readZip(files[k]);
      const schede = [...z.entries.keys()].filter(n => /(^|\/)scheda\.json$/.test(n));
      if (!schede.length) { bad++; continue; }
      for (const sj of schede) {
        const prefix = sj.slice(0, sj.length - 'scheda.json'.length);
        const s = JSON.parse(await (await z.blob(sj, 'application/json')).text());
        if (!s || typeof s !== 'object' || !String(s.formato || '').startsWith('bozze-vinted/')) { bad++; continue; }
        const id = (typeof s.id === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(s.id)) ? s.id : uid();
        const updated = s.modificata ? Date.parse(s.modificata) : Date.now();
        const existing = drafts.get(id);
        if (existing && (existing.updatedAt || 0) > updated) { skipped++; continue; }
        const leaf = Array.isArray(s.categoria) ? LEAVES.find(l => l.path.join('/') === s.categoria.join('/')) : null;
        const d = normalize({
          id, createdAt: s.creata ? Date.parse(s.creata) : Date.now(), updatedAt: updated,
          ref: s.referenza || '', title: String(s.titolo || '').slice(0, LIMITS.title), description: String(s.descrizione || '').slice(0, LIMITS.desc),
          category: Array.isArray(s.categoria) ? { path: s.categoria.map(String), sizeGroup: leaf ? leaf.sizeGroup : (s.gruppo_taglie || 'none') } : null,
          brand: s.brand || '', size: s.taglia || '', condition: s.condizioni || '', colors: (s.colori || []).slice(0, LIMITS.colors), materials: (s.materiali || []).slice(0, LIMITS.materials),
          price: typeof s.prezzo === 'number' ? s.prezzo : null, parcel: s.pacco || '', unisex: !!s.unisex,
          status: s.stato === 'caricata_su_vinted' ? 'uploaded' : 'active', exportedAt: s.esportata ? Date.parse(s.esportata) : null, photos: []
        });
        const det = Array.isArray(s.foto_dettagli) ? s.foto_dettagli : [];
        for (const name of (Array.isArray(s.foto) ? s.foto : []).slice(0, LIMITS.photos)) {
          const b = await z.blob(prefix + name, typeOfName(name)); if (!b) continue;
          const r = await processImage(b, name);
          const pid = uid();
          await putPhotoAndThumb(await blobRecord(pid, { draftId: id }, r.blob), await blobRecord(pid, {}, r.thumb));
          const info = det.find(x => x && x.file === name) || {};
          d.photos.push({ id: pid, w: r.w, h: r.h, bytes: r.blob.size, type: r.type, name: info.nome_originale || name }); nPhotos++;
        }
        if (existing) { const ops = []; for (const p of existing.photos) { ops.push(['photos', 'del', p.id], ['thumbs', 'del', p.id]); dropThumb(p.id); } try { await store.batch(ops); } catch (e) {} }
        if (d.exportedAt && d.exportedAt < d.updatedAt) d.exportedAt = d.updatedAt;
        drafts.set(id, d); await store.put('drafts', JSON.parse(JSON.stringify(d))); ok++;
      }
    } catch (e) { bad++; }
  }
  renderList(); refreshMeter();
  toast((ok === 1 ? 'Importata 1 bozza' : `Importate ${ok} bozze`) + ` (${nPhotos} foto)` + (skipped ? ` · ${skipped} già più recenti nel telefono` : '') + (bad ? ` · ${bad} file non validi` : ''), 5000);
}

/* ---------- Installazione ---------- */
function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
function setupInstall() {
  const ua = navigator.userAgent || '';
  const iOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const banner = $('#bannerInstall');
  if (PREVIEW) { $('#bannerPreview').hidden = false; return; }
  if (isStandalone() || !(iOS || android) || ss.get('bv-install-off')) return;
  if (iOS) $('#installTxt').innerHTML = 'Tocca <b>Condividi</b> (il quadrato con la freccia), poi <b>Aggiungi alla schermata Home</b>. Da lì in poi apri sempre l\'icona: le bozze salvate qui nel browser e quelle nell\'app sono in memorie separate.';
  else $('#installTxt').innerHTML = 'Apri il menu <b>⋮</b> e scegli <b>Installa app</b> (o «Aggiungi a schermata Home»). Poi apri sempre l\'icona.';
  banner.hidden = false;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; $('#btnInstall').hidden = false; });
  $('#btnInstall').onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; $('#btnInstall').hidden = true; };
  window.addEventListener('appinstalled', () => { banner.hidden = true; });
}

/* ---------- Eventi ---------- */
function newDraft() {
  return normalize({ id: uid(), createdAt: Date.now(), updatedAt: Date.now(), description: applyTemplate(settings.descTemplate, ''), condition: settings.condition, parcel: settings.parcel });
}
function bind() {
  $('#btnNew').onclick = () => openEditor(newDraft(), true);
  $('#btnBack').onclick = navBack; $('#btnDone').onclick = navBack;
  window.addEventListener('popstate', () => {
    if (openSheetId) { closeSheetNow(); if (cur && navOK) { try { history.pushState({ bv: 'editor' }, ''); } catch (e) {} } return; }
    if (cur) closeEditorNow();
  });
  $('#cards').addEventListener('click', e => { const b = e.target.closest('.card'); if (!b) return; const d = drafts.get(b.dataset.id); if (d) openEditor(d, false); });
  $('#chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; filter = b.dataset.f; $$('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); renderList(); });
  $('#scrim').onclick = closeSheetNow;
  $$('[data-close]').forEach(b => b.onclick = closeSheetNow);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheetNow(); });

  $('#fRef').addEventListener('input', e => {
    const d = cur, v = e.target.value.trim(), old = d.ref, t = settings.descTemplate || '';
    const tl = t.split('\n'), idx = tl.findIndex(l => l.includes('{ref}'));
    if (idx >= 0) {
      const lines = d.description.split('\n');
      if (lines[idx] !== undefined && lines[idx].trim() === applyTemplate(tl[idx], old).trim()) { lines[idx] = applyTemplate(tl[idx], v); d.description = lines.join('\n').slice(0, LIMITS.desc); $('#fDesc').value = d.description; updCount('#cDesc', d.description.length, LIMITS.desc); }
    }
    d.ref = v; touch();
  });
  $('#fTitle').addEventListener('input', e => { cur.title = e.target.value.slice(0, LIMITS.title); updCount('#cTitle', cur.title.length, LIMITS.title); touch(); });
  $('#fDesc').addEventListener('input', e => { cur.description = e.target.value.slice(0, LIMITS.desc); updCount('#cDesc', cur.description.length, LIMITS.desc); autoGrow(e.target); touch(); });
  $('#fPrice').addEventListener('input', e => { const raw = e.target.value.replace(/[^\d,.]/g, '').replace(',', '.'); const n = parseFloat(raw); cur.price = isNaN(n) ? null : Math.round(n * 100) / 100; touch(); });
  $('#fPrice').addEventListener('blur', e => { if (!cur) return; e.target.value = cur.price != null ? fmtPrice(cur.price) : ''; if (cur.price != null && cur.price < LIMITS.priceMin) toast('Il prezzo minimo su Vinted è 1,00 €'); });
  $('#fUnisex').addEventListener('change', e => { cur.unisex = e.target.checked; touch(); });

  $('#rCategory').onclick = () => { catStack = cur.category ? cur.category.path.slice(0, -1).filter((k, i, a) => { let n = CATS; for (const x of a.slice(0, i + 1)) { n = n && n[x]; } return !!n; }) : []; $('#catSearch').value = ''; renderCat(); openSheet('shCategory'); };
  $('#catBack').onclick = () => { catStack.pop(); renderCat(); };
  $('#catSearch').addEventListener('input', renderCat);
  $('#rSize').onclick = openSize;
  $('#rBrand').onclick = () => { $('#brandSearch').value = ''; renderBrand(); openSheet('shBrand'); };
  $('#brandSearch').addEventListener('input', renderBrand);
  $('#brandSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) { const m = BRANDS.find(b => b.toLowerCase() === q.toLowerCase()); cur.brand = m || q; touch(); renderEditor(); closeSheetNow(); } } });
  $('#rCondition').onclick = () => { renderRadioSheet('conditionList', CONDITIONS, () => cur.condition, v => cur.condition = v); openSheet('shCondition'); };
  $('#rParcel').onclick = () => { renderRadioSheet('parcelList', PARCELS, () => cur.parcel, v => cur.parcel = v); openSheet('shParcel'); };
  $('#rColor').onclick = () => { renderColors(); openSheet('shColor'); };
  $('#rMaterial').onclick = () => { renderMaterials(); openSheet('shMaterial'); };
  $('#matClear').onclick = () => { cur.materials = []; touch(); renderEditor(); closeSheetNow(); };

  const pickPhotos = () => { const f = $('#fileInput'); f.value = ''; f.click(); };
  $('#addBig').onclick = pickPhotos;
  $('#photos').addEventListener('click', e => {
    if (e.target.closest('#addMore')) { pickPhotos(); return; }
    const t = e.target.closest('.tile'); if (!t) return;
    if (t.dataset.p !== undefined) {
      const pend = pending.get(cur.id) || [], it = pend[+t.dataset.p];
      if (it && it.state === 'err') { pend.splice(pend.indexOf(it), 1); URL.revokeObjectURL(it.localUrl); renderPhotos(); renderStatus(); }
      return;
    }
    const i = +t.dataset.i; selPhoto = selPhoto === i ? -1 : i; renderPhotos();
  });
  $('#fileInput').addEventListener('change', e => addFiles(e.target.files));
  const move = (from, to) => { const a = cur.photos; const [p] = a.splice(from, 1); a.splice(to, 0, p); selPhoto = to; renderPhotos(); touch(); };
  $('#paCover').onclick = () => move(selPhoto, 0);
  $('#paLeft').onclick = () => move(selPhoto, selPhoto - 1);
  $('#paRight').onclick = () => move(selPhoto, selPhoto + 1);
  $('#paDel').onclick = () => deletePhotoAt(selPhoto);

  $('#btnMenu').onclick = () => openSheet('shMenu');
  $('#mExport').onclick = () => { closeSheetNow(); if (!cur.photos.length) { toast('Aggiungi almeno una foto prima di esportare'); return; } persist(cur); setTimeout(() => openExport(cur.id), 260); };
  $('#mCopyTitle').onclick = async () => { closeSheetNow(); toast(await copyText(cur.title) ? 'Titolo copiato' : 'Copia non riuscita'); };
  $('#mCopyDesc').onclick = async () => { closeSheetNow(); toast(await copyText(cur.description) ? 'Descrizione copiata' : 'Copia non riuscita'); };
  $('#mDup').onclick = () => {
    const s = cur; closeSheetNow(); persist(s);
    const n = normalize({ ...JSON.parse(JSON.stringify(s)), id: uid(), createdAt: Date.now(), updatedAt: Date.now(), photos: [], status: 'active', uploadedAt: null, exportedAt: null, title: (s.title ? s.title + ' (copia)' : '').slice(0, LIMITS.title) });
    cur = null; $('#editorView').hidden = true;
    if (navOK && history.state && history.state.bv === 'editor') { try { history.replaceState({ bv: 'editor' }, ''); } catch (e) {} }
    openEditorReplace(n); toast('Bozza duplicata senza foto');
  };
  $('#mUploaded').onclick = () => { closeSheetNow(); if (cur.status === 'uploaded') { cur.status = 'active'; cur.uploadedAt = null; } else { cur.status = 'uploaded'; cur.uploadedAt = Date.now(); } persist(cur); renderEditor(); };
  $('#mDel').onclick = () => { closeSheetNow(); setTimeout(() => askConfirm('Eliminare la bozza?', 'Vengono eliminate dal telefono anche le sue foto. Non si può annullare.', 'Elimina', async () => {
    const d = cur; closeSheetNow();
    clearTimeout(saveTimers.get(d.id)); saveTimers.delete(d.id);
    const ops = [['drafts', 'del', d.id]]; for (const p of d.photos) { ops.push(['photos', 'del', p.id], ['thumbs', 'del', p.id]); }
    try { await store.batch(ops); } catch (e) { toast('Bozza non eliminata, riprova'); return; }
    d.photos.forEach(p => dropThumb(p.id)); drafts.delete(d.id); pending.delete(d.id);
    d.title = ''; d.photos = []; // evita il salvataggio alla chiusura
    cur = null; $('#editorView').hidden = true; $('#listView').hidden = false; ss.set('bv-open', '');
    if (navOK && history.state && history.state.bv === 'editor') { try { history.back(); } catch (e) {} }
    renderList(); refreshMeter(); toast('Bozza eliminata');
  }), 260); };
  $('#confirmOk').onclick = () => { const cb = confirmCb; confirmCb = null; if (cb) cb(); };

  $('#btnSettings').onclick = () => { renderSettings(); openSheet('shSettings'); };
  $('#sSave').onclick = async () => {
    settings = { condition: $('#sCondition').value, parcel: $('#sParcel').value, noBrand: $('#sNoBrand').value.trim(), descTemplate: $('#sTemplate').value };
    try { await store.put('meta', { k: 'settings', v: settings }); toast('Valori salvati: valgono per le nuove bozze'); } catch (e) { toast('Valori non salvati, riprova'); }
    closeSheetNow();
  };
  $('#btnExport').onclick = () => openExport();
  $('#backupGo').onclick = () => openExport();
  $('#backupClose').onclick = () => { ss.set('bv-backup-off', '1'); $('#bannerBackup').hidden = true; };
  $('#installClose').onclick = () => { ss.set('bv-install-off', '1'); $('#bannerInstall').hidden = true; };

  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
}
function openEditorReplace(d) {
  cur = d; selPhoto = -1; drafts.set(d.id, d);
  $('#listView').hidden = true; $('#editorView').hidden = false; window.scrollTo(0, 0);
  setSaveBadge('Nuova bozza'); renderEditor(); ss.set('bv-open', d.id); touch(d, 50);
}

/* ---------- Avvio ---------- */
async function init() {
  bind(); setupInstall();
  await store.ready();
  await loadSettings();
  try { (await store.all('drafts')).forEach(d => drafts.set(d.id, normalize(d))); } catch (e) { toast('Non riesco a leggere le bozze salvate'); }
  if (!store.persistent && !PREVIEW) { const b = $('#bannerStorage'); b.hidden = false; b.innerHTML = '<div><b>Questo browser non permette di salvare.</b> Le bozze andrebbero perse alla chiusura: esci dalla navigazione privata o installa l\'app.</div>'; }
  renderList(); refreshMeter();
  const open = ss.get('bv-open'); if (open && drafts.has(open)) openEditor(drafts.get(open), false);
  if (!PREVIEW && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
