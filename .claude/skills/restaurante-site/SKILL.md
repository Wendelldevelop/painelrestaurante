---
name: restaurante-site
description: Trabalhar no modelo de site de restaurante (Casa Brasa) em templates/restaurante-site — cardápio digital, pedido na mesa por QR, PDV de demonstração. Use ao mudar visual, cardápio, fotos, modos de pedido, montar ou testar esse site.
---

# Site de restaurante (Casa Brasa)

O dono do projeto fala português, não é técnico e quer respostas curtas. Ele gerencia limite de uso: não releia arquivos inteiros, não tire prints sem necessidade, rode o teste único em vez de testes manuais.

## Onde fica cada coisa
- `templates/restaurante-site/fonte/`: `premium.js` (todo o site, JS puro), `premium.css` (tokens no `:root`), `modelo.html` (casca com `%%MARCADORES%%`), `fontes/`.
- `templates/restaurante-premium/data/`: `config.json` (restaurante, horários, `pedidos`), `cardapio.json` (pratos), `fotos.json` (origem e recorte das fotos).
- `templates/restaurante-premium/public/fotos/` e `video/`: fotos tratadas e vídeo da capa (gerados).
- Saídas geradas (não editar à mão): `casa-brasa.html`, `site/`, `demo-pdv.html`, `casa-brasa-site.zip`.
- Documentos: `README.md`, `NOVO-CLIENTE.md`, `PROMPT-PAINEL.md`.

## Modos (`"pedidos"` no config.json)
- `false`: só cardápio, com redes sociais. É o modo publicado hoje.
- `true`: pedido e reserva pelo WhatsApp; QR da mesa (`?mesa=N`) manda "Na mesa N".
- `"painel"`: pedido só com QR da mesa, vai para o PDV (hoje só na demonstração, por `postMessage`).
- Elementos marcados com `data-so-pedido` / `data-so-vitrine` aparecem conforme o modo.

## Comandos
```bash
python3 templates/restaurante-site/fotos.py            # depois de mudar fotos.json
python3 templates/restaurante-site/montar.py           # gera casa-brasa.html e site/
python3 templates/restaurante-site/demo-pdv.py         # gera demo-pdv.html (tela dividida)
python3 templates/restaurante-site/testes/testar.py    # TODOS os testes, nos 3 modos; restaura o config
```
Sempre rode `testar.py` antes de commitar. Ele imprime só o resumo.

## Regras do projeto
- Visual: Fraunces (títulos), Hanken Grotesk (texto), Allura (nomes dos pratos); pratos redondos vistos de cima na louça branca; nada de fotos quadradas; sem fotos geradas por IA.
- Roleta do Executivo e transições curtas funcionam mesmo com "animações reduzidas" (Windows).
- Nada pode passar da largura da tela (testado em 375, 768, 1440 e telas de notebook).
- Depoimentos, endereço e telefone são de exemplo: nunca apresentar como reais.
- Commits no branch de trabalho, com as linhas de atribuição pedidas pela sessão; para entregar, gere o zip da pasta `site/` e envie `casa-brasa.html` / `demo-pdv.html`.
