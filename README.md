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
- **Painel lateral** com cinco abas:
  - **Anúncios:** lista ordenável por score, dias no ar, variações, mais novos ou mais antigos.
  - **Anunciantes:** ranking com quantidade de anúncios, ativos, máximo e média de dias.
  - **Palavras:** termos e combinações de duas palavras mais repetidos nas copys, para achar ângulos e ganchos. Clicar em um termo filtra a lista.
  - **Salvos:** anúncios guardados no navegador, que continuam disponíveis ao recarregar a página.
  - **☕ Cafézinho:** chave Pix e endereços de criptomoeda para quem quiser apoiar o projeto (opcional).
- **Agrupar criativos repetidos:** o mesmo criativo do mesmo anunciante aparece em uma linha só, com o selo "+N iguais". Dá para desligar no painel, e as exportações sempre levam todos os anúncios.
- **Filtros:** busca por texto (copy, anunciante, domínio ou ID), mínimo de dias, mínimo de variações, tipo de mídia (vídeo, imagem ou sem mídia), status (ativo ou inativo) e destino do clique (site, WhatsApp ou mensagem). O que não passa no filtro pode ser esmaecido ou ocultado na própria página. Os filtros ficam salvos entre sessões (menos o texto da busca) e o painel mostra quantos anúncios estão sendo exibidos.
- **Destino do clique:** cada anúncio é classificado como site, WhatsApp ou mensagem (Messenger), e a opção "Site ou WhatsApp" mostra só os que levam o lead para um canal de contato.
- **Visualizador de mídia:** a mídia ocupa a área principal, com tela cheia, abertura em nova aba e link para o anúncio original. Na lateral ficam o anunciante, o nível (forte, médio ou fraco), os destaques (dias no ar, variações, score e volume do anunciante), os dados do anúncio, a copy e os botões de copiar texto, salvar e abrir o site.
- **Modelar página:** clique no ícone do Ad Miner na barra do navegador em qualquer página de destino (por exemplo, a landing page de um anúncio). A extensão gera o **print completo da página em alta qualidade (2x)**, extrai a estrutura (títulos, botões, formulários, preços e texto) e monta um **prompt pronto para colar no Claude**. O prompt funciona como um mini agente: faz uma entrevista rápida se faltar informação, diagnostica a página, aponta os pontos fortes, compara anúncio e página e entrega a remodelagem da sua oferta, a estrutura da página seção por seção e três ângulos de anúncio. Você preenche os insumos do seu produto uma vez e eles ficam salvos. Se você abriu a página pelo botão **Site** do painel, o anúncio de origem entra no prompt e os criativos ficam prontos para copiar ou baixar.
- **Carregar tudo:** rola a página automaticamente até o limite de anúncios definido (padrão 400).
- **Exportação:** CSV (separador `;`, compatível com Excel em português), JSON ou só a lista de IDs.
- **Português e inglês:** reconhece a Biblioteca nos dois idiomas.

## Instalação

A extensão não está na Chrome Web Store. A instalação é manual e leva um minuto:

1. **[Baixe o ad-miner.zip](https://github.com/MatheusJuan/ad-miner/releases/latest/download/ad-miner.zip)** e extraia em uma pasta que você não vá apagar (por exemplo, `Documentos/ad-miner`).
2. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta extraída (a que contém o `manifest.json`).

Funciona também no Edge, Brave e Opera. O Chrome pode mostrar um aviso de extensão do modo desenvolvedor ao abrir: é esperado para instalação fora da loja.

## Como usar

1. Acesse a [Biblioteca de Anúncios da Meta](https://www.facebook.com/ads/library/) e faça uma busca.
2. Clique no botão com a logo **Ad Miner** no canto inferior direito para abrir o painel. O número ao lado mostra quantos anúncios foram capturados.
3. Role a página ou clique em **Carregar tudo** para capturar mais anúncios.
4. Ordene e filtre. Use **Salvar** nos anúncios que interessam e **CSV** ou **JSON** para levar os dados para fora.

A lista da página atual zera ao recarregar ou ao mudar a busca. Os anúncios salvos permanecem.

### Modelar página

1. No painel, clique em **Site** no anúncio que você quer estudar. A página de destino abre em outra aba.
2. Nessa aba, clique no ícone do Ad Miner na barra do navegador. Se não aparecer, fixe-o pelo menu de extensões.
3. Preencha **Seus insumos** (produto, público, oferta, diferenciais e provas).
4. Clique em **Capturar página**. O Chrome mostra uma faixa de depuração por alguns segundos, e isso é esperado. Páginas muito longas saem em mais de um arquivo.
5. Clique em **Copiar prompt**, cole no Claude e depois cole ou anexe o print e os criativos do anúncio (os botões **Copiar criativo** e **Baixar** estão no mesmo painel).

Dicas: feche o DevTools da aba antes de capturar e evite páginas com dados pessoais (painéis, e-mails, contas).

## Atualizações

Clique no selo **Dev** no topo do painel para ver a versão instalada, se há uma versão mais nova publicada neste repositório e o link para o GitHub. A checagem compara o `version` do `manifest.json` da branch `main` com o da sua instalação. Para atualizar, [baixe o ZIP mais recente](https://github.com/MatheusJuan/ad-miner/releases/latest/download/ad-miner.zip), extraia por cima da pasta anterior (substituindo os arquivos) e clique em recarregar a extensão em `chrome://extensions`. Os anúncios salvos são mantidos.

### Histórico recente

- **1.6.0:** função **Modelar página**: print completo em alta qualidade, estrutura da página e prompt pronto para o Claude, com os insumos do produto e o anúncio de origem.
- **1.5.0:** criativos repetidos agrupados na lista ("+N iguais"), variações contadas por anunciante, contador "mostrando X de Y", filtros lembrados entre sessões, miniaturas dos salvos mais confiáveis, CSV protegido contra fórmulas e "Limpar lista" que desfaz as marcações na página.
- **1.4.2:** link de download direto do ZIP no aviso de nova versão e no README.
- **1.4.1:** chave Pix na aba Cafézinho.
- **1.4.0:** aba Cafézinho para apoiar o projeto.
- **1.3.0:** filtro de destino do clique (site, WhatsApp ou mensagem) e coluna `destino` nas exportações.
- **1.2.x:** novo topo do painel com versão e checagem de atualização, destaque em laranja, logo no botão flutuante, visualizador com lateral de copy e destaques, e badge isolado do CSS do Facebook.

## Privacidade

Tudo roda no seu navegador. Os dados dos anúncios e os salvos ficam em `chrome.storage.local` e não são enviados a nenhum servidor. As requisições externas feitas pela extensão são a leitura do `manifest.json` deste repositório, para a checagem de versão, e o download de miniaturas e criativos de anúncios (do CDN da Meta) quando você salva, copia ou baixa um anúncio. O **Modelar página** só age quando você clica no ícone: o print, o texto da página e os insumos ficam no seu computador e só saem dele quando você cola o prompt na IA que escolher.

## Estrutura

```
ad-miner/                 raiz do repositório
  README.md, CLAUDE.md
  logo-*.png, icon-*.png  artes originais
  ad-miner/               pasta da extensão
    manifest.json
    content.js            leitura da página, métricas e painel
    background.js         versão no GitHub, miniaturas e print da página
    lp.js                 Modelar página (injetado ao clicar no ícone)
    assets/               logo e ícones usados pela extensão
```

Não há build nem dependências: é JavaScript puro. Para desenvolver, edite os arquivos e recarregue a extensão e a aba da Biblioteca.

## Limitações

- O score é uma heurística baseada em tempo no ar e repetição de criativo. Não considera gasto nem conversão.
- A leitura depende do texto da página (não de classes CSS), o que resiste bem a mudanças visuais, mas pode quebrar se a Meta mudar os rótulos.
- Só funciona com a Biblioteca em português ou inglês.
- Links de vídeo e imagem da Meta expiram. Anúncios salvos guardam uma miniatura, mas o vídeo original pode deixar de abrir com o tempo.
- Com muitos anúncios carregados (centenas) a página pode ficar mais lenta.

## Apoie o projeto ☕

O Ad Miner é feito e mantido por uma pessoa só e continua funcionando igual para todo mundo. Se ele te ajuda a achar boas ofertas, você pode pagar um cafezinho por Pix ou criptomoeda. As mesmas chaves e endereços estão na aba **Cafézinho** do painel, com botão de copiar.

| Moeda | Rede | Chave ou endereço |
| --- | --- | --- |
| Pix | Chave aleatória | `f5c8ac92-9089-421f-867a-3009c70ba022` |
| Bitcoin | Bitcoin | `bc1qwnh9fm5fw4z9w9sf9dm6q5mma7djuyy743g5h2` |
| Ethereum | Ethereum | `0xaC5C2A9ba9A844F51CCb100b8756518ADd3CF93B` |
| Dólar digital (USDT ou USDC) | Ethereum (ERC-20) | `0xaC5C2A9ba9A844F51CCb100b8756518ADd3CF93B` |
| Solana | Solana | `9WbXEo6xZCuS29beCY3keeTYb19JcWFm71UQj6HJcjiL` |

Em criptomoeda, confira a rede antes de enviar: mandar uma moeda pela rede errada pode perder o valor.

## Aviso

Este é um projeto independente, sem vínculo com a Meta. A Biblioteca de Anúncios é pública, mas leia os termos de uso da Meta e use a ferramenta com responsabilidade.
