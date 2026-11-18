# Site do restaurante — plano Premium

App Next.js (App Router) + TypeScript + Tailwind CSS, independente do site da Stack Solution.

## Rodar

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | Lint |
| `npm test` | Testes unitários |

Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SITE_URL`. A `ANTHROPIC_API_KEY` (garçom virtual) entra na etapa 4 e fica só no servidor.

## Trocar o cardápio

Edite `data/cardapio.json`. Cada item:

| Campo | Exemplo |
| --- | --- |
| `id` | `"picanha-brasa"` (vira o endereço `/cardapio/picanha-brasa`) |
| `categoria` | `entradas`, `principais`, `massas`, `sobremesas`, `bebidas` ou `vinhos` |
| `preco` | `89` (número) |
| `ingredientes` | lista de textos (também aparecem no prato desmontado) |
| `alergenicos` | `gluten`, `lactose`, `frutos_do_mar`, `amendoim`, `ovo`, `soja` |
| `restricoes` | `vegetariano`, `vegano`, `sem_gluten` |
| `picante` | 0 a 3 |
| `quente` | `true` mostra vapor no 3D (etapa 3) |
| `harmonizacao` | ids de bebidas/vinhos |
| `imagem` | URL da foto |
| `modelo3d` | opcional, arquivo `.glb` (etapa 3) |
| `destaque` | `true` aparece em "Os mais pedidos" |

Os filtros "sem glúten" e "sem lactose" usam os alergênicos declarados: se o item não tem `gluten`, ele aparece em "sem glúten".

Para usar um banco de dados no lugar do JSON, troque só as funções de `lib/dados.ts`.

## Dados do restaurante

`data/config.json`: nome, WhatsApp, endereço, coordenadas, horários por dia (vários turnos; fechar `00:00` = passa da meia-noite), capacidade de reservas, taxa de entrega, formas de pagamento, história, chef e fotos.

## Cardápio ilustrado

A página `/cardapio` abre com o **prato do chefe** girando em 3D (`pratoDoChefe` em `data/config.json` indica qual prato). Depois vêm as categorias, cada uma com um visual próprio:

| Categoria | Visual |
| --- | --- |
| Entradas e massas | prato grande alternando com cartão de informação |
| Principais | pratos em coluna sobre faixa verde translúcida |
| Executivo | lista numerada em painel vinho e pratos numerados |
| Sobremesas | pratos em coluna sobre faixa oliva |
| Bebidas e vinhos | colagem em arco sobre foto escura |

Ao buscar ou filtrar, o cardápio mostra só os resultados em grade. O campo `selo` de cada item mostra um selo curto ("Mais pedido", "Novidade").

## Prato 3D

`components/prato-3d.tsx` mostra a foto do prato sobre uma louça em 3D (Three.js), com luz quente, sombra e vapor nos pratos com `quente: true`. Arraste para girar. O 3D só carrega quando aparece na tela e pausa fora dela. Sem WebGL ou com "reduzir movimento" ativo, mostra a foto parada.

## Reservas

A página `/reservas` gera os horários de chegada a partir de `data/config.json`:

- `horarios`: os turnos de cada dia. Os horários vão de "abre" até "fecha" menos `reservas.ultimaChegadaAntesDeFecharMin`.
- `reservas.intervaloMinutos`: de quanto em quanto tempo há um horário (ex.: 30).
- `reservas.capacidadePorHorario`: lugares por horário de chegada.
- `reservas.antecedenciaMinimaHoras`: para hoje, esconde horários muito próximos.
- `reservas.diasAFrente` e `reservas.maxPessoas`: até quando e para quantas pessoas reservar pelo site. Grupos maiores vão para o WhatsApp.

A pessoa escolhe pessoas, dia e horário e envia um resumo pelo WhatsApp; a equipe confirma por lá. Para descontar reservas já feitas, passe a lista em `gerarHorarios(config, data, pessoas, reservas)` (`lib/reservas.ts`), por exemplo vinda de um banco ou de uma planilha.

## Mapa

A página `/sobre` mostra o mapa do OpenStreetMap com Leaflet, sem chave de API. A posição vem de `coordenadas` em `data/config.json` (latitude e longitude: no Google Maps, clique com o botão direito no local e copie os números).

## Cores e fontes

Em `app/globals.css`, bloco `@theme`. As fontes ficam em `app/layout.tsx`.

## Estrutura

```
app/            páginas (início, cardápio, prato, pedido, reservas, sobre e contato)
components/     componentes de interface
data/           cardapio.json e config.json
lib/            dados, filtros, horários, reservas, mensagem do WhatsApp
lib/__tests__/  testes unitários (npm test)
store/          carrinho (Zustand salvo no navegador)
types/          tipos compartilhados
```

## Etapas

1. ✅ Estrutura, layout, cardápio, filtros e carrinho com envio pelo WhatsApp
2. ✅ Reservas e página de contato com mapa
3. 🟡 Pratos 3D (prato do chefe pronto) e hero com montagem por scroll (falta)
4. Garçom virtual com IA e filtro de alergênicos
5. Polimento visual, SEO local e desempenho
