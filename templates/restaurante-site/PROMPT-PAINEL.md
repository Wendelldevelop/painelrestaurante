# Prompt: sistema de pedidos na mesa (PDV de pedidos) integrado ao cardápio digital

Copie tudo abaixo da linha e cole numa nova conversa com o Claude Code, aberta no repositório `stack-solution`.

---

Você é um engenheiro full-stack sênior. Construa o **sistema de pedidos na mesa** de um produto que vou vender por assinatura mensal a vários restaurantes. Ele é integrado ao site de cardápio digital que já existe neste repositório. Precisa aguentar uma sexta à noite com a casa cheia e ser fácil de eu manter sozinho.

Antes de programar, leia o projeto, me mostre um plano curto (arquitetura, telas, tabelas do banco e etapas) e espere eu aprovar. Depois implemente em etapas pequenas, testando cada uma, com um commit por etapa. Use a skill `restaurante-site` do repositório para entender o site.

## Escopo
**Entra:** pedido na mesa por QR Code, retirada no balcão, cozinha e bar, celular do garçom, reservas e gerência com CRM.
**Não entra:** delivery, caixa, emissão de nota fiscal e pagamento. O caixa e a nota continuam no sistema que o restaurante já usa; nós entregamos o resumo da conta para ele lançar.

## O que já existe (leia antes)
- `templates/restaurante-site/`: site do cardápio em HTML, CSS e JavaScript puro. Leia `README.md`, `NOVO-CLIENTE.md` e a skill `.claude/skills/restaurante-site/SKILL.md`.
- `templates/restaurante-premium/data/config.json`: dados do restaurante. A chave `pedidos` define o modo do site:
  - `false`: só cardápio;
  - `true`: pedido e reserva pelo WhatsApp;
  - `"painel"`: pedido só com o QR da mesa, enviado ao painel. Hoje só funciona na demonstração `demo-pdv.html`, via `postMessage`; você vai ligar esse modo ao servidor de verdade.
- `templates/restaurante-premium/data/cardapio.json`: pratos (`id`, `nome`, `categoria`, `preco`, `descricao`, `ingredientes`, `alergenicos`, `restricoes` e fotos).
- O QR de cada mesa abre `cardapio.html?mesa=N`; as plaquinhas saem em `site/mesas.html`.
- Testes do site: `python3 templates/restaurante-site/testes/testar.py` (rode sempre; não pode quebrar os modos atuais).

## As frentes (telas)
São dois sistemas: o **do cliente** (o site que já existe) e o **da casa** (um painel só, com login, que mostra a tela certa para cada função).

### 1. Site do cliente (já existe: só integrar)
- Cardápio, fotos, história e **pedido de reserva** (dia, horário, número de pessoas, nome e telefone).
- A reserva vai para o painel de reservas (frente 2), não mais direto para o WhatsApp.

### 2. Reservas (recepção)
- Lista de reservas por dia, com status: pendente, confirmada, chegou, não veio, cancelada.
- Botão que abre o WhatsApp do cliente já com a mensagem de confirmação pronta; ao confirmar, a reserva muda de status.
- Ver a lotação por horário e bloquear horários cheios no site.
- **Fila de espera:** o cliente entra na fila pelo celular e é avisado no WhatsApp quando a mesa liberar.

### 3. Cardápio da mesa (cliente, pelo QR)
- Só pede quem escaneou o QR da mesa; sem QR, o cardápio é só para ver (o site já faz isso).
- Monta o pedido como hoje: quantidade, tirar ingrediente, ponto da carne, observação.
- **Pede mais na mesma conta:** várias rodadas e vários celulares na mesma mesa somam.
- Acompanha o status: recebido, em preparo, pronto, entregue.
- Botões "Chamar garçom" e "Pedir a conta".
- Prato esgotado aparece como "esgotado hoje" e não pode ser pedido.
- **Retirada no balcão:** pedido com número; o cliente é avisado quando ficar pronto.
- Se o servidor estiver fora do ar, avisa e oferece mandar o pedido pelo WhatsApp (o fluxo atual).

### 4. Cozinha e bar (telas de produção)
- Pedidos chegando em tempo real, com som, pensado para tablet.
- **Separar por setor:** bebidas vão para a tela do bar, pratos para a cozinha (setor definido por categoria do cardápio).
- Mudar status: em preparo, pronto.
- **Tempo de cada pedido,** com alerta quando passar do tempo normal.
- Marcar prato esgotado na hora.
- **Comanda impressa (opcional):** impressora térmica comum no Brasil (Epson, Elgin, Bematech) sem servidor no restaurante. Pesquise e me apresente as opções antes de implementar.

### 5. Celular do garçom (atendente)
- **Mapa das mesas:** livre, ocupada, aguardando pedido, pronto para levar, pediu a conta.
- **Aceitar o primeiro pedido de cada mesa** (evita pedido de brincadeira de quem fotografou o QR).
- Ver o que está pronto e **marcar "entregue na mesa"**.
- **Lançar pedido pelo celular dele,** para o cliente que não quer usar o QR.
- Receber os alertas de "chamar garçom" e "pedir a conta".
- **Fechar a mesa:** resumo com itens, taxa de serviço de 10% (configurável) e total, para o caixa lançar no sistema dele; depois liberar a mesa (o código do QR muda).

### 6. Gerência e CRM (dono)
- **Cardápio:** editar nome, descrição, preço, foto, categoria, setor (cozinha ou bar), ordem e esgotado. O site passa a ler o cardápio daqui. Importar o `cardapio.json` atual.
- **Mesas e QR Codes:** quantas mesas, gerar e imprimir as plaquinhas.
- **Usuários por função:** gerente, recepção, cozinha, bar e garçom, cada um vendo só a sua tela.
- **Cancelar ou trocar item** só com a senha do gerente, com o motivo registrado.
- **Resumo do dia e do mês:** pedidos, pratos mais pedidos, tempo médio de preparo, horários de pico, reservas e faltas. É o que vou mostrar ao dono todo mês para ele renovar.
- **CRM:** clientes que reservaram ou pediram (nome, telefone, visitas, última visita, aniversário se informado), com filtro "não volta há X dias" e botão para mandar mensagem no WhatsApp.
- **Avaliação:** depois da visita, um link para o cliente deixar nota no Google.

### 7. Minha área (super administrador)
- Um único sistema atende vários restaurantes, com dados isolados (nenhum vê nada de outro).
- Cada restaurante tem um identificador curto (por exemplo `casa-brasa`) usado nas URLs.
- Criar restaurante, escolher o plano (Cardápio Digital, Site + Reservas, Mesa Completa) e ativar ou suspender por falta de pagamento.

### 8. Balcão com senha e TV (lanchonetes, hamburguerias, cafeterias)
- Pedido sem mesa ("Retirar no balcão" ou QR do balcão `?balcao`): o cliente recebe uma **senha** no celular.
- Tela de **TV** com "Preparando" e "Pode retirar", chamando a senha com som; botões "Chamar de novo" e "Retirado".

### 9. Redes (várias unidades) — já nascer preparado
- Uma conta de **rede** com várias **unidades**; cada unidade com mesas, equipe, QR e caixa próprios.
- **Painel da rede:** faturamento somado, ranking das lojas, ticket, tempo de preparo e alertas por unidade.
- **Cardápio central** com preço próprio por unidade e "esgotado" por loja.
- Cargos: dono da rede, gerente regional, gerente da loja e equipe.
- **Cliente único da rede** (CRM e fidelidade valem em qualquer unidade).
- Abrir unidade nova copiando a configuração de outra.
- Tipo de negócio na configuração (restaurante, pizzaria, hamburgueria, cafeteria, bar) liga só os recursos daquele tipo.

### 10. Para o dono voltar todo dia e o cliente voltar sempre
- **Resumo do dia no WhatsApp** do dono às 23h (faturamento, pedidos, campeão, preparo, cancelamentos, reservas de amanhã), via API oficial do WhatsApp.
- **Fidelidade com cashback** (% configurável) ou "10ª visita grátis", válido na rede toda.
- **Promoções por horário** (happy hour, prato do dia) que ligam e desligam sozinhas e mudam o preço no cardápio.
- **Fila de espera virtual** pelo QR da porta, com aviso no WhatsApp quando a mesa libera.
- **Assistente com IA** para o dono perguntar sobre os próprios dados (usar a API do Claude, só leitura, por restaurante).

## Segurança e confiabilidade (obrigatório)
- Código da mesa no QR que muda quando a mesa é fechada, mais o aceite do garçom no primeiro pedido.
- Limite de pedidos por minuto por mesa.
- Regras de acesso no banco por restaurante (row-level security ou equivalente).
- Nenhuma chave secreta no código do site; o site usa só a chave pública.
- LGPD: pedido na mesa não exige nome nem telefone; dados do CRM só com o cliente sabendo, e o restaurante pode apagar um cliente.
- **Internet oscilando:** o pedido do cliente e o status na cozinha não podem se perder; guardar e reenviar quando a conexão voltar.

## Tecnologia sugerida (proponha outra se tiver motivo forte)
- Supabase (Postgres, Auth, Realtime, Row Level Security), plano gratuito no começo.
- Painel da casa em Next.js com TypeScript, hospedado na Vercel, funcionando bem como app no celular (PWA).
- O site continua em JavaScript puro, com um módulo pequeno para falar com o Supabase, ativado por `"pedidos": "painel"` mais a URL e a chave pública no `config.json`, sem quebrar os modos `false` e `true`.
- Informe o custo mensal estimado para 1, 10 e 50 restaurantes.

## Integração com o site (contrato)
Documente funções ou endpoints para:
- ler cardápio e esgotados;
- abrir a sessão da mesa (mesa e código);
- criar pedido (`id` do prato, quantidade, observação) e pedido de retirada;
- acompanhar o status em tempo real;
- chamar garçom e pedir a conta;
- criar reserva e entrar na fila de espera.

Deixe também um webhook a cada pedido e a cada mesa fechada, para no futuro integrar com o PDV de caixa do cliente (Saipos, Consumer, Colibri e outros). Não implemente essas integrações agora.

## Qualidade e entrega
- Visual com o mesmo cuidado do site: letras grandes, alto contraste, usável com a mão suja na cozinha e com uma mão só no celular do garçom.
- Testes automatizados do fluxo principal: escanear, pedir, garçom aceitar, aparecer na cozinha e no bar, mudar status, cliente ver o status, garçom entregar e fechar a mesa. Inclua duas mesas e três celulares ao mesmo tempo.
- Uma demonstração para eu mostrar a donos de restaurante, como a `demo-pdv.html`, agora com cozinha, garçom e reservas.
- README em português simples, para alguém não técnico (eu):
  - criar as contas no Supabase e na Vercel, passo a passo;
  - cadastrar um restaurante novo e as mesas;
  - imprimir os QR Codes;
  - treinar a equipe em 1 hora (roteiro);
  - o que fazer se der problema numa noite cheia.
- Não invente dados: o que faltar, marque com `TODO` e me avise.

Comece lendo o projeto e me mostrando o plano.
