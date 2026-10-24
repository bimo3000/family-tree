// Shared behaviour of the Stammbaum mock-ups. Throwaway code: no build step, no network, fictional data only.
// A variant page sets its look via CSS (incl. --card-w/--card-h/--slot-w/--row-h) and its open UX choices
// via data attributes on <body>: data-variant, data-edit-mode ("panel" | "dialog").
// Changes live in memory only and are gone after reloading the page.
(function () {
  'use strict';

  const body = document.body;
  const css = getComputedStyle(body);
  const num = (name) => parseFloat(css.getPropertyValue(name));
  const CARD_W = num('--card-w');
  const CARD_H = num('--card-h');
  const SLOT_W = num('--slot-w');
  const ROW_H = num('--row-h');
  const EDIT_MODE = body.dataset.editMode;
  const VARIANTS = [
    ['a', 'a-familienalbum.html', 'A · Familienalbum'],
    ['b', 'b-klar-modern.html', 'B · Klar & modern'],
    ['c', 'c-ahnentafel.html', 'C · Ahnentafel'],
  ];

  let state = structuredClone(window.FAMILIE);
  let selectedId = null;
  let editingId = null;
  const undoStack = [];
  const redoStack = [];
  const view = { x: 0, y: 0, k: 1 };

  // ---------------------------------------------------------------- helpers

  const esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const person = (id) => state.persons.find((p) => p.id === id);
  const parentsOf = (id) => state.parentChild.filter((l) => l.childId === id);
  const childrenOf = (id) => state.parentChild.filter((l) => l.parentId === id);
  const isBio = (l) => !l.kind || l.kind === 'biological';
  const other = (r, id) => (r.partners[0] === id ? r.partners[1] : r.partners[0]);
  const sortValue = (p) => p.birth?.date?.y ?? 9999;
  const partnershipsOf = (id) =>
    state.partnerships
      .filter((r) => r.partners.includes(id))
      .sort((a, b) => (a.start?.date?.y ?? 9999) - (b.start?.date?.y ?? 9999));
  const word = (p, female, male, neutral) =>
    p.gender === 'female' ? female : p.gender === 'male' ? male : neutral;

  function hue(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  }

  // ---------------------------------------------------------------- dates (PERS-06)

  const MONTHS = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  function parseDate(input) {
    const s = input.trim();
    if (!s) return undefined;
    let m;
    if ((m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{3,4})$/)))
      return checked({ y: +m[3], m: +m[2], d: +m[1] }, s);
    if ((m = s.match(/^(\d{1,2})\.(\d{3,4})$/))) return checked({ y: +m[2], m: +m[1] }, s);
    if ((m = s.match(/^([a-zA-ZäÄ]{3,})\.?\s+(\d{3,4})$/))) {
      const i = MONTHS.findIndex((name) => name.toLowerCase().startsWith(m[1].toLowerCase()));
      if (i >= 0) return { y: +m[2], m: i + 1 };
    }
    if ((m = s.match(/^(\d{3,4})$/))) return { y: +m[1] };
    if ((m = s.match(/^(?:ca\.?|um|~)\s*(\d{3,4})$/i))) return { y: +m[1], q: 'about' };
    if ((m = s.match(/^vor\s+(\d{3,4})$/i))) return { y: +m[1], q: 'before' };
    if ((m = s.match(/^nach\s+(\d{3,4})$/i))) return { y: +m[1], q: 'after' };
    if (
      (m = s.match(/^(?:zw\.?|zwischen)\s*(\d{3,4})\s*(?:und|-|–)\s*(\d{3,4})$/i)) ||
      (m = s.match(/^(\d{3,4})\s*[-–]\s*(\d{3,4})$/))
    )
      return { y: +m[1], q: 'between', y2: +m[2] };
    return { text: s };
  }

  function checked(d, s) {
    if (d.m < 1 || d.m > 12 || (d.d && (d.d < 1 || d.d > 31))) return { text: s };
    return d;
  }

  function qualified(d, plain) {
    if (d.q === 'about') return `ca. ${d.y}`;
    if (d.q === 'before') return `vor ${d.y}`;
    if (d.q === 'after') return `nach ${d.y}`;
    if (d.q === 'between') return `${d.y}–${d.y2}`;
    return plain;
  }

  /** Full precision, for details and tooltips. */
  function fmtDate(d) {
    if (!d) return '';
    if (d.text) return d.text;
    if (d.d) return `${pad(d.d)}.${pad(d.m)}.${d.y}`;
    if (d.m) return qualified(d, `${pad(d.m)}.${d.y}`);
    return qualified(d, String(d.y));
  }

  /** Year only, for the card (PERS-04). */
  function fmtYear(d) {
    if (!d) return '';
    if (d.text) return d.text;
    return qualified(d, String(d.y));
  }

  /** The live interpretation shown under a date field. */
  function dateHint(d) {
    if (!d) return '';
    if (d.text) return '→ wird so übernommen (kann nicht zum Sortieren genutzt werden)';
    if (d.q === 'about') return `→ ungefähr ${d.y}`;
    if (d.q === 'before') return `→ vor ${d.y}`;
    if (d.q === 'after') return `→ nach ${d.y}`;
    if (d.q === 'between') return `→ zwischen ${d.y} und ${d.y2}`;
    if (d.d) return `→ ${d.d}. ${MONTHS[d.m - 1]} ${d.y}`;
    if (d.m) return `→ ${MONTHS[d.m - 1]} ${d.y}`;
    return `→ im Jahr ${d.y}`;
  }

  // ---------------------------------------------------------------- names and wording (PERS-07)

  function fullName(p) {
    return [p.givenNames, p.surname].filter(Boolean).join(' ') || 'Ohne Namen';
  }

  function shortName(p) {
    if (p.placeholder) return 'Unbekannt';
    const first = p.callName || (p.givenNames || '').split(' ')[0];
    return [first, p.surname].filter(Boolean).join(' ') || 'Ohne Namen';
  }

  /** Given names with the Rufname underlined, plus the last known surname. */
  function nameHtml(p) {
    let given = esc(p.givenNames || '');
    if (p.callName && given.includes(esc(p.callName)))
      given = given.replace(esc(p.callName), `<u>${esc(p.callName)}</u>`);
    const html = [given, esc(p.surname || '')].filter(Boolean).join(' ');
    return html || '<i>Ohne Namen</i>';
  }

  function initials(p) {
    const first = (p.callName || p.givenNames || '').trim()[0] || '';
    const last = (p.surname || '').trim()[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  function yearsLine(p) {
    const parts = [];
    if (p.birth?.date) parts.push(`* ${fmtYear(p.birth.date)}`);
    if (p.death?.date) parts.push(`† ${fmtYear(p.death.date)}`);
    else if (p.deceased) parts.push('†');
    return parts.join('   ');
  }

  const KIND_PREFIX = { adoptive: 'Adoptiv', step: 'Stief', foster: 'Pflege' };
  const withKind = (kind, w) => (KIND_PREFIX[kind] ? KIND_PREFIX[kind] + w.toLowerCase() : w);
  const parentWord = (p, kind) => withKind(kind, word(p, 'Mutter', 'Vater', 'Elternteil'));
  const childWord = (p, kind) => withKind(kind, word(p, 'Tochter', 'Sohn', 'Kind'));
  const partnerWord = (p, r) =>
    r.kind === 'marriage'
      ? word(p, 'Ehefrau', 'Ehemann', 'Ehepartner/in')
      : word(p, 'Partnerin', 'Partner', 'Partner/in');

  function partnershipDetail(r) {
    const parts = [];
    if (r.start?.date || r.start?.place) {
      const when = [fmtDate(r.start.date), r.start.place && `in ${r.start.place}`]
        .filter(Boolean)
        .join(' ');
      parts.push(`${r.kind === 'marriage' ? 'verheiratet' : 'zusammen seit'} ${when}`);
    }
    if (r.end?.reason)
      parts.push(
        `${r.end.reason === 'divorce' ? 'geschieden' : 'getrennt'} ${fmtDate(r.end.date)}`.trim(),
      );
    return parts.join(', ');
  }

  function eventText(e) {
    return [fmtDate(e.date), e.place && `in ${e.place}`].filter(Boolean).join(' ');
  }

  // ---------------------------------------------------------------- page skeleton

  body.insertAdjacentHTML(
    'afterbegin',
    `
    <header class="topbar">
      <div class="proj">
        <button class="proj-btn" data-action="menu">${esc(state.name)} ▾</button>
        <div class="menu" hidden>
          <button data-mock="Neu">Neuer Stammbaum</button>
          <button data-mock="Öffnen">Öffnen …</button>
          <button data-mock="Speichern unter">Speichern unter …</button>
          <button data-mock="Umbenennen">Umbenennen</button>
          <hr />
          <button data-mock="Drucken / Als Bild speichern">Drucken / Als Bild speichern</button>
          <hr />
          <button data-mock="Beispiel ansehen">Beispiel ansehen</button>
          <button data-mock="Hilfe">Hilfe</button>
        </div>
      </div>
      <button class="icon-btn" data-action="undo" title="Rückgängig (Strg+Z)" disabled>↶</button>
      <button class="icon-btn" data-action="redo" title="Wiederholen (Strg+Y)" disabled>↷</button>
      <div class="spacer"></div>
      <span class="status">✓ Gespeichert</span>
      <button class="btn primary" data-action="save">Speichern</button>
    </header>
    <main>
      <div class="viewport">
        <div class="world"><svg class="edges"></svg><div class="cards"></div></div>
        <div class="zoom">
          <button class="btn" data-action="zoom-in" title="Vergrößern">+</button>
          <button class="btn" data-action="zoom-out" title="Verkleinern">−</button>
          <button class="btn" data-action="fit" title="Alles anzeigen">⤢ Alles anzeigen</button>
        </div>
        <div class="hint">
          <span>Klick auf eine Person, um Details zu sehen. Ziehen verschiebt den Baum, das Mausrad zoomt.</span>
          <button class="close" style="position: static" data-action="hint-close" title="Ausblenden">×</button>
        </div>
      </div>
      <aside class="panel" hidden></aside>
    </main>
    <div class="tooltip" hidden></div>
    <div class="backdrop" hidden><div class="modal"></div></div>
    <div class="toast" hidden></div>
    <div class="start">
      <h1>Stammbaum</h1>
      <p>Deine Familiengeschichte – privat auf deinem Computer.</p>
      <button class="btn primary" data-mock="Neuen Stammbaum anlegen">Neuen Stammbaum anlegen</button>
      <button class="btn" data-mock="Stammbaum-Datei öffnen">Stammbaum-Datei öffnen</button>
      <button class="btn" data-action="example">Beispiel ansehen</button>
    </div>
    <nav class="mockbar">
      <span>Mock-up:</span>
      ${VARIANTS.map(
        ([id, file, label]) =>
          `<a href="${file}" class="${id === body.dataset.variant ? 'current' : ''}">${label}</a>`,
      ).join('')}
      <button data-action="start">Startseite</button>
      <a href="index.html">Übersicht</a>
    </nav>`,
  );

  const $ = (sel) => document.querySelector(sel);
  const viewport = $('.viewport');
  const world = $('.world');
  const edgesEl = $('.edges');
  const cardsEl = $('.cards');
  const panel = $('.panel');
  const tooltip = $('.tooltip');
  const backdrop = $('.backdrop');
  const modal = $('.modal');
  const toastEl = $('.toast');
  const menu = $('.menu');
  const statusEl = $('.status');
  let modalOnClose = null;

  // ---------------------------------------------------------------- tree rendering

  const pos = (p) => ({ x: p.x * SLOT_W, y: p.row * ROW_H });
  const size = (p) => (p.placeholder ? { w: 40, h: 40 } : { w: CARD_W, h: CARD_H });

  function photoHtml(p, cls) {
    if (!p.photo) return `<div class="${cls}">${esc(initials(p))}</div>`;
    const h = hue(p.id);
    const old = (p.birth?.date?.y ?? 2000) < 1935 ? ' old' : '';
    return `<div class="${cls}${old}"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill="hsl(${h}, 30%, 74%)" />
      <circle cx="50" cy="40" r="17" fill="hsl(${h}, 22%, 44%)" />
      <path d="M14 104 C14 66 86 66 86 104 Z" fill="hsl(${h}, 22%, 44%)" /></svg></div>`;
  }

  function cardHtml(p) {
    const { x, y } = pos(p);
    const { w, h } = size(p);
    const style = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px`;
    if (p.placeholder)
      return `<div class="card unknown" data-id="${p.id}" style="${style}">?</div>`;
    return `<div class="card" data-id="${p.id}" data-gender="${p.gender || ''}" style="${style}">
      ${photoHtml(p, 'ph')}
      <div class="txt"><div class="nm">${nameHtml(p)}</div><div class="yr">${esc(yearsLine(p))}</div></div>
    </div>`;
  }

  function edgesHtml() {
    const out = [];
    const byId = new Map(state.persons.map((p) => [p.id, p]));

    // Couples: a horizontal line between the cards. "//" if divorced/separated (only when it applies).
    for (const r of state.partnerships) {
      const [a, b] = r.partners.map((id) => byId.get(id)).sort((p, q) => p.x - q.x);
      if (!a || !b) continue;
      const pa = pos(a);
      const pb = pos(b);
      const ids = `data-a="${a.id}" data-b="${b.id}"`;
      if (a.row !== b.row) {
        out.push(`<path ${ids} d="M${pa.x} ${pa.y} L${pb.x} ${pb.y}" />`);
        continue;
      }
      const x1 = pa.x + size(a).w / 2;
      const x2 = pb.x - size(b).w / 2;
      const y = pa.y;
      const mx = (x1 + x2) / 2;
      if (r.end?.reason) {
        out.push(`<path ${ids} d="M${x1} ${y} H${mx - 6} M${mx + 6} ${y} H${x2}" />`);
        out.push(
          `<path ${ids} d="M${mx - 9} ${y + 8} L${mx - 3} ${y - 8} M${mx + 3} ${y + 8} L${mx + 9} ${y - 8}"><title>${r.end.reason === 'divorce' ? 'geschieden' : 'getrennt'}</title></path>`,
        );
      } else {
        out.push(`<path ${ids} d="M${x1} ${y} H${x2}" />`);
      }
      if (r.kind === 'marriage')
        out.push(
          `<g class="marr" ${ids}><circle cx="${mx - 3}" cy="${y - 9}" r="4" /><circle cx="${mx + 3}" cy="${y - 9}" r="4" /></g>`,
        );
    }

    // Children hang from the middle of their parents' couple line (or below a single parent).
    const groups = new Map();
    for (const c of state.persons) {
      const links = parentsOf(c.id);
      if (!links.length) continue;
      const key = links
        .map((l) => l.parentId)
        .sort()
        .join(' ');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ child: c, links });
    }
    for (const [key, kids] of groups) {
      const parents = key
        .split(' ')
        .map((id) => byId.get(id))
        .filter(Boolean);
      if (!parents.length) continue;
      const couple =
        parents.length === 2 &&
        parents[0].row === parents[1].row &&
        state.partnerships.some(
          (r) => r.partners.includes(parents[0].id) && r.partners.includes(parents[1].id),
        );
      const ox = parents.reduce((s, p) => s + pos(p).x, 0) / parents.length;
      const bottom = Math.max(...parents.map((p) => pos(p).y + size(p).h / 2));
      const oy = couple ? pos(parents[0]).y : bottom;
      const top = Math.min(...kids.map((k) => pos(k.child).y - size(k.child).h / 2));
      const busY = (bottom + top) / 2;
      const pids = parents.map((p) => p.id).join(' ');
      out.push(
        `<path data-parents="${pids}" data-children="${kids.map((k) => k.child.id).join(' ')}" d="M${ox} ${oy} V${busY}" />`,
      );
      for (const k of kids) {
        const cp = pos(k.child);
        const kind = k.links.find((l) => !isBio(l))?.kind;
        const label = kind ? `<title>${withKind(kind, 'Kind')}</title>` : '';
        out.push(
          `<path data-parents="${pids}" data-children="${k.child.id}"${kind ? ' class="adoptive"' : ''} d="M${ox} ${busY} H${cp.x} V${cp.y - size(k.child).h / 2}">${label}</path>`,
        );
      }
    }
    return out.join('');
  }

  function renderTree() {
    cardsEl.innerHTML = state.persons.map(cardHtml).join('');
    edgesEl.innerHTML = edgesHtml();
    applyFocus();
  }

  // ---------------------------------------------------------------- focus (highlight the line)

  function focusSet(id) {
    const set = new Set([id]);
    const walk = (start, next) => {
      const todo = [start];
      while (todo.length)
        for (const n of next(todo.pop()))
          if (!set.has(n)) {
            set.add(n);
            todo.push(n);
          }
    };
    walk(id, (n) => parentsOf(n).map((l) => l.parentId));
    walk(id, (n) => childrenOf(n).map((l) => l.childId));
    for (const r of partnershipsOf(id)) set.add(other(r, id));
    return set;
  }

  function applyFocus() {
    const set = selectedId ? focusSet(selectedId) : null;
    for (const el of cardsEl.children) {
      el.classList.toggle('dim', !!set && !set.has(el.dataset.id));
      el.classList.toggle('selected', el.dataset.id === selectedId);
    }
    for (const el of edgesEl.children) {
      let on = false;
      if (set) {
        if (el.dataset.a) on = set.has(el.dataset.a) && set.has(el.dataset.b);
        else
          on =
            el.dataset.parents.split(' ').some((id) => set.has(id)) &&
            el.dataset.children.split(' ').some((id) => set.has(id));
      }
      el.classList.toggle('hl', on);
      el.classList.toggle('dim', !!set && !on);
    }
  }

  // ---------------------------------------------------------------- pan and zoom (TREE-02)

  function applyView(animate) {
    world.classList.toggle('animate', !!animate);
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
  }

  function fitAll(animate) {
    const rects = state.persons.map((p) => {
      const { x, y } = pos(p);
      const { w, h } = size(p);
      return [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
    });
    const minX = Math.min(...rects.map((r) => r[0]));
    const minY = Math.min(...rects.map((r) => r[1]));
    const maxX = Math.max(...rects.map((r) => r[2]));
    const maxY = Math.max(...rects.map((r) => r[3]));
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    view.k = clamp(Math.min((vw - 80) / (maxX - minX), (vh - 140) / (maxY - minY), 1.1), 0.25, 2.5);
    view.x = vw / 2 - ((minX + maxX) / 2) * view.k;
    view.y = (vh - 50) / 2 - ((minY + maxY) / 2) * view.k;
    applyView(animate);
  }

  function zoomAt(factor, cx, cy) {
    const k = clamp(view.k * factor, 0.25, 2.5);
    view.x = cx - (cx - view.x) * (k / view.k);
    view.y = cy - (cy - view.y) * (k / view.k);
    view.k = k;
    applyView();
  }

  function centerOn(id) {
    const { x, y } = pos(person(id));
    view.x = viewport.clientWidth / 2 - x * view.k;
    view.y = viewport.clientHeight / 2 - y * view.k;
    applyView(true);
  }

  /** After the panel opens, the card may be hidden behind it: bring it back into view. */
  function ensureVisible(id) {
    const { x, y } = pos(person(id));
    const sx = view.x + x * view.k;
    const sy = view.y + y * view.k;
    const m = 60;
    if (sx < m || sy < m || sx > viewport.clientWidth - m || sy > viewport.clientHeight - m)
      centerOn(id);
  }

  let drag = null;
  let suppressClick = false;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.zoom, .hint')) return;
    drag = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    viewport.classList.add('panning');
    tooltip.hidden = true;
    view.x = drag.vx + dx;
    view.y = drag.vy + dy;
    applyView();
  });
  window.addEventListener('pointerup', () => {
    if (drag?.moved) {
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
    }
    drag = null;
    viewport.classList.remove('panning');
  });
  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const r = viewport.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false },
  );
  viewport.addEventListener('click', (e) => {
    if (suppressClick || e.target.closest('.zoom, .hint')) return;
    const card = e.target.closest('.card');
    if (card) select(card.dataset.id);
    else clearSelection();
  });
  viewport.addEventListener('dblclick', (e) => {
    const card = e.target.closest('.card');
    if (card) centerOn(card.dataset.id);
  });

  // ---------------------------------------------------------------- hover tooltip (PERS-04/05)

  function tipHtml(p) {
    if (p.placeholder)
      return '<b>Unbekannter Elternteil</b><br />Klick, um die Person einzutragen.';
    const lines = [`<b>${esc(fullName(p))}</b>`];
    if (p.birthName) lines.push(`geb. ${esc(p.birthName)}`);
    if (p.birth?.date || p.birth?.place) lines.push(`* ${esc(eventText(p.birth))}`);
    if (p.death?.date || p.death?.place) lines.push(`† ${esc(eventText(p.death))}`);
    else if (p.deceased) lines.push('† Datum unbekannt');
    return lines.join('<br />');
  }

  cardsEl.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.card');
    if (!card || drag?.moved) return;
    tooltip.innerHTML = tipHtml(person(card.dataset.id));
    tooltip.hidden = false;
    moveTip(e);
  });
  cardsEl.addEventListener('mousemove', moveTip);
  cardsEl.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.card');
    if (card && !card.contains(e.relatedTarget)) tooltip.hidden = true;
  });
  function moveTip(e) {
    const x = Math.min(e.clientX + 16, window.innerWidth - tooltip.offsetWidth - 10);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${e.clientY + 18}px`;
  }

  // ---------------------------------------------------------------- detail panel (PERS-05)

  function select(id) {
    selectedId = id;
    editingId = null;
    $('.hint').hidden = true;
    renderPanel();
    applyFocus();
    requestAnimationFrame(() => ensureVisible(id));
  }

  function clearSelection() {
    if (editingId && EDIT_MODE === 'panel') editingId = null;
    selectedId = null;
    renderPanel();
    applyFocus();
  }

  function renderPanel() {
    const p = selectedId && person(selectedId);
    if (!p) {
      selectedId = null;
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    if (editingId === p.id && EDIT_MODE === 'panel') {
      panel.replaceChildren(buildForm(p));
      return;
    }
    panel.innerHTML = detailsHtml(p);
  }

  function familyEntry(q, role, detail) {
    const name = q.placeholder ? '<i>unbekannt</i>' : esc(shortName(q));
    const years = q.placeholder ? '' : yearsLine(q);
    const info = [role, years, detail].filter(Boolean).join(' · ');
    return `<button class="fam-link" data-action="goto" data-id="${q.id}"><span class="fam-name">${name}</span><br /><span class="fam-role">${esc(info)}</span></button>`;
  }

  function familyHtml(p) {
    const parents = parentsOf(p.id).map((l) => {
      const q = person(l.parentId);
      return familyEntry(q, q.placeholder ? '' : parentWord(q, l.kind));
    });
    const partners = partnershipsOf(p.id).map((r) => {
      const q = person(other(r, p.id));
      return familyEntry(q, partnerWord(q, r), partnershipDetail(r));
    });
    const children = childrenOf(p.id)
      .map((l) => [person(l.childId), l])
      .sort((a, b) => sortValue(a[0]) - sortValue(b[0]))
      .map(([c, l]) => familyEntry(c, childWord(c, l.kind)));
    const myParents = parentsOf(p.id).map((l) => l.parentId);
    const siblingIds = new Set(myParents.flatMap((id) => childrenOf(id).map((l) => l.childId)));
    siblingIds.delete(p.id);
    const siblings = [...siblingIds]
      .map(person)
      .sort((a, b) => sortValue(a) - sortValue(b))
      .map((s) => {
        const theirs = parentsOf(s.id).map((l) => l.parentId);
        const full =
          theirs.length === myParents.length && theirs.every((id) => myParents.includes(id));
        const w = full
          ? word(s, 'Schwester', 'Bruder', 'Geschwister')
          : 'Halb' + word(s, 'schwester', 'bruder', 'geschwister');
        return familyEntry(s, w);
      });
    const groups = [
      ['Eltern', parents],
      [partners.length > 1 ? 'Partner/innen' : 'Partner/in', partners],
      ['Kinder', children],
      ['Geschwister', siblings],
    ].filter(([, items]) => items.length);
    if (!groups.length) return '';
    return `<h3>Familie</h3>${groups
      .map(
        ([title, items]) =>
          `<div class="fam"><div class="fam-title">${title}</div>${items.join('')}</div>`,
      )
      .join('')}`;
  }

  function detailsHtml(p) {
    const close = '<button class="close" data-action="close" title="Schließen (Esc)">×</button>';
    if (p.placeholder)
      return `${close}
        <div class="p-photo p-unknown">?</div>
        <h2>Unbekannter Elternteil</h2>
        <p class="muted">Diese Person ist noch nicht bekannt. Sie wurde angelegt, damit Geschwister zusammengehören.</p>
        ${familyHtml(p)}
        <div class="actions"><button class="btn primary wide" data-action="edit">Person eintragen</button></div>`;
    const facts = [];
    if (p.birth?.date || p.birth?.place) facts.push(['Geboren', eventText(p.birth)]);
    if (p.death?.date || p.death?.place) facts.push(['Gestorben', eventText(p.death)]);
    else if (p.deceased) facts.push(['Gestorben', 'Datum unbekannt']);
    if (p.occupation) facts.push(['Beruf', p.occupation]);
    if (p.residences) facts.push(['Wohnorte', p.residences]);
    for (const f of p.extraFields || []) if (f.label || f.value) facts.push([f.label, f.value]);
    const empty = !facts.length && !p.biography && !p.givenNames && !p.surname;
    return `${close}
      ${photoHtml(p, 'p-photo')}
      <h2>${nameHtml(p)}</h2>
      ${p.birthName ? `<div class="geb">geb. ${esc(p.birthName)}</div>` : ''}
      ${empty ? '<p class="muted">Noch keine Angaben. Klick auf „Bearbeiten“.</p>' : ''}
      ${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
      ${p.biography ? `<h3>Lebensgeschichte</h3><p class="bio">${esc(p.biography)}</p>` : ''}
      ${familyHtml(p)}
      <div class="actions">
        <button class="btn primary wide" data-action="edit">Bearbeiten</button>
        <button class="btn" data-action="add" data-kind="parent">+ Elternteil</button>
        <button class="btn" data-action="add" data-kind="partner">+ Partner/in</button>
        <button class="btn" data-action="add" data-kind="child">+ Kind</button>
        <button class="btn" data-action="add" data-kind="sibling">+ Geschwister</button>
      </div>
      <button class="link danger" data-action="delete">Person löschen</button>`;
  }

  panel.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t || !panel.contains(t)) return;
    const a = t.dataset.action;
    if (a === 'close') clearSelection();
    else if (a === 'goto') {
      select(t.dataset.id);
      centerOn(t.dataset.id);
    } else if (a === 'edit') startEdit(selectedId);
    else if (a === 'add') openAdd(t.dataset.kind, selectedId);
    else if (a === 'delete') openDelete(selectedId);
  });

  // ---------------------------------------------------------------- edit form

  let snapshotPending = false;

  function getPath(p, path) {
    const [a, b] = path.split('.');
    return b ? p[a]?.[b] : p[a];
  }

  function setPath(p, path, value) {
    const [a, b] = path.split('.');
    const empty = value === '' || value === false || value === undefined;
    if (!b) {
      if (empty) delete p[a];
      else p[a] = value;
      return;
    }
    p[a] ??= {};
    if (empty) delete p[a][b];
    else p[a][b] = value;
    if (!Object.keys(p[a]).length) delete p[a];
  }

  const field = (path, label, placeholder = '') =>
    `<label>${label}<input type="text" data-field="${path}" placeholder="${placeholder}" /></label>`;
  const dateField = (path, label) =>
    `<label>${label}<input type="text" data-date="${path}" placeholder="z. B. 12.03.1923 oder ca. 1850" /></label><div class="date-hint" data-hint="${path}"></div>`;

  function buildForm(p) {
    const el = document.createElement('div');
    el.className = 'form';
    const moreOpen = ['callName', 'gender', 'occupation', 'residences', 'biography'].some(
      (k) => p[k],
    );
    el.innerHTML = `
      <h2>${p.placeholder ? 'Person eintragen' : 'Person bearbeiten'}</h2>
      <div class="photo-row">
        ${photoHtml(p, 'f-photo')}
        <div>
          <button type="button" class="btn" data-action="photo">Foto wählen …</button>
          ${p.photo ? '<button type="button" class="link" data-action="photo-remove">Foto entfernen</button>' : ''}
        </div>
      </div>
      ${field('givenNames', 'Vornamen', 'z. B. Anna Maria')}
      ${field('surname', 'Nachname (zuletzt bekannt)')}
      ${field('birthName', 'Geburtsname')}
      <div class="pair"><div>${dateField('birth.date', 'Geboren am')}</div><div>${field('birth.place', 'in')}</div></div>
      <div class="pair"><div>${dateField('death.date', 'Gestorben am')}</div><div>${field('death.place', 'in')}</div></div>
      <label class="check"><input type="checkbox" data-field="deceased" /> verstorben, Datum unbekannt</label>
      <details ${moreOpen ? 'open' : ''}>
        <summary>Mehr Angaben</summary>
        ${field('callName', 'Rufname', 'Der Name, mit dem sie/er gerufen wurde')}
        <label>Geschlecht
          <select data-field="gender">
            <option value="">keine Angabe</option>
            <option value="female">weiblich</option>
            <option value="male">männlich</option>
            <option value="diverse">divers</option>
          </select>
        </label>
        ${field('occupation', 'Beruf')}
        ${field('residences', 'Wohnorte', 'z. B. Hamburg, ab 1960 Kiel')}
        <label>Lebensgeschichte<textarea data-field="biography" rows="6"></textarea></label>
        <label>Weitere Angaben</label>
        <div class="extra-list"></div>
        <button type="button" class="link" data-action="extra-add">+ Feld hinzufügen</button>
      </details>
      <div class="form-actions"><button type="button" class="btn primary" data-action="done">Fertig</button></div>
      <p class="muted small">Änderungen werden sofort übernommen. Mit ↶ kannst du sie rückgängig machen.</p>`;

    for (const input of el.querySelectorAll('[data-field]')) {
      const v = getPath(p, input.dataset.field);
      if (input.type === 'checkbox') input.checked = !!v;
      else input.value = v ?? '';
    }
    for (const input of el.querySelectorAll('[data-date]')) {
      const d = getPath(p, input.dataset.date);
      input.value = fmtDate(d);
      showHint(el, input.dataset.date, d);
    }
    renderExtras(el, p);

    el.addEventListener('focusin', () => (snapshotPending = true));
    const onInput = (e) => {
      const t = e.target;
      if (!t.matches('[data-field], [data-date], [data-extra]')) return;
      if (snapshotPending) {
        pushUndo();
        snapshotPending = false;
      }
      if (t.dataset.field)
        setPath(p, t.dataset.field, t.type === 'checkbox' ? t.checked : t.value.trim());
      if (t.dataset.date) {
        const d = parseDate(t.value);
        setPath(p, t.dataset.date, d);
        showHint(el, t.dataset.date, d);
      }
      if (t.dataset.extra) p.extraFields[+t.dataset.extra][t.dataset.part] = t.value;
      if (p.placeholder && (p.givenNames || p.surname)) delete p.placeholder;
      markDirty();
      renderTree();
    };
    el.addEventListener('input', onInput);
    el.addEventListener('change', onInput);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (a === 'done') finishEdit();
      else if (a === 'photo')
        toast('Hier öffnet sich die Dateiauswahl für ein Foto. (In der Attrappe nicht möglich.)');
      else if (a === 'photo-remove') {
        pushUndo();
        delete p.photo;
        markDirty();
        renderTree();
        refreshForm();
      } else if (a === 'extra-add') {
        pushUndo();
        (p.extraFields ??= []).push({ label: '', value: '' });
        renderExtras(el, p);
        el.querySelector('.extra-row:last-child input').focus();
      } else if (a === 'extra-remove') {
        pushUndo();
        p.extraFields.splice(+e.target.dataset.index, 1);
        markDirty();
        renderExtras(el, p);
        renderTree();
      }
    });
    return el;
  }

  function showHint(el, path, d) {
    const hint = el.querySelector(`[data-hint="${path}"]`);
    hint.textContent = dateHint(d);
    hint.classList.toggle('vague', !!d?.text);
  }

  function renderExtras(el, p) {
    const list = el.querySelector('.extra-list');
    list.innerHTML = (p.extraFields || [])
      .map(
        (f, i) => `<div class="extra-row">
          <input type="text" data-extra="${i}" data-part="label" placeholder="z. B. Konfession" />
          <input type="text" data-extra="${i}" data-part="value" placeholder="z. B. evangelisch" />
          <button type="button" class="link danger" data-action="extra-remove" data-index="${i}" title="Feld entfernen">×</button>
        </div>`,
      )
      .join('');
    list.querySelectorAll('[data-extra]').forEach((input) => {
      input.value = p.extraFields[+input.dataset.extra][input.dataset.part];
    });
  }

  function startEdit(id) {
    editingId = id;
    if (EDIT_MODE === 'panel') {
      selectedId = id;
      renderPanel();
      applyFocus();
      panel.scrollTop = 0;
    } else {
      openModal(buildForm(person(id)), { wide: true, onClose: finishEdit });
    }
    requestAnimationFrame(() => document.querySelector('.form [data-field="givenNames"]')?.focus());
  }

  function finishEdit() {
    editingId = null;
    closeModal();
    renderPanel();
  }

  /** Rebuild an open form, e.g. after undo replaced the data. */
  function refreshForm() {
    if (!editingId) return;
    if (!person(editingId)) {
      editingId = null;
      closeModal();
    } else if (EDIT_MODE === 'dialog') modal.replaceChildren(buildForm(person(editingId)));
    renderPanel();
  }

  // ---------------------------------------------------------------- dialogs

  function openModal(content, { wide = false, onClose = null } = {}) {
    if (typeof content === 'string') modal.innerHTML = content;
    else modal.replaceChildren(content);
    modal.classList.toggle('wide', wide);
    backdrop.hidden = false;
    modalOnClose = onClose;
  }

  function closeModal() {
    backdrop.hidden = true;
    modal.replaceChildren();
    modal.onclick = modal.onchange = null;
    modalOnClose = null;
  }

  function dismissModal() {
    if (modalOnClose) modalOnClose();
    else closeModal();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) dismissModal();
  });

  const radio = (name, value, label, isChecked = false) =>
    `<label class="radio"><input type="radio" name="${name}" value="${value}" ${isChecked ? 'checked' : ''} /> ${label}</label>`;

  const ADD_TITLES = {
    child: 'Kind hinzufügen',
    partner: 'Partner/in hinzufügen',
    parent: 'Elternteil hinzufügen',
    sibling: 'Geschwister hinzufügen',
  };

  // Adding relatives (ui-concept §2.6): extra questions appear only when they are needed.
  function openAdd(kind, id) {
    const p = person(id);
    const name = esc(shortName(p));
    let question = '';
    if (kind === 'child') {
      const ps = partnershipsOf(id);
      if (ps.length > 1)
        question = `<fieldset><legend>Mit wem?</legend>
          ${ps.map((r, i) => radio('with', other(r, id), esc(shortName(person(other(r, id)))), i === ps.length - 1)).join('')}
          ${radio('with', '', 'anderer / unbekannter Elternteil')}</fieldset>`;
      else if (ps.length === 1)
        question = `<p class="muted">Das Kind wird auch als Kind von ${esc(shortName(person(other(ps[0], id))))} eingetragen.</p>`;
    }
    if (kind === 'parent') {
      const bio = parentsOf(id).filter(isBio);
      if (bio.length >= 2)
        question = `<fieldset><legend>${name} hat schon zwei leibliche Eltern. Was für ein Elternteil kommt dazu?</legend>
          ${radio('pkind', 'adoptive', 'Adoptivelternteil', true)}
          ${radio('pkind', 'step', 'Stiefelternteil')}
          ${radio('pkind', 'foster', 'Pflegeelternteil')}</fieldset>`;
      else if (bio.length === 1)
        question = `<label class="radio"><input type="checkbox" name="couple" checked /> ist Partner/in von ${esc(shortName(person(bio[0].parentId)))}</label>`;
    }
    if (kind === 'sibling' && !parentsOf(id).length)
      question =
        '<p class="muted">Die Eltern sind noch unbekannt. Damit beide als Geschwister zusammengehören, wird ein Platzhalter „?“ als Elternteil angelegt.</p>';
    const options = state.persons
      .filter((x) => !x.placeholder && x.id !== id)
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'de'))
      .map((x) => `<option value="${x.id}">${esc(fullName(x))} ${esc(yearsLine(x))}</option>`)
      .join('');
    openModal(`
      <h2>${ADD_TITLES[kind]}</h2>
      <p class="muted">zu ${name}</p>
      ${question}
      <fieldset><legend>Wer?</legend>
        ${radio('who', 'new', 'Neue Person', true)}
        ${radio('who', 'existing', 'Vorhandene Person auswählen')}
        <select name="existing" hidden>${options}</select>
      </fieldset>
      <div class="form-actions">
        <button class="btn primary" data-action="confirm">Hinzufügen</button>
        <button class="btn" data-action="cancel">Abbrechen</button>
      </div>`);
    modal.onchange = () => {
      modal.querySelector('[name="existing"]').hidden =
        modal.querySelector('[name="who"]:checked').value !== 'existing';
    };
    modal.onclick = (e) => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (a === 'cancel') closeModal();
      if (a !== 'confirm') return;
      const val = (n) => modal.querySelector(`[name="${n}"]:checked`)?.value;
      doAdd(kind, id, {
        existing: val('who') === 'existing' ? modal.querySelector('[name="existing"]').value : null,
        with: val('with'),
        pkind: val('pkind'),
        couple: modal.querySelector('[name="couple"]')?.checked,
      });
    };
  }

  /** Nearest free spot in a generation row (the real app computes a proper layout). */
  function freeSlot(row, preferred) {
    for (let i = 0; i < 80; i++) {
      const x = preferred + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.5;
      if (state.persons.every((q) => q.row !== row || Math.abs(q.x - x) >= 1)) return x;
    }
    return preferred;
  }

  let nextId = 1;
  function addPerson(row, preferredX, extra = {}) {
    const p = { id: `p_neu${nextId++}`, row, x: freeSlot(row, preferredX), ...extra };
    state.persons.push(p);
    return p;
  }
  const link = (parentId, childId, kind) =>
    state.parentChild.push(kind ? { parentId, childId, kind } : { parentId, childId });
  const couple = (a, b) => state.partnerships.push({ id: `u_neu${nextId++}`, partners: [a, b] });

  function doAdd(kind, id, f) {
    pushUndo();
    const p = person(id);
    const existing = f.existing ? person(f.existing) : null;
    let target;
    if (kind === 'child') {
      const ps = partnershipsOf(id);
      const otherId = ps.length > 1 ? f.with : ps.length === 1 ? other(ps[0], id) : '';
      const parentIds = [id, otherId].filter(Boolean);
      const siblings = childrenOf(id)
        .map((l) => person(l.childId))
        .filter((c) => parentsOf(c.id).every((l) => parentIds.includes(l.parentId)));
      const preferred = siblings.length
        ? Math.max(...siblings.map((c) => c.x)) + 1
        : parentIds.reduce((s, pid) => s + person(pid).x, 0) / parentIds.length;
      target = existing || addPerson(p.row + 1, preferred);
      for (const pid of parentIds) link(pid, target.id);
    } else if (kind === 'partner') {
      target = existing || addPerson(p.row, p.x + 1);
      couple(id, target.id);
    } else if (kind === 'parent') {
      const bio = parentsOf(id).filter(isBio);
      const known = bio.length === 1 ? person(bio[0].parentId) : null;
      target = existing || addPerson(p.row - 1, known ? known.x + 1 : p.x - 0.5);
      link(target.id, id, bio.length >= 2 ? f.pkind : undefined);
      if (known && f.couple) couple(known.id, target.id);
    } else if (kind === 'sibling') {
      if (!parentsOf(id).length) {
        const ph = addPerson(p.row - 1, p.x + 0.5, { placeholder: true });
        link(ph.id, id);
      }
      target = existing || addPerson(p.row, p.x + 1);
      for (const l of parentsOf(id)) link(l.parentId, target.id, l.kind);
    }
    markDirty();
    closeModal();
    renderTree();
    select(target.id);
    if (!existing) startEdit(target.id);
  }

  // Deleting (ui-concept §2.7)
  function openDelete(id) {
    const p = person(id);
    const whose = word(p, 'Ihre', 'Seine', 'Die');
    openModal(`
      <h2>${esc(fullName(p))} wirklich löschen?</h2>
      <p>${whose} Verbindungen zu anderen Personen werden entfernt. Du kannst das mit ↶ rückgängig machen.</p>
      <div class="form-actions">
        <button class="btn danger" data-action="confirm">Löschen</button>
        <button class="btn" data-action="cancel">Abbrechen</button>
      </div>`);
    modal.onclick = (e) => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (a === 'cancel') closeModal();
      if (a !== 'confirm') return;
      pushUndo();
      state.persons = state.persons.filter((q) => q.id !== id);
      state.parentChild = state.parentChild.filter((l) => l.parentId !== id && l.childId !== id);
      state.partnerships = state.partnerships.filter((r) => !r.partners.includes(id));
      markDirty();
      closeModal();
      selectedId = null;
      renderTree();
      renderPanel();
      toast('Gelöscht. Mit ↶ kannst du das rückgängig machen.');
    };
  }

  // ---------------------------------------------------------------- undo/redo (UI-01), save status (UI-02)

  function pushUndo() {
    undoStack.push(JSON.stringify(state));
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function stepHistory(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(state));
    state = JSON.parse(from.pop());
    markDirty();
    renderTree();
    if (editingId) refreshForm();
    else renderPanel();
    applyFocus();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('[data-action="undo"]').disabled = !undoStack.length;
    $('[data-action="redo"]').disabled = !redoStack.length;
  }

  function markDirty() {
    statusEl.textContent = '● Nicht in Datei gespeichert';
    statusEl.classList.add('dirty');
  }

  // ---------------------------------------------------------------- top bar, start screen, keyboard

  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 4500);
  }

  document.addEventListener('click', (e) => {
    const mock = e.target.closest('[data-mock]');
    if (mock) {
      menu.hidden = true;
      toast(`„${mock.dataset.mock}“ ist in der Attrappe nicht umgesetzt.`);
      return;
    }
    const a = e.target.closest('[data-action]')?.dataset.action;
    if (a !== 'menu' && !e.target.closest('.menu')) menu.hidden = true;
    if (a === 'menu') menu.hidden = !menu.hidden;
    else if (a === 'undo') stepHistory(undoStack, redoStack);
    else if (a === 'redo') stepHistory(redoStack, undoStack);
    else if (a === 'save') {
      statusEl.textContent = '✓ Gespeichert';
      statusEl.classList.remove('dirty');
      toast(
        'Gespeichert. (Attrappe: Es wurde keine Datei geschrieben. Im echten Programm speichert Chrome/Edge danach automatisch, Firefox/Safari laden die Datei herunter.)',
      );
    } else if (a === 'zoom-in' || a === 'zoom-out')
      zoomAt(a === 'zoom-in' ? 1.25 : 0.8, viewport.clientWidth / 2, viewport.clientHeight / 2);
    else if (a === 'fit') fitAll(true);
    else if (a === 'hint-close') $('.hint').hidden = true;
    else if (a === 'example') {
      $('.start').hidden = true;
      fitAll();
    } else if (a === 'start') $('.start').hidden = false;
  });

  document.addEventListener('keydown', (e) => {
    const inField = e.target.closest('input, textarea, select');
    if (e.key === 'Escape') {
      if (!menu.hidden) menu.hidden = true;
      else if (!backdrop.hidden) dismissModal();
      else if (editingId) finishEdit();
      else clearSelection();
      return;
    }
    if (!(e.ctrlKey || e.metaKey) || inField) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) stepHistory(undoStack, redoStack);
    else if (key === 'y' || (key === 'z' && e.shiftKey)) stepHistory(redoStack, undoStack);
    else return;
    e.preventDefault();
  });

  renderTree();
  fitAll();
})();
