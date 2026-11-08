// Chat box, chat log and the online indicator. Plain HTML so it stays crisp and
// phones get their normal keyboard.

import { Input } from '../game/input';
import { net } from '../net/client';
import { cleanChat } from '../net/protocol';

const SHOW_MS = 12000;
const MAX_LINES = 6;

let bar: HTMLFormElement;
let input: HTMLInputElement;
let log: HTMLDivElement;
let hud: HTMLDivElement;
let open = false;

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
  hud.className = net.status;
  const t = hud.querySelector('#nettext')!;
  t.textContent = net.status === 'online' ? `${net.online} ONLINE` : net.status === 'connecting' ? 'CONNECTING' : 'OFFLINE';
}

export function installChat() {
  bar = document.getElementById('chatbar') as HTMLFormElement;
  input = document.getElementById('chatin') as HTMLInputElement;
  log = document.getElementById('chatlog') as HTMLDivElement;
  hud = document.getElementById('hud') as HTMLDivElement;

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
  net.on('online', renderHud);
  net.on('welcome', renderHud);
  net.on('refused', (m) => chatLine(m.reason));
}
