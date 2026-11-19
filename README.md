# Painel Restaurante (Stack Solution)

Cardápio digital com pedido na mesa por QR Code e painel da casa.

- **Tudo em um (recomendado):** abra `sistema.html`. No topo, no centro, escolha **Cliente**, **Restaurante** ou **TV senhas**. O pedido feito no Cliente aparece no Restaurante (o botão Restaurante mostra um número quando chega algo novo).
- **Sistema em 2 telas:** abra `restaurante.html` (o que o restaurante vê: Pedidos, Cozinha, Bar, Mesas, Reservas, Cardápio e Gerência) e, em outra janela do mesmo navegador, `cliente.html` (o que o cliente vê na mesa 5; para outra mesa, `cliente.html?mesa=3`). O pedido feito no cliente aparece no restaurante.
- **Demonstração lado a lado:** abra `demo-pdv.html` no navegador do computador. À esquerda o cliente na mesa 5; à direita o painel com Cozinha, Bar, Mesas (garçom), Reservas e Gerência/CRM.
- **Site do cardápio:** `templates/restaurante-site` (leia o `README.md` de lá).
- **Sistema de verdade:** o plano completo está em `templates/restaurante-site/PROMPT-PAINEL.md`.
- **Testes:** `python3 templates/restaurante-site/testes/testar.py`
