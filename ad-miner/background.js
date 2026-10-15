// tarefas que o content script nao consegue fazer (CORS/CSP da pagina, depurador, icone da barra)
const MANIFEST_URL = 'https://raw.githubusercontent.com/MatheusJuan/ad-miner/main/ad-miner/manifest.json';
const MAX_THUMB = 600000;
const MAX_IMAGE = 8e6;

const toDataUrl = blob => new Promise(res => {
  const f = new FileReader();
  f.onload = () => res(f.result);
  f.onerror = () => res('');
  f.readAsDataURL(blob);
});

// so https do CDN da Meta: o content script nao vira um proxy aberto
const isCdn = url => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)fbcdn\.net$/.test(u.hostname);
  } catch (e) { return false; }
};

async function fetchData(url, max) {
  if (!isCdn(url)) return '';
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  const b = await r.blob();
  return b.size > max ? '' : toDataUrl(b);
}

/* ========================= MODELAR PAGINA ========================= */
const attached = new Set();
chrome.debugger.onDetach.addListener(src => attached.delete(src.tabId));

async function ensure(tabId) {
  if (attached.has(tabId)) return;
  await chrome.debugger.attach({ tabId }, '1.3');
  attached.add(tabId);
}

// deixa a superficie da pagina em 2x (qualidade retina) sem pedir recorte ampliado, que repetia blocos
async function begin(tabId, m) {
  await ensure(tabId);
  await chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
    width: m.w, height: m.h, deviceScaleFactor: m.scale, mobile: false
  });
}

async function shot(tabId) {
  await ensure(tabId);
  const r = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
  return 'data:image/png;base64,' + r.data;
}

async function release(tabId) {
  if (!attached.has(tabId)) return;
  attached.delete(tabId);
  try { await chrome.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride'); } catch (e) { /* ignora */ }
  try { await chrome.debugger.detach({ tabId }); } catch (e) { /* ja desanexado */ }
}

// clique no icone da extensao: abre o painel Modelar pagina na aba atual
chrome.action.onClicked.addListener(async tab => {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['lp.js'] });
  } catch (e) {
    // pagina interna do navegador ou loja: nao da para injetar
    chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 2500);
  }
});

/* ========================= MENSAGENS ========================= */
chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (!msg) return;
  const tabId = sender.tab && sender.tab.id;

  // versao publicada no repositorio
  if (msg.type === 'am-latest') {
    fetch(MANIFEST_URL, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(m => send({ version: m.version }))
      .catch(() => send({ version: null }));
    return true; // resposta assincrona
  }

  // miniatura de anuncio salvo
  if (msg.type === 'am-thumb') {
    fetchData(msg.url, MAX_THUMB).then(d => send({ data: d })).catch(() => send({ data: '' }));
    return true;
  }

  // criativo do anuncio para copiar ou baixar
  if (msg.type === 'am-image') {
    fetchData(msg.url, MAX_IMAGE).then(d => send({ data: d })).catch(() => send({ data: '' }));
    return true;
  }

  // arquivo da propria extensao (logo) para a pagina, sem expor recurso acessivel
  if (msg.type === 'am-asset') {
    if (!/^assets\/[\w.-]+\.png$/.test(msg.path || '')) { send({ data: '' }); return; }
    fetch(chrome.runtime.getURL(msg.path)).then(r => r.blob()).then(toDataUrl).then(d => send({ data: d })).catch(() => send({ data: '' }));
    return true;
  }

  // modelar pagina: prepara a superficie, captura a tela atual e encerra
  if (msg.type === 'am-begin' && tabId !== undefined) {
    begin(tabId, msg).then(() => send({ ok: true })).catch(e => send({ error: String((e && e.message) || e) }));
    return true;
  }

  if (msg.type === 'am-shot' && tabId !== undefined) {
    shot(tabId).then(d => send({ data: d })).catch(e => send({ error: String((e && e.message) || e) }));
    return true;
  }

  if (msg.type === 'am-done' && tabId !== undefined) {
    release(tabId).then(() => send({ ok: true }));
    return true;
  }
});
