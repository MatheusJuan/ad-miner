// consulta a versao publicada no repositorio (o content script nao pode: CORS/CSP da pagina)
const MANIFEST_URL = 'https://raw.githubusercontent.com/MatheusJuan/ad-miner/main/ad-miner/manifest.json';

chrome.runtime.onMessage.addListener((msg, _sender, send) => {
  if (!msg || msg.type !== 'am-latest') return;
  fetch(MANIFEST_URL, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then(m => send({ version: m.version }))
    .catch(() => send({ version: null }));
  return true; // resposta assincrona
});
