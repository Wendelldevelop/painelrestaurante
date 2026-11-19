"""Gera demo-pdv.html: tela dividida com o cliente na mesa 5 (o site) e o painel da casa.

Uso (depois do montar.py):
    python3 templates/restaurante-site/demo-pdv.py

É só demonstração: tudo roda dentro do navegador, sem servidor. Pedidos, mesas, reservas e
números da gerência que não vêm do celular são dados de exemplo. O sistema de verdade está
descrito em PROMPT-PAINEL.md.
"""
import base64
import json
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
site = (AQUI / "casa-brasa.html").read_text(encoding="utf-8")
# liga o modo painel e fixa a mesa 5 só nesta demonstração
site, n = re.subn(r'"pedidos": (false|true|"painel")', '"pedidos": "painel", "mesa": 5', site, count=1)
assert n == 1, "rode o montar.py antes"
MENU = json.dumps([{"id": i["id"], "nome": i["nome"], "cat": i["categoria"], "preco": i["preco"], "opc": len(i.get("opcoes", []))} for i in json.loads((AQUI.parent / "restaurante-premium/data/cardapio.json").read_text(encoding="utf-8"))], ensure_ascii=False)

PAINEL = r"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demonstração: pedido na mesa e painel da casa</title>
<style>:root{--fundo:#f5efe4;--cartao:#fffdf9;--cartao2:#f1e9dc;--linha:#e6dccb;--texto:#2b2018;--suave:#7c6b58;--brasa:#b23a1e;--brasa-cl:#fbe9e4;--ouro:#b7791f;--ouro-cl:#fbf1de;--verde:#2f7d3b;--verde-cl:#e7f3e6;--sombra:0 1px 2px rgba(60,40,20,.06),0 6px 18px rgba(60,40,20,.06);--r:14px}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;height:100vh;display:grid;grid-template-columns:auto 1fr;overflow:hidden}
button{font:600 13px system-ui,sans-serif;border:0;border-radius:10px;padding:10px 16px;cursor:pointer;background:var(--brasa);color:#fff;transition:filter .15s,transform .1s}
button:hover{filter:brightness(1.08)}button:active{transform:scale(.97)}
button.sec{background:var(--cartao);color:var(--texto);border:1px solid var(--linha)}button.perigo{background:var(--brasa);color:#fff}
.lado{display:grid;place-items:center;padding:24px;background:linear-gradient(160deg,#efe6d6,#e4d8c4);border-right:1px solid var(--linha)}
.lado p{margin:0 0 12px;color:var(--suave);font-size:13px;text-align:center;max-width:390px}
.celular{width:390px;height:min(800px,calc(100vh - 90px));border:10px solid #1d1611;border-radius:44px;overflow:hidden;box-shadow:0 30px 60px rgba(60,40,20,.3);background:#000}
.celular iframe{width:100%;height:100%;border:0;display:block}
.painel{display:grid;grid-template-columns:210px 1fr;grid-template-rows:auto 1fr;min-width:0;min-height:0}
header{grid-column:1/-1;display:flex;align-items:center;gap:14px;padding:14px 24px;background:var(--cartao);border-bottom:1px solid var(--linha)}
header h1{margin:0;font:600 20px/1 Georgia,serif;letter-spacing:-.01em}
header h1::before{content:"CB";display:inline-grid;place-items:center;width:34px;height:34px;margin-right:10px;border-radius:50%;background:var(--brasa);color:#fff;font:700 13px system-ui;vertical-align:middle}
.tag{padding:4px 10px;border-radius:99px;background:var(--verde-cl);color:var(--verde);font-size:11px;font-weight:700}
.tag::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--verde);margin-right:6px;vertical-align:1px;animation:pulsa 1.6s infinite}
.usuario{margin-left:auto;font-size:13px;color:var(--suave)}
.usuario select{font:600 13px system-ui;background:var(--cartao2);color:var(--texto);border:1px solid var(--linha);border-radius:10px;padding:8px 10px;margin-left:8px}
nav{display:flex;flex-direction:column;gap:4px;padding:18px 12px;background:var(--cartao);border-right:1px solid var(--linha);overflow-y:auto}
nav button{background:none;color:var(--suave);text-align:left;padding:11px 14px;border-radius:10px;position:relative;font-size:14px;font-weight:600}
nav button:hover{background:var(--cartao2);color:var(--texto);filter:none}
nav button[aria-selected=true]{background:var(--brasa-cl);color:var(--brasa)}
nav .bolinha{position:absolute;top:50%;right:10px;transform:translateY(-50%);min-width:20px;height:20px;border-radius:10px;background:var(--brasa);color:#fff;font-size:11px;display:grid;place-items:center;padding:0 5px}
main{overflow:auto;padding:24px 28px 40px;min-width:0}
.aba{display:none}.aba.ativa{display:block;animation:entra .25s ease}
.alertas{display:grid;gap:10px;margin-bottom:18px}.alertas:empty{display:none}
.alerta{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:var(--r);background:var(--brasa-cl);border:1px solid #f0c4b8;border-left:5px solid var(--brasa);animation:chega .3s ease;box-shadow:var(--sombra)}
.alerta b{font-size:16px;margin-right:6px}.alerta span{color:var(--suave)}.alerta .mx{margin-left:auto;display:flex;gap:8px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.col{background:var(--cartao2);border-radius:var(--r);padding:14px;min-height:240px}
.col h2{margin:2px 4px 14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--suave)}
.card{background:var(--cartao);border:1px solid var(--linha);border-radius:12px;padding:14px;margin-bottom:12px;animation:chega .35s ease;box-shadow:var(--sombra)}
.card.novo{border-color:var(--ouro);box-shadow:0 0 0 3px var(--ouro-cl),var(--sombra)}.card.atraso{border-color:var(--brasa);box-shadow:0 0 0 3px var(--brasa-cl),var(--sombra)}
.topo{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.mesa{font:600 21px/1 Georgia,serif}.hora{color:var(--suave);font-size:12px}
.tempo{font-variant-numeric:tabular-nums;font-weight:600}.atraso .tempo{color:var(--brasa)}
.card ul{list-style:none;margin:10px 0;padding:0}.card li{padding:6px 0;border-top:1px solid var(--linha);font-weight:500}.card li small{display:block;color:var(--ouro);font-weight:600}
.pe{display:flex;justify-content:space-between;align-items:center;gap:8px}.total{font-weight:700}
.card .mx{display:flex;gap:6px}.card .mx .sec{padding:10px 12px}
.vazio{color:var(--suave);font-size:13px;padding:22px 16px;border:2px dashed var(--linha);border-radius:12px;text-align:center;background:rgba(255,255,255,.4)}
.mapa{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
.m{background:var(--cartao);border:1px solid var(--linha);border-top:5px solid var(--linha);border-radius:var(--r);padding:14px;min-height:140px;display:flex;flex-direction:column;gap:4px;box-shadow:var(--sombra)}
.m .n{font:600 22px/1 Georgia,serif}.m .s{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.m .v{color:var(--suave);font-size:13px}.m button{margin-top:auto}
.m.livre{background:rgba(255,253,249,.6);box-shadow:none}.m.livre .s{color:var(--verde)}
.m.ocupada{border-top-color:var(--ouro)}.m.ocupada .s{color:var(--ouro)}
.m.pronto{border-top-color:var(--verde);background:var(--verde-cl)}.m.pronto .s{color:var(--verde)}
.m.conta{border-top-color:var(--brasa);background:var(--brasa-cl)}.m.conta .s{color:var(--brasa)}
.lista{display:grid;gap:10px}
.linha{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--cartao);border:1px solid var(--linha);border-radius:12px;box-shadow:var(--sombra)}
.linha .q{font:600 19px/1 Georgia,serif;min-width:60px;color:var(--brasa)}.linha .d{flex:1;min-width:0}.linha .d small{display:block;color:var(--suave)}
.st{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px}
.st.pendente{color:var(--ouro);background:var(--ouro-cl)}.st.confirmada{color:var(--verde);background:var(--verde-cl)}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}
.k{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r);padding:16px;box-shadow:var(--sombra)}
.k small{color:var(--suave);font-size:12px;font-weight:600}.k b{display:block;font:600 26px/1.25 Georgia,serif;margin-top:4px}
.k.lucro{background:var(--verde-cl);border-color:#cfe5cc}.k.lucro b{color:var(--verde)}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.bloco{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r);padding:18px;box-shadow:var(--sombra)}
.bloco .linha{box-shadow:none;background:var(--fundo)}
.bloco h3{margin:0 0 12px;font:600 16px Georgia,serif}
.barra{display:flex;align-items:center;gap:10px;font-size:13px;margin:8px 0}.barra i{height:10px;border-radius:5px;background:linear-gradient(90deg,var(--brasa),var(--ouro));display:block}
.nota{color:var(--suave);font-size:12px;margin-top:12px}
.seguro{display:flex;gap:8px;flex-wrap:wrap}.seguro span{font-size:12px;padding:6px 12px;border-radius:99px;background:var(--verde-cl);color:var(--verde);font-weight:600}
.seguro span::before{content:"✓ "}
.modal{position:fixed;inset:0;background:rgba(43,32,24,.45);backdrop-filter:blur(3px);display:grid;place-items:center;z-index:9}.modal[hidden]{display:none}
.caixa{background:var(--cartao);border-radius:18px;padding:24px;width:min(440px,92vw);box-shadow:0 30px 60px rgba(43,32,24,.25)}.caixa h3{margin:0 0 12px;font:600 21px Georgia,serif}
.caixa .l{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--linha)}.caixa .t{font-size:20px;font-weight:700;border:0;color:var(--brasa)}
.caixa label{display:block;font-size:13px;font-weight:600;color:var(--suave)}
.caixa input,.caixa select{width:100%;font:15px system-ui;padding:11px;margin:6px 0 12px;border-radius:10px;border:1px solid var(--linha);background:var(--fundo);color:var(--texto)}
.erro{color:var(--brasa);font-size:13px;min-height:1.2em;font-weight:600}
div.esg{display:flex;flex-wrap:wrap;gap:8px}div.esg button{background:var(--fundo);color:var(--texto);border:1px solid var(--linha);font-weight:500}
div.esg button.on{background:var(--brasa-cl);color:var(--brasa);border-color:#f0c4b8;text-decoration:line-through}
tbody.esg button{padding:7px 12px;background:var(--verde-cl);color:var(--verde);border-color:#cfe5cc;text-decoration:none}tbody.esg button.on{background:var(--brasa-cl);color:var(--brasa);border-color:#f0c4b8}
.filtros{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.filtros button{background:var(--cartao);color:var(--suave);border:1px solid var(--linha);font-weight:600;border-radius:99px;padding:8px 14px}.filtros button.on{background:var(--texto);color:var(--cartao);border-color:var(--texto)}
.tabela{overflow-x:auto;background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r);box-shadow:var(--sombra)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--suave);padding:12px 14px;background:var(--cartao2)}
td{padding:12px 14px;border-top:1px solid var(--linha);vertical-align:top}tr:hover td{background:#fdf8f0}td small{display:block;color:var(--suave)}
.ps{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:99px;white-space:nowrap;background:var(--cartao2);color:var(--suave)}
.ps.p-Pronto,.ps.p-Entregue{color:var(--verde);background:var(--verde-cl)}.ps.p-Recebido,.ps.p-Em,.ps.p-Aguardando{color:var(--ouro);background:var(--ouro-cl)}.ps.p-Cancelado,.ps.p-Recusado{color:var(--brasa);background:var(--brasa-cl)}
#aba-pedidos>.vazio{margin-top:14px}
@media(max-width:700px){.col{min-height:0}.usuario{font-size:0}.painel{grid-template-columns:1fr;grid-template-rows:auto 1fr auto}header{padding:10px 14px;flex-wrap:wrap;gap:8px}header h1{font-size:17px}.usuario{margin-left:0;flex:1;display:flex;align-items:center}.usuario select{flex:1}nav{grid-row:3;flex-direction:row;overflow-x:auto;border-right:0;border-top:1px solid var(--linha);padding:6px;gap:2px}nav button{white-space:nowrap;font-size:12px;padding:10px 12px}nav .bolinha{top:3px;right:1px;transform:none;min-width:16px;height:16px;font-size:10px}main{padding:14px}.cols,.duas{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr;gap:10px}.k b{font-size:20px}.mapa{grid-template-columns:1fr 1fr;gap:10px}.alerta{flex-wrap:wrap}.alerta .mx{margin-left:0;width:100%}.alerta .mx button{flex:1}.linha{flex-wrap:wrap}}
body.modo-cel{background:#ddd0bb}
body.modo-cel .painel{width:400px;justify-self:center;align-self:center;height:min(820px,calc(100vh - 40px));border:10px solid #1d1611;border-radius:38px;overflow:hidden;box-shadow:0 30px 60px rgba(60,40,20,.3);background:var(--fundo)}
body.modo-cel main{overflow:auto}
body.modo-cel .painel{grid-template-columns:1fr;grid-template-rows:auto 1fr auto}
body.modo-cel .col{min-height:0}
body.modo-cel .usuario{font-size:0}
body.modo-cel header{padding:10px 14px;flex-wrap:wrap;gap:8px}
body.modo-cel header h1{font-size:17px}
body.modo-cel .usuario{margin-left:0;flex:1;display:flex;align-items:center}
body.modo-cel .usuario select{flex:1}
body.modo-cel nav{grid-row:3;flex-direction:row;overflow-x:auto;border-right:0;border-top:1px solid var(--linha);padding:6px;gap:2px}
body.modo-cel nav button{white-space:nowrap;font-size:12px;padding:10px 12px}
body.modo-cel nav .bolinha{top:3px;right:1px;transform:none;min-width:16px;height:16px;font-size:10px}
body.modo-cel main{padding:14px}
body.modo-cel .cols,body.modo-cel .duas{grid-template-columns:1fr}
body.modo-cel .kpis{grid-template-columns:1fr 1fr;gap:10px}
body.modo-cel .k b{font-size:20px}
body.modo-cel .mapa{grid-template-columns:1fr 1fr;gap:10px}
body.modo-cel .alerta{flex-wrap:wrap}
body.modo-cel .alerta .mx{margin-left:0;width:100%}
body.modo-cel .alerta .mx button{flex:1}
body.modo-cel .linha{flex-wrap:wrap}
@media(max-width:700px){#modo-tela{display:none}nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:6px;overflow:visible}nav button{white-space:normal;text-align:center;font-size:11px;line-height:1.2;padding:9px 4px;min-height:44px}nav .bolinha{top:2px;right:2px}.tabela{background:none;border:0;box-shadow:none;overflow:visible}.tabela table,.tabela tbody,.tabela tr,.tabela td{display:block}.tabela thead{display:none}.tabela tr{display:grid;gap:4px 10px;background:var(--cartao);border:1px solid var(--linha);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--sombra)}.tabela td{padding:0;border:0;background:none!important}#aba-pedidos tr{grid-template-columns:auto 1fr auto}#aba-pedidos td:nth-child(3){font-weight:700}#aba-pedidos td:nth-child(4){grid-column:1/-1;padding:6px 0;border-top:1px solid var(--linha);border-bottom:1px solid var(--linha)}#aba-pedidos td:nth-child(5){font-weight:700}#aba-pedidos td:nth-child(6){grid-column:2/-1;justify-self:end}#aba-cardapio tr{grid-template-columns:1fr auto;align-items:center}#aba-cardapio td:nth-child(1){font-weight:600}#aba-cardapio td:nth-child(2),#aba-cardapio td:nth-child(3){display:none}#aba-cardapio td:nth-child(6){grid-row:1/3;grid-column:2}#aba-cardapio td:nth-child(4),#aba-cardapio td:nth-child(5){color:var(--suave);font-size:13px;display:inline}#aba-cardapio td:nth-child(5)::after{content:" vendidos hoje"}.filtros{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px}.filtros button{white-space:nowrap}.card .pe{flex-wrap:wrap}.linha .q{min-width:0}}
body.modo-cel nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:6px;overflow:visible}
body.modo-cel nav button{white-space:normal;text-align:center;font-size:11px;line-height:1.2;padding:9px 4px;min-height:44px}
body.modo-cel nav .bolinha{top:2px;right:2px}
body.modo-cel .tabela{background:none;border:0;box-shadow:none;overflow:visible}
body.modo-cel .tabela table,body.modo-cel .tabela tbody,body.modo-cel .tabela tr,body.modo-cel .tabela td{display:block}
body.modo-cel .tabela thead{display:none}
body.modo-cel .tabela tr{display:grid;gap:4px 10px;background:var(--cartao);border:1px solid var(--linha);border-radius:12px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--sombra)}
body.modo-cel .tabela td{padding:0;border:0;background:none!important}
body.modo-cel #aba-pedidos tr{grid-template-columns:auto 1fr auto}
body.modo-cel #aba-pedidos td:nth-child(3){font-weight:700}
body.modo-cel #aba-pedidos td:nth-child(4){grid-column:1/-1;padding:6px 0;border-top:1px solid var(--linha);border-bottom:1px solid var(--linha)}
body.modo-cel #aba-pedidos td:nth-child(5){font-weight:700}
body.modo-cel #aba-pedidos td:nth-child(6){grid-column:2/-1;justify-self:end}
body.modo-cel #aba-cardapio tr{grid-template-columns:1fr auto;align-items:center}
body.modo-cel #aba-cardapio td:nth-child(1){font-weight:600}
body.modo-cel #aba-cardapio td:nth-child(2),body.modo-cel #aba-cardapio td:nth-child(3){display:none}
body.modo-cel #aba-cardapio td:nth-child(6){grid-row:1/3;grid-column:2}
body.modo-cel #aba-cardapio td:nth-child(4),body.modo-cel #aba-cardapio td:nth-child(5){color:var(--suave);font-size:13px;display:inline}
body.modo-cel #aba-cardapio td:nth-child(5)::after{content:" vendidos hoje"}
body.modo-cel body.modo-cel .filtros{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px}
body.modo-cel .filtros button{white-space:nowrap}
body.modo-cel .card .pe{flex-wrap:wrap}
body.modo-cel .linha .q{min-width:0}
.m .lancar{margin-top:6px;padding:7px 10px;font-size:12px}.m button+.lancar{margin-top:6px}.m .lancar:only-of-type{margin-top:auto}
.origem{display:block;font:600 12px system-ui;color:var(--ouro);margin-top:3px}
.l-menu{max-height:42vh;overflow:auto;margin:6px 0 12px;border:1px solid var(--linha);border-radius:10px}
.l-cat{margin:0;padding:7px 12px;background:var(--cartao2);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--suave);position:sticky;top:0}
.l-it{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-top:1px solid var(--linha);font-size:14px}.l-it small{display:block;color:var(--suave)}.l-it.on{background:var(--ouro-cl)}
.l-q{display:flex;align-items:center;gap:8px}.l-q button{padding:5px 11px}.l-q b{min-width:18px;text-align:center}
.integ{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.ig{background:var(--cartao);border:1px solid var(--linha);border-radius:var(--r);padding:16px;display:flex;flex-direction:column;gap:6px;box-shadow:var(--sombra)}
.ig b{font:600 18px Georgia,serif}.ig small{color:var(--suave)}.ig .st{align-self:flex-start}.ig button{margin-top:8px}.ig.on{border-color:#cfe5cc;background:#fbfef9}
#integ-log p{margin:6px 0;font-size:13px;cursor:pointer}#integ-log p:hover{color:var(--brasa)}
#integ-json{background:var(--cartao2);padding:12px;border-radius:10px;font-size:12px;overflow:auto;max-height:240px;white-space:pre-wrap;margin:10px 0 0}
.acoes-g{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.sec-tit{margin:28px 0 12px;font:600 20px Georgia,serif}
.form-fila{display:grid;grid-template-columns:2fr 1fr 2fr auto;gap:8px}.form-fila input,.form-fila select,.lin select{font:15px system-ui;padding:9px 10px;border-radius:10px;border:1px solid var(--linha);background:var(--fundo);color:var(--texto);min-width:0}
.cel-fila{margin-top:14px;max-width:300px;border:8px solid #1d1611;border-radius:26px;padding:18px;background:#1b1410;color:#f6efe4;font-size:14px}.cel-fila b{display:block;font:600 22px Georgia,serif;margin:4px 0}.cel-fila .grande{font:800 44px/1 system-ui;color:#dba63a;margin:8px 0}
.lin{display:flex;align-items:center;gap:10px;font-weight:600;margin:6px 0 14px}
.kpis2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kpis2 .k{box-shadow:none}.kpis2 .k b{font-size:21px}
.ia{margin-bottom:18px;background:linear-gradient(135deg,#fffdf9,#fbf1de)}.ia-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.ia-chips button{background:var(--cartao);color:var(--texto);border:1px solid var(--linha);font-weight:500;border-radius:99px;padding:7px 13px}
.ia-conversa{display:grid;gap:8px;max-height:320px;overflow:auto;margin-bottom:10px}.ia-conversa:empty{display:none}
.ia-p{justify-self:end;background:var(--brasa);color:#fff;padding:9px 13px;border-radius:14px 14px 4px 14px;max-width:80%}
.ia-r{justify-self:start;background:var(--cartao);border:1px solid var(--linha);padding:10px 14px;border-radius:14px 14px 14px 4px;max-width:90%;line-height:1.55}
.ia-form{display:flex;gap:8px}.ia-form input{flex:1;font:15px system-ui;padding:10px 12px;border-radius:10px;border:1px solid var(--linha);background:var(--cartao);min-width:0}
.zap{background:#e5ddd5;border-radius:12px;padding:14px;margin:6px 0 12px}.zap-topo{font-size:12px;color:#54656f;text-align:center;margin-bottom:10px}
.zap-msg{background:#fff;border-radius:0 10px 10px 10px;padding:10px 12px;font-size:14px;line-height:1.5;box-shadow:0 1px 1px rgba(0,0,0,.1);color:#111b21}.zap-h{display:block;text-align:right;font-size:11px;color:#667781;margin-top:4px}
@media(max-width:700px){.form-fila{grid-template-columns:1fr 1fr}}
#relatorio{position:fixed;inset:0;z-index:40;background:rgba(43,32,24,.55);overflow:auto;padding:24px 14px}
.rel-acoes{display:flex;gap:8px;justify-content:flex-end;max-width:860px;margin:0 auto 12px}
.folha{background:#fff;color:#2b2018;max-width:860px;margin:0 auto;border-radius:14px;padding:40px 44px;box-shadow:0 30px 60px rgba(0,0,0,.3)}
.folha header{all:unset;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #b23a1e;padding-bottom:14px;margin-bottom:22px}
.folha h1{margin:0;font:600 28px Georgia,serif}.folha h2{font:600 17px Georgia,serif;margin:26px 0 10px}.folha .sub{color:#7c6b58;font-size:13px}
.rel-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.rel-kpis div{border:1px solid #e6dccb;border-radius:10px;padding:12px}.rel-kpis small{color:#7c6b58;font-size:11px;display:block}.rel-kpis b{font:600 20px Georgia,serif}
.rel-kpis .up{display:block;color:#2f7d3b;font-size:11px;font-weight:700}
.folha svg{width:100%;height:auto;display:block}.folha table{font-size:13px}.folha td,.folha th{padding:7px 8px}.folha .nota{font-size:11px}
.rel-duas{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:700px){.folha{padding:22px 18px}.rel-kpis{grid-template-columns:1fr 1fr}.rel-duas{grid-template-columns:1fr}}
@media print{body{display:block!important;height:auto!important;overflow:visible!important;padding:0!important;background:#fff!important}
body>*:not(#relatorio){display:none!important}#relatorio{position:static!important;overflow:visible!important;background:#fff!important;padding:0!important}
.rel-acoes{display:none!important}.folha{box-shadow:none!important;padding:0!important;max-width:none!important}.folha h2{break-after:avoid}.rel-bloco{break-inside:avoid}@page{size:A4;margin:14mm}}
#unidade{font:600 13px system-ui;background:var(--cartao2);color:var(--texto);border:1px solid var(--linha);border-radius:10px;padding:7px 8px}
.aviso-unidade{margin:0 0 16px;padding:12px 16px;border-radius:12px;background:var(--ouro-cl);border:1px solid #ecd3a6;color:#6b4a12;font-size:14px}
table.mini{width:100%;font-size:13px}table.mini th,table.mini td{padding:7px 8px;border-top:1px solid var(--linha);text-align:left}table.mini th{background:none;border:0}
.ao-vivo{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:99px;background:var(--verde-cl);color:var(--verde);font-size:11px;font-weight:700}
.alerta-t{color:var(--brasa);font-weight:700}.nova{color:var(--suave);font-style:italic}
#tv{position:fixed;inset:0;z-index:35;background:#1b1410;color:#f6efe4;display:grid;grid-template-rows:auto 1fr}
body.um #tv{top:64px}
.tv-topo{display:flex;align-items:center;gap:20px;padding:18px 34px;border-bottom:1px solid rgba(246,239,228,.12)}
.tv-topo b{font:600 30px Georgia,serif}.tv-hora{margin-left:auto;font:600 28px system-ui;font-variant-numeric:tabular-nums;color:#dba63a}
.tv-topo .sec{background:transparent;color:#f6efe4;border-color:rgba(246,239,228,.25)}body.um #tv-sair{display:none}
.tv-corpo{display:grid;grid-template-columns:1fr 1.4fr;min-height:0}
.tv-col{padding:26px 34px;overflow:hidden}.tv-col h2{margin:0 0 18px;font:600 20px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#bcaa8f}
.tv-col+.tv-col{background:#2a1d14}
.tv-prep,.tv-prontos{display:flex;flex-wrap:wrap;gap:14px}.tv-prep span,.tv-prontos span{font:700 46px/1 system-ui;padding:14px 24px;border-radius:14px;background:rgba(246,239,228,.08);color:#d8c8b0}
.tv-prontos span{background:#2f7d3b;color:#fff}.tv-prep em,.tv-prontos em{color:#7c6b58;font-size:22px}
.tv-agora{background:#b23a1e;border-radius:22px;padding:22px 30px;margin-bottom:22px}.tv-agora.chama{animation:pisca .9s ease 3}
.tv-agora small{display:block;font-size:20px;letter-spacing:.12em;text-transform:uppercase;opacity:.85}.tv-agora b{display:block;font:800 128px/1.05 system-ui}.tv-agora span{font-size:32px}
.tv-agora.vazio{background:rgba(246,239,228,.06)}
@keyframes pisca{50%{filter:brightness(1.4);transform:scale(1.02)}}
@media(max-width:800px){.tv-corpo{grid-template-columns:1fr}.tv-agora b{font-size:84px}.tv-prep span,.tv-prontos span{font-size:32px}.tv-topo{padding:14px 18px}.tv-col{padding:18px}}
@media(max-width:700px){#unidade{max-width:150px}#aba-rede .tabela tr{grid-template-columns:1fr 1fr}#aba-rede .tabela td:nth-child(1){grid-column:1/-1;font-weight:700}}
body.modo-cel #aba-rede .tabela tr{grid-template-columns:1fr 1fr}body.modo-cel #aba-rede .tabela td:nth-child(1){grid-column:1/-1;font-weight:700}body.modo-cel #unidade{max-width:150px}
[hidden]{display:none!important}
@keyframes chega{from{opacity:0;transform:translateY(-6px)}}@keyframes entra{from{opacity:0}}@keyframes pulsa{50%{opacity:.35}}
@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,1fr)}}
@media(max-width:1000px){body{grid-template-columns:1fr;height:auto;overflow:auto}.celular{width:100%;max-width:390px;height:720px}
.painel{grid-template-columns:1fr}nav{flex-direction:row;overflow-x:auto;border-right:0;border-bottom:1px solid var(--linha);padding:8px 12px}nav button{white-space:nowrap;padding-right:34px}
.cols,.duas{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}main{padding:16px}header{flex-wrap:wrap}.usuario{margin-left:0}}
</style></head><body>
<section class="lado"><div><p>Cliente na <b>mesa 5</b>: escolha os pratos, aceite a sugestão de bebida, finalize e use "Chamar garçom" e "Pedir a conta".</p>
<div class="celular"><iframe id="site" title="Cardápio do cliente"></iframe></div></div></section>
<section class="painel">
<header><h1>Casa Brasa · Painel</h1><select id="unidade" aria-label="Unidade"></select><span class="tag">Ao vivo</span><button class="sec" id="modo-tela" type="button">📱 Ver no celular</button><label class="usuario">Entrar como<select id="funcao"><option value="">Gerente (vê tudo)</option><option value="cozinha">Cozinha</option><option value="bar">Bar</option><option value="mesas">Garçom</option><option value="reservas">Recepção</option><option value="pedidos">Caixa (só pedidos)</option><option value="balcao">Balcão</option><option value="rede">Dono da rede</option></select></label></header>
<nav role="tablist">
<button role="tab" aria-selected="false" data-aba="pedidos">Pedidos<span class="bolinha" id="b-pedidos" hidden></span></button>
<button role="tab" aria-selected="true" data-aba="cozinha">Cozinha<span class="bolinha" id="b-cozinha" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="bar">Bar<span class="bolinha" id="b-bar" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="mesas">Mesas (garçom)<span class="bolinha" id="b-mesas" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="balcao">Balcão e TV<span class="bolinha" id="b-balcao" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="reservas">Reservas e fila</button>
<button role="tab" aria-selected="false" data-aba="cardapio">Cardápio</button>
<button role="tab" aria-selected="false" data-aba="marketing">Fidelidade e promoções</button>
<button role="tab" aria-selected="false" data-aba="gerencia">Gerência e CRM</button>
<button role="tab" aria-selected="false" data-aba="integracoes">Integrações</button>
<button role="tab" aria-selected="false" data-aba="rede">Rede de lojas</button>
</nav>
<main>
<p class="aviso-unidade" id="aviso-unidade" hidden></p>
<div class="alertas" id="alertas"></div>
<section class="aba" id="aba-pedidos"><div class="filtros" id="filtros"></div><div class="tabela"><table><thead><tr><th>#</th><th>Hora</th><th>Mesa</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead><tbody id="lista-pedidos"></tbody></table></div><p class="vazio" id="sem-pedidos">Nenhum pedido ainda. Faça um pelo celular do cliente.</p></section>
<section class="aba" id="aba-cardapio"><div class="tabela"><table><thead><tr><th>Prato</th><th>Categoria</th><th>Setor</th><th>Preço</th><th>Vendidos hoje</th><th>Hoje</th></tr></thead><tbody class="esg" data-setor="todos"></tbody></table></div><p class="nota">"Esgotado" some na hora do cardápio do cliente. No sistema real o dono também troca preço, foto e descrição por aqui.</p></section>
<section class="aba ativa" id="aba-cozinha"><div class="cols">
<div class="col"><h2>Novos</h2><div id="cozinha-Recebido"><p class="vazio">Pratos dos pedidos aceitos aparecem aqui, com tempo correndo.</p></div></div>
<div class="col"><h2>Em preparo</h2><div id="cozinha-Em preparo"></div></div><div class="col"><h2>Prontos</h2><div id="cozinha-Pronto"></div></div></div><div class="bloco" style="margin-top:14px"><h3>Acabou algum prato? Toque para marcar "esgotado hoje"</h3><div class="esg" data-setor="cozinha"></div><p class="nota">Some na hora do cardápio do cliente.</p></div></section>
<section class="aba" id="aba-bar"><div class="cols">
<div class="col"><h2>Novos</h2><div id="bar-Recebido"><p class="vazio">Bebidas e vinhos vêm direto para cá, separados da cozinha.</p></div></div>
<div class="col"><h2>Em preparo</h2><div id="bar-Em preparo"></div></div><div class="col"><h2>Prontos</h2><div id="bar-Pronto"></div></div></div><div class="bloco" style="margin-top:14px"><h3>Acabou alguma bebida?</h3><div class="esg" data-setor="bar"></div></div></section>
<section class="aba" id="aba-mesas"><div class="mapa" id="mapa"></div><p class="nota">O garçom vê o mapa no celular dele: aceita o primeiro pedido de cada mesa e leva o que ficou pronto. O cliente fecha a conta pelo celular e o garçom só leva a maquininha.</p></section>
<section class="aba" id="aba-reservas"><div class="lista" id="reservas"></div><p class="nota">Reservas feitas pelo site chegam aqui. "Confirmar no WhatsApp" abre a conversa com a mensagem pronta. Lista de exemplo.</p>
<h2 class="sec-tit">Fila de espera</h2>
<div class="duas"><div class="bloco"><h3>Agora na fila</h3><div class="lista" id="fila"></div></div>
<div class="bloco"><h3>Cliente entra pelo QR da porta</h3><p class="nota" style="margin-top:0">Casa cheia? Ele escaneia o QR da entrada, deixa nome e WhatsApp e espera onde quiser. Quando a mesa libera, recebe a mensagem.</p>
<div class="form-fila"><input id="f-nome" placeholder="Nome" aria-label="Nome"><select id="f-pes" aria-label="Pessoas"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select><input id="f-tel" placeholder="WhatsApp" inputmode="tel" aria-label="WhatsApp"><button id="f-entrar" type="button">Entrar na fila</button></div>
<div class="cel-fila" id="cel-fila" hidden></div></div></div></section>
<section class="aba" id="aba-marketing"><div class="duas">
<div class="bloco"><h3>Fidelidade com cashback</h3><p class="nota" style="margin-top:0">Ao fechar a conta, o cliente ganha crédito para a próxima visita e vê isso no celular na hora.</p>
<label class="lin">Cashback na conta <select id="fid-pct"><option value="0">Desligado</option><option value="3">3%</option><option value="5" selected>5%</option><option value="10">10%</option></select></label>
<div class="kpis2"><div class="k lucro"><small>Cashback dado hoje</small><b id="fid-dist">R$ 0,00</b></div><div class="k"><small>Voltaram para usar (mês)</small><b>38%</b></div><div class="k"><small>Clientes no programa</small><b>1.096</b></div><div class="k"><small>Vendas de quem voltou (mês)</small><b>R$ 21.480</b></div></div>
<p class="nota">Também funciona como "a 10ª visita é grátis" ou pontos. Os números do mês são exemplo.</p></div>
<div class="bloco"><h3>Promoções por horário</h3><div class="lista" id="promos"></div><p class="nota">Ligam e desligam sozinhas no horário. Na demonstração, use "Ligar agora" e veja o cardápio do cliente mudar.</p></div></div></section>
<section class="aba" id="aba-integracoes"><p class="nota" style="margin-top:0">Ligue o sistema ao caixa que o restaurante já usa: cada pedido e cada conta fechada vão direto para lá, sem lançar duas vezes.</p>
<div class="integ" id="integ"></div>
<div class="bloco" style="margin-top:18px"><h3>Últimos envios ao caixa</h3><div id="integ-log"><p class="nota">Conecte um sistema e faça um pedido.</p></div><pre id="integ-json" hidden></pre></div>
<p class="nota">Na demonstração o envio é simulado. A integração real usa a API de cada sistema (Saipos, Consumer, Colibri) ou um webhook para qualquer outro.</p></section>
<section class="aba" id="aba-balcao"><div class="acoes-g"><button id="abrir-tv" type="button">📺 Abrir tela da TV</button></div>
<div class="duas"><div class="bloco"><h3>Preparando</h3><div class="lista" id="b-prep"><p class="nota">Nenhum pedido do balcão.</p></div></div><div class="bloco"><h3>Prontos para retirar</h3><div class="lista" id="b-prontos"><p class="nota">—</p></div></div></div>
<p class="nota">Pedido do balcão não tem mesa: o cliente recebe uma senha no celular e é chamado na TV quando fica pronto. Para hamburguerias, lanchonetes, cafeterias e pizzarias com retirada.</p></section>
<section class="aba" id="aba-rede"><div class="acoes-g"><button id="nova-unidade" type="button" class="sec">+ Nova unidade</button></div>
<div class="kpis" id="r-kpis"></div>
<div class="tabela"><table><thead><tr><th>Unidade</th><th>Faturamento hoje</th><th>Pedidos</th><th>Ticket médio</th><th>Preparo</th><th>Nota</th></tr></thead><tbody id="r-lojas"></tbody></table></div>
<div class="duas" style="margin-top:18px"><div class="bloco"><h3>Cardápio central</h3><table class="mini" id="r-cardapio"></table><p class="nota">Muda uma vez e vale para todas as lojas; cada unidade pode ter preço próprio e marcar o que acabou.</p></div>
<div class="bloco"><h3>Clientes da rede</h3><div class="lista"><div class="linha"><span class="q">4.812</span><span class="d"><b>clientes cadastrados</b><small>em todas as unidades</small></span></div><div class="linha"><span class="q">22%</span><span class="d"><b>já foram em mais de uma loja</b><small>reconhecidos em qualquer unidade</small></span></div><div class="linha"><span class="q">1.096</span><span class="d"><b>no programa de fidelidade</b><small>pontos valem na rede toda</small></span></div></div></div></div>
<p class="nota">A unidade Centro mostra os pedidos ao vivo desta demonstração; as outras são exemplos.</p></section>
<section class="aba" id="aba-gerencia"><div class="acoes-g"><button id="btn-zap" type="button" class="sec">📱 Resumo do dia (WhatsApp)</button><button id="btn-rel" type="button">📄 Relatório do mês (PDF)</button></div>
<div class="kpis"><div class="k"><small>Pedidos hoje</small><b id="g-ped">0</b></div><div class="k"><small>Faturamento hoje</small><b id="g-fat">R$ 0,00</b></div>
<div class="k"><small>Ticket médio por mesa</small><b id="g-tkt">R$ 0,00</b></div><div class="k lucro"><small>Vendas extras (sugestão)</small><b id="g-sug">R$ 0,00</b></div><div class="k"><small>Tempo médio de preparo</small><b id="g-tmp">—</b></div></div>
<div class="bloco ia"><h3>✨ Pergunte ao assistente</h3><div class="ia-chips" id="ia-chips"></div><div class="ia-conversa" id="ia-conversa"></div>
<form id="ia-form" class="ia-form"><input id="ia-q" placeholder="Ex.: qual prato vende menos?" aria-label="Pergunta"><button>Perguntar</button></form>
<p class="nota">Demonstração: respostas a partir dos dados desta tela e de exemplos. No sistema real a IA lê todos os pedidos, reservas e clientes.</p></div>
<div class="duas" style="margin-top:18px"><div class="bloco"><h3>Mais pedidos hoje</h3><div id="g-top"><p class="nota">Faça um pedido no celular.</p></div></div>
<div class="bloco"><h3>Clientes que não voltam há 30 dias</h3><div class="lista" id="crm"></div></div></div>
<div class="duas" style="margin-top:14px"><div class="bloco"><h3>Aniversariantes da semana</h3><div class="lista" id="aniv"></div></div><div class="bloco"><h3>Cancelamentos (com senha do gerente)</h3><div id="g-canc"><p class="nota">Nenhum hoje.</p></div></div></div>
<div class="bloco" style="margin-top:14px"><h3>Segurança</h3><div class="seguro"><span>Primeiro pedido da mesa só entra com aceite do garçom</span><span>QR muda quando a mesa é fechada</span><span>Cancelar item só com senha do gerente</span><span>Cada restaurante vê só os próprios dados</span><span>Pedido é reenviado até a cozinha confirmar</span><span>Máximo de 3 pedidos por minuto por mesa</span><span>Login por função</span></div></div>
<p class="nota">Números do celular são reais nesta demonstração; clientes, reservas e a senha do gerente (1234) são exemplos.</p></section>
</main></section>
<div id="relatorio" hidden></div>
<section id="tv" class="tv" hidden aria-label="Tela de senhas"><div class="tv-topo"><b>Casa Brasa</b><span class="tv-hora" id="tv-hora"></span><button class="sec" id="tv-sair" type="button">Sair da TV</button></div>
<div class="tv-corpo"><div class="tv-col"><h2>Preparando</h2><div class="tv-prep" id="tv-prep"></div></div><div class="tv-col"><h2>Pode retirar</h2><div id="tv-agora" class="tv-agora"></div><div class="tv-prontos" id="tv-prontos"></div></div></div></section>
<div class="modal" id="modal" hidden><div class="caixa" id="caixa"></div></div>
<script id="site-html" type="text/plain">%%SITE%%</script>
<script>
(()=>{const b=atob(document.getElementById("site-html").textContent.trim()),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
document.getElementById("site").src=URL.createObjectURL(new Blob([u],{type:"text/html"}))+"#cardapio"})();
const $=s=>document.querySelector(s),reais=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const site=()=>document.getElementById("site").contentWindow;
const BAR=["bebidas","vinhos"],PROX={"Recebido":["Em preparo","Começar"],"Em preparo":["Pronto","Pronto"]};
const qr=()=>Math.random().toString(36).slice(2,6).toUpperCase(),MENU=%%MENU%%;
const mesas={};for(let i=1;i<=12;i++)mesas[i]={n:i,estado:"livre",total:0,itens:[],aceita:false,pronto:0,qr:qr()};
Object.assign(mesas[2],{estado:"ocupada",total:186,aceita:true,itens:[{nome:"Picanha na brasa",qtd:2,preco:89}]});
Object.assign(mesas[7],{estado:"ocupada",total:64,aceita:true,itens:[{nome:"Tagliatelle da Dona Lúcia",qtd:1,preco:64}]});
Object.assign(mesas[9],{estado:"conta",total:212,aceita:true,itens:[{nome:"Costela 12 horas",qtd:2,preco:84,pessoa:"Lucas"},{nome:"Chope pilsen",qtd:3,preco:14,pessoa:"Marina"}]});
const pedidos=[],pagos=[];function liberar(n){const b=document.createElement("button");b.dataset.confirmar=n;b.hidden=true;$("#caixa").append(b);b.click()}
let filtro="Todos";
function reg(p,st){let o=pedidos.find(x=>x.num===p.num);if(!o){o=Object.assign({},p,{hora:new Date()});pedidos.unshift(o)}o.status=st;listaPedidos();try{tv()}catch(e){}}
const FILTROS=["Todos","Aguardando aceite","Recebido","Em preparo","Pronto","Entregue","Conta fechada","Cancelado"];
function listaPedidos(){const vis=pedidos.filter(o=>filtro==="Todos"||o.status===filtro);
$("#filtros").innerHTML=FILTROS.map(f=>`<button class="${f===filtro?"on":""}" data-f="${f}">${f} (${f==="Todos"?pedidos.length:pedidos.filter(o=>o.status===f).length})</button>`).join("");
$("#lista-pedidos").innerHTML=vis.map(o=>`<tr><td>#${o.num}</td><td>${o.hora.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td><td>${o.mesa?"Mesa "+esc(o.mesa):"Retirada"}</td>
<td>${o.itens.map(i=>`${i.qtd}× ${esc(i.nome)}${i.obs?`<small>${esc(i.obs)}</small>`:""}`).join("<br>")}</td><td>${reais(o.total)}</td><td><span class="ps p-${o.status.split(" ")[0]}">${o.status}</span></td></tr>`).join("");
$("#sem-pedidos").hidden=pedidos.length>0;const n=pedidos.filter(o=>o.status==="Aguardando aceite").length;const b=$("#b-pedidos");b.hidden=!n;b.textContent=n}
$("#filtros").onclick=e=>{const b=e.target.closest("[data-f]");if(b){filtro=b.dataset.f;listaPedidos()}};
let ped=0,fat=0,sug=0,senhaN=40;const balcao=[];const vendidos={},vistos=new Set(),hist={},tempos=[],cancel=[];
function bip(f=880){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.setValueAtTime(.18,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.45);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.45)}catch(e){}}
function bolinha(id,n){const b=$("#b-"+id);b.hidden=!n;b.textContent=n}
function contar(){bolinha("cozinha",document.querySelectorAll("#cozinha-Recebido .card").length);bolinha("bar",document.querySelectorAll("#bar-Recebido .card").length);
bolinha("mesas",Object.values(mesas).filter(m=>["conta","pronto"].includes(m.estado)).length+document.querySelectorAll(".alerta").length)}
// abas
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-selected",x===b));document.querySelectorAll(".aba").forEach(a=>a.classList.toggle("ativa",a.id==="aba-"+b.dataset.aba))});
// mapa das mesas
const ROT={livre:"Livre",ocupada:"Ocupada",pronto:"Pronto para levar",conta:"Pediu a conta"};
function mapa(){$("#mapa").innerHTML=Object.values(mesas).map(m=>`<div class="m ${m.estado}"><span class="n">Mesa ${m.n}</span><span class="s">${ROT[m.estado]}</span><span class="v">QR ${m.qr}${m.total?` · ${reais(m.total)}`:""}</span>
${m.estado==="pronto"?`<button data-entregar="${m.n}">Entregue na mesa</button>`:m.estado==="conta"||(m.estado==="ocupada"&&m.total)?`<button class="${m.estado==="conta"?"perigo":"sec"}" data-fechar="${m.n}">Fechar conta</button>`:""}<button class="sec lancar" data-lancar="${m.n}">+ Lançar pedido</button></div>`).join("");contar()}
$("#mapa").onclick=e=>{const la=e.target.closest("[data-lancar]");if(la)return lancar(la.dataset.lancar);const en=e.target.closest("[data-entregar]"),fe=e.target.closest("[data-fechar]");
if(en){const m=mesas[en.dataset.entregar];m.pronto=0;m.estado="ocupada";pedidos.filter(o=>+o.mesa===+m.n&&o.status==="Pronto").forEach(o=>{o.status="Entregue";site().postMessage({tipo:"status",num:o.num,status:"Entregue na mesa"},"*")});listaPedidos();mapa()}
if(fe){const m=mesas[fe.dataset.fechar],serv=m.total*.1;$("#caixa").innerHTML=`<h3>Fechar mesa ${m.n}</h3>${m.itens.map(i=>`<div class="l"><span>${i.qtd}× ${esc(i.nome)}</span><span>${reais(i.qtd*i.preco)}</span></div>`).join("")}
${comandas(m)}<div class="l"><span>Subtotal</span><span>${reais(m.total)}</span></div><div class="l"><span>Serviço (10%)</span><span>${reais(serv)}</span></div><div class="l t"><span>Total</span><span>${reais(m.total+serv)}</span></div>
<p class="nota">Com a integração ligada, a conta vai direto para o caixa (aba Integrações). A mesa é liberada e o código do QR muda (${m.qr} deixa de valer), então ninguém pede de casa com foto do QR.</p><div class="pe" style="margin-top:12px"><button class="sec" data-cancelar>Voltar</button><button data-confirmar="${m.n}">Enviar ao caixa e liberar</button></div>`;$("#modal").hidden=false}};
$("#caixa").onclick=e=>{if(e.target.closest("[data-cancelar]"))$("#modal").hidden=true;const c=e.target.closest("[data-confirmar]");
if(c){const m=mesas[c.dataset.confirmar];enviarCaixa("mesa.fechada",`Conta da mesa ${m.n} · ${reais(m.total*1.1)}`,{mesa:m.n,itens:m.itens.map(i=>({nome:i.nome,qtd:i.qtd,preco:i.preco,pessoa:i.pessoa||"Mesa"})),subtotal:m.total,servico:+(m.total*.1).toFixed(2),total:+(m.total*1.1).toFixed(2)});const cb=+(m.total*fidPct()/100).toFixed(2);fidDist+=cb;fidelidade();site().postMessage({tipo:"fechada",mesa:m.n,cashback:cb},"*");pedidos.filter(o=>+o.mesa===+m.n&&!["Cancelado","Recusado"].includes(o.status)).forEach(o=>o.status="Conta fechada");listaPedidos();Object.assign(m,{estado:"livre",total:0,itens:[],aceita:false,pronto:0,qr:qr()});document.querySelectorAll(`.alerta[data-mesa="${m.n}"]`).forEach(a=>a.remove());$("#modal").hidden=true;mapa()}};
// cozinha e bar
function cartao(p,setor,itens){const c=document.createElement("article");c.className="card novo";c.dataset.status="Recebido";c.dataset.ini=Date.now();
c.innerHTML=`<div class="topo"><span class="mesa">${p.mesa?"Mesa "+esc(p.mesa):"Balcão · senha "+p.senha}${p.nome?`<small class="origem">${esc(p.nome)}${p.origem==="garcom"?" · lançado pelo garçom":""}</small>`:""}</span><span class="hora">#${p.num} · <span class="tempo">0:00</span></span></div>
<ul>${itens.map(i=>`<li>${i.qtd}× ${esc(i.nome)}${i.obs?`<small>${esc(i.obs)}</small>`:""}</li>`).join("")}</ul><div class="pe"><span class="hora">${setor==="bar"?"Bar":"Cozinha"}</span><span class="mx"><button>Começar</button><button class="sec" data-cancel>Cancelar</button></span></div>`;
c.querySelector("[data-cancel]").onclick=()=>cancelar(c,p,itens);
c.querySelector("button").onclick=()=>{const s=PROX[c.dataset.status][0];c.dataset.status=s;c.classList.remove("novo");
if(s==="Pronto"){c.querySelector(".mx").remove();tempos.push((Date.now()-c.dataset.ini)/1000);gerencia();const m=mesas[p.mesa];if(m){m.estado="pronto";m.pronto++;}if(!p.mesa&&--p.pend<=0)pronta(p);mapa()}else c.querySelector("button").textContent=PROX[s][1];
if(p.mesa||s!=="Pronto")reg(p,s);site().postMessage({tipo:"status",num:p.num,status:p.mesa?(s==="Pronto"?"Pronto, saindo para a mesa":"Em preparo"):(p.pronta?`Pronto! Senha ${p.senha}: retire no balcão`:`Senha ${p.senha} · em preparo`)},"*");document.getElementById(`${setor}-${s}`).prepend(c);contar()};
$(`#${setor}-Recebido .vazio`)?.remove();$(`#${setor}-Recebido`).prepend(c)}
setInterval(()=>document.querySelectorAll(".card[data-ini]").forEach(c=>{if(c.dataset.status==="Pronto")return;const s=Math.floor((Date.now()-c.dataset.ini)/1000);
c.querySelector(".tempo").textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;c.classList.toggle("atraso",s>90)}),1000);
function entrar(p){reg(p,"Recebido");if(!p.mesa&&!p.senha){p.senha=String(++senhaN).padStart(3,"0");balcao.push(p);site().postMessage({tipo:"status",num:p.num,status:`Sua senha: ${p.senha}. Aguarde ser chamado na TV.`},"*")}enviarCaixa("pedido.criado",`Pedido #${p.num} · ${p.mesa?"mesa "+p.mesa:"retirada"} · ${reais(p.total)}`,{numero:p.num,mesa:p.mesa,pessoa:p.nome||"",itens:p.itens.map(i=>({nome:i.nome,qtd:i.qtd,preco:i.preco,obs:i.obs||""})),total:p.total});const coz=p.itens.filter(i=>!BAR.includes(i.cat)),bar=p.itens.filter(i=>BAR.includes(i.cat));
if(coz.length)cartao(p,"cozinha",coz);if(bar.length)cartao(p,"bar",bar);p.pend=(coz.length?1:0)+(bar.length?1:0);tv();
const m=mesas[p.mesa];if(m){m.estado="ocupada";m.total+=p.total;m.ultimo=p.num;p.itens.forEach(i=>{i.pessoa=i.pessoa||p.nome||"Mesa";m.itens.push(i)})}
ped++;fat+=p.total;p.itens.forEach(i=>{vendidos[i.nome]=(vendidos[i.nome]||0)+i.qtd;if(i.sug)sug+=i.qtd*i.preco});gerencia();mapa();bip()}
// alertas: aceite do primeiro pedido, garçom, conta
function alerta(html,mesa,acoes){const a=document.createElement("div");a.className="alerta";a.dataset.mesa=mesa;a.innerHTML=html+`<span class="mx">${acoes}</span>`;$("#alertas").prepend(a);bip(660);contar();return a}
window.addEventListener("message",ev=>{const p=ev.data;if(!p||!p.tipo)return;
if(p.tipo==="pedido"){site().postMessage({tipo:"recebido",num:p.num},"*");if(vistos.has(p.num))return;vistos.add(p.num);const m=mesas[p.mesa];reg(p,"Aguardando aceite");
const h=hist[p.mesa]=(hist[p.mesa]||[]).filter(x=>Date.now()-x<60000);
if(h.length>=3){const a=alerta(`<b>Mesa ${esc(p.mesa)}: muitos pedidos em 1 minuto</b><span>Pedido #${p.num} segurado. Confira com a mesa.</span>`,p.mesa,`<button data-ok>Liberar</button><button class="sec" data-nao>Descartar</button>`);
site().postMessage({tipo:"status",num:p.num,status:"Aguardando o garçom confirmar"},"*");a.querySelector("[data-ok]").onclick=()=>{a.remove();entrar(p)};a.querySelector("[data-nao]").onclick=()=>{a.remove();reg(p,"Cancelado");contar()};return}
h.push(Date.now());
if(m&&!m.aceita){const a=alerta(`<b>Mesa ${esc(p.mesa)}: primeiro pedido</b><span>${p.itens.length} item(ns) · ${reais(p.total)} · confirme que tem gente na mesa</span>`,p.mesa,`<button data-ok>Aceitar</button><button class="sec" data-nao>Recusar</button>`);
a.querySelector("[data-ok]").onclick=()=>{m.aceita=true;a.remove();entrar(p)};a.querySelector("[data-nao]").onclick=()=>{a.remove();reg(p,"Recusado");site().postMessage({tipo:"status",num:p.num,status:"Recusado: chame o garçom"},"*");contar()}}
else entrar(p)}
if(p.tipo==="ver-conta"){const m=mesas[p.mesa];if(m){m.estado="conta";mapa();site().postMessage({tipo:"extrato",mesa:p.mesa,itens:m.itens,total:m.total},"*")}return}
if(p.tipo==="conta"&&p.pagamento){const m=mesas[p.mesa];if(m){m.estado="conta";mapa()}
const a=alerta(`<b>Mesa ${esc(p.mesa)} fechou a conta</b><span>${reais(p.total)} no ${esc(p.pagamento)}${p.partes?` · cada um paga o seu: ${p.partes.map(x=>esc(x.nome)+" "+reais(x.total)).join(", ")}`:p.pessoas>1?` · dividir em ${p.pessoas} (${reais(p.total/p.pessoas)} cada)`:""}${p.servico?"":" · sem os 10%"} · levar a maquininha</span>`,p.mesa,`<button data-pago>Pago na maquininha</button>`);
a.querySelector("[data-pago]").onclick=()=>{a.remove();pagos.push(p);liberar(p.mesa)};return}
if(p.tipo==="garcom"||p.tipo==="conta"){const m=mesas[p.mesa];if(p.tipo==="conta"&&m){m.estado="conta";mapa()}
const a=alerta(`<b>Mesa ${esc(p.mesa)}</b><span>${p.tipo==="conta"?"pediu a conta":"chamou o garçom"}</span>`,p.mesa,`<button data-vou>Estou indo</button>`);a.querySelector("[data-vou]").onclick=()=>{a.remove();contar()}}});
// reservas (exemplo)
const reservas=[["19:30","Família Souza",4,"5511900000001","pendente","Aniversário"],["20:00","Carlos Mendes",2,"5511900000002","confirmada",""],["20:30","Ana Lima",6,"5511900000003","pendente","Cadeirão para criança"],["21:00","Pedro Alves",2,"5511900000004","pendente","Jantar a dois"]];
function listaReservas(){$("#reservas").innerHTML=reservas.map((r,i)=>`<div class="linha"><span class="q">${r[0]}</span><span class="d"><b>${esc(r[1])}</b> · ${r[2]} pessoas<small>${esc(r[5]||"Sem observações")}</small></span><span class="st ${r[4]}">${r[4]}</span>
${r[4]==="pendente"?`<a href="https://wa.me/${r[3]}?text=${encodeURIComponent(`Olá, ${r[1]}! Aqui é da Casa Brasa. Confirmamos sua reserva hoje às ${r[0]} para ${r[2]} pessoas. Até logo!`)}" target="_blank" rel="noopener"><button data-conf="${i}">Confirmar no WhatsApp</button></a>`:""}</div>`).join("")}
$("#reservas").onclick=e=>{const b=e.target.closest("[data-conf]");if(b)setTimeout(()=>{reservas[b.dataset.conf][4]="confirmada";listaReservas()},300)};
// gerência e CRM
const crm=[["Marina Costa","5511900000011","34 dias","Picanha na brasa"],["Rafael Nunes","5511900000012","41 dias","Tagliatelle da Dona Lúcia"],["Juliana Prado","5511900000013","52 dias","Cheesecake de mirtilo"]];
$("#crm").innerHTML=crm.map(c=>`<div class="linha"><span class="d"><b>${esc(c[0])}</b><small>Última visita há ${c[2]} · gosta de ${esc(c[3])}</small></span><a href="https://wa.me/${c[1]}?text=${encodeURIComponent(`Olá, ${c[0]}! Sentimos sua falta na Casa Brasa. Esta semana a sobremesa é por nossa conta. Reserve pelo site!`)}" target="_blank" rel="noopener"><button class="sec">Mandar convite</button></a></div>`).join("");
function gerencia(){const ocup=Object.values(mesas).filter(m=>m.total).length||1;$("#g-ped").textContent=ped;$("#g-fat").textContent=reais(fat);$("#g-tkt").textContent=reais(fat/Math.max(1,new Set(Object.values(mesas).filter(m=>m.ultimo).map(m=>m.n)).size));$("#g-sug").textContent=reais(sug);try{rede()}catch(e){}if(typeof cardapio==="function"&&$('.esg[data-setor="todos"]').innerHTML)cardapio();if(tempos.length){const md=tempos.reduce((a,b)=>a+b,0)/tempos.length;$("#g-tmp").textContent=`${Math.floor(md/60)}:${String(Math.round(md%60)).padStart(2,"0")} min`}
if(cancel.length)$("#g-canc").innerHTML=cancel.map(x=>`<p class="nota" style="margin:4px 0">${x}</p>`).join("");
const top=Object.entries(vendidos).sort((a,b)=>b[1]-a[1]).slice(0,5),max=top[0]?top[0][1]:1;
$("#g-top").innerHTML=top.length?top.map(([n,q])=>`<div class="barra"><span style="flex:0 0 46%">${esc(n)}</span><i style="width:${q/max*45}%"></i><b>${q}</b></div>`).join(""):'<p class="nota">Faça um pedido no celular.</p>'}
$("#modo-tela").onclick=e=>{const c=document.body.classList.toggle("modo-cel");e.target.textContent=c?"💻 Ver no PC":"📱 Ver no celular"};
// login por função: cada um vê só a sua tela
$("#funcao").onchange=e=>{const f=e.target.value;document.querySelectorAll("nav button").forEach(b=>b.hidden=!!f&&b.dataset.aba!==f);document.querySelector(`nav [data-aba="${f||"cozinha"}"]`).click()};
// esgotado hoje
const esgot=new Set();function cardapio(){$('.esg[data-setor="todos"]').innerHTML=MENU.map(i=>`<tr><td>${esc(i.nome)}</td><td>${esc(i.cat)}</td><td>${BAR.includes(i.cat)?"Bar":"Cozinha"}</td><td>${reais(i.preco)}</td><td>${vendidos[i.nome]||0}</td><td><button class="${esgot.has(i.id)?"on":""}" data-id="${i.id}">${esgot.has(i.id)?"Esgotado":"Disponível"}</button></td></tr>`).join("")}
document.querySelectorAll(".esg").forEach(el=>{const bar=el.dataset.setor==="bar";if(el.dataset.setor!=="todos")el.innerHTML=MENU.filter(i=>BAR.includes(i.cat)===bar).map(i=>`<button data-id="${i.id}">${esc(i.nome)}</button>`).join("");
el.onclick=e=>{const b=e.target.closest("[data-id]");if(!b)return;const id=b.dataset.id,on=!esgot.has(id);on?esgot.add(id):esgot.delete(id);
document.querySelectorAll(`.esg:not(tbody) [data-id="${id}"]`).forEach(x=>x.classList.toggle("on",on));cardapio();site().postMessage({tipo:"esgotado",id,ativo:on},"*")}});cardapio();
// cancelar com senha do gerente
function cancelar(c,p,itens){const v=itens.reduce((t,i)=>t+i.qtd*i.preco,0);
$("#caixa").innerHTML=`<h3>Cancelar ${p.mesa?"mesa "+esc(p.mesa):"pedido"} #${p.num}</h3><p class="nota">${itens.map(i=>i.qtd+"× "+esc(i.nome)).join(", ")} · ${reais(v)}</p>
<label>Motivo<select id="motivo"><option>Cliente desistiu</option><option>Prato errado</option><option>Acabou o ingrediente</option><option>Pedido duplicado</option></select></label>
<label>Senha do gerente<input id="pin" type="password" inputmode="numeric" placeholder="1234 na demonstração"></label><p class="erro" id="erro"></p>
<div class="pe"><button class="sec" data-cancelar>Voltar</button><button class="perigo" id="ok-canc">Cancelar itens</button></div>`;$("#modal").hidden=false;$("#pin").focus();
$("#ok-canc").onclick=()=>{if($("#pin").value!=="1234"){$("#erro").textContent="Senha errada. Só o gerente pode cancelar.";return}
const m=mesas[p.mesa];if(m){m.total-=v;m.itens=m.itens.filter(i=>!itens.includes(i))}fat-=v;itens.forEach(i=>{vendidos[i.nome]-=i.qtd;if(i.sug)sug-=i.qtd*i.preco});
cancel.unshift(`${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} · ${p.mesa?"Mesa "+esc(p.mesa):"Retirada"} · ${itens.map(i=>esc(i.nome)).join(", ")} · ${reais(v)} · ${esc($("#motivo").value)}`);
c.remove();reg(p,"Cancelado");site().postMessage({tipo:"status",num:p.num,status:"Item cancelado pela casa: "+$("#motivo").value},"*");$("#modal").hidden=true;gerencia();mapa()}}
// aniversários (exemplo)
$("#aniv").innerHTML=[["Bruno Teixeira","5511900000021","sexta-feira"],["Camila Rocha","5511900000022","domingo"]].map(c=>`<div class="linha"><span class="d"><b>${esc(c[0])}</b><small>Aniversário ${c[2]}</small></span><a href="https://wa.me/${c[1]}?text=${encodeURIComponent(`Feliz aniversário, ${c[0]}! Venha comemorar na Casa Brasa: a sobremesa é por nossa conta. Reserve pelo site!`)}" target="_blank" rel="noopener"><button class="sec">Mandar parabéns</button></a></div>`).join("");
// comanda individual no fechamento
function comandas(m){const g={};m.itens.forEach(i=>{const k=i.pessoa||"Mesa";g[k]=(g[k]||0)+i.qtd*i.preco});const k=Object.keys(g);
return k.length>1?`<p class="nota" style="margin:8px 0">Comanda individual (com 10%): ${k.map(n=>`<b>${esc(n)}</b> ${reais(g[n]*1.1)}`).join(" · ")}</p>`:""}
// pedido lançado pelo garçom (cliente que não quer usar o QR)
const CATS=[...new Set(MENU.map(i=>i.cat))];
function lancar(n){const qt={};
$("#caixa").innerHTML=`<h3>Lançar pedido · mesa ${esc(n)}</h3><label>Para quem (comanda)<input id="l-pessoa" placeholder="Ex.: Carla"></label>
<div class="l-menu">${CATS.map(c=>`<p class="l-cat">${esc(c)}</p>`+MENU.filter(i=>i.cat===c).map(i=>`<div class="l-it" data-id="${i.id}"><span>${esc(i.nome)}<small>${reais(i.preco)}</small></span><span class="l-q"><button class="sec" data-m="-1" aria-label="Menos">−</button><b>0</b><button class="sec" data-m="1" aria-label="Mais">+</button></span></div>`).join("")).join("")}</div>
<label>Observação<input id="l-obs" placeholder="Ex.: sem cebola, ponto da carne"></label>
<div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="l-ok">Enviar · <span id="l-tot">R$ 0,00</span></button></div>`;$("#modal").hidden=false;
$(".l-menu").onclick=e=>{const b=e.target.closest("[data-m]");if(!b)return;const r=b.closest(".l-it"),id=r.dataset.id;qt[id]=Math.max(0,(qt[id]||0)+ +b.dataset.m);
r.querySelector("b").textContent=qt[id];r.classList.toggle("on",qt[id]>0);$("#l-tot").textContent=reais(MENU.reduce((t,i)=>t+(qt[i.id]||0)*i.preco,0))};
$("#l-ok").onclick=()=>{const its=MENU.filter(i=>qt[i.id]).map(i=>({nome:i.nome,qtd:qt[i.id],obs:$("#l-obs").value.trim(),preco:i.preco,cat:i.cat,sug:false}));if(!its.length)return;
const p={tipo:"pedido",num:Date.now()%100000,mesa:String(n),modo:"Mesa",nome:$("#l-pessoa").value.trim()||"Mesa",origem:"garcom",itens:its,total:its.reduce((t,i)=>t+i.qtd*i.preco,0)};
vistos.add(p.num);mesas[n].aceita=true;$("#modal").hidden=true;entrar(p)}}
// integração com o caixa (simulada na demonstração)
const INTEG=[["saipos","Saipos","PDV para restaurantes"],["consumer","Consumer","PDV e gestão"],["colibri","Colibri","PDV NCR Colibri"],["webhook","Outro sistema","Webhook (qualquer PDV com API)"]],ligadas=new Set(),envios=[];
function integ(){$("#integ").innerHTML=INTEG.map(([id,n,d])=>{const on=ligadas.has(id);return `<div class="ig ${on?"on":""}"><b>${n}</b><small>${d}</small><span class="st ${on?"confirmada":"pendente"}">${on?"Conectado":"Desconectado"}</span><button class="${on?"sec":""}" data-ig="${id}">${on?"Desconectar":"Conectar"}</button></div>`}).join("")}
$("#integ").onclick=e=>{const b=e.target.closest("[data-ig]");if(!b)return;const id=b.dataset.ig;if(ligadas.has(id)){ligadas.delete(id);integ()}else{b.textContent="Conectando…";b.disabled=true;setTimeout(()=>{ligadas.add(id);integ()},600)}};
function enviarCaixa(ev,txt,dados){if(!ligadas.size)return;const para=[...ligadas].map(id=>INTEG.find(x=>x[0]===id)[1]).join(", ");
envios.unshift({h:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),txt,para,json:JSON.stringify(Object.assign({evento:ev,restaurante:"casa-brasa"},dados,{enviado_em:new Date().toISOString()}),null,2)});
$("#integ-log").innerHTML=envios.slice(0,8).map((x,i)=>`<p data-env="${i}">✓ ${x.h} · ${esc(x.txt)} → <b>${esc(x.para)}</b></p>`).join("")}
$("#integ-log").onclick=e=>{const r=e.target.closest("[data-env]");if(!r)return;const j=$("#integ-json");j.textContent=envios[r.dataset.env].json;j.hidden=false};
// relatório do mês (dados de exemplo + o que entrou hoje), salvo em PDF pelo "Imprimir > Salvar como PDF"
function relatorio(){let sd=7;const rnd=()=>(sd=(sd*9301+49297)%233280)/233280;
const hoje=new Date(),ini=new Date(hoje.getFullYear(),hoje.getMonth()-1,1),dias=new Date(hoje.getFullYear(),hoje.getMonth(),0).getDate();
const mes=ini.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
const porDia=[...Array(dias)].map((_,i)=>{const w=new Date(ini.getFullYear(),ini.getMonth(),i+1).getDay();return w===1?0:Math.round((w===5||w===6?7600:w===0?6200:3900)*(.8+rnd()*.4))});
const fatM=porDia.reduce((a,b)=>a+b,0),pedM=Math.round(fatM/92),mesasM=Math.round(pedM/1.6);
const horas=[11,12,13,14,15,16,17,18,19,20,21,22,23],peso=[3,9,10,6,2,1,1,3,6,10,9,5,2],pt=peso.reduce((a,b)=>a+b,0);
const pratos=MENU.filter(i=>!BAR.includes(i.cat)).map(i=>({n:i.nome,q:Math.round(20+rnd()*140+(vendidos[i.nome]||0))})).sort((a,b)=>b.q-a.q).slice(0,8);
const maxD=Math.max(...porDia),bw=760/dias;
const barras=`<svg viewBox="0 0 780 190" role="img" aria-label="Vendas por dia">${porDia.map((v,i)=>`<rect x="${10+i*bw}" y="${165-v/maxD*150}" width="${bw-4}" height="${v/maxD*150}" rx="3" fill="${v===maxD?"#b23a1e":"#d9a46a"}"/><text x="${10+i*bw+(bw-4)/2}" y="182" font-size="9" text-anchor="middle" fill="#7c6b58">${i+1}</text>`).join("")}</svg>`;
const pico=`<svg viewBox="0 0 380 170" role="img" aria-label="Pedidos por horário">${horas.map((h,i)=>`<rect x="${8+i*28}" y="${140-peso[i]/10*120}" width="22" height="${peso[i]/10*120}" rx="3" fill="${peso[i]>=9?"#b23a1e":"#d9a46a"}"/><text x="${19+i*28}" y="158" font-size="10" text-anchor="middle" fill="#7c6b58">${h}h</text>`).join("")}</svg>`;
const tmp=tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length/60:14.2;
$("#relatorio").innerHTML=`<div class="rel-acoes"><button class="sec" data-rel-fechar>Fechar</button><button data-rel-pdf>Baixar PDF</button></div><div class="folha">
<header><div><h1>Relatório de ${mes}</h1><p class="sub">Casa Brasa · gerado em ${hoje.toLocaleDateString("pt-BR")}</p></div><p class="sub">Stack Solution</p></header>
<div class="rel-kpis rel-bloco"><div><small>Faturamento no mês</small><b>${reais(fatM)}</b><span class="up">▲ 9,4% vs mês anterior</span></div><div><small>Pedidos</small><b>${pedM.toLocaleString("pt-BR")}</b></div><div><small>Ticket médio por mesa</small><b>${reais(fatM/mesasM)}</b></div><div><small>Tempo médio de preparo</small><b>${tmp.toFixed(1).replace(".",",")} min</b></div>
<div><small>Vendas extras (sugestão)</small><b>${reais(fatM*.064)}</b></div><div><small>Reservas</small><b>186</b></div><div><small>Compareceram</small><b>171 (92%)</b></div><div><small>Pedidos pelo QR</small><b>78%</b></div></div>
<div class="rel-bloco"><h2>Vendas por dia</h2>${barras}<p class="nota">Segundas-feiras: fechado. Melhor dia em vermelho.</p></div>
<div class="rel-duas rel-bloco"><div><h2>Horários de pico</h2>${pico}<p class="nota">Almoço 12h–13h e jantar 20h–21h concentram ${Math.round((peso[1]+peso[2]+peso[9]+peso[10])/pt*100)}% dos pedidos: reforce a equipe nesses horários.</p></div>
<div><h2>Pratos mais vendidos</h2><table><tbody>${pratos.map((x,i)=>`<tr><td>${i+1}. ${esc(x.n)}</td><td style="text-align:right"><b>${x.q}</b></td></tr>`).join("")}</tbody></table></div></div>
<div class="rel-bloco"><h2>Recomendações para o próximo mês</h2><p>• Destacar <b>${esc(pratos[0].n)}</b> no topo do cardápio e criar combo com bebida.<br>• Mandar convite para os 38 clientes que não voltam há 30 dias.<br>• Quinta-feira está 35% abaixo de sexta: testar um prato do dia ou happy hour.</p></div>
<p class="nota">Demonstração: números do mês são exemplos (os pedidos de hoje entram na lista de pratos). No sistema real vêm dos pedidos registrados.</p></div>`;$("#relatorio").hidden=false}
$("#btn-rel").onclick=relatorio;
$("#relatorio").onclick=e=>{if(e.target.closest("[data-rel-fechar]"))$("#relatorio").hidden=true;if(e.target.closest("[data-rel-pdf]"))window.print()};
// balcão: senha pronta vai para a TV
function pronta(p){p.pronta=Date.now();reg(p,"Pronto");tv();bip(990)}
function tv(){const prep=balcao.filter(o=>!o.pronta&&!o.retirada),pr=balcao.filter(o=>o.pronta&&!o.retirada).sort((a,b)=>b.pronta-a.pronta),ult=pr[0];
$("#tv-prep").innerHTML=prep.map(o=>`<span>${o.senha}</span>`).join("")||"<em>Nenhum pedido no momento</em>";
const ag=$("#tv-agora");const novo=ult&&ag.dataset.num!==String(ult.num)+ult.pronta;ag.dataset.num=ult?String(ult.num)+ult.pronta:"";
ag.className="tv-agora"+(ult?"":" vazio");ag.innerHTML=ult?`<small>Senha chamada</small><b>${ult.senha}</b><span>${esc(ult.nome&&ult.nome!=="Mesa"?ult.nome:"")}</span>`:`<small>Aguardando</small><b>—</b>`;
if(novo){void ag.offsetWidth;ag.classList.add("chama")}
$("#tv-prontos").innerHTML=pr.slice(1).map(o=>`<span>${o.senha}</span>`).join("");
const linha=(o,b)=>`<div class="linha"><span class="q">${o.senha}</span><span class="d"><b>${esc(o.nome||"Cliente")}</b><small>${o.itens.map(i=>i.qtd+"× "+esc(i.nome)).join(", ")}</small></span>${b}</div>`;
$("#b-prep").innerHTML=prep.map(o=>linha(o,`<span class="st pendente">${(pedidos.find(x=>x.num===o.num)||{}).status||"Recebido"}</span>`)).join("")||'<p class="nota">Nenhum pedido do balcão.</p>';
$("#b-prontos").innerHTML=pr.map(o=>linha(o,`<span class="mx"><button class="sec" data-de-novo="${o.num}">Chamar de novo</button><button data-retirado="${o.num}">Retirado</button></span>`)).join("")||'<p class="nota">—</p>';
const n=pr.length,bb=$("#b-balcao");bb.hidden=!n;bb.textContent=n}
$("#b-prontos").onclick=e=>{const r=e.target.closest("[data-retirado]"),d=e.target.closest("[data-de-novo]");
if(r){const o=balcao.find(x=>String(x.num)===r.dataset.retirado);o.retirada=true;reg(o,"Entregue");const cb=+(o.total*fidPct()/100).toFixed(2);fidDist+=cb;fidelidade();site().postMessage({tipo:"status",num:o.num,status:"Retirado. Bom apetite!"+(cb?` Você ganhou ${reais(cb)} de cashback.`:"")},"*");tv()}
if(d){const o=balcao.find(x=>String(x.num)===d.dataset.deNovo);o.pronta=Date.now();tv();bip(990)}};
$("#abrir-tv").onclick=()=>{const b=document.querySelector('.troca [data-ver="tv"]');if(b)b.click();else $("#tv").hidden=false};
$("#tv-sair").onclick=()=>{$("#tv").hidden=true};
setInterval(()=>{$("#tv-hora").textContent=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})},1000);
// rede: várias unidades (Centro ao vivo; as outras são exemplo)
const UNID=[{id:"centro",nome:"Centro",fat:5120,ped:58,tmp:14.1,nota:4.8},{id:"jardins",nome:"Jardins",fat:6230,ped:71,tmp:13.1,nota:4.9},{id:"moema",nome:"Moema",fat:4890,ped:58,tmp:17.6,nota:4.6}];
function unidades(){const v=$("#unidade").value||"centro";$("#unidade").innerHTML=UNID.map(u=>`<option value="${u.id}">Unidade ${esc(u.nome)}${u.id==="centro"?" (ao vivo)":""}</option>`).join("");$("#unidade").value=v}
$("#unidade").onchange=e=>{const u=UNID.find(x=>x.id===e.target.value),a=$("#aviso-unidade");a.hidden=u.id==="centro";
a.textContent=`Você está na unidade ${u.nome}. Cada loja tem as suas mesas, equipe e QR Codes. Nesta demonstração os pedidos ao vivo chegam na unidade Centro; ${u.nome} aparece com números de exemplo na aba Rede de lojas.`};
function rede(){const lojas=UNID.map(u=>u.id==="centro"?Object.assign({},u,{fat:u.fat+fat,ped:u.ped+ped}):u),tf=lojas.reduce((t,u)=>t+u.fat,0),tp=lojas.reduce((t,u)=>t+u.ped,0);
$("#r-kpis").innerHTML=`<div class="k"><small>Faturamento da rede hoje</small><b>${reais(tf)}</b></div><div class="k"><small>Pedidos na rede</small><b>${tp}</b></div><div class="k"><small>Ticket médio</small><b>${reais(tf/Math.max(1,tp)*1.6)}</b></div><div class="k"><small>Unidades</small><b>${lojas.length}</b></div><div class="k lucro"><small>Melhor loja hoje</small><b>${esc([...lojas].sort((a,b)=>b.fat-a.fat)[0].nome)}</b></div>`;
$("#r-lojas").innerHTML=[...lojas].sort((a,b)=>b.fat-a.fat).map((u,i)=>u.nova?`<tr><td>${esc(u.nome)}</td><td colspan="5" class="nova">Configurando: cardápio, mesas e QR copiados da unidade Centro</td></tr>`:`<tr><td>${i+1}º · ${esc(u.nome)}${u.id==="centro"?'<span class="ao-vivo">ao vivo</span>':""}</td><td>${reais(u.fat)}</td><td>${u.ped} pedidos</td><td>${reais(u.fat/Math.max(1,u.ped)*1.6)}</td><td class="${u.tmp>16?"alerta-t":""}">${u.tmp.toFixed(1).replace(".",",")} min${u.tmp>16?" ⚠":""}</td><td>★ ${u.nota.toFixed(1).replace(".",",")}</td></tr>`).join("");
const pr=["picanha-brasa","pizza-fermentacao","tiramisu"].map(id=>MENU.find(i=>i.id===id)).filter(Boolean),ab=UNID.filter(u=>!u.nova);
$("#r-cardapio").innerHTML=`<tr><th>Prato</th>${ab.map(u=>`<th>${esc(u.nome)}</th>`).join("")}</tr>`+pr.map(i=>`<tr><td>${esc(i.nome)}</td>${ab.map(u=>`<td>${reais(i.preco+(u.id==="jardins"?6:0))}</td>`).join("")}</tr>`).join("")}
$("#nova-unidade").onclick=()=>{const n=UNID.length+1;UNID.push({id:"u"+n,nome:"Nova unidade "+n,fat:0,ped:0,tmp:0,nota:0,nova:true});unidades();rede()};
unidades();rede();tv();
// fidelidade com cashback
let fidDist=0;const fidPct=()=>+$("#fid-pct").value;function fidelidade(){$("#fid-dist").textContent=reais(fidDist)}
$("#fid-pct").onchange=fidelidade;
// promoções por horário
const PROMOS=[{id:"happy",titulo:"Happy hour: chopes e caipirinha com 50%",quando:"Seg a sex, das 17h às 19h",precos:{"chope-pilsen":7,"chope-ipa":9.5,"caipirinha-limao":12}},{id:"dia",titulo:"Prato do dia: Costela 12 horas por R$ 69",quando:"Ter a sex, almoço (11h30 às 15h)",precos:{"costela-12h":69}}];
function promos(){$("#promos").innerHTML=PROMOS.map((x,i)=>`<div class="linha"><span class="d"><b>${esc(x.titulo)}</b><small>${esc(x.quando)}</small></span><span class="st ${x.ativa?"confirmada":"pendente"}">${x.ativa?"Ativa agora":"Agendada"}</span><button class="${x.ativa?"sec":""}" data-promo="${i}">${x.ativa?"Desligar":"Ligar agora"}</button></div>`).join("")}
$("#promos").onclick=e=>{const b=e.target.closest("[data-promo]");if(!b)return;const x=PROMOS[b.dataset.promo];x.ativa=!x.ativa;site().postMessage({tipo:"promo",id:x.id,titulo:x.titulo,ativa:x.ativa,precos:x.precos},"*");promos()};
// fila de espera
const fila=[{nome:"Paula",pes:4,tel:"5511900000031",desde:Date.now()-18*60000},{nome:"Diego",pes:2,tel:"5511900000032",desde:Date.now()-9*60000}];
function listaFila(){const at=fila.filter(f=>!f.fim);$("#fila").innerHTML=at.map((f,i)=>{const min=Math.round((Date.now()-f.desde)/60000);return `<div class="linha"><span class="q">${i+1}º</span><span class="d"><b>${esc(f.nome)}</b> · ${f.pes} pessoas<small>esperando há ${min} min${f.avisado?" · avisado no WhatsApp":""}</small></span>
${f.avisado?`<span class="mx"><button data-sentou="${fila.indexOf(f)}">Sentou</button><button class="sec" data-desistiu="${fila.indexOf(f)}">Desistiu</button></span>`:`<a href="https://wa.me/${f.tel}?text=${encodeURIComponent(`Olá, ${f.nome}! Sua mesa na Casa Brasa está pronta. Te esperamos em até 10 minutos.`)}" target="_blank" rel="noopener"><button data-avisar="${fila.indexOf(f)}">Mesa pronta: avisar</button></a>`}</div>`}).join("")||'<p class="nota">Ninguém na fila.</p>'}
$("#fila").onclick=e=>{const a=e.target.closest("[data-avisar]"),s=e.target.closest("[data-sentou]"),d=e.target.closest("[data-desistiu]");
if(a)setTimeout(()=>{fila[a.dataset.avisar].avisado=true;listaFila()},200);if(s){fila[s.dataset.sentou].fim=1;listaFila()}if(d){fila[d.dataset.desistiu].fim=1;listaFila()}};
$("#f-entrar").onclick=()=>{const nome=$("#f-nome").value.trim();if(!nome)return $("#f-nome").focus();const f={nome,pes:+$("#f-pes").value,tel:$("#f-tel").value.replace(/\D/g,"")||"5511900000000",desde:Date.now()};fila.push(f);listaFila();
const pos=fila.filter(x=>!x.fim).indexOf(f)+1;const cel=$("#cel-fila");cel.hidden=false;cel.innerHTML=`<small>Casa Brasa · fila de espera</small><b>Olá, ${esc(nome)}!</b>Você é o<div class="grande">${pos}º</div>da fila. Espera estimada: ~${pos*8} min.<br><br>Pode esperar onde quiser: avisamos no WhatsApp quando a mesa estiver pronta.`;$("#f-nome").value="";$("#f-tel").value=""};
setInterval(listaFila,30000);
// resumo do dia no WhatsApp do dono
$("#btn-zap").onclick=()=>{const top=Object.entries(vendidos).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])[0],tm=tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length/60:0,hoje=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const linhas=[`*Casa Brasa · resumo de hoje (${hoje})*`,"",`💰 Faturamento: ${reais(fat)}`,`🧾 Pedidos: ${ped} · ticket médio ${reais(fat/Math.max(1,new Set(pedidos.filter(o=>o.mesa).map(o=>o.mesa)).size))}`,`🏆 Campeão do dia: ${top?top[0]+" ("+top[1]+")":"—"}`,`⏱️ Preparo médio: ${tm?tm.toFixed(1).replace(".",",")+" min":"—"}`,`✨ Vendas extras (sugestão): ${reais(sug)}`,`🎁 Cashback dado: ${reais(fidDist)}`,`❌ Cancelamentos: ${cancel.length}`,`📅 Reservas amanhã: 4 (1 aniversário)`,"","Bom descanso! Relatório completo no painel."];
$("#caixa").innerHTML=`<h3>Resumo do dia no WhatsApp</h3><div class="zap"><div class="zap-topo">Stack Solution · mensagem automática</div><div class="zap-msg">${linhas.map(l=>esc(l).replace(/\*(.+?)\*/g,"<b>$1</b>")).join("<br>")}<span class="zap-h">23:00 ✓✓</span></div></div>
<label class="lin"><input type="checkbox" checked> Enviar todo dia às 23h para o dono e o gerente</label><div class="pe"><button class="sec" data-cancelar>Fechar</button><a href="https://wa.me/?text=${encodeURIComponent(linhas.join("\n"))}" target="_blank" rel="noopener"><button>Enviar agora</button></a></div>`;$("#modal").hidden=false};
// assistente de IA (respostas prontas a partir dos dados da demonstração)
const PERG=["Qual prato vende mais?","Qual prato vende menos?","Quanto vendi hoje?","Qual o melhor horário?","Quem devo chamar de volta?","Como aumentar o ticket médio?"];
$("#ia-chips").innerHTML=PERG.map(q=>`<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("");
const nm=id=>(MENU.find(i=>i.id===id)||{}).nome||id;
function responder(q){const t=q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");const top=Object.entries(vendidos).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
if(/menos|pior|parad/.test(t))return `Os que menos saem no mês são <b>${nm("lasanha-berinjela")}</b> (12 pedidos) e <b>${nm("sorbet-manga")}</b> (15). Sugestão: coloque um deles como prato do dia com preço menor por uma semana; se não reagir, tire do cardápio e simplifique a cozinha.`;
if(/mais|campe|melhor prato|vende bem/.test(t))return top.length?`Hoje o campeão é <b>${esc(top[0][0])}</b> (${top[0][1]}). No mês, <b>${nm("picanha-brasa")}</b> lidera com 159 pedidos. Vale destacar no topo do cardápio e criar um combo com bebida.`:`No mês, <b>${nm("picanha-brasa")}</b> lidera com 159 pedidos, seguida da <b>${nm("pizza-fermentacao")}</b>. Faça um pedido no celular para eu contar o de hoje.`;
if(/hoje|vendi|fatur/.test(t))return `Hoje: <b>${reais(fat)}</b> em ${ped} pedido(s), com ${reais(sug)} vindos de sugestões "Vai bem com". ${cancel.length?cancel.length+" cancelamento(s) com senha do gerente.":"Nenhum cancelamento."}`;
if(/horario|pico|hora/.test(t))return `Os picos são <b>20h–21h</b> no jantar e <b>12h–13h</b> no almoço: juntos, 51% dos pedidos. Reforce a cozinha nesses horários. Das 15h às 18h quase não há movimento: bom horário para um happy hour (aba Fidelidade e promoções).`;
if(/cliente|volta|sumi|chamar/.test(t))return `38 clientes não voltam há mais de 30 dias. Os mais valiosos: <b>Marina Costa</b> (gosta de Picanha), <b>Rafael Nunes</b> e <b>Juliana Prado</b>. Mande o convite com sobremesa grátis na Gerência; com cashback ligado, 38% costumam voltar.`;
if(/ticket|aumentar|vender mais|lucro|margem/.test(t))return `Três caminhos: 1) a sugestão "Vai bem com" já rendeu <b>${reais(sug)}</b> hoje; 2) adicionais no prato (queijo coalho, borda recheada) somam R$ 8 a R$ 18 por pedido; 3) combo prato + bebida. Para falar de <b>margem</b>, cadastre o custo de cada prato: no sistema real eu mostro o lucro por item.`;
if(/quinta|segunda|terca|quarta|sexta|sabado|domingo|dia da semana/.test(t))return `Sexta e sábado vendem o dobro da semana. Quinta é o dia mais fraco depois do almoço de terça: teste um prato do dia ou happy hour na quinta.`;
return `Na demonstração eu respondo às perguntas sugeridas acima. No sistema real a IA lê todos os seus pedidos, reservas e clientes e responde qualquer pergunta.`}
function perguntar(q){if(!q.trim())return;const c=$("#ia-conversa");c.insertAdjacentHTML("beforeend",`<div class="ia-p">${esc(q)}</div><div class="ia-r ia-digitando">digitando…</div>`);c.scrollTop=c.scrollHeight;
setTimeout(()=>{const r=c.querySelector(".ia-digitando");r.classList.remove("ia-digitando");r.innerHTML=responder(q);c.scrollTop=c.scrollHeight},650)}
$("#ia-chips").onclick=e=>{const b=e.target.closest("[data-q]");if(b)perguntar(b.dataset.q)};
$("#ia-form").onsubmit=e=>{e.preventDefault();perguntar($("#ia-q").value);$("#ia-q").value=""};
fidelidade();promos();listaFila();
integ();
mapa();listaReservas();gerencia();listaPedidos();
</script></body></html>"""

destino = AQUI / "demo-pdv.html"
destino.write_text(PAINEL.replace("%%MENU%%", MENU).replace("%%SITE%%", base64.b64encode(site.encode("utf-8")).decode()), encoding="utf-8")
print(f"{destino.name}: {destino.stat().st_size // 1024} KB")

# ---- duas telas separadas: cliente.html (o que o cliente vê) e restaurante.html (o que a casa vê)
# Abertas no mesmo navegador (duas janelas, ou PC e TV espelhada), conversam por um canal local.
CANAL = "casa-brasa-pdv"
PONTE = """<script>(()=>{const c=new BroadcastChannel("%s");
window.addEventListener("message",e=>{if(e.source===window&&e.data&&["pedido","garcom","conta","ver-conta"].includes(e.data.tipo))c.postMessage(e.data)});
c.onmessage=e=>window.postMessage(e.data,"*")})();</script></body>""" % CANAL
cli = site.replace("</body>", PONTE, 1) if "</body>" in site else site + PONTE
(AQUI / "cliente.html").write_text(cli, encoding="utf-8")

rest = PAINEL.replace("%%MENU%%", MENU)
a, b = rest.index('<section class="lado">'), rest.index('<section class="painel">')
rest = rest[:a] + rest[b:]
a = rest.index('<script id="site-html"')
rest = rest[:a] + rest[rest.index("</script>", a) + len("</script>"):]  # tira o html do site
a = rest.index("(()=>{const b=atob(")
rest = rest[:a] + rest[rest.index('"#cardapio"})();', a) + len('"#cardapio"})();'):]  # tira o iframe
rest = rest.replace('const site=()=>document.getElementById("site").contentWindow;',
    'const canal=new BroadcastChannel("%s"),site=()=>({postMessage:d=>canal.postMessage(d)});canal.onmessage=e=>window.dispatchEvent(new MessageEvent("message",{data:e.data}));' % CANAL)
rest = rest.replace("display:grid;grid-template-columns:auto 1fr;overflow:hidden}", "display:grid;grid-template-columns:1fr;overflow:hidden}").replace("<title>Demonstração: pedido na mesa e painel da casa</title>", "<title>Casa Brasa · Painel do restaurante</title>")
(AQUI / "restaurante.html").write_text(rest, encoding="utf-8")
print("cliente.html e restaurante.html")

# ---- tudo em um: sistema.html, com a escolha "Cliente | Restaurante" no topo
TROCA_CSS = """<style>
body.um{grid-template-columns:1fr;padding-top:64px}
.troca{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:50;display:flex;gap:4px;padding:4px;background:var(--cartao);border:1px solid var(--linha);border-radius:99px;box-shadow:0 6px 20px rgba(60,40,20,.15)}
.troca button{background:none;color:var(--suave);border-radius:99px;padding:9px 22px;font-size:14px;position:relative}
.troca button[aria-pressed=true]{background:var(--brasa);color:#fff}
.troca .bolinha{position:absolute;top:-4px;right:-2px;min-width:18px;height:18px;border-radius:9px;background:var(--ouro);color:#fff;font-size:11px;display:grid;place-items:center;padding:0 4px}
body.ver-cliente .painel,body.ver-restaurante .lado,body.ver-tv .painel,body.ver-tv .lado{display:none}
body.ver-cliente .lado{border:0}body.ver-cliente .lado p{display:none}
body.um .celular{height:min(800px,calc(100vh - 100px))}
body.ver-restaurante .painel{height:calc(100vh - 64px)}
@media(max-width:600px){body.ver-cliente .lado{padding:0}body.ver-cliente .celular{width:100vw;height:calc(100vh - 64px);border:0;border-radius:0;box-shadow:none}}
</style></head>"""
TROCA_HTML = """<body class="um ver-cliente"><div class="troca" role="group" aria-label="Escolher a tela">
<button type="button" data-ver="cliente" aria-pressed="true">Cliente</button><button type="button" data-ver="restaurante" aria-pressed="false">Restaurante<span class="bolinha" id="b-troca" hidden></span></button><button type="button" data-ver="tv" aria-pressed="false">TV senhas</button></div>"""
TROCA_JS = """<script>
(()=>{const ver=v=>{document.body.classList.toggle("ver-cliente",v==="cliente");document.body.classList.toggle("ver-restaurante",v==="restaurante");
document.body.classList.toggle("ver-tv",v==="tv");document.getElementById("tv").hidden=v!=="tv";document.querySelectorAll(".troca [data-ver]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ver===v));try{localStorage.setItem("cb-ver",v)}catch(e){}};
document.querySelectorAll(".troca [data-ver]").forEach(b=>b.onclick=()=>ver(b.dataset.ver));
try{const v=localStorage.getItem("cb-ver");if(v)ver(v)}catch(e){}
// avisa no botão "Restaurante" quando chega algo novo enquanto se está na tela do cliente
setInterval(()=>{const n=document.querySelectorAll(".alerta").length+document.querySelectorAll(".card.novo").length,b=document.getElementById("b-troca");b.hidden=!n;b.textContent=n},500)})();
</script></body></html>"""
um = PAINEL.replace("%%MENU%%", MENU).replace("%%SITE%%", base64.b64encode(site.encode("utf-8")).decode())
um = um.replace("</style></head>", "</style>" + TROCA_CSS, 1).replace("<body>", TROCA_HTML, 1)
um = um.replace("<title>Demonstração: pedido na mesa e painel da casa</title>", "<title>Casa Brasa · Sistema</title>")
assert um.rstrip().endswith("</body></html>")
um = um.rstrip()[: -len("</body></html>")] + TROCA_JS
(AQUI / "sistema.html").write_text(um, encoding="utf-8")
print("sistema.html")
