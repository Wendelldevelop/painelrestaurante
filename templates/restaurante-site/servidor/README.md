# Servidor do Comanda+ (versão 1)

O servidor coloca o Comanda+ **na internet**: o celular do cliente, o painel do restaurante e a TV ficam em aparelhos diferentes e conversam em tempo real. Ele também guarda tudo num banco de dados.

## O que ele faz
- **Landing page** em `/` (com o botão "Testar", que abre a demonstração em `/demonstracao`).
- **Cliente:** `/<restaurante>/mesa/<n>?t=<código>` (QR de cada mesa) e `/<restaurante>/balcao?balcao=1&t=<código>` (QR do balcão).
- **Painel:** `/<restaurante>/painel`, com **login de verdade** (senha protegida com scrypt, limite de tentativas e sessão de 14 horas).
- **TV de senhas:** `/<restaurante>/tv`, num aparelho separado (TV com navegador, TV box ou um notebook ligado na TV).
- **Segurança:**
  - cada mesa tem um **código secreto no QR**, e quem não tem o código não consegue pedir;
  - a mesa do pedido vem do QR, nunca do celular;
  - **até 6 pedidos por minuto** por mesa;
  - cada restaurante só vê os próprios dados.
- **Nada se perde:**
  - o pedido é guardado no banco antes de ir para a cozinha;
  - se o painel recarregar ou a internet do restaurante cair, os pedidos abertos do dia voltam sozinhos.
- **Vários restaurantes** no mesmo servidor, cada um com o seu endereço (`/casa-brasa/...`, `/burger-top/...`).

## Testar no seu computador
Precisa do **Node 22.13 ou mais novo** e do **Python 3** (com `pip install qrcode` para gerar os QR Codes).

```bash
cd templates/restaurante-site/servidor
python3 admin.py criar casa-brasa "Casa Brasa" --mesas 12 --email gerente@casabrasa.com.br --senha "troque-esta-senha"
python3 admin.py qrcodes casa-brasa --url http://localhost:8080
npm start
```

Abra `http://localhost:8080/casa-brasa/painel` (painel), `http://localhost:8080/casa-brasa/tv` (TV) e `http://localhost:8080/casa-brasa/qrcodes` (QR Codes para imprimir; ao abrir um QR, você entra como cliente).

Teste automático (3 aparelhos simulados): `npm test`.

## Colocar no ar (recomendado: um servidor VPS)
O banco é um arquivo (SQLite), então o servidor precisa de **disco que não se apaga**. O jeito mais simples e barato é um **VPS** (Hostinger, Contabo, DigitalOcean, Magalu Cloud: a partir de uns R$ 30 por mês).

1. Contrate um VPS com **Ubuntu** e aponte o seu domínio (ex.: `app.comandamais.com.br`) para o IP dele.
2. No VPS, instale o Node 22, o Python, o git e o Caddy (que faz o HTTPS sozinho):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs python3-pip git caddy && pip3 install qrcode
   ```
3. Baixe o projeto e crie o primeiro restaurante:
   ```bash
   git clone https://github.com/Wendelldevelop/painelrestaurante.git && cd painelrestaurante/templates/restaurante-site/servidor
   python3 admin.py criar casa-brasa "Casa Brasa" --mesas 12 --email gerente@casabrasa.com.br --senha "uma-senha-forte"
   python3 admin.py qrcodes casa-brasa --url https://app.comandamais.com.br
   ```
4. Deixe o servidor sempre ligado (reinicia sozinho se cair ou se o VPS reiniciar):
   ```bash
   sudo npm install -g pm2 && pm2 start "npm start" --name comanda && pm2 save && pm2 startup
   ```
5. Configure o HTTPS no Caddy (`/etc/caddy/Caddyfile`) e reinicie com `sudo systemctl reload caddy`:
   ```
   app.comandamais.com.br {
       reverse_proxy localhost:8080
   }
   ```
6. **Backup:** copie todo dia a pasta `servidor/dados` (tem o banco e a chave de login). Ex.: `0 4 * * * tar czf ~/backup-$(date +\%F).tgz ~/painelrestaurante/templates/restaurante-site/servidor/dados` no `crontab -e`.

## Comandos do dia a dia (`admin.py`)
| O que fazer | Comando |
|---|---|
| Novo restaurante | `python3 admin.py criar <id> "<Nome>" --mesas 12 --email ... --senha ...` |
| Novo funcionário | `python3 admin.py usuario <id> email@... "senha" --nome "Ana" --funcao cozinha` |
| Mudar número de mesas | `python3 admin.py mesas <id> 20` (depois gere os QR Codes de novo) |
| QR Codes para imprimir | `python3 admin.py qrcodes <id> --url https://app.comandamais.com.br` |
| Suspender por falta de pagamento | `python3 admin.py suspender <id>` (e `ativar` para voltar) |
| Ver todos | `python3 admin.py listar` |

**Cardápio e marca de cada restaurante:** gere o site com os dados do restaurante (`montar.py`) e copie `casa-brasa.html` para `servidor/dados/restaurantes/<id>/site.html`. Se esse arquivo não existir, o servidor usa o cardápio modelo.

## O que vem na próxima versão (fase 2)
Esta versão já permite rodar um restaurante com **um painel principal** (computador ou tablet do caixa ou da cozinha), os celulares dos clientes e a TV. Para a próxima versão ficam:
- **Vários aparelhos da equipe sincronizados:** tablet da cozinha, celular do garçom e computador do gerente ao mesmo tempo, com o estado guardado no servidor.
- **Cardápio, reservas, clientes, fidelidade e estoque salvos no banco**, editáveis pelo painel e por restaurante.
- **Relatórios do mês com os dados reais** do banco.
- **WhatsApp oficial** (resumo do dia, reservas, fila) e **IA de verdade** (API do Claude).
- **Pix com confirmação automática** pelo banco ou intermediador de pagamento.
- **Cobrança automática da mensalidade** (Asaas ou Iugu) com suspensão automática.
- Painel do super administrador numa tela, no lugar do `admin.py`.

Enquanto isso, o painel publicado esconde os recursos que ainda usam dados de exemplo: relatório do mês, resumo do WhatsApp, assistente de IA, estoque, rede de lojas e integrações.
