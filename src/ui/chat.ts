// Chat box, chat log and the online indicator. Plain HTML so it stays crisp and
// phones get their normal keyboard.

import { Input } from '../game/input';
import { net } from '../net/client';
import { cleanChat, type ServerMsg } from '../net/protocol';
import { MAPS } from '../data/maps';
import { isMusicOff, toggleMusic, unlockAudio } from '../audio/sound';

const SHOW_MS = 12000;
const MAX_LINES = 6;

let bar: HTMLFormElement;
let input: HTMLInputElement;
let log: HTMLDivElement;
let hud: HTMLElement;
let open = false;
let who: HTMLDivElement;
let whoTimer = 0;

export function isChatOpen() {
  return open;
}

export function chatLine(text: string, who?: string) {
  const el = document.createElement('div');
  if (who) {
    const b = document.createElement('b');
    b.textContent = who + ': ';
    el.append(b, text);
  } else {
    el.className = 'sys';
    el.textContent = text;
  }
  log.append(el);
  while (log.children.length > MAX_LINES) log.firstElementChild?.remove();
  setTimeout(() => (el.style.opacity = '0'), SHOW_MS);
  setTimeout(() => el.remove(), SHOW_MS + 700);
}

export function openChat() {
  if (!net.isOnline) {
    chatLine('Chat needs a connection to the server.');
    return;
  }
  open = true;
  Input.releaseAll();
  bar.hidden = false;
  input.value = '';
  input.focus();
}

function closeChat() {
  open = false;
  bar.hidden = true;
  input.blur();
  Input.releaseAll();
}

function renderHud() {
  hud.hidden = false;
  hud.className = net.status + (who && isWhoOpen() ? ' open' : '');
  const t = hud.querySelector('#nettext')!;
  t.textContent = net.status === 'online' ? `${net.online} ONLINE` : net.status === 'connecting' ? 'CONNECTING' : 'OFFLINE';
}

// ---------- who's online ----------

function isWhoOpen() {
  return !who.hidden;
}

function openWho() {
  if (!net.isOnline) {
    chatLine("You're offline, so there's nobody to list.");
    return;
  }
  who.hidden = false;
  hud.classList.add('open');
  renderWho(null);
  net.send({ t: 'who' });
  window.clearInterval(whoTimer);
  whoTimer = window.setInterval(() => (net.isOnline ? net.send({ t: 'who' }) : closeWho()), 5000);
}

function closeWho() {
  who.hidden = true;
  hud.classList.remove('open');
  window.clearInterval(whoTimer);
}

function renderWho(list: Extract<ServerMsg, { t: 'who' }>['list'] | null) {
  const ul = who.querySelector('#wholist')!;
  ul.replaceChildren();
  const row = (cls: string, name: string, where: string, busy = false) => {
    const li = document.createElement('li');
    li.className = cls;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = name;
    const m = document.createElement('span');
    m.className = 'm' + (busy ? ' busy' : '');
    m.textContent = where;
    li.append(n, m);
    ul.append(li);
  };
  if (!list) return row('empty', 'Looking around...', '');
  if (!list.length) return row('empty', 'Nobody. Spooky.', '');
  // You first, then whoever's on the same map, then everyone else by place.
  const here = list.find((p) => p.id === net.id)?.map ?? '';
  const sorted = [...list].sort(
    (a, b) => +(b.id === net.id) - +(a.id === net.id) || +(b.map === here) - +(a.map === here) || placeName(a.map).localeCompare(placeName(b.map)) || a.name.localeCompare(b.name),
  );
  for (const p of sorted) {
    const where = placeName(p.map) + (p.busy && p.map ? ' (BUSY)' : '');
    row(p.id === net.id ? 'me' : '', p.id === net.id ? p.name + ' (YOU)' : p.name, where, p.busy);
  }
}

function placeName(map: string) {
  if (!map) return 'TITLE SCREEN';
  return MAPS[map]?.name ?? '???';
}

// ---------- music button ----------

function installMusicButton() {
  const btn = document.getElementById('musicbtn') as HTMLButtonElement | null;
  if (!btn) return;
  const show = () => {
    const off = isMusicOff();
    btn.classList.toggle('off', off);
    btn.setAttribute('aria-label', off ? 'Turn music on' : 'Mute music');
    btn.title = off ? 'Music off (M)' : 'Music on (M)';
  };
  const flip = () => {
    unlockAudio();
    toggleMusic();
    show();
  };
  // pointerdown so it doesn't steal focus or wait for a click on phones.
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    flip();
  });
  btn.addEventListener('keydown', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && !e.repeat && !open && (e.target as HTMLElement)?.tagName !== 'INPUT') flip();
  });
  show();
}

export function installChat() {
  bar = document.getElementById('chatbar') as HTMLFormElement;
  input = document.getElementById('chatin') as HTMLInputElement;
  log = document.getElementById('chatlog') as HTMLDivElement;
  hud = document.getElementById('hud') as HTMLElement;
  who = document.getElementById('who') as HTMLDivElement;
  installMusicButton();

  hud.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWhoOpen()) closeWho();
    else openWho();
  });
  document.getElementById('whoclose')?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeWho();
  });
  who.addEventListener('pointerdown', (e) => e.stopPropagation());
  window.addEventListener('pointerdown', () => isWhoOpen() && closeWho());
  // Esc closes the list before the game sees it (so it doesn't also open the menu).
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'Escape' && isWhoOpen()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeWho();
      }
    },
    true,
  );
  net.on('who', (m) => isWhoOpen() && renderWho(m.list));

  bar.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = cleanChat(input.value);
    if (text) net.send({ t: 'chat', text });
    closeChat();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChat();
    e.stopPropagation();
  });
  input.addEventListener('blur', () => setTimeout(() => open && closeChat(), 100));
  window.addEventListener('keydown', (e) => {
    if (open || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (e.code === 'KeyT' || e.code === 'Slash') {
      e.preventDefault();
      openChat();
    }
  });
  document.querySelector('[data-act="chat"]')?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    openChat();
  });

  net.on('chat', (m) => chatLine(m.text, m.name));
  net.on('online', () => {
    renderHud();
    if (net.status === 'offline' && who && isWhoOpen()) closeWho();
  });
  net.on('welcome', renderHud);
  net.on('refused', (m) => chatLine(m.reason));
}
