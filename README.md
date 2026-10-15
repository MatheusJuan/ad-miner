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
- **Filtros:** busca por texto (copy, anunciante, domínio ou ID), mínimo de dias, mínimo de variações, tipo de mídia (vídeo, imagem ou sem mídia), status (ativo ou inativo) e destino do clique (site, WhatsApp ou mensagem). O que não passa no filtro pode ser esmaecido ou ocultado na própria página.
- **Destino do clique:** cada anúncio é classificado como site, WhatsApp ou mensagem (Messenger), e a opção "Site ou WhatsApp" mostra só os que levam o lead para um canal de contato.
- **Visualizador de mídia:** a mídia ocupa a área principal, com tela cheia, abertura em nova aba e link para o anúncio original. Na lateral ficam o anunciante, o nível (forte, médio ou fraco), os destaques (dias no ar, variações, score e volume do anunciante), os dados do anúncio, a copy e os botões de copiar texto, salvar e abrir o site.
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

## Atualizações

Clique no selo **Dev** no topo do painel para ver a versão instalada, se há uma versão mais nova publicada neste repositório e o link para o GitHub. A checagem compara o `version` do `manifest.json` da branch `main` com o da sua instalação. Para atualizar, [baixe o ZIP mais recente](https://github.com/MatheusJuan/ad-miner/releases/latest/download/ad-miner.zip), extraia por cima da pasta anterior (substituindo os arquivos) e clique em recarregar a extensão em `chrome://extensions`. Os anúncios salvos são mantidos.

### Histórico recente

- **1.4.2:** link de download direto do ZIP no aviso de nova versão e no README.
- **1.4.1:** chave Pix na aba Cafézinho.
- **1.4.0:** aba Cafézinho para apoiar o projeto.
- **1.3.0:** filtro de destino do clique (site, WhatsApp ou mensagem) e coluna `destino` nas exportações.
- **1.2.x:** novo topo do painel com versão e checagem de atualização, destaque em laranja, logo no botão flutuante, visualizador com lateral de copy e destaques, e badge isolado do CSS do Facebook.

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
