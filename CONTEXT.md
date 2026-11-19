# Contexto do projeto: Painel Restaurante (Stack Solution)

Leia isto antes de mexer no projeto. Resume o que existe, as decisões já tomadas e o que falta.

## O negócio
- Agência **Stack Solution** vende para restaurantes, por **assinatura mensal** (o lucro está na recorrência e no suporte).
- **Sem delivery.** Pedido só na mesa (QR Code) e, talvez, retirada no balcão.
- **Caixa, nota fiscal e pagamento ficam no sistema que o restaurante já usa.** Nós entregamos o resumo da conta para o caixa lançar.

### Planos e preços (proposta atual)
| Plano | Mensal | 3 meses | 6 meses | 12 meses |
|---|---|---|---|---|
| Cardápio Digital | R$ 350 | R$ 1.200 | R$ 2.200 | R$ 4.200 |
| Site + Reservas | R$ 550 | R$ 1.900 | R$ 3.500 | R$ 6.600 |
| Mesa Completa | R$ 990 | R$ 3.400 | R$ 6.300 | R$ 11.880 |

- 20 clientes (8/7/5) = R$ 11.600/mês. 50 clientes (20/18/12) = R$ 28.780/mês.
- **Em aberto:** a implantação entra nos pacotes ou é cobrada à parte?
- Apresentação (slides): https://claude.ai/artifact/YBnRHxZJgt7vQ5VAn6mfdf (privada).

## O sistema: 2 partes
1. **O que o cliente vê** (`cliente.html`): site do restaurante com cardápio, fotos e reserva. Pelo QR da mesa (`?mesa=N`) ele pede, acompanha o status, chama o garçom e **fecha a conta pelo celular** (vê os itens, 10% opcional, escolhe Pix/crédito/débito/dinheiro e divide por pessoas). O pagamento é na **maquininha do restaurante**: o painel avisa "levar a maquininha", o garçom confirma "Pago na maquininha", a mesa é liberada e o cliente recebe o link para avaliar no Google. Ao adicionar um prato aparece "Vai bem com…" (venda extra).
2. **O que o restaurante vê** (`restaurante.html`): painel claro, menu lateral no PC e menu embaixo no celular (botão "Ver no celular / Ver no PC"). Abas:
   - **Pedidos:** todos do dia, com status e filtro.
   - **Cozinha e Bar:** pedidos separados por setor, com tempo, alerta de atraso e "esgotado hoje".
   - **Mesas (garçom):** mapa, aceite do 1º pedido, "entregue na mesa", fechar conta com 10% de serviço.
   - **Reservas:** lista do dia e "Confirmar no WhatsApp".
   - **Cardápio (dono):** preços, vendidos hoje e esgotado.
   - **Gerência e CRM:** faturamento, ticket médio, tempo de preparo, vendas extras, mais pedidos, cancelamentos, clientes sumidos e aniversariantes.
   - **"Entrar como":** cada função vê só a sua tela.
   - **Segurança na demo:**
     - aceite do 1º pedido;
     - QR que muda ao fechar a mesa;
     - limite de 3 pedidos por minuto por mesa;
     - cancelar só com senha do gerente (1234 na demo);
     - pedido reenviado até o restaurante confirmar.

**Recursos de mercado (já na demo):**
- **Adicionais e opções no prato** (`opcoes` em `cardapio.json`): acompanhamento, tamanho, borda, adicionais com preço extra; o preço soma na hora.
- **Comanda individual:** cada pessoa põe o nome no pedido; a conta sai separada por pessoa e dá para "cada um paga o seu".
- **Pedido lançado pelo garçom** na aba Mesas ("+ Lançar pedido"), para quem não quer usar o QR.
- **Relatório do mês em PDF** (Gerência > "Relatório do mês"): faturamento, pedidos, ticket, vendas por dia, horários de pico, pratos mais vendidos e recomendações. Números do mês são de exemplo.
- **Integrações com o caixa** (aba Integrações): Saipos, Consumer, Colibri ou webhook; cada pedido e conta fechada é enviado (simulado na demo, com o JSON que seria enviado).

**Tudo em um:** `sistema.html` junta as duas partes, com a escolha **Cliente | Restaurante** no topo, no centro.

**Hoje é demonstração:** roda só no navegador, sem servidor. As duas telas conversam quando abertas no **mesmo navegador** (BroadcastChannel). `demo-pdv.html` mostra as duas lado a lado. Reservas, clientes e as mesas 2, 7 e 9 ocupadas são dados de exemplo.

## Arquivos
- `cliente.html`, `restaurante.html`, `demo-pdv.html`: gerados, prontos para abrir.
- `templates/restaurante-site/`: fonte do site.
  - `fonte/modelo.html`, `fonte/premium.css`, `fonte/premium.js`: o site inteiro, em JavaScript puro.
  - `montar.py`: gera `casa-brasa.html` (arquivo único) e `site/` (para publicar).
  - `demo-pdv.py`: gera `demo-pdv.html`, `cliente.html` e `restaurante.html`.
  - `fotos.py`: tratamento das fotos dos pratos.
  - `PROMPT-PAINEL.md`: especificação completa do **sistema real** (Supabase + Next.js PWA, segurança, LGPD, webhook para PDV de caixa).
  - `README.md`, `NOVO-CLIENTE.md`: uso e como montar um cliente novo.
- `templates/restaurante-premium/data/config.json` e `cardapio.json`: dados do restaurante de exemplo (Casa Brasa).
- `.claude/skills/restaurante-site/SKILL.md`: skill do projeto para o Claude.

## Modos do site (`config.json`)
- `"pedidos": false`: só cardápio (vitrine).
- `"pedidos": true`: pedido e reserva pelo WhatsApp (`"entrega": {"delivery": false}` tira o delivery).
- `"pedidos": "painel"`: pedido só com QR da mesa, enviado ao painel.
- `"esgotados": []`, `"avaliacao": {"link": ""}`: o link do Google de cada cliente ainda precisa ser preenchido.

## Comandos
```bash
python3 templates/restaurante-site/montar.py
python3 templates/restaurante-site/demo-pdv.py
python3 templates/restaurante-site/testes/testar.py
```
O último roda todos os testes: os três modos, a demo e as duas telas.

## Próximo passo grande
Construir o sistema real descrito em `templates/restaurante-site/PROMPT-PAINEL.md`, para funcionar com o celular do cliente e o painel em aparelhos diferentes, com login, banco e vários restaurantes.

## Preferências do dono do projeto
- Responder em português, de forma curta e simples (não é programador).
- Economizar uso: não reler arquivos inteiros sem necessidade; usar a skill e o comando de teste único.
- Visual sofisticado, sem cara de IA (pratos redondos, fundo creme, fontes Fraunces e Hanken Grotesk).
