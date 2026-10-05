(() => {
  if (window.__adMinerLoaded) return;
  window.__adMinerLoaded = true;

  /* ========================= CONFIG ========================= */
  const MONTHS = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11, feb: 1, apr: 3, may: 4, aug: 7, sep: 8, oct: 9, dec: 11 };
  const DAY = 864e5;
  const REPO = 'https://github.com/MatheusJuan/ad-miner';
  const LABEL_RE = /Identificação da biblioteca|Library ID/i;
  const ID_RE = /(?:Identificação da biblioteca|Library ID)\s*:?\s*(\d{6,})/i;
  const META_LINE = /^(Ativo|Inativo|Active|Inactive|Patrocinado|Sponsored|Ver resumo|Ver detalhes do anúncio|See ad details|See summary details|Plataformas|Platforms|\.\.\.|…)$/i;
  const META_CONTAINS = /Identificação da biblioteca|Library ID|Veiculação|Started running|Ran from|usam esse criativo|use this creative|^Plataformas|^Platforms/i;
  const CTA_RE = /^(Saiba mais|Learn more|Comprar agora|Shop now|Cadastre-se|Sign up|Enviar mensagem|Send message|Fale conosco|Contact us|Baixar|Download|Reservar|Book now|Ver mais|See more|Obter oferta|Get offer|Solicitar|Ligar agora|Call now|Assistir mais|Watch more|Inscreva-se|Subscribe|Obter cotação|Get quote|Experimente|Enviar mensagem no WhatsApp|WhatsApp)$/i;
  const STOP = new Set('para como mais você voce uma uns umas com sem por que não nao dos das nos nas seu sua seus suas pelo pela isso essa esse esta este mesmo muito muita ainda também tambem são sao foi ser ter tem uma tudo todo toda todos todas aqui onde quando sobre entre até ate fazer faça faca sua seu nosso nossa pode podem the and for you your with that this from have are our not but was can will get its out all more'.split(' '));

  const state = {
    ads: new Map(),      // anuncios da pagina atual (resetam ao recarregar ou mudar a busca)
    saved: new Map(),    // anuncios salvos (persistem no navegador)
    tab: 'ads',
    open: false,
    scrolling: false,
    max: 400,
    filters: { q: '', minDays: 0, minVar: 0, type: 'all', status: 'all', sort: 'score', dim: true, hide: false }
  };
  const isSaved = id => state.saved.has(id);
  const getAd = id => state.ads.get(id) || state.saved.get(id);

  /* ========================= UTILS ========================= */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').trim();
  const fmtDate = d => (d ? new Date(d).toLocaleDateString('pt-BR') : '');
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  function parseDate(s) {
    if (!s) return null;
    let m = s.match(/(\d{1,2})\s+de\s+([A-Za-zçÇ]{3})[A-Za-z]*\.?\s+de\s+(\d{4})/i);
    if (m) { const mo = MONTHS[m[2].toLowerCase()]; if (mo !== undefined) return new Date(+m[3], mo, +m[1]); }
    m = s.match(/([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { const mo = MONTHS[m[1].toLowerCase()]; if (mo !== undefined) return new Date(+m[3], mo, +m[2]); }
    return null;
  }

  function download(name, mime, content) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ========================= SALVOS (PERSISTENCIA) ========================= */
  const serialize = a => {
    const { el, ...rest } = a;
    return { ...rest, start: a.start ? new Date(a.start).toISOString() : null, end: a.end ? new Date(a.end).toISOString() : null };
  };
  const revive = o => {
    const a = { ...o, start: o.start ? new Date(o.start) : null, end: o.end ? new Date(o.end) : null };
    if (a.start && !a.end && a.status === 'ativo') a.days = Math.max(1, Math.round((Date.now() - a.start) / DAY) + 1);
    return a;
  };
  const persistSaved = debounce(() => {
    try {
      chrome.storage.local.set({ amSaved: Object.fromEntries([...state.saved].map(([k, v]) => [k, serialize(v)])) });
    } catch (e) { /* ignora */ }
  }, 400);

  async function thumbToData(url) {
    try {
      const r = await fetch(url);
      const b = await r.blob();
      if (b.size > 600000) return '';
      return await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); });
    } catch (e) { return ''; }
  }

  async function toggleSave(id) {
    if (state.saved.has(id)) {
      state.saved.delete(id);
    } else {
      const a = state.ads.get(id);
      if (!a) return;
      const snap = { ...a };
      delete snap.el;
      snap.savedAt = Date.now();
      state.saved.set(id, snap);
      persistSaved();
      if (a.thumb) {
        const d = await thumbToData(a.thumb);
        if (d && state.saved.has(id)) state.saved.get(id).thumbData = d;
      }
    }
    persistSaved();
    refresh();
  }

  /* ========================= COLETA DE CARDS ========================= */
  function collectCards() {
    const nodes = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (LABEL_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    let n;
    while ((n = w.nextNode())) nodes.push(n);
    const out = [];
    nodes.forEach((node, i) => {
      const idm = (node.parentElement?.textContent || '').match(ID_RE);
      if (!idm) return;
      const others = [nodes[i - 1], nodes[i + 1]].filter(Boolean);
      let el = node.parentElement;
      while (el.parentElement && el.parentElement !== document.body) {
        const p = el.parentElement;
        if (others.some(o => p.contains(o))) break;
        el = p;
      }
      out.push({ id: idm[1], el });
    });
    return out;
  }

  function extract(el, id) {
    const text = el.innerText || '';
    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

    const status = (lines.find(l => /^(Ativo|Inativo|Active|Inactive)$/i.test(l)) || '').toLowerCase();
    const isActive = /^(ativo|active)$/.test(status);

    const startM = text.match(/Veiculação iniciada em\s+([^\n]+)/i) || text.match(/Started running on\s+([^\n]+)/i);
    const rangeM = text.match(/Veiculação de\s+(.+?)\s+a\s+([^\n]+)/i) || text.match(/Ran from\s+(.+?)\s+to\s+([^\n]+)/i);
    let start = null, end = null;
    if (startM) start = parseDate(startM[1]);
    if (rangeM) { start = parseDate(rangeM[1]); end = parseDate(rangeM[2]); }
    let days = 0;
    if (start) days = Math.max(1, Math.round(((end || new Date()) - start) / DAY) + 1);

    const varM = text.match(/(\d+)\s+an[úu]ncios\s+usam\s+esse\s+criativo/i) || text.match(/(\d+)\s+ads\s+use\s+this\s+creative/i);
    const nativeVars = varM ? +varM[1] : 1;

    const spIdx = lines.findIndex(l => /^(Patrocinado|Sponsored)$/i.test(l));
    let advertiser = spIdx > 0 ? lines[spIdx - 1] : '';
    if (!advertiser) {
      const a = [...el.querySelectorAll('a[href]')].find(x => (x.textContent || '').trim() && /facebook\.com\/(?!ads\/library)|instagram\.com/.test(x.href));
      advertiser = a ? a.textContent.trim() : '';
    }

    const base = spIdx >= 0 ? lines.slice(spIdx + 1) : lines;
    const copyLines = base.filter(l => !META_LINE.test(l) && !META_CONTAINS.test(l) && !CTA_RE.test(l) && !/^[A-Z0-9\-]+(\.[A-Z0-9\-]+)+(\/.*)?$/.test(l) && l !== advertiser);
    const copy = copyLines.join('\n').slice(0, 2000);
    const cta = lines.find(l => CTA_RE.test(l)) || '';

    let domain = '', link = '';
    for (const a of el.querySelectorAll('a[href]')) {
      try {
        const u = new URL(a.href);
        if (u.hostname === 'l.facebook.com' && u.searchParams.get('u')) {
          link = u.searchParams.get('u');
          domain = new URL(link).hostname.replace(/^www\./, '');
          break;
        }
        if (!/facebook\.com|fb\.com|instagram\.com|fbcdn/.test(u.hostname) && /^https?:$/.test(u.protocol)) {
          link = a.href; domain = u.hostname.replace(/^www\./, ''); break;
        }
      } catch (e) { /* ignora */ }
    }
    if (!domain) {
      const dl = lines.find(l => /^[A-Z0-9\-]+(\.[A-Z0-9\-]+)+$/.test(l));
      if (dl) domain = dl.toLowerCase();
    }

    // midia: videos e imagens grandes
    const media = [];
    const seen = new Set();
    const posters = new Set();
    el.querySelectorAll('video').forEach(v => {
      const src = v.currentSrc || v.src || (v.querySelector('source') && v.querySelector('source').src) || '';
      if (v.poster) posters.add(v.poster);
      if (src && !seen.has(src)) { seen.add(src); media.push({ type: 'video', src, poster: v.poster || '' }); }
    });
    const imgs = [...el.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 120 && r.height > 120; });
    imgs.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
    imgs.forEach(i => {
      if (!seen.has(i.src) && !posters.has(i.src)) { seen.add(i.src); media.push({ type: 'imagem', src: i.src }); }
    });
    const hasVideo = el.querySelector('video') !== null;
    const thumb = (media.find(m => m.poster) || {}).poster || (imgs[0] && imgs[0].src) || '';
    const type = hasVideo ? 'video' : imgs.length ? 'imagem' : 'texto';
    let mediaKey = '';
    try { mediaKey = thumb ? new URL(thumb).pathname : ''; } catch (e) { /* ignora */ }

    return { id, el, advertiser, copy, cta, domain, link, thumb, media, type, mediaKey, status: isActive ? 'ativo' : (status ? 'inativo' : ''), start, end, days, nativeVars };
  }

  /* ========================= METRICAS ========================= */
  function recompute() {
    const advCount = new Map(), textGroups = new Map(), mediaGroups = new Map();
    state.ads.forEach(a => {
      advCount.set(a.advertiser, (advCount.get(a.advertiser) || 0) + 1);
      const k = norm(a.copy).slice(0, 220);
      if (k.length > 15) textGroups.set(k, (textGroups.get(k) || 0) + 1);
      if (a.mediaKey) mediaGroups.set(a.mediaKey, (mediaGroups.get(a.mediaKey) || 0) + 1);
    });
    state.ads.forEach(a => {
      const k = norm(a.copy).slice(0, 220);
      const tg = k.length > 15 ? textGroups.get(k) : 1;
      const mg = a.mediaKey ? mediaGroups.get(a.mediaKey) : 1;
      a.vars = Math.max(a.nativeVars || 1, tg || 1, mg || 1);
      a.advAds = advCount.get(a.advertiser) || 1;
      let s = Math.min(a.days, 60) / 60 * 55 + Math.min(a.vars, 10) / 10 * 30 + Math.min(a.advAds, 15) / 15 * 15;
      if (a.status === 'inativo') s -= 10;
      a.score = Math.max(0, Math.round(s));
      a.tier = a.score >= 70 ? 'forte' : a.score >= 40 ? 'medio' : 'fraco';
      // mantem o snapshot salvo atualizado
      if (state.saved.has(a.id)) {
        const snap = { ...a }; delete snap.el;
        const old = state.saved.get(a.id);
        snap.thumbData = old.thumbData; snap.savedAt = old.savedAt;
        state.saved.set(a.id, snap);
      }
    });
  }

  function passes(a) {
    const f = state.filters;
    if (a.days < f.minDays) return false;
    if (a.vars < f.minVar) return false;
    if (f.type !== 'all' && a.type !== f.type) return false;
    if (f.status !== 'all' && a.status !== f.status) return false;
    if (f.q) {
      const hay = norm([a.copy, a.advertiser, a.domain, a.id, a.cta].join(' '));
      if (!f.q.toLowerCase().split(/\s+/).every(t => hay.includes(norm(t)))) return false;
    }
    return true;
  }

  function sorted(list) {
    const s = state.filters.sort;
    const by = {
      score: (a, b) => b.score - a.score,
      days: (a, b) => b.days - a.days,
      vars: (a, b) => b.vars - a.vars || b.days - a.days,
      newest: (a, b) => (new Date(b.start || 0)) - (new Date(a.start || 0)),
      oldest: (a, b) => (new Date(a.start || 8.64e15)) - (new Date(b.start || 8.64e15))
    };
    return list.sort(by[s] || by.score);
  }

  const filtered = () => sorted([...state.ads.values()].filter(passes));
  const currentList = () => (state.tab === 'favs'
    ? sorted([...state.saved.values()].map(s => state.ads.get(s.id) || s))
    : filtered());

  /* ========================= OVERLAY NOS CARDS ========================= */
  const TIER_SHADOW = {
    forte: '0 0 0 3px #F5A31A, 0 0 18px rgba(245,163,26,.55)',
    medio: '0 0 0 2px #7f93c9',
    fraco: ''
  };

  function decorate() {
    const f = state.filters;
    state.ads.forEach(a => {
      const el = a.el;
      if (!el || !el.isConnected) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.boxShadow = TIER_SHADOW[a.tier] || '';
      el.style.borderRadius = '12px';
      el.dataset.amid = a.id;

      let b = el.querySelector(':scope > .am-badge');
      if (!b) {
        b = document.createElement('div');
        b.className = 'am-badge';
        b.style.cssText = 'position:absolute;top:8px;right:8px;z-index:9;display:flex;border-radius:10px;overflow:hidden;color:#fff;pointer-events:none;box-shadow:0 3px 12px rgba(0,0,0,.4);font-family:system-ui,sans-serif';
        for (let i = 0; i < 3; i++) {
          const c = document.createElement('div');
          c.style.cssText = 'padding:5px 11px;text-align:center;min-width:62px;' + (i ? 'border-left:1px solid rgba(255,255,255,.28);' : '');
          const n = document.createElement('div');
          n.style.cssText = 'font-weight:800;font-size:19px;line-height:1.1';
          const l = document.createElement('div');
          l.style.cssText = 'font-weight:600;font-size:9px;letter-spacing:.5px;opacity:.92;margin-top:1px';
          c.appendChild(n); c.appendChild(l);
          b.appendChild(c);
        }
        el.appendChild(b);
      }
      b.style.background = a.tier === 'forte' ? '#F5A31A' : a.tier === 'medio' ? '#4a5a8a' : '#3a3a4a';
      b.style.color = a.tier === 'forte' ? '#1A1A2E' : '#fff';
      const vals = [[a.days, 'DIAS NO AR'], [a.vars + 'x', 'VARIAÇÕES'], [a.score, isSaved(a.id) ? 'SCORE ★' : 'SCORE']];
      vals.forEach(([v, lab], i) => {
        b.children[i].children[0].textContent = v;
        b.children[i].children[1].textContent = lab;
      });

      let z = el.querySelector(':scope > .am-zoom');
      const hasMedia = (a.media && a.media.length) || a.thumb;
      if (!z && hasMedia) {
        z = document.createElement('button');
        z.className = 'am-zoom';
        z.textContent = 'Ampliar mídia';
        z.style.cssText = 'position:absolute;top:68px;right:8px;z-index:9;padding:5px 11px;border:0;border-radius:8px;font:600 11px/1.3 system-ui,sans-serif;color:#fff;background:#1A1A2E;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35)';
        z.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openLightbox(el.dataset.amid, 0); });
        el.appendChild(z);
      }

      const ok = passes(a);
      el.style.display = !ok && f.hide ? 'none' : '';
      el.style.opacity = !ok && f.dim && !f.hide ? '.25' : '';
    });
  }

  /* ========================= PAINEL (SHADOW DOM) ========================= */
  const host = document.createElement('div');
  host.id = 'ad-miner-host';
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;top:0;right:0;';
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
  <style>
    :host{all:initial}
    *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    .wrap{--dark:#1A1A2E;--accent:#F5A31A;--yellow:#E0A800;--bg:#12121f;--card:#1f1f35;--txt:#ececf5;--mut:#9a9ab5}
    .fab{position:fixed;right:16px;bottom:16px;display:flex;align-items:center;gap:10px;background:var(--dark);color:#fff;border:2px solid var(--accent);border-radius:999px;padding:8px 14px 8px 18px;cursor:pointer;box-shadow:0 6px 24px rgba(245,163,26,.35)}
    .fab img{height:26px;display:block}
    .fab span{background:var(--accent);color:var(--dark);border-radius:999px;padding:2px 9px;font-weight:800;font-size:12px}
    .panel{position:fixed;top:0;right:0;width:430px;height:100vh;background:var(--bg);color:var(--txt);display:none;flex-direction:column;box-shadow:-8px 0 30px rgba(0,0,0,.45);border-left:1px solid #2c2c4a}
    .panel.open{display:flex}
    header{padding:12px 14px;background:var(--dark);display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--accent)}
    header img{height:34px;display:block}
    header button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}
    .about{margin:10px 14px 0;font-size:12px}
    .about .row1{display:flex;justify-content:space-between;align-items:center;color:var(--mut)}
    .badge{background:none;border:1px solid var(--accent);border-radius:6px;padding:2px 10px;font-size:11px;font-weight:700;color:var(--accent);cursor:pointer}
    .badge:hover{background:var(--accent);color:var(--dark)}
    .about .box{display:none;margin-top:8px;border:1px solid #2c2c4a;border-left:3px solid var(--accent);border-radius:8px;padding:8px 10px;background:var(--card);line-height:1.7}
    .about .box.open{display:block}
    .about .box a{color:var(--accent);font-weight:700;text-decoration:none}
    .about .box a:hover{text-decoration:underline}
    .about .box b{color:var(--accent)}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 14px}
    .st{background:var(--card);border-radius:8px;padding:8px;text-align:center}
    .st b{display:block;font-size:17px}.st small{color:var(--mut);font-size:10px}
    .tabs{display:flex;padding:0 14px;gap:4px}
    .tab{flex:1;background:var(--card);border:0;color:var(--mut);padding:8px 4px;border-radius:8px 8px 0 0;cursor:pointer;font-size:12px;font-weight:600}
    .tab.on{background:var(--accent);color:var(--dark)}
    .filters{padding:10px 14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;background:var(--card)}
    .filters input,.filters select{width:100%;background:#12121f;border:1px solid #34345a;color:var(--txt);border-radius:6px;padding:6px;font-size:12px}
    .filters .full{grid-column:1/-1}
    .filters label{font-size:11px;color:var(--mut);display:flex;align-items:center;gap:4px}
    .filters label input{width:auto}
    .list{flex:1;overflow:auto;padding:10px 14px}
    .row{display:flex;gap:10px;background:var(--card);border-radius:10px;padding:8px;margin-bottom:8px;border-left:4px solid #444}
    .row.forte{border-left-color:var(--accent)}.row.medio{border-left-color:#7f93c9}
    .thw{position:relative;flex:none;width:64px;height:84px;cursor:pointer}
    .th{width:64px;height:84px;object-fit:cover;border-radius:6px;background:#0c0c18;display:block}
    .play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;text-shadow:0 1px 6px #000;background:rgba(0,0,0,.22);border-radius:6px}
    .info{min-width:0;flex:1}
    .top{display:flex;justify-content:space-between;gap:6px;align-items:center}
    .top b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:6px 0}
    .met{background:#12121f;border-radius:8px;padding:6px 2px 5px;text-align:center;border:1px solid #2c2c4a}
    .met b{display:block;font-size:20px;font-weight:800;line-height:1.1}
    .met small{display:block;font-size:8.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;margin-top:2px}
    .met.score{background:#33260d;border-color:var(--accent)}
    .c-g{color:#6dffae}.c-y{color:#ffd166}.c-n{color:#d8d8ea}.c-p{color:#ffc46b}.c-r{color:#ff8a8a}
    .meta{color:var(--mut);font-size:10.5px;margin:3px 0}
    .copy{font-size:11.5px;color:#d5d5e8;max-height:46px;overflow:hidden}
    .acts{margin-top:5px;display:flex;gap:4px;flex-wrap:wrap}
    .acts button,.foot button{background:#2c2c4a;color:#fff;border:0;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}
    .acts button:hover,.foot button:hover{background:var(--accent);color:var(--dark)}
    .acts .view{background:var(--accent);color:var(--dark);font-weight:700}
    .foot{padding:10px 14px;background:var(--dark);display:flex;gap:6px;flex-wrap:wrap;align-items:center;border-top:1px solid #2c2c4a}
    .foot .main{background:var(--accent);color:var(--dark);font-weight:700}
    .foot input{width:62px;background:#12121f;border:1px solid #34345a;color:#fff;border-radius:6px;padding:4px;font-size:11px}
    table{width:100%;border-collapse:collapse;font-size:11.5px}
    th,td{padding:6px 4px;text-align:left;border-bottom:1px solid #2c2c4a}
    th{color:var(--mut);font-size:10.5px}
    tr.click{cursor:pointer}tr.click:hover{background:#26264a}
    .chips{display:flex;flex-wrap:wrap;gap:6px}
    .chip{background:#2c2c4a;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer}
    .chip:hover{background:var(--accent);color:var(--dark)}.chip:hover i{color:var(--dark)}.chip i{color:var(--accent);font-style:normal;margin-left:6px}
    .empty{color:var(--mut);text-align:center;padding:30px 10px;font-size:13px}
    .legend{font-size:10.5px;color:var(--mut);padding:0 14px 8px}
    .lb{position:fixed;inset:0;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center}
    .lb.open{display:flex}
    .lbbox{width:min(94vw,920px);max-height:96vh;display:flex;flex-direction:column;background:#12121f;border-radius:14px;overflow:hidden;color:#fff;border:1px solid #34345a}
    .lbbar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;background:#1A1A2E;border-bottom:2px solid #F5A31A;flex-wrap:wrap}
    .lbbar b{font-size:13px}
    .lbbar button{background:#2c2c4a;color:#fff;border:0;border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;margin-left:4px}
    .lbbar button:hover{background:#F5A31A;color:#1A1A2E}
    .lbmedia{flex:1;display:flex;align-items:center;justify-content:center;background:#000;min-height:200px;overflow:hidden}
    .lbmedia video,.lbmedia img{max-width:100%;max-height:72vh;object-fit:contain}
    .lbcopy{padding:10px 14px;font-size:12px;max-height:16vh;overflow:auto;color:#d5d5e8;white-space:pre-wrap}
    .lbmsg{color:#F5A31A;font-size:12px;padding:6px 14px}
  </style>
  <div class="wrap">
    <button class="fab" id="fab" title="Abrir Ad Miner"><img id="fablogo" alt="Ad Miner"><span id="fabc">0</span></button>
    <div class="panel" id="panel">
      <header><img id="logo" alt="Ad Miner | Mineração de Ofertas"><button id="close">×</button></header>
      <div class="about">
        <div class="row1"><span id="origin"></span><button class="badge" id="devbadge" title="Ver versão e atualizações">Dev</button></div>
        <div class="box" id="vbox">
          <div>Versão instalada: <b id="ver"></b></div>
          <div id="vstatus">Verificando atualização...</div>
          <div><a id="repo" href="${REPO}" target="_blank" rel="noopener">📦 Ver repositório no GitHub</a></div>
        </div>
      </div>
      <div class="stats" id="stats"></div>
      <div class="tabs">
        <button class="tab on" data-tab="ads">Anúncios</button>
        <button class="tab" data-tab="advs">Anunciantes</button>
        <button class="tab" data-tab="words">Palavras</button>
        <button class="tab" data-tab="favs" id="tabfavs">Salvos</button>
      </div>
      <div class="filters">
        <input class="full" id="q" placeholder="Buscar em copy, anunciante, domínio ou ID">
        <input id="minDays" type="number" min="0" placeholder="Mín. dias">
        <input id="minVar" type="number" min="0" placeholder="Mín. variações">
        <select id="sort">
          <option value="score">Ordenar: Score</option>
          <option value="days">Mais dias no ar</option>
          <option value="vars">Mais variações</option>
          <option value="newest">Mais novos</option>
          <option value="oldest">Mais antigos</option>
        </select>
        <select id="type"><option value="all">Mídia: todas</option><option value="video">Vídeo</option><option value="imagem">Imagem</option><option value="texto">Sem mídia</option></select>
        <select id="status"><option value="all">Status: todos</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
        <label><input type="checkbox" id="dim" checked> Esmaecer</label>
        <label class="full"><input type="checkbox" id="hide"> Ocultar na página os anúncios que não passam no filtro</label>
      </div>
      <div class="legend">Score: dias no ar (55%), variações (30%), volume do anunciante (15%). Forte 70+, Médio 40+. A lista reseta ao recarregar ou mudar a busca, os salvos ficam.</div>
      <div class="list" id="list"></div>
      <div class="foot">
        <button class="main" id="auto">Carregar tudo</button>
        <input id="max" type="number" value="400" title="Limite de anúncios">
        <button id="csv">CSV</button>
        <button id="json">JSON</button>
        <button id="ids">Copiar IDs</button>
        <button id="clear">Limpar lista</button>
      </div>
    </div>

    <div class="lb" id="lb">
      <div class="lbbox">
        <div class="lbbar">
          <b id="lbt"></b>
          <span>
            <button id="lbprev">‹</button><button id="lbnext">›</button>
            <button id="lbfs">Tela cheia</button>
            <button id="lbopen">Abrir em nova aba</button>
            <button id="lbad">Ver na Biblioteca</button>
            <button id="lbclose">Fechar</button>
          </span>
        </div>
        <div class="lbmedia" id="lbm"></div>
        <div class="lbmsg" id="lbmsg"></div>
        <div class="lbcopy" id="lbc"></div>
      </div>
    </div>
  </div>`;

  const $ = id => root.getElementById(id);

  // topo: logo, origem e versao; clicar no selo abre o box de versao
  const newer = (a, b) => {
    const x = a.split('.').map(Number), y = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return false;
  };
  let installed = '';
  try {
    const mf = chrome.runtime.getManifest();
    installed = mf.version;
    const logo = chrome.runtime.getURL('assets/logo-white.png');
    $('logo').src = logo; $('fablogo').src = logo;
    $('ver').textContent = installed;
    $('devbadge').textContent = mf.update_url ? 'v' + installed : 'Dev'; // Dev = instalada sem loja
  } catch (e) { /* ignora */ }
  $('origin').textContent = location.origin;

  let checked = false;
  function checkUpdate() {
    if (checked) return;
    checked = true;
    const st = $('vstatus');
    try {
      chrome.runtime.sendMessage({ type: 'am-latest' }, r => {
        const v = r && r.version;
        if (chrome.runtime.lastError || !v) { checked = false; st.textContent = '⚠️ Não foi possível verificar a atualização.'; return; }
        st.innerHTML = newer(v, installed)
          ? `⬆️ Nova versão <b>${esc(v)}</b> disponível. <a href="${REPO}" target="_blank" rel="noopener">Baixar</a>`
          : '✅ Você está na versão mais recente.';
      });
    } catch (e) { checked = false; st.textContent = '⚠️ Recarregue a página para verificar.'; }
  }
  $('devbadge').onclick = () => { $('vbox').classList.toggle('open'); checkUpdate(); };

  /* ========================= LIGHTBOX ========================= */
  const lb = { id: null, idx: 0, list: [] };

  function mediaOf(a) {
    if (a.media && a.media.length) return a.media;
    const src = a.thumbData || a.thumb;
    return src ? [{ type: 'imagem', src }] : [];
  }

  function renderLightbox() {
    const a = getAd(lb.id);
    if (!a) return;
    const m = lb.list[lb.idx];
    const box = $('lbm');
    box.innerHTML = '';
    $('lbmsg').textContent = '';
    $('lbt').textContent = `${a.advertiser || 'Anúncio'} | ${lb.list.length ? (lb.idx + 1) + '/' + lb.list.length : 'sem mídia'}`;
    $('lbc').textContent = a.copy || '';
    $('lbprev').style.display = $('lbnext').style.display = lb.list.length > 1 ? '' : 'none';
    if (!m) { $('lbmsg').textContent = 'Nenhuma mídia disponível para este anúncio.'; return; }
    if (m.type === 'video') {
      const v = document.createElement('video');
      v.src = m.src; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      if (m.poster) v.poster = m.poster;
      v.addEventListener('error', () => {
        $('lbmsg').textContent = 'O vídeo expirou ou não pode ser reproduzido aqui. Use "Ver na Biblioteca" para abrir o anúncio original.';
      });
      box.appendChild(v);
    } else {
      const i = document.createElement('img');
      i.src = m.src;
      i.addEventListener('error', () => {
        if (a.thumbData && i.src !== a.thumbData) i.src = a.thumbData;
        else $('lbmsg').textContent = 'A imagem expirou. Use "Ver na Biblioteca" para abrir o anúncio original.';
      });
      box.appendChild(i);
    }
  }

  function openLightbox(id, idx) {
    const a = getAd(id);
    if (!a) return;
    lb.id = id; lb.idx = idx || 0; lb.list = mediaOf(a);
    $('lb').classList.add('open');
    renderLightbox();
  }
  function closeLightbox() {
    $('lb').classList.remove('open');
    $('lbm').innerHTML = '';
    lb.id = null;
  }
  const lbStep = d => { if (lb.list.length > 1) { lb.idx = (lb.idx + d + lb.list.length) % lb.list.length; renderLightbox(); } };

  $('lbclose').onclick = closeLightbox;
  $('lb').addEventListener('click', e => { if (e.target === $('lb')) closeLightbox(); });
  $('lbprev').onclick = () => lbStep(-1);
  $('lbnext').onclick = () => lbStep(1);
  $('lbfs').onclick = () => { const el = $('lbm').firstElementChild; if (el && el.requestFullscreen) el.requestFullscreen(); };
  $('lbopen').onclick = () => { const m = lb.list[lb.idx]; if (m) window.open(m.src, '_blank'); };
  $('lbad').onclick = () => { if (lb.id) window.open('https://www.facebook.com/ads/library/?id=' + lb.id, '_blank'); };
  window.addEventListener('keydown', e => {
    if (!$('lb').classList.contains('open')) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeLightbox(); }
    if (e.key === 'ArrowRight') { e.stopPropagation(); lbStep(1); }
    if (e.key === 'ArrowLeft') { e.stopPropagation(); lbStep(-1); }
  }, true);

  /* ========================= RENDER ========================= */
  function renderStats() {
    const all = [...state.ads.values()];
    const act = all.filter(a => a.status === 'ativo').length;
    const strong = all.filter(a => a.tier === 'forte').length;
    const avg = all.length ? Math.round(all.reduce((s, a) => s + a.days, 0) / all.length) : 0;
    $('stats').innerHTML = [
      [all.length, 'Capturados'], [act, 'Ativos'], [strong, 'Fortes'], [avg + 'd', 'Média no ar']
    ].map(([v, l]) => `<div class="st"><b>${v}</b><small>${l}</small></div>`).join('');
    $('fabc').textContent = all.length;
    $('tabfavs').textContent = `Salvos (${state.saved.size})`;
  }

  function rowHTML(a) {
    const src = a.thumbData || a.thumb;
    const live = a.el && a.el.isConnected;
    const hasMedia = (a.media && a.media.length) || src;
    return `<div class="row ${a.tier}" data-id="${a.id}">
      <div class="thw" data-act="view" title="Ampliar mídia">
        ${src ? `<img class="th" src="${esc(src)}" alt="">` : '<div class="th"></div>'}
        ${a.type === 'video' ? '<div class="play">▶</div>' : ''}
      </div>
      <div class="info">
        <div class="top"><b title="${esc(a.advertiser)}">${esc(a.advertiser || 'Sem nome')}</b></div>
        <div class="mets">
          <div class="met" title="Dias desde o início da veiculação"><b class="${a.days >= 45 ? 'c-g' : a.days >= 14 ? 'c-y' : 'c-n'}">${a.days}</b><small>dias no ar</small></div>
          <div class="met" title="Quantidade de anúncios que usam este mesmo criativo e texto"><b class="${a.vars >= 3 ? 'c-p' : 'c-n'}">${a.vars}x</b><small>variações</small></div>
          <div class="met score" title="Score de oferta de 0 a 100"><b class="${a.tier === 'forte' ? 'c-g' : a.tier === 'medio' ? 'c-y' : 'c-r'}">${a.score}</b><small>score</small></div>
          <div class="met" title="Anúncios deste anunciante capturados nesta busca"><b class="c-n">${a.advAds || 1}</b><small>do anunciante</small></div>
        </div>
        <div class="meta">${a.type} | ${a.status || '?'}${a.domain ? ' | ' + esc(a.domain) : ''} | Início ${fmtDate(a.start) || '?'} | ID ${a.id}</div>
        <div class="copy">${esc((a.copy || '').slice(0, 160))}</div>
        <div class="acts">
          ${hasMedia ? `<button class="view" data-act="view">${a.type === 'video' ? 'Ver vídeo' : 'Ver imagem'}</button>` : ''}
          ${live ? '<button data-act="go">Ir</button>' : ''}
          <button data-act="open">Biblioteca</button>
          <button data-act="copy">Copiar texto</button>
          <button data-act="fav">${isSaved(a.id) ? '★ Salvo' : '☆ Salvar'}</button>
          ${a.link ? '<button data-act="site">Site</button>' : ''}
        </div>
      </div></div>`;
  }

  function renderList() {
    const el = $('list');
    const t = state.tab;
    if (t === 'ads' || t === 'favs') {
      const list = currentList();
      const emptyMsg = t === 'favs' ? 'Nenhum anúncio salvo ainda. Use o botão "Salvar" em qualquer anúncio.' : 'Nenhum anúncio ainda. Role a página ou clique em "Carregar tudo".';
      el.innerHTML = list.length ? list.slice(0, 300).map(rowHTML).join('') : `<div class="empty">${emptyMsg}</div>`;
    } else if (t === 'advs') {
      const m = new Map();
      filtered().forEach(a => {
        const k = a.advertiser || 'Sem nome';
        const o = m.get(k) || { name: k, n: 0, act: 0, max: 0, sum: 0, domains: new Set() };
        o.n++; if (a.status === 'ativo') o.act++; o.max = Math.max(o.max, a.days); o.sum += a.days;
        if (a.domain) o.domains.add(a.domain);
        m.set(k, o);
      });
      const rows = [...m.values()].sort((a, b) => b.n - a.n).slice(0, 200);
      el.innerHTML = rows.length ? `<table><tr><th>Anunciante</th><th>Anúncios</th><th>Ativos</th><th>Máx dias</th><th>Méd dias</th></tr>${rows.map(o =>
        `<tr class="click" data-q="${esc(o.name)}" title="${esc([...o.domains].join(', '))}"><td>${esc(o.name)}<br><small style="color:#9a9ab5">${esc([...o.domains].slice(0, 2).join(', '))}</small></td><td>${o.n}</td><td>${o.act}</td><td>${o.max}</td><td>${Math.round(o.sum / o.n)}</td></tr>`).join('')}</table>`
        : '<div class="empty">Sem dados.</div>';
    } else if (t === 'words') {
      const uni = new Map(), bi = new Map();
      filtered().forEach(a => {
        const toks = ((a.copy || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length >= 4 && !STOP.has(w));
        new Set(toks).forEach(w => uni.set(w, (uni.get(w) || 0) + 1));
        const seen = new Set();
        for (let i = 0; i < toks.length - 1; i++) seen.add(toks[i] + ' ' + toks[i + 1]);
        seen.forEach(b => bi.set(b, (bi.get(b) || 0) + 1));
      });
      const top = m => [...m.entries()].filter(e => e[1] > 1).sort((a, b) => b[1] - a[1]).slice(0, 40);
      const chips = l => l.map(([w, c]) => `<span class="chip" data-q="${esc(w)}">${esc(w)}<i>${c}</i></span>`).join('') || '<div class="empty">Sem repetições ainda.</div>';
      el.innerHTML = `<h4 style="margin:0 0 8px">Termos (anúncios que usam)</h4><div class="chips">${chips(top(uni))}</div><h4 style="margin:16px 0 8px">Combinações de 2 palavras (ângulos e ganchos)</h4><div class="chips">${chips(top(bi))}</div>`;
    }
  }

  function refresh() {
    recompute();
    decorate();
    renderStats();
    if (state.open) renderList();
  }
  const refreshSoft = debounce(refresh, 300);

  /* ========================= EVENTOS ========================= */
  $('fab').onclick = () => { state.open = true; $('panel').classList.add('open'); $('fab').style.display = 'none'; refresh(); };
  $('close').onclick = () => { state.open = false; $('panel').classList.remove('open'); $('fab').style.display = ''; };

  root.querySelectorAll('.tab').forEach(b => b.onclick = () => {
    state.tab = b.dataset.tab;
    root.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
    renderList();
  });

  const bind = (id, key, num) => $(id).addEventListener('input', e => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    state.filters[key] = num ? (+v || 0) : v;
    refresh();
  });
  bind('q', 'q'); bind('minDays', 'minDays', true); bind('minVar', 'minVar', true);
  bind('sort', 'sort'); bind('type', 'type'); bind('status', 'status'); bind('dim', 'dim'); bind('hide', 'hide');
  $('max').addEventListener('input', e => { state.max = +e.target.value || 400; });

  root.addEventListener('click', e => {
    const chip = e.target.closest('[data-q]');
    if (chip) {
      state.filters.q = chip.dataset.q; $('q').value = chip.dataset.q; state.tab = 'ads';
      root.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === 'ads'));
      refresh(); return;
    }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const row = btn.closest('.row');
    if (!row) return;
    const id = row.dataset.id;
    const a = getAd(id);
    if (!a) return;
    const act = btn.dataset.act;
    if (act === 'view') openLightbox(id, 0);
    if (act === 'go' && a.el && a.el.isConnected) {
      a.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const old = a.el.style.boxShadow;
      a.el.style.boxShadow = '0 0 0 4px #00e5ff';
      setTimeout(() => { a.el.style.boxShadow = old; }, 1500);
    }
    if (act === 'open') window.open('https://www.facebook.com/ads/library/?id=' + id, '_blank');
    if (act === 'site') window.open(a.link, '_blank');
    if (act === 'copy') { navigator.clipboard.writeText(a.copy || ''); btn.textContent = 'Copiado'; }
    if (act === 'fav') toggleSave(id);
  });

  /* ========================= EXPORTACAO ========================= */
  const COLS = ['id', 'anunciante', 'status', 'inicio', 'fim', 'dias_no_ar', 'variacoes', 'score', 'nivel', 'tipo_midia', 'dominio', 'cta', 'link_destino', 'copy', 'url_biblioteca'];
  const rowOf = a => [a.id, a.advertiser, a.status, fmtDate(a.start), fmtDate(a.end), a.days, a.vars, a.score, a.tier, a.type, a.domain, a.cta, a.link, a.copy, 'https://www.facebook.com/ads/library/?id=' + a.id];
  const csvCell = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ') + '"';
  const stamp = () => new Date().toISOString().slice(0, 10);
  const tag = () => (state.tab === 'favs' ? 'salvos' : 'lista');

  $('csv').onclick = () => {
    const rows = currentList().map(rowOf);
    download(`ad-miner-${tag()}-${stamp()}.csv`, 'text/csv;charset=utf-8', '\ufeff' + [COLS, ...rows].map(r => r.map(csvCell).join(';')).join('\n'));
  };
  $('json').onclick = () => {
    const data = currentList().map(a => Object.fromEntries(COLS.map((c, i) => [c, rowOf(a)[i]])));
    download(`ad-miner-${tag()}-${stamp()}.json`, 'application/json', JSON.stringify(data, null, 2));
  };
  $('ids').onclick = () => {
    navigator.clipboard.writeText(currentList().map(a => a.id).join('\n'));
    $('ids').textContent = 'Copiado';
    setTimeout(() => { $('ids').textContent = 'Copiar IDs'; }, 1200);
  };
  $('clear').onclick = () => { state.ads.clear(); refresh(); };

  /* ========================= AUTO SCROLL ========================= */
  async function autoLoad() {
    if (state.scrolling) { state.scrolling = false; return; }
    state.scrolling = true;
    $('auto').textContent = 'Parar';
    let last = -1, stale = 0;
    while (state.scrolling) {
      window.scrollTo({ top: document.documentElement.scrollHeight });
      await sleep(1800);
      scan();
      const c = state.ads.size;
      if (c >= state.max) break;
      if (c === last) { if (++stale >= 4) break; } else stale = 0;
      last = c;
    }
    state.scrolling = false;
    $('auto').textContent = 'Carregar tudo';
    refresh();
  }
  $('auto').onclick = autoLoad;

  /* ========================= SCAN ========================= */
  function scan() {
    collectCards().forEach(({ id, el }) => {
      const ad = extract(el, id);
      const prev = state.ads.get(id) || {};
      const merged = { ...prev };
      Object.entries(ad).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return;
        if (Array.isArray(v) && !v.length) return;
        if (k === 'days' && !v) return;
        merged[k] = v;
      });
      merged.el = el;
      state.ads.set(id, merged);
    });
    refreshSoft();
  }
  const scanSoft = debounce(scan, 700);

  const OWN = n => n.classList && (n.classList.contains('am-badge') || n.classList.contains('am-zoom'));
  const isOwn = m => {
    const t = m.target;
    if (host.contains(t) || t === host || OWN(t)) return true;
    if (t.closest && t.closest('.am-badge, .am-zoom')) return true;
    const nodes = [...m.addedNodes, ...m.removedNodes];
    return nodes.length > 0 && nodes.every(OWN);
  };

  new MutationObserver(muts => { if (!muts.every(isOwn)) scanSoft(); })
    .observe(document.body, { childList: true, subtree: true });

  // reset ao mudar a busca sem recarregar (a Biblioteca e uma SPA)
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      state.scrolling = false;
      state.ads.clear();
      refresh();
      setTimeout(scan, 1500);
    }
  }, 1000);

  // carrega salvos
  try {
    chrome.storage.local.get('amSaved', r => {
      Object.entries(r.amSaved || {}).forEach(([id, o]) => state.saved.set(id, revive(o)));
      refresh();
    });
  } catch (e) { /* ignora */ }

  scan();
})();
