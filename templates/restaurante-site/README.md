# Site de restaurante — modelo Casa Brasa

Site completo de restaurante: início, cardápio ilustrado, tela de cada prato, pedido e reserva pelo WhatsApp, história, eventos, mapa e contato.

## O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `casa-brasa.html` | Prévia em arquivo único. Abra com dois cliques para conferir. |
| `site/` | Pasta para publicar: uma página por arquivo, fontes hospedadas junto, `sitemap.xml`. |
| `fonte/` | Código do site: `modelo.html`, `premium.css`, `premium.js`. |
| `montar.py` | Junta código e dados e gera a prévia e a pasta `site/`. |
| `prerender.js` | Usado pelo montador para o conteúdo já vir escrito no HTML. |
| `fotos.py` | Baixa e trata as fotos (mesma luz e cor) e recorta os pratos da roleta. |
| `NOVO-CLIENTE.md` | Roteiro de 20 minutos para montar a demonstração com a cara do cliente. |
| `PROMPT-PAINEL.md` | Prompt para construir o painel de pedidos na mesa integrado a este site. |

Os dados ficam em `../restaurante-premium/data/`:

- `config.json`: nome, endereço, horários, WhatsApp, entrega, história, depoimentos, eventos.
- `cardapio.json`: pratos, preços, descrições, ingredientes, alergênicos.
- `fotos.json`: de onde vem cada foto e como recortar os pratos da roleta.

Fotos tratadas e vídeo ficam em `../restaurante-premium/public/fotos/` e `public/video/`. Depois de trocar uma foto no `fotos.json`, rode `fotos.py` e depois `montar.py`.

## Trocar para outro restaurante

1. Edite `config.json` e `cardapio.json`.
2. Troque as fotos no `fotos.json` e rode `python3 templates/restaurante-site/fotos.py`.
3. Monte de novo:

```bash
python3 templates/restaurante-site/montar.py
```

O montador precisa de Python com Pillow. Com Node e Playwright instalados, o conteúdo das páginas da pasta `site/` já sai escrito no HTML (melhor para o Google); sem eles o site funciona igual.

## Campos que precisam do dado real do cliente

Estão preenchidos com dados de demonstração. Troque antes de publicar:

- `site.url`: endereço do site (usado no sitemap, no link canônico e na prévia do WhatsApp).
- `whatsapp`, `telefone`, `endereco`, `coordenadas`, `horarios`.
- `canais.ifood`: link da loja no iFood. Vazio = o botão não aparece.
- `instagram`, `instagramUsuario`, `facebook`.
- `avaliacao` e `depoimentos`: use os reais. A nota só entra nos dados estruturados do Google se `avaliacao.verificada` for `true`.
- `comodidades` (estacionamento, acessibilidade, pet, Wi-Fi) e `eventos`.
- `sobre.fotos`: fachada, salão, chef e galeria.

## Fotos e vídeo de demonstração

Troque pelos do cliente antes de publicar. Todos são de bancos gratuitos:

- Pratos e casa (Unsplash e Pexels): lista completa no `fotos.json`.
- Roleta do executivo: bife, frango, salmão e curry vistos de cima (Unsplash).
- Vídeo da capa: carne na grelha, do Mixkit (licença gratuita, uso comercial permitido), em `public/video/capa.mp4`.

O tratamento do `fotos.py` deixa luz e cor parecidas, mas fotos de lugares diferentes nunca ficam iguais a uma sessão só.

## Cardápio ou cardápio com pedido

No `config.json`, a chave `pedidos` define o que o site faz:

- `false`: só cardápio. Pratos, preços, fotos e redes sociais, sem pedido e sem reserva (não gera as páginas de reserva e de pedido).
- `true`: o cliente monta o pedido e reserva mesa; tudo chega pelo WhatsApp.

## Plaquinhas de mesa (QR Code)

O montador gera `site/mesas.html`: uma plaquinha por mesa, para imprimir. O QR abre o cardápio com `?mesa=N`; o pedido sai no WhatsApp como "Na mesa N", sem pedir endereço nem telefone. Precisa do `site.url` certo no `config.json` e da biblioteca `qrcode` (`pip install qrcode`).

## Publicar

Envie o conteúdo da pasta `site/` para a hospedagem (Netlify, Vercel, Hostinger, Cloudflare Pages). A página inicial é `index.html`.

## Trocar as cores

No começo de `fonte/premium.css`, em `:root`: `--carvao`, `--creme`, `--brasa`, `--mostarda` e as fontes `--display` e `--sans`.
