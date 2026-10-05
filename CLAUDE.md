# Ad Miner | Mineração de Ofertas

Extensão Chrome (Manifest V3) que analisa a Biblioteca de Anúncios da Meta (`https://www.facebook.com/ads/library/*`) e destaca anúncios com sinais de oferta que funciona: tempo no ar, variações do criativo e volume do anunciante.

Repositório: https://github.com/MatheusJuan/ad-miner

## Estrutura

```
ad-miner/                 raiz do repositório
  CLAUDE.md
  icon-*.png, logo-*.png  artes originais (branco/preto), fora da extensão
  ad-miner/               pasta da extensão (é esta que se carrega no Chrome)
    manifest.json
    content.js            todo o código (IIFE única, ~750 linhas)
    assets/               logo-white.png (560x159) e icon-16/48/128.png, gerados do icon-white original
```

Carregar: `chrome://extensions` > Modo do desenvolvedor > Carregar sem compactação > pasta `ad-miner/ad-miner`. Depois de editar, recarregar a extensão e a aba da Biblioteca. Não há build, bundler, dependências nem testes.

## Como funciona (content.js)

- **Config/constantes:** regex em pt-BR e inglês (`LABEL_RE`, `ID_RE`, `META_LINE`, `CTA_RE`), meses, lista de stopwords.
- **Coleta (`collectCards`):** não usa classes CSS (o Facebook as muda). Percorre os nós de texto atrás de "Identificação da biblioteca" / "Library ID" e sobe no DOM até o ancestral que contém só aquele card.
- **Extração (`extract`):** lê `innerText` do card e tira anunciante (linha antes de "Patrocinado"), copy, CTA, domínio/link de destino (desembrulha `l.facebook.com?u=`), mídia (vídeos e imagens > 120px), status, datas de veiculação e "N anúncios usam esse criativo".
- **Métricas (`recompute`):**
  - `vars` = máximo entre variações nativas da Meta, cópias do mesmo texto (primeiros 220 caracteres normalizados) e cópias da mesma mídia (pathname da thumb).
  - `score` = dias no ar (máx 60) 55% + variações (máx 10) 30% + anúncios do anunciante (máx 15) 15%; inativo perde 10. Níveis: forte 70+, médio 40+, fraco abaixo.
- **Overlay (`decorate`):** badge com dias/variações/score e botão "Ampliar mídia" sobre cada card, contorno por nível, esmaecer ou ocultar o que não passa nos filtros.
- **Painel:** Shadow DOM (`#ad-miner-host`) com topo (logo, origem, selo Dev, versão), estatísticas, abas Anúncios / Anunciantes / Palavras / Salvos, filtros, lightbox de mídia e rodapé (carregar tudo, CSV, JSON, copiar IDs, limpar lista).
- **Estado:** `state.ads` (página atual, zera ao mudar a busca ou recarregar) e `state.saved` (persistido em `chrome.storage.local`, chave `amSaved`, com thumbnail em data URL quando cabe em 600 KB).
- **SPA:** `MutationObserver` com debounce dispara `scan`; um `setInterval` de 1 s detecta mudança de `location.href` e reinicia a lista.
- **Topo do painel:** versão vem de `chrome.runtime.getManifest()`; o selo "Dev" aparece quando o manifest não tem `update_url` (instalação sem loja). A linha "Você está na versão mais recente" é fixa: ainda não há checagem de atualização.

## Convenções

- Código em JavaScript puro, sem dependências. Comentários curtos em português, sem acentos nos comentários do código.
- Textos de interface em pt-BR.
- Qualquer texto vindo da página entra no painel via `esc()`; não usar `innerHTML` com dado do anúncio sem escapar.
- Identidade visual: fundo `#1A1A2E`, roxo `#7B2FBE` (destaque forte), amarelo `#E0A800` (médio). Logo e ícone brancos no painel escuro; logo laranja `#F5A31A` em gradiente.
- Recursos usados pelo content script precisam estar em `web_accessible_resources` no manifest.

## Problemas conhecidos (da análise)

1. `thumbToData` faz `fetch` de fbcdn no content script, sujeito ao CORS da página; sem `host_permissions` pode falhar em silêncio. Possível correção: service worker com `host_permissions` para `*.fbcdn.net`.
2. `csvCell` não neutraliza células iniciadas por `= + - @` (injeção de fórmula no Excel com texto de anúncio de terceiros).
3. `recompute` agrupa variações por texto/mídia sem considerar o anunciante; template de agência infla o score.
4. `collectCards`: com apenas um card na página o ancestral sobe até quase o `body`.
5. "Limpar lista" não desfaz `display:none`/opacidade dos cards nem os badges.
6. Cada `scan` relê `innerText` e `getBoundingClientRect` de todos os cards; custoso perto de 400+ anúncios.
7. Snapshots em `state.saved` são atualizados em memória pelo `recompute`, mas só persistem quando outra ação chama `persistSaved`.
8. Anúncio inativo sem data final tem os dias contados até hoje.
9. `window.open(a.link)` não valida o protocolo no ramo `l.facebook.com`.
10. Só reconhece pt e en; outros idiomas da Biblioteca retornam zero cards.
11. `description` do manifest passa de 132 caracteres (limite da Chrome Web Store).

## Observações de produto e risco

- O score é heurística (tempo no ar como proxy de rentabilidade), sem dado de gasto ou conversão.
- Ler o DOM da Biblioteca pode conflitar com os termos de uso da Meta; considerar isso antes de publicar na Chrome Web Store.
- Não há testes. As partes mais frágeis são `parseDate`, `extract` e o cálculo de score.
