# Roteiro: demonstração com a cara do cliente (uns 20 minutos)

O que mais vende é o dono abrir o site e ver o restaurante **dele**. Antes da reunião, troque o básico abaixo.

## 1. Junte o material (5 min)

Pelo Instagram e pelo Google Maps do restaurante:

- Nome, endereço, telefone/WhatsApp e horários.
- 6 a 10 pratos com nome e preço (o cardápio do iFood ou uma foto do cardápio impresso servem).
- 3 a 6 fotos boas: o prato mais famoso, o salão e a fachada. Salve na pasta `templates/restaurante-premium/public/originais/`.

## 2. Preencha os dados (10 min)

Em `templates/restaurante-premium/data/`:

**`config.json`**

| Campo | O que pôr |
|---|---|
| `nome`, `slogan`, `cozinha`, `fundacao` | Nome da casa, frase curta, tipo de cozinha, ano de abertura |
| `logo.iniciais` | Duas letras para o selo (ex.: "CB") |
| `whatsapp` | Só números, com 55 e DDD: `5511987654321` |
| `telefone`, `endereco`, `coordenadas` | Como aparece no Google Maps (latitude e longitude: clique com o botão direito no mapa) |
| `horarios` | Dia por dia, `{"abre": "11:30", "fecha": "15:00"}`. Dia fechado: `[]` |
| `capa.titulo`, `capa.texto` | A frase grande da primeira tela e duas linhas embaixo |
| `pratoDoChefe` | O `id` do prato mais famoso |
| `executivo` | Dias e o que acompanha (se não tiver executivo, apague os pratos `exec-` do cardápio) |
| `site.url` | Endereço onde o site vai ficar (precisa para o QR Code das mesas) |
| `mesas` | Quantas plaquinhas de mesa gerar |

**`cardapio.json`**: troque nome, descrição, preço e ingredientes dos pratos. Para a demonstração, basta acertar 6 a 10; os outros podem ficar.

- `destaque: true` faz o prato aparecer grande, com foto, no cardápio (2 ou 3 por categoria).
- Pratos do executivo usam `fotoCima`: foto **vista de cima**, que vira a roleta.

**`fotos.json`**: para cada foto, troque `url` por `"arquivo": "restaurante-premium/public/originais/nome-da-foto.jpg"`. Use o `id` do prato como nome da entrada (`"picanha-brasa": {...}`).

## 3. Gere e confira (5 min)

```bash
python3 templates/restaurante-site/fotos.py
```

```bash
python3 templates/restaurante-site/montar.py
```

Abra `templates/restaurante-site/casa-brasa.html` e confira no celular e no computador.

## 4. Na reunião

1. Mande o link pelo WhatsApp: a prévia com a foto do prato chega antes de ele abrir.
2. Abra no celular dele: primeira tela, "Ver o cardápio", a roleta do executivo.
3. Faça um pedido de teste e mostre a mensagem chegando no WhatsApp.
4. Mostre `mesas.html`: as plaquinhas com QR Code para imprimir e pôr nas mesas.
5. Feche com o que ele ganha: cardápio sem impressão, pedido direto sem taxa de aplicativo, reserva organizada.

## Dicas

- Foto ruim derruba o site inteiro. Se as fotos do cliente forem fracas, use as da demonstração e ofereça a sessão de fotos no pacote.
- Para a roleta, as fotos precisam ser de cima, com o prato redondo inteiro na foto. No `fotos.json`, ajuste `centro` e `raio` para enquadrar o prato.
- Não publique avaliações ou depoimentos inventados no site do cliente: use os reais do Google.
