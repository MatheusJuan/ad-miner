<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo-white.png">
    <img src="logo-black.png" alt="Ad Miner | Mineração de Ofertas" width="420">
  </picture>
</p>

<p align="center">
  Extensão para Chrome que minera a <b>Biblioteca de Anúncios da Meta</b> e mostra quais anúncios têm sinais de oferta que funciona.
</p>

---

## O que é

Anúncio que fica muito tempo no ar, com várias variações do mesmo criativo, costuma ser anúncio que dá retorno: ninguém mantém no ar o que dá prejuízo. O Ad Miner lê a Biblioteca de Anúncios, calcula esses sinais para cada anúncio e destaca os melhores direto na página, além de oferecer um painel para filtrar, comparar, salvar e exportar.

## Funcionalidades

- **Badge em cada anúncio:** dias no ar, variações do criativo e score de 0 a 100, com contorno colorido por nível (forte, médio e fraco).
- **Score de oferta:** combina tempo no ar (55%), variações do criativo (30%) e volume de anúncios do anunciante (15%). Anúncio inativo perde 10 pontos. Forte: 70 ou mais. Médio: 40 ou mais.
- **Painel lateral** com quatro abas:
  - **Anúncios:** lista ordenável por score, dias no ar, variações, mais novos ou mais antigos.
  - **Anunciantes:** ranking com quantidade de anúncios, ativos, máximo e média de dias.
  - **Palavras:** termos e combinações de duas palavras mais repetidos nas copys, para achar ângulos e ganchos. Clicar em um termo filtra a lista.
  - **Salvos:** anúncios guardados no navegador, que continuam disponíveis ao recarregar a página.
- **Filtros:** busca por texto (copy, anunciante, domínio ou ID), mínimo de dias, mínimo de variações, tipo de mídia (vídeo, imagem ou sem mídia) e status (ativo ou inativo). O que não passa no filtro pode ser esmaecido ou ocultado na própria página.
- **Visualizador de mídia:** amplia vídeos e imagens, navega entre as mídias do anúncio, abre em tela cheia ou em nova aba e leva ao anúncio original na Biblioteca.
- **Carregar tudo:** rola a página automaticamente até o limite de anúncios definido (padrão 400).
- **Exportação:** CSV (separador `;`, compatível com Excel em português), JSON ou só a lista de IDs.
- **Português e inglês:** reconhece a Biblioteca nos dois idiomas.

## Instalação

A extensão ainda não está na Chrome Web Store. Para instalar manualmente:

1. Baixe o projeto: clique em **Code > Download ZIP** neste repositório e extraia, ou use `git clone https://github.com/MatheusJuan/ad-miner.git`.
2. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta **`ad-miner/ad-miner`** (a que contém o `manifest.json`).

## Como usar

1. Acesse a [Biblioteca de Anúncios da Meta](https://www.facebook.com/ads/library/) e faça uma busca.
2. Clique no botão **Ad Miner** no canto inferior direito para abrir o painel.
3. Role a página ou clique em **Carregar tudo** para capturar mais anúncios.
4. Ordene e filtre. Use **Salvar** nos anúncios que interessam e **CSV** ou **JSON** para levar os dados para fora.

A lista da página atual zera ao recarregar ou ao mudar a busca. Os anúncios salvos permanecem.

## Atualizações

Clique no selo **Dev** no topo do painel para ver a versão instalada e se há uma versão mais nova publicada neste repositório. A checagem compara o `version` do `manifest.json` da branch `main` com o da sua instalação. Para atualizar, baixe a versão nova, substitua a pasta e clique em recarregar a extensão em `chrome://extensions`.

## Privacidade

Tudo roda no seu navegador. Os dados dos anúncios e os salvos ficam em `chrome.storage.local` e não são enviados a nenhum servidor. A única requisição externa feita pela extensão é a leitura do `manifest.json` deste repositório, para a checagem de versão.

## Estrutura

```
ad-miner/                 raiz do repositório
  README.md, CLAUDE.md
  logo-*.png, icon-*.png  artes originais
  ad-miner/               pasta da extensão
    manifest.json
    content.js            leitura da página, métricas e painel
    background.js         checagem de versão no GitHub
    assets/               logo e ícones usados pela extensão
```

Não há build nem dependências: é JavaScript puro. Para desenvolver, edite os arquivos e recarregue a extensão e a aba da Biblioteca.

## Limitações

- O score é uma heurística baseada em tempo no ar e repetição de criativo. Não considera gasto nem conversão.
- A leitura depende do texto da página (não de classes CSS), o que resiste bem a mudanças visuais, mas pode quebrar se a Meta mudar os rótulos.
- Só funciona com a Biblioteca em português ou inglês.
- Links de vídeo e imagem da Meta expiram. Anúncios salvos guardam uma miniatura, mas o vídeo original pode deixar de abrir com o tempo.
- Com muitos anúncios carregados (centenas) a página pode ficar mais lenta.

## Aviso

Este é um projeto independente, sem vínculo com a Meta. A Biblioteca de Anúncios é pública, mas leia os termos de uso da Meta e use a ferramenta com responsabilidade.
