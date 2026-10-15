// tarefas que o content script nao consegue fazer (CORS/CSP da pagina)
const MANIFEST_URL = 'https://raw.githubusercontent.com/MatheusJuan/ad-miner/main/ad-miner/manifest.json';
const MAX_THUMB = 600000;

const toDataUrl = blob => new Promise(res => {
  const f = new FileReader();
  f.onload = () => res(f.result);
  f.onerror = () => res('');
  f.readAsDataURL(blob);
});

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (!msg) return;

  // versao publicada no repositorio
  if (msg.type === 'am-latest') {
    fetch(MANIFEST_URL, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(m => send({ version: m.version }))
      .catch(() => send({ version: null }));
    return true; // resposta assincrona
  }

  // miniatura de anuncio salvo, so de hosts do CDN da Meta
  if (msg.type === 'am-thumb') {
    let ok = false;
    try {
      const u = new URL(msg.url);
      ok = u.protocol === 'https:' && /(^|\.)fbcdn\.net$/.test(u.hostname);
    } catch (e) { /* url invalida */ }
    if (!ok) { send({ data: '' }); return; }
    fetch(msg.url)
      .then(r => (r.ok ? r.blob() : Promise.reject(new Error(r.status))))
      .then(b => (b.size > MAX_THUMB ? '' : toDataUrl(b)))
      .then(d => send({ data: d }))
      .catch(() => send({ data: '' }));
    return true;
  }
});
