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
def _qrs():
    try:
        import qrcode, qrcode.image.svg
    except ImportError:
        return "{}"
    conf = json.loads((AQUI.parent / "restaurante-premium/data/config.json").read_text(encoding="utf-8"))
    base = (conf.get("site", {}).get("url") or "https://seurestaurante.com.br").rstrip("/") + "/cardapio.html?mesa="
    out = {}
    for n in range(1, 31):
        svg = qrcode.make(base + str(n), image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1).to_string(encoding="unicode")
        out[n] = re.sub(r"<\?xml[^>]*>", "", svg)
    return json.dumps(out)
QRS = _qrs()
def _pix():
    def emv(i, v): return f"{i}{len(v):02d}{v}"
    corpo = emv("00", "01") + emv("26", emv("00", "br.gov.bcb.pix") + emv("01", "demo@stacksolution.com.br")) + emv("52", "0000") + emv("53", "986") + emv("58", "BR") + emv("59", "CASA BRASA DEMO") + emv("60", "SAO PAULO") + emv("62", emv("05", "DEMO")) + "6304"
    crc = 0xFFFF
    for ch in corpo.encode():
        crc ^= ch << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    copia = corpo + f"{crc:04X}"
    try:
        import qrcode, qrcode.image.svg
        svg = re.sub(r"<\?xml[^>]*>", "", qrcode.make(copia, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1).to_string(encoding="unicode"))
    except ImportError:
        svg = ""
    return json.dumps({"qr": svg, "copia": copia})
PIX = _pix()
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
header h1::before{content:attr(data-ini);display:inline-grid;place-items:center;width:34px;height:34px;margin-right:10px;border-radius:50%;background:var(--brasa);color:#fff;font:700 13px system-ui;vertical-align:middle}
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
.cols{display:grid;grid-template-columns:1fr;gap:18px}
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
body>*:not(#relatorio):not(#impressao){display:none!important}#impressao{position:static!important}#relatorio{position:static!important;overflow:visible!important;background:#fff!important;padding:0!important}
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
.btn-ia{position:fixed;right:22px;bottom:22px;z-index:25;border-radius:99px;padding:13px 20px;font-size:14px;box-shadow:0 10px 24px rgba(178,58,30,.35)}
body.ver-cliente .btn-ia,body.ver-tv .btn-ia,body.modo-cel .btn-ia{display:none}
@media(max-width:700px){.btn-ia{bottom:150px;right:12px;padding:11px 16px}}
.demo-menu{position:relative}
.demo-pop{position:absolute;top:calc(100% + 8px);left:0;z-index:30;width:270px;display:grid;gap:10px;padding:14px;background:var(--cartao);border:1px solid var(--linha);border-radius:14px;box-shadow:0 18px 40px rgba(60,40,20,.18)}
.demo-pop label{display:grid;gap:5px;font-size:13px;font-weight:600;color:var(--suave)}.demo-pop select{font:600 14px system-ui;padding:9px;border-radius:10px;border:1px solid var(--linha);background:var(--fundo);color:var(--texto)}
#btn-auto.on{background:var(--verde)}
.aviso-flutua{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:60;max-width:min(560px,92vw);padding:13px 18px;border-radius:12px;background:var(--texto);color:var(--cartao);font-size:14px;box-shadow:0 14px 30px rgba(0,0,0,.25);animation:chega .3s ease}
.cores{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}.cores button{width:34px;height:34px;border-radius:50%;padding:0;border:3px solid transparent}.cores button.on{border-color:var(--texto)}
.caixa input[type=color]{height:42px;padding:3px}
nav .c{display:none}
@media(max-width:700px){nav .l{display:none}nav .c{display:inline}}body.modo-cel nav .l{display:none}body.modo-cel nav .c{display:inline}
.aviso-rede{margin:0 0 16px;padding:12px 16px;border-radius:12px;background:var(--brasa-cl);border:1px solid #f0c4b8;color:var(--brasa);font-weight:600}.aviso-rede.ok{background:var(--verde-cl);border-color:#cfe5cc;color:var(--verde)}
.tag.off{background:var(--brasa-cl);color:var(--brasa)}.tag.off::before{background:var(--brasa)}
tbody.esg button[data-editar]{background:var(--cartao);color:var(--texto);border:1px solid var(--linha)}
.apagar{color:var(--brasa)!important}
.desc{margin-top:12px;font-size:14px}.desc summary{cursor:pointer;font-weight:600;color:var(--suave)}.desc-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.desc-g select,.desc-g input{width:100%;font:14px system-ui;padding:9px;border-radius:10px;border:1px solid var(--linha);background:var(--fundo);margin:0}
.filtros-h{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}.filtros-h input{flex:1;min-width:180px}.filtros-h select,.filtros-h input,.horarios input,.form-func input,.form-func select,.lin input[type=number]{font:15px system-ui;padding:9px 10px;border-radius:10px;border:1px solid var(--linha);background:var(--fundo);color:var(--texto)}
.placas-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:12px;max-height:260px;overflow:auto}.placas-mini div{border:1px solid var(--linha);border-radius:10px;padding:6px;text-align:center;font-size:12px;font-weight:700}.placas-mini svg{width:100%;height:auto;display:block}
.horarios{display:grid;gap:6px}.horarios div{display:grid;grid-template-columns:42px 1fr 1fr auto;gap:6px;align-items:center;font-size:13px}.horarios input{padding:6px;font-size:13px;min-width:0}
.form-func{display:grid;grid-template-columns:2fr 1.4fr 1.4fr auto;gap:6px;margin-top:10px}.form-func input,.form-func select{min-width:0}
#impressao{position:fixed;left:-9999px;top:0}
.ticket{width:290px;margin:0 auto;padding:14px;background:#fff;color:#000;font:14px/1.35 "Courier New",monospace;border:1px dashed #bbb}.ticket b{font-size:15px}.ticket .tk-c{text-align:center}.ticket hr{border:0;border-top:1px dashed #000;margin:8px 0}.ticket .tk-o{padding-left:14px}
#impressao .ticket{border:0;width:72mm;padding:0}#impressao.ticket-p{page:ticket}
.placa-p{display:inline-block;width:62mm;margin:4mm;padding:5mm;border:1px solid #000;border-radius:4mm;text-align:center;font:14px system-ui;break-inside:avoid}.placa-p b{display:block;font:700 20px Georgia,serif}.placa-p svg{width:40mm;height:40mm}
@page ticket{size:80mm 200mm;margin:3mm}
.wiz-passos{display:flex;gap:6px;margin-bottom:12px}.wiz-passos span{flex:1;height:5px;border-radius:3px;background:var(--linha)}.wiz-passos span.on{background:var(--brasa)}
.wiz-ok{text-align:center}.wiz-ok .grande{font-size:44px}.wiz-ok code{display:block;margin:8px 0;padding:8px;background:var(--cartao2);border-radius:8px;font-size:13px;word-break:break-all}
@media(max-width:700px){#aba-historico .tabela tr{grid-template-columns:1fr auto}#aba-historico .tabela td:nth-child(5){grid-column:1/-1}.form-func{grid-template-columns:1fr 1fr}.desc-g{grid-template-columns:1fr}}
body.modo-cel #aba-historico .tabela tr{grid-template-columns:1fr auto}body.modo-cel #aba-historico .tabela td:nth-child(5){grid-column:1/-1}body.modo-cel .form-func{grid-template-columns:1fr 1fr}body.modo-cel .duas{grid-template-columns:1fr}
@media(max-width:700px){#crm .linha .d,#aniv .linha .d{flex:1 1 100%}}body.modo-cel #crm .linha .d,body.modo-cel #aniv .linha .d{flex:1 1 100%}
.est-barra{display:block;height:6px;border-radius:3px;background:var(--cartao2);margin-top:6px;overflow:hidden}.est-barra i{display:block;height:100%}
/* revisão de layout */
.card .pe{flex-wrap:wrap;row-gap:8px}.card .mx{margin-left:auto;flex-wrap:wrap;justify-content:flex-end}.card .mx button{padding:9px 12px}.card .mx .sec{padding:9px 10px}
.card .topo{flex-wrap:wrap}.mesa{line-height:1.15}
.aviso-flutua{bottom:auto;top:82px}body.um .aviso-flutua{top:146px}
.tv-agora.vazio span{display:block;margin-top:10px;font-size:22px;opacity:.7}
tr.clic{cursor:pointer}tr.clic:hover td{background:var(--ouro-cl)}#lista-pedidos td small{display:block;color:var(--suave);font-size:12px}
.linha-tempo{list-style:none;margin:10px 0;padding:0;border-left:2px solid var(--linha)}.linha-tempo li{position:relative;padding:4px 0 8px 16px}.linha-tempo li::before{content:"";position:absolute;left:-6px;top:9px;width:10px;height:10px;border-radius:50%;background:var(--verde)}
.linha-tempo small{color:var(--suave);margin-left:6px}
#nav-mais{display:none}
@media(max-width:700px){
 header{gap:6px 8px;padding:8px 12px}header h1{font-size:16px;flex:1 1 auto}#unidade{display:none}.tag{font-size:10px;padding:3px 8px}
 .troca button{padding:8px 11px;font-size:13px;white-space:nowrap}.troca .tour-btn{padding:8px 10px}
 nav:not(.aberta){grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
 nav:not(.aberta) button[data-aba]:not(.prim):not([aria-selected=true]){display:none}
 nav.aberta{grid-template-columns:repeat(4,minmax(0,1fr));max-height:60vh;overflow:auto}
 #nav-mais{display:block;font-size:11px;padding:9px 4px;min-height:44px;color:var(--brasa)}
 .btn-ia{bottom:96px;right:10px;padding:11px 14px;font-size:16px}.btn-ia .t{display:none}
 .aviso-flutua{top:auto;bottom:100px}body.um .aviso-flutua{top:auto}
}
body.modo-cel header{gap:6px 8px;padding:8px 12px}body.modo-cel header h1{font-size:16px;flex:1 1 auto}body.modo-cel #unidade{display:none}
body.modo-cel nav:not(.aberta){grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
body.modo-cel nav:not(.aberta) button[data-aba]:not(.prim):not([aria-selected=true]){display:none}
body.modo-cel nav.aberta{grid-template-columns:repeat(4,minmax(0,1fr));max-height:60vh;overflow:auto}
body.modo-cel #nav-mais{display:block;font-size:11px;padding:9px 4px;min-height:44px;color:var(--brasa)}
body.ver-tv .aviso-flutua{display:none}
@media(max-width:600px){.troca{gap:2px;padding:3px}.troca button{padding:7px 10px;font-size:12.5px}.troca .tour-btn .t{display:none}}
/* cores: mesa x balcão */
.card.mesa-c{border-left:6px solid #c98a2c}.card.balc-c{border-left:6px solid #2457a6;background:#f4f8fe}.card.balc-c .mesa{color:#1d4688}
.pg{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:99px;font:700 11px system-ui;background:var(--ouro-cl);color:var(--ouro)}.pg.ok{background:var(--verde-cl);color:var(--verde)}
.legenda-cor{display:flex;gap:16px;flex-wrap:wrap;margin:0 0 12px;font-size:13px;color:var(--suave)}.lc::before{content:"";display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.lc.mesa-c::before{background:#c98a2c}.lc.balc-c::before{background:#2457a6}
/* agilizar */
.card [data-av]{flex:1;font-size:15px;padding:12px 14px;background:var(--verde)}.card .mx{flex:1;margin-left:0}
.alerta.ok-pronto{background:var(--verde-cl);border-color:#cfe5cc;border-left-color:var(--verde)}.alerta.ok-pronto [data-levei]{background:var(--verde)}
.esg-box{margin-top:14px;padding:0}.esg-box summary{cursor:pointer;padding:14px 18px;font:600 15px Georgia,serif;list-style:none}.esg-box summary::after{content:" ▾";color:var(--suave)}.esg-box[open] summary{border-bottom:1px solid var(--linha)}.esg-box>.esg,.esg-box>.nota{margin:14px 18px}
.nav-sec{display:block;margin:14px 14px 4px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--suave);opacity:.75}.nav-sec:first-child{margin-top:0}nav.so-uma .nav-sec{display:none}
@media(max-width:1000px){.nav-sec{display:none}}body.modo-cel .nav-sec{display:none}
.m .levei{background:var(--verde)}
/* cozinha só com o que falta fazer */
#cozinha-Recebido,#bar-Recebido{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px;align-items:start}#cozinha-Recebido .card,#bar-Recebido .card{margin:0}#cozinha-Recebido .vazio,#bar-Recebido .vazio{grid-column:1/-1}
.card.saindo{opacity:0;transform:scale(.96);transition:all .3s}
.prontas{border:2px solid #cfe5cc;background:#fbfef9}.pronta-mesa{background:var(--verde-cl)!important;border-color:#cfe5cc!important}.pronta-mesa .q{color:var(--verde)}.pronta-mesa [data-levei-mesa]{background:var(--verde)}.pronta-mesa .d small{display:block;margin-top:4px}
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
<header><h1 data-ini="CB"><span id="marca-nome">Casa Brasa</span> · Painel</h1><select id="unidade" aria-label="Unidade"></select><span class="tag" id="tag-rede">Ao vivo</span><div class="demo-menu"><button class="sec" id="btn-demo" type="button" aria-expanded="false">⚙ Demo</button><div class="demo-pop" id="demo-pop" hidden>
<label>Tipo de negócio<select id="tipo-neg"><option value="restaurante">Restaurante</option><option value="pizzaria">Pizzaria</option><option value="hamburgueria">Hamburgueria / lanchonete</option><option value="cafeteria">Cafeteria / padaria</option><option value="bar">Bar / choperia</option></select></label>
<button type="button" id="btn-marca" class="sec">🎨 Personalizar marca</button><button type="button" id="btn-auto">▶ Modo apresentação</button><button type="button" class="sec" id="btn-off">📶 Simular queda de internet</button><button type="button" class="sec" id="btn-novo-rest2">🚀 Cadastrar restaurante novo</button>
<p class="nota" style="margin:0">Ajustes para mostrar ao cliente durante a reunião.</p></div></div>
<button class="sec" id="modo-tela" type="button">📱 Ver no celular</button><label class="usuario">Entrar como<select id="funcao"><option value="">Gerente (vê tudo)</option><option value="cozinha">Cozinha</option><option value="bar">Bar</option><option value="mesas">Garçom</option><option value="reservas">Recepção</option><option value="pedidos">Caixa (só pedidos)</option><option value="balcao">Balcão</option><option value="rede">Dono da rede</option></select></label></header>
<nav role="tablist">
<span class="nav-sec">Operação</span>
<button role="tab" aria-selected="false" data-aba="pedidos">Pedidos<span class="bolinha" id="b-pedidos" hidden></span></button>
<button role="tab" aria-selected="true" data-aba="cozinha">Cozinha<span class="bolinha" id="b-cozinha" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="bar">Bar<span class="bolinha" id="b-bar" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="mesas">Mesas (garçom)<span class="bolinha" id="b-mesas" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="balcao">Balcão e TV<span class="bolinha" id="b-balcao" hidden></span></button>
<span class="nav-sec">Gestão</span>
<button role="tab" aria-selected="false" data-aba="reservas">Reservas e fila</button>
<button role="tab" aria-selected="false" data-aba="cardapio">Cardápio</button>
<button role="tab" aria-selected="false" data-aba="marketing">Fidelidade e promoções</button>
<button role="tab" aria-selected="false" data-aba="gerencia">Gerência e CRM</button>
<button role="tab" aria-selected="false" data-aba="historico">Histórico</button>
<span class="nav-sec">Ajustes</span>
<button role="tab" aria-selected="false" data-aba="integracoes">Integrações</button>
<button role="tab" aria-selected="false" data-aba="rede">Rede de lojas</button>
<button role="tab" aria-selected="false" data-aba="config">Configurações</button>
<button type="button" id="nav-mais" aria-expanded="false">☰ Mais</button>
</nav>
<main>
<p class="aviso-rede" id="aviso-rede" hidden></p>
<p class="aviso-unidade" id="aviso-unidade" hidden></p>
<div class="alertas" id="alertas"></div>
<section class="aba" id="aba-pedidos"><div class="filtros" id="filtros"></div><div class="tabela"><table><thead><tr><th>#</th><th>Hora</th><th>Mesa</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead><tbody id="lista-pedidos"></tbody></table></div><p class="vazio" id="sem-pedidos">Nenhum pedido ainda. Faça um pelo celular do cliente.</p></section>
<section class="aba" id="aba-cardapio"><div class="acoes-g"><button id="novo-prato" type="button">+ Novo prato</button></div><div class="tabela"><table><thead><tr><th>Prato</th><th>Categoria</th><th>Setor</th><th>Preço</th><th>Vendidos hoje</th><th>Hoje</th></tr></thead><tbody class="esg" data-setor="todos"></tbody></table></div><p class="nota">"Esgotado" some na hora do cardápio do cliente. "Editar" muda nome, preço, descrição e foto no celular do cliente na hora.</p>
<div class="bloco" style="margin-top:18px"><h3>Estoque</h3><div class="lista" id="estoque"></div><p class="nota">Cada prato vendido dá baixa nos ingredientes. Abaixo do mínimo, avisa; zerou, o prato vira "esgotado" sozinho. Quantidades de exemplo.</p></div></section>
<section class="aba ativa" id="aba-cozinha"><p class="legenda-cor"><span class="lc mesa-c">Mesa: o garçom leva</span><span class="lc balc-c">Balcão: senha chamada na TV</span></p><div class="cols">
<div class="col"><h2>Preparando</h2><div id="cozinha-Recebido"><p class="vazio">Os pedidos chegam aqui sozinhos, com o tempo correndo. Terminou? Toque em ✓ Pronto.</p></div></div>
</div><details class="bloco esg-box"><summary>Acabou algum prato? Marcar "esgotado hoje"</summary><div class="esg" data-setor="cozinha"></div><p class="nota">Some na hora do cardápio do cliente.</p></details></section>
<section class="aba" id="aba-bar"><p class="legenda-cor"><span class="lc mesa-c">Mesa: o garçom leva</span><span class="lc balc-c">Balcão: senha chamada na TV</span></p><div class="cols">
<div class="col"><h2>Preparando</h2><div id="bar-Recebido"><p class="vazio">Bebidas e vinhos chegam aqui sozinhos, separados da cozinha.</p></div></div>
</div><details class="bloco esg-box"><summary>Acabou alguma bebida? Marcar "esgotado hoje"</summary><div class="esg" data-setor="bar"></div></details></section>
<section class="aba" id="aba-mesas"><div class="acoes-g"><button id="btn-notif" class="sec" type="button">🔔 Ativar avisos no celular do garçom</button></div><div class="mapa" id="mapa"></div><p class="nota">O garçom vê o mapa no celular dele: aceita o primeiro pedido de cada mesa e leva o que ficou pronto. O cliente fecha a conta pelo celular e o garçom só leva a maquininha.</p></section>
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
<div class="bloco prontas"><h3>🍽️ Mesas prontas: pratos esperando o garçom</h3><div class="lista" id="mesas-prontas"><p class="nota">Nenhum prato esperando. Quando a cozinha ou o bar marcam pronto, o prato aparece aqui com o número da mesa.</p></div></div>
<h2 class="sec-tit">Balcão: senhas</h2>
<div class="duas"><div class="bloco"><h3>Preparando</h3><div class="lista" id="b-prep"><p class="nota">Nenhum pedido do balcão.</p></div></div><div class="bloco"><h3>Prontos para retirar</h3><div class="lista" id="b-prontos"><p class="nota">—</p></div></div></div>
<p class="nota">A senha sai da TV sozinha 5 minutos depois de chamada. Pedido do balcão não tem mesa: o cliente recebe uma senha no celular e é chamado na TV quando fica pronto. Para hamburguerias, lanchonetes, cafeterias e pizzarias com retirada.</p></section>
<section class="aba" id="aba-rede"><div class="acoes-g"><button id="nova-unidade" type="button" class="sec">+ Nova unidade</button></div>
<div class="kpis" id="r-kpis"></div>
<div class="tabela"><table><thead><tr><th>Unidade</th><th>Faturamento hoje</th><th>Pedidos</th><th>Ticket médio</th><th>Preparo</th><th>Nota</th></tr></thead><tbody id="r-lojas"></tbody></table></div>
<div class="duas" style="margin-top:18px"><div class="bloco"><h3>Cardápio central</h3><table class="mini" id="r-cardapio"></table><p class="nota">Muda uma vez e vale para todas as lojas; cada unidade pode ter preço próprio e marcar o que acabou.</p></div>
<div class="bloco"><h3>Clientes da rede</h3><div class="lista"><div class="linha"><span class="q">4.812</span><span class="d"><b>clientes cadastrados</b><small>em todas as unidades</small></span></div><div class="linha"><span class="q">22%</span><span class="d"><b>já foram em mais de uma loja</b><small>reconhecidos em qualquer unidade</small></span></div><div class="linha"><span class="q">1.096</span><span class="d"><b>no programa de fidelidade</b><small>pontos valem na rede toda</small></span></div></div></div></div>
<p class="nota">A unidade Centro mostra os pedidos ao vivo desta demonstração; as outras são exemplos.</p></section>
<section class="aba" id="aba-historico"><div class="filtros-h"><select id="h-per" aria-label="Período"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="7" selected>Últimos 7 dias</option></select><input id="h-q" placeholder="Buscar mesa, cliente, prato ou nº do pedido" aria-label="Buscar"><button id="h-exp" type="button">⬇ Exportar Excel</button></div>
<p class="nota" id="h-res"></p><div class="tabela"><table><thead><tr><th>Data</th><th>Pedido</th><th>Mesa</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th></tr></thead><tbody id="h-lista"></tbody></table></div>
<p class="nota">Os dias anteriores são exemplo; os pedidos de hoje são os desta demonstração.</p></section>
<section class="aba" id="aba-config"><div class="acoes-g"><button id="btn-novo-rest" type="button">🚀 Cadastrar restaurante novo</button></div>
<div class="duas">
<div class="bloco"><h3>Mesas e QR Codes</h3><label class="lin">Quantidade de mesas <input id="c-mesas" type="number" min="1" max="30" value="12" style="width:80px"></label>
<div class="pe" style="justify-content:flex-start"><button class="sec" id="c-mesas-ok" type="button">Atualizar</button><button id="c-placas" type="button">🖨 Imprimir plaquinhas</button></div><div class="placas-mini" id="placas-mini"></div></div>
<div class="bloco"><h3>Conta e funcionamento</h3><label class="lin"><input type="checkbox" id="c-aceite" checked> Garçom aceita o 1º pedido de cada mesa (segurança)</label><label class="lin"><input type="checkbox" id="c-serv" checked> Cobrar taxa de serviço</label><label class="lin">Taxa <input id="c-pct" type="number" min="0" max="20" value="10" style="width:70px"> %</label><label class="lin">Pedido do balcão <select id="c-balcao"><option value="antes">Pagar antes (Pix ou caixa)</option><option value="retirada">Pagar ao retirar</option></select></label>
<h3 style="margin-top:16px">Horário de funcionamento</h3><div class="horarios" id="horarios"></div><button class="sec" id="c-hor-ok" type="button" style="margin-top:8px">Salvar horários</button></div>
<div class="bloco"><h3>Impressora da cozinha</h3><label class="lin">Modelo <select id="c-imp"><option>Epson TM-T20</option><option>Elgin i9</option><option>Bematech MP-4200</option><option value="">Sem impressora (usar tablet)</option></select></label>
<label class="lin"><input type="checkbox" id="c-auto-imp"> Imprimir cada pedido automaticamente</label><label class="lin"><input type="checkbox" id="c-bar-imp" checked> Bebidas saem na impressora do bar</label>
<button class="sec" id="c-teste-imp" type="button">🖨 Imprimir teste</button><p class="nota">Impressora térmica de 80 mm ligada ao computador ou na rede. Cada cartão da cozinha também tem o botão 🖨.</p></div>
<div class="bloco"><h3>Funcionários e senhas</h3><div class="lista" id="funcs"></div>
<div class="form-func"><input id="fu-nome" placeholder="Nome" aria-label="Nome"><select id="fu-f" aria-label="Função"><option value="gerente">Gerente</option><option value="cozinha">Cozinha</option><option value="bar">Bar</option><option value="mesas">Garçom</option><option value="reservas">Recepção</option><option value="pedidos">Caixa</option></select><input id="fu-pin" placeholder="Senha (4 números)" inputmode="numeric" maxlength="4" aria-label="Senha"><button id="fu-add" type="button">Adicionar</button></div>
<button class="sec" id="btn-login" type="button" style="margin-top:10px">🔒 Entrar com senha</button></div></div>
<div class="bloco" style="margin-top:18px"><h3>Registro de atividades (quem fez o quê)</h3><div class="tabela"><table><thead><tr><th>Hora</th><th>Quem</th><th>Ação</th><th>Detalhe</th></tr></thead><tbody id="audit"><tr><td colspan="4">Nada registrado ainda.</td></tr></tbody></table></div></div></section>
<section class="aba" id="aba-gerencia"><div class="acoes-g"><button id="btn-zap" type="button" class="sec">📱 Resumo do dia (WhatsApp)</button><button id="btn-rel" type="button">📄 Relatório do mês (PDF)</button></div>
<div class="kpis"><div class="k"><small>Pedidos hoje</small><b id="g-ped">0</b></div><div class="k"><small>Faturamento hoje</small><b id="g-fat">R$ 0,00</b></div>
<div class="k"><small>Ticket médio por mesa</small><b id="g-tkt">R$ 0,00</b></div><div class="k lucro"><small>Vendas extras (sugestão)</small><b id="g-sug">R$ 0,00</b></div><div class="k"><small>Tempo médio de preparo</small><b id="g-tmp">—</b></div></div>
<div class="bloco ia" id="assistente"><h3>✨ Pergunte ao assistente</h3><div class="ia-chips" id="ia-chips"></div><div class="ia-conversa" id="ia-conversa"></div>
<form id="ia-form" class="ia-form"><input id="ia-q" placeholder="Ex.: qual prato vende menos?" aria-label="Pergunta"><button>Perguntar</button></form>
<p class="nota">Demonstração: respostas a partir dos dados desta tela e de exemplos. No sistema real a IA lê todos os pedidos, reservas e clientes.</p></div>
<div class="duas" style="margin-top:18px"><div class="bloco"><h3>Mais pedidos hoje</h3><div id="g-top"><p class="nota">Faça um pedido no celular.</p></div></div>
<div class="bloco"><h3>Clientes que não voltam há 30 dias</h3><div class="lista" id="crm"></div></div></div>
<div class="duas" style="margin-top:14px"><div class="bloco"><h3>Aniversariantes da semana</h3><div class="lista" id="aniv"></div></div><div class="bloco"><h3>Cancelamentos (com senha do gerente)</h3><div id="g-canc"><p class="nota">Nenhum hoje.</p></div></div></div>
<div class="bloco" style="margin-top:14px"><h3>Segurança</h3><div class="seguro"><span>Primeiro pedido da mesa só entra com aceite do garçom</span><span>QR muda quando a mesa é fechada</span><span>Cancelar item só com senha do gerente</span><span>Cada restaurante vê só os próprios dados</span><span>Pedido é reenviado até a cozinha confirmar</span><span>Máximo de 3 pedidos por minuto por mesa</span><span>Login por função</span></div></div>
<p class="nota">Números do celular são reais nesta demonstração; clientes, reservas e a senha do gerente (1234) são exemplos.</p></section>
</main></section>
<button type="button" class="btn-ia" id="btn-ia" aria-label="Assistente">✨<span class="t"> Assistente</span></button>
<div id="relatorio" hidden></div>
<div id="impressao" hidden></div>
<section id="tv" class="tv" hidden aria-label="Tela de senhas"><div class="tv-topo"><b id="tv-nome">Casa Brasa</b><span class="tv-hora" id="tv-hora"></span><button class="sec" id="tv-sair" type="button">Sair da TV</button></div>
<div class="tv-corpo"><div class="tv-col"><h2>Preparando</h2><div class="tv-prep" id="tv-prep"></div></div><div class="tv-col"><h2>Pode retirar</h2><div id="tv-agora" class="tv-agora"></div><div class="tv-prontos" id="tv-prontos"></div></div></div></section>
<div class="modal" id="modal" hidden><div class="caixa" id="caixa"></div></div>
<script id="site-html" type="text/plain">%%SITE%%</script>
<script>
(()=>{const b=atob(document.getElementById("site-html").textContent.trim()),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
document.getElementById("site").src=URL.createObjectURL(new Blob([u],{type:"text/html"}))+"#cardapio"})();
const MARCA={nome:"Casa Brasa",ini:"CB",cor:"#b23a1e"};
// nomes curtos das abas para o menu de baixo no celular
{const CURTO={historico:"Histórico",config:"Ajustes",pedidos:"Pedidos",cozinha:"Cozinha",bar:"Bar",mesas:"Mesas",balcao:"Balcão",reservas:"Reservas",cardapio:"Cardápio",marketing:"Fidelidade",gerencia:"Gerência",integracoes:"Integrar",rede:"Rede"};
document.querySelectorAll("nav button[data-aba]").forEach(b=>{const tx=[...b.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());if(!tx)return;const l=document.createElement("span");l.className="l";l.textContent=tx.nodeValue;tx.replaceWith(l);
const c=document.createElement("span");c.className="c";c.textContent=CURTO[b.dataset.aba]||l.textContent;l.after(c)})}
const $=s=>document.querySelector(s),reais=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const site=()=>document.getElementById("site").contentWindow;
const BAR=["bebidas","vinhos"],PROX={"Recebido":["Pronto","✓ Pronto"]};
const auditoria=[];let servOn=true,servPct=10,offline=false,usuario="Marcos (gerente)";const taxaServ=()=>servOn?servPct/100:0,esperando=new Set(),descMesa={};
const QRS=%%QRS%%;
const FUNC=[{nome:"Marcos",funcao:"gerente",pin:"1234"},{nome:"Dona Lúcia",funcao:"cozinha",pin:"2580"},{nome:"Pedro",funcao:"bar",pin:"1357"},{nome:"Júlia",funcao:"mesas",pin:"2468"},{nome:"Sara",funcao:"reservas",pin:"9090"}];
const ROTULO_F={"":"Gerente",gerente:"Gerente",cozinha:"Cozinha",bar:"Bar",mesas:"Garçom",reservas:"Recepção",pedidos:"Caixa",balcao:"Balcão",rede:"Dono da rede"};
const gerentePin=()=>(FUNC.find(f=>f.funcao==="gerente")||{}).pin||"1234";
function log(acao,det){auditoria.unshift({h:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),quem:usuario,acao,det});try{listaAudit()}catch(e){}}
function notificar(t,c){try{if("Notification" in window&&Notification.permission==="granted")new Notification(t,{body:c,tag:"painel-"+Date.now()})}catch(e){}try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
const qr=()=>Math.random().toString(36).slice(2,6).toUpperCase(),MENU=%%MENU%%;
const mesas={};for(let i=1;i<=12;i++)mesas[i]={n:i,estado:"livre",total:0,itens:[],aceita:false,pronto:0,qr:qr()};
Object.assign(mesas[2],{estado:"ocupada",total:186,aceita:true,itens:[{nome:"Picanha na brasa",qtd:2,preco:89}]});
Object.assign(mesas[7],{estado:"ocupada",total:64,aceita:true,itens:[{nome:"Tagliatelle da Dona Lúcia",qtd:1,preco:64}]});
Object.assign(mesas[9],{estado:"conta",total:212,aceita:true,itens:[{nome:"Costela 12 horas",qtd:2,preco:84,pessoa:"Lucas"},{nome:"Chope pilsen",qtd:3,preco:14,pessoa:"Marina"}]});
const pedidos=[],pagos=[];function liberar(n){const b=document.createElement("button");b.dataset.confirmar=n;b.hidden=true;$("#caixa").append(b);b.click()}
let filtro="Todos";
function reg(p,st){let o=pedidos.find(x=>x.num===p.num);if(!o){o=Object.assign({},p,{hora:new Date()});pedidos.unshift(o)}o.status=st;(o.tempos=o.tempos||{})[st]=o.tempos[st]||new Date();listaPedidos();try{tv()}catch(e){}try{historico()}catch(e){}}
const FILTROS=["Todos","Aguardando aceite","Aguardando pagamento","Recebido","Em preparo","Pronto","Entregue","Conta fechada","Cancelado"];
function listaPedidos(){const vis=pedidos.filter(o=>filtro==="Todos"||o.status===filtro);
$("#filtros").innerHTML=FILTROS.map(f=>`<button class="${f===filtro?"on":""}" data-f="${f}">${f} (${f==="Todos"?pedidos.length:pedidos.filter(o=>o.status===f).length})</button>`).join("");
$("#lista-pedidos").innerHTML=vis.map(o=>`<tr class="clic" data-num="${o.num}" title="Ver detalhes"><td>#${o.num}</td><td>${o.hora.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}${["Aguardando aceite","Recebido","Em preparo"].includes(o.status)?`<small class="${Date.now()-o.hora>15*60000?"alerta-t":""}">há ${Math.max(0,Math.round((Date.now()-o.hora)/60000))} min</small>`:""}</td><td>${o.mesa?"Mesa "+esc(o.mesa):"Balcão"+(o.senha?" · senha "+o.senha:"")}${o.origem==="garcom"?"<small>lançado pelo garçom</small>":o.nome&&o.nome!=="Mesa"?`<small>${esc(o.nome)}</small>`:""}</td>
<td>${o.itens.map(i=>`${i.qtd}× ${esc(i.nome)}${i.obs?`<small>${esc(i.obs)}</small>`:""}`).join("<br>")}</td><td>${reais(o.total)}</td><td><span class="ps p-${o.status.split(" ")[0]}">${o.status}</span></td></tr>`).join("");
$("#sem-pedidos").hidden=pedidos.length>0;const n=pedidos.filter(o=>o.status==="Aguardando aceite").length;const b=$("#b-pedidos");b.hidden=!n;b.textContent=n}
$("#filtros").onclick=e=>{const b=e.target.closest("[data-f]");if(b){filtro=b.dataset.f;listaPedidos()}};
let ped=0,fat=0,sug=0,senhaN=40;const balcao=[],prontosMesa=[];const vendidos={},vistos=new Set(),hist={},tempos=[],cancel=[];
function bip(f=880){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.setValueAtTime(.18,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.45);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.45)}catch(e){}}
function bolinha(id,n){const b=$("#b-"+id);b.hidden=!n;b.textContent=n}
function contar(){bolinha("cozinha",document.querySelectorAll("#cozinha-Recebido .card").length);bolinha("bar",document.querySelectorAll("#bar-Recebido .card").length);
bolinha("mesas",Object.values(mesas).filter(m=>["conta","pronto"].includes(m.estado)).length+document.querySelectorAll(".alerta").length)}
// abas
document.querySelectorAll("nav button[data-aba]").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button[data-aba]").forEach(x=>x.setAttribute("aria-selected",x===b));document.querySelectorAll(".aba").forEach(a=>a.classList.toggle("ativa",a.id==="aba-"+b.dataset.aba))});
// mapa das mesas
const ROT={livre:"Livre",ocupada:"Ocupada",pronto:"Pronto para levar",conta:"Pediu a conta"};
function mapa(){$("#mapa").innerHTML=Object.values(mesas).map(m=>`<div class="m ${m.estado}"><span class="n">Mesa ${m.n}</span><span class="s">${ROT[m.estado]}</span><span class="v">QR ${m.qr}${m.total?` · ${reais(m.total)}`:""}</span>
${m.estado==="pronto"?`<button class="levei" data-entregar="${m.n}">Levei ✓</button>`:m.estado==="conta"||(m.estado==="ocupada"&&m.total)?`<button class="${m.estado==="conta"?"perigo":"sec"}" data-fechar="${m.n}">Fechar conta</button>`:""}<button class="sec lancar" data-lancar="${m.n}">+ Lançar pedido</button></div>`).join("");contar()}
$("#mapa").onclick=e=>{const la=e.target.closest("[data-lancar]");if(la)return lancar(la.dataset.lancar);const en=e.target.closest("[data-entregar]"),fe=e.target.closest("[data-fechar]");
if(en)entregue(en.dataset.entregar)
if(fe){const m=mesas[fe.dataset.fechar],serv=m.total*taxaServ();$("#caixa").innerHTML=`<h3>Fechar mesa ${m.n}</h3>${m.itens.map(i=>`<div class="l"><span>${i.qtd}× ${esc(i.nome)}</span><span>${reais(i.qtd*i.preco)}</span></div>`).join("")}
${comandas(m)}<div class="l"><span>Subtotal</span><span>${reais(m.total)}</span></div><div class="l"><span>Serviço (${servOn?servPct:0}%)</span><span>${reais(serv)}</span></div><div class="l" id="l-desc" hidden><span>Desconto</span><span id="v-desc"></span></div><div class="l t"><span>Total</span><span id="v-tot">${reais(m.total+serv)}</span></div>
<details class="desc"><summary>Desconto ou cortesia (senha do gerente)</summary><div class="desc-g"><select id="d-tipo" aria-label="Tipo"><option value="pct">Desconto em %</option><option value="rs">Desconto em R$</option><option value="cortesia">Cortesia (conta toda)</option></select><input id="d-val" type="number" min="0" placeholder="Valor" aria-label="Valor"><select id="d-mot" aria-label="Motivo"><option>Cliente fiel</option><option>Demora no pedido</option><option>Prato com problema</option><option>Aniversário</option></select><input id="d-pin" type="password" inputmode="numeric" placeholder="Senha do gerente" aria-label="Senha do gerente"><button type="button" class="sec" id="d-ok">Aplicar</button></div><p class="erro" id="d-erro"></p></details>
<p class="nota">Com a integração ligada, a conta vai direto para o caixa (aba Integrações). A mesa é liberada e o código do QR muda (${m.qr} deixa de valer), então ninguém pede de casa com foto do QR.</p><div class="pe" style="margin-top:12px"><button class="sec" data-cancelar>Voltar</button><button data-confirmar="${m.n}">Enviar ao caixa e liberar</button></div>`;$("#modal").hidden=false;desconto(m)}};
$("#caixa").onclick=e=>{if(e.target.closest("[data-cancelar]"))$("#modal").hidden=true;const c=e.target.closest("[data-confirmar]");
if(c){const m=mesas[c.dataset.confirmar];log("Fechou conta",`Mesa ${m.n} · ${reais(m.total*(1+taxaServ())-(descMesa[m.n]||0))}`);enviarCaixa("mesa.fechada",`Conta da mesa ${m.n} · ${reais(m.total*(1+taxaServ())-(descMesa[m.n]||0))}`,{mesa:m.n,itens:m.itens.map(i=>({nome:i.nome,qtd:i.qtd,preco:i.preco,pessoa:i.pessoa||"Mesa"})),subtotal:m.total,servico:+(m.total*taxaServ()).toFixed(2),desconto:+(descMesa[m.n]||0).toFixed(2),total:+(m.total*(1+taxaServ())-(descMesa[m.n]||0)).toFixed(2)});const cb=+(m.total*fidPct()/100).toFixed(2);fidDist+=cb;fidelidade();site().postMessage({tipo:"fechada",mesa:m.n,cashback:cb},"*");pedidos.filter(o=>+o.mesa===+m.n&&!["Cancelado","Recusado"].includes(o.status)).forEach(o=>o.status="Conta fechada");listaPedidos();for(let i=prontosMesa.length-1;i>=0;i--)if(+prontosMesa[i].mesa===+m.n)prontosMesa.splice(i,1);listaProntas();Object.assign(m,{estado:"livre",total:0,itens:[],aceita:false,pronto:0,qr:qr()});document.querySelectorAll(`.alerta[data-mesa="${m.n}"]`).forEach(a=>a.remove());$("#modal").hidden=true;mapa()}};
// cozinha e bar
function cartao(p,setor,itens){const c=document.createElement("article");c.className="card novo"+(p.mesa?" mesa-c":" balc-c");c.dataset.status="Recebido";c.dataset.ini=Date.now();
c.innerHTML=`<div class="topo"><span class="mesa">${p.mesa?"Mesa "+esc(p.mesa):"Balcão · senha "+p.senha}${p.mesa?"":`<small class="pg ${p.pagar==="pix"||p.pago?"ok":""}">${p.pagar==="pix"?"✓ Pago no Pix":p.pago==="caixa"?"✓ Pago no caixa":"A pagar na retirada"}</small>`}${p.nome?`<small class="origem">${esc(p.nome)}${p.origem==="garcom"?" · lançado pelo garçom":""}</small>`:""}</span><span class="hora">#${p.num} · <span class="tempo">0:00</span></span></div>
<ul>${itens.map(i=>`<li>${i.qtd}× ${esc(i.nome)}${i.obs?`<small>${esc(i.obs)}</small>`:""}</li>`).join("")}</ul><div class="pe"><span class="mx"><button data-av>✓ Pronto</button><button class="sec" data-imp title="Imprimir comanda" aria-label="Imprimir comanda">🖨</button><button class="sec" data-cancel title="Cancelar item" aria-label="Cancelar">✕</button></span></div>`;
c.querySelector("[data-cancel]").onclick=()=>cancelar(c,p,itens);c.querySelector("[data-imp]").onclick=()=>comanda(p,itens,setor);if($("#c-auto-imp")?.checked&&$("#c-imp").value){avisar(`🖨 Comanda #${p.num} impressa na ${esc(setor==="bar"&&$("#c-bar-imp").checked?"impressora do bar":$("#c-imp").value)}`);log("Imprimiu comanda",`#${p.num} · ${setor}`)}
c.querySelector("button").onclick=()=>{const s=PROX[c.dataset.status][0];c.dataset.status=s;c.classList.remove("novo");
if(s==="Pronto"){c.querySelector("[data-av]").remove();tempos.push((Date.now()-c.dataset.ini)/1000);gerencia();const m=mesas[p.mesa];if(m){m.estado="pronto";m.pronto++;prontosMesa.push({mesa:m.n,num:p.num,itens,setor,hora:Date.now(),p});listaProntas();notificar(MARCA.nome,`Mesa ${m.n}: pronto para levar (veja no Balcão)`);bip(990);}if(!p.mesa&&--p.pend<=0)pronta(p);mapa()}else c.querySelector("button").textContent=PROX[s][1];
if(p.mesa||s!=="Pronto")reg(p,s);site().postMessage({tipo:"status",num:p.num,status:p.mesa?(s==="Pronto"?"Pronto, saindo para a mesa":"Em preparo"):(p.pronta?`Pronto! Senha ${p.senha}: retire no balcão`:`Senha ${p.senha} · em preparo`)},"*");if(s==="Pronto"){c.classList.add("saindo");setTimeout(()=>{const col=c.parentElement;c.remove();if(col&&!col.querySelector(".card"))col.innerHTML=`<p class="vazio">Nada para fazer agora. 👌</p>`},350)}else document.getElementById(`${setor}-${s}`).prepend(c);contar()};
$(`#${setor}-Recebido .vazio`)?.remove();$(`#${setor}-Recebido`).prepend(c)}
setInterval(()=>document.querySelectorAll(".card[data-ini]").forEach(c=>{if(c.dataset.status==="Pronto")return;const s=Math.floor((Date.now()-c.dataset.ini)/1000);
c.querySelector(".tempo").textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;c.classList.toggle("atraso",s>90)}),1000);
function entrar(p){reg(p,"Recebido");try{baixarEstoque(p)}catch(e){}if(!p.mesa&&!p.senha){p.senha=String(++senhaN).padStart(3,"0");balcao.push(p);const po=pedidos.find(x=>x.num===p.num);if(po)po.senha=p.senha;site().postMessage({tipo:"status",num:p.num,status:`Sua senha: ${p.senha}. Aguarde ser chamado na TV.`},"*")}enviarCaixa("pedido.criado",`Pedido #${p.num} · ${p.mesa?"mesa "+p.mesa:"retirada"} · ${reais(p.total)}`,{numero:p.num,mesa:p.mesa,pessoa:p.nome||"",itens:p.itens.map(i=>({nome:i.nome,qtd:i.qtd,preco:i.preco,obs:i.obs||""})),total:p.total});const coz=p.itens.filter(i=>!BAR.includes(i.cat)),bar=p.itens.filter(i=>BAR.includes(i.cat));
if(coz.length)cartao(p,"cozinha",coz);if(bar.length)cartao(p,"bar",bar);p.pend=(coz.length?1:0)+(bar.length?1:0);reg(p,"Em preparo");site().postMessage({tipo:"status",num:p.num,status:p.mesa?"Em preparo":`Senha ${p.senha} · em preparo. Aguarde ser chamado na TV.`},"*");tv();
const m=mesas[p.mesa];if(m){m.estado="ocupada";m.total+=p.total;m.ultimo=p.num;p.itens.forEach(i=>{i.pessoa=i.pessoa||p.nome||"Mesa";m.itens.push(i)})}
ped++;fat+=p.total;p.itens.forEach(i=>{vendidos[i.nome]=(vendidos[i.nome]||0)+i.qtd;if(i.sug)sug+=i.qtd*i.preco});gerencia();mapa();bip()}
// alertas: aceite do primeiro pedido, garçom, conta
function alerta(html,mesa,acoes){notificar(MARCA.nome,html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());const a=document.createElement("div");a.className="alerta";a.dataset.mesa=mesa;a.innerHTML=html+`<span class="mx">${acoes}</span>`;$("#alertas").prepend(a);bip(660);contar();return a}
window.addEventListener("message",ev=>{const p=ev.data;if(!p||!p.tipo)return;if(offline&&["pedido","garcom","conta","ver-conta"].includes(p.tipo)){esperando.add(p.num||p.tipo+p.mesa);faixaRede();return}
if(p.tipo==="pedido"){site().postMessage({tipo:"recebido",num:p.num},"*");if(vistos.has(p.num))return;vistos.add(p.num);const m=mesas[p.mesa];reg(p,"Aguardando aceite");
if(!p.mesa&&p.pagar==="caixa"){p.senha=String(++senhaN).padStart(3,"0");reg(p,"Aguardando pagamento");const po=pedidos.find(x=>x.num===p.num);if(po)po.senha=p.senha;
site().postMessage({tipo:"status",num:p.num,status:`Sua senha: ${p.senha}. Pague ${reais(p.total)} no caixa para o pedido ir para a cozinha.`},"*");
const a=alerta(`<b>Balcão · senha ${p.senha}</b><span>${esc(p.nome||"Cliente")} · ${reais(p.total)} · aguardando pagamento no caixa</span>`,"",`<button data-ok>Recebido no caixa</button><button class="sec" data-nao>Cancelar</button>`);
a.querySelector("[data-ok]").onclick=()=>{a.remove();p.pago="caixa";balcao.push(p);entrar(p);log("Recebeu no caixa",`Senha ${p.senha} · ${reais(p.total)}`);site().postMessage({tipo:"status",num:p.num,status:`Pagamento confirmado! Senha ${p.senha}: aguarde ser chamado na TV.`},"*");contar()};
a.querySelector("[data-nao]").onclick=()=>{a.remove();reg(p,"Cancelado");site().postMessage({tipo:"status",num:p.num,status:"Pedido cancelado pelo caixa."},"*");contar()};return}
const h=hist[p.mesa]=(hist[p.mesa]||[]).filter(x=>Date.now()-x<60000);
if(h.length>=3){const a=alerta(`<b>Mesa ${esc(p.mesa)}: muitos pedidos em 1 minuto</b><span>Pedido #${p.num} segurado. Confira com a mesa.</span>`,p.mesa,`<button data-ok>Liberar</button><button class="sec" data-nao>Descartar</button>`);
site().postMessage({tipo:"status",num:p.num,status:"Aguardando o garçom confirmar"},"*");a.querySelector("[data-ok]").onclick=()=>{a.remove();entrar(p)};a.querySelector("[data-nao]").onclick=()=>{a.remove();reg(p,"Cancelado");contar()};return}
h.push(Date.now());
if(m&&!m.aceita&&$("#c-aceite").checked){const a=alerta(`<b>Mesa ${esc(p.mesa)}: primeiro pedido</b><span>${p.itens.length} item(ns) · ${reais(p.total)} · confirme que tem gente na mesa</span>`,p.mesa,`<button data-ok>Aceitar</button><button class="sec" data-nao>Recusar</button>`);
a.querySelector("[data-ok]").onclick=()=>{m.aceita=true;a.remove();entrar(p)};a.querySelector("[data-nao]").onclick=()=>{a.remove();reg(p,"Recusado");site().postMessage({tipo:"status",num:p.num,status:"Recusado: chame o garçom"},"*");contar()}}
else entrar(p)}
if(p.tipo==="ver-conta"){const m=mesas[p.mesa];if(m){m.estado="conta";mapa();site().postMessage({tipo:"extrato",mesa:p.mesa,itens:m.itens,total:m.total,servico:servOn?servPct:0,pix:PIX},"*")}return}
if(p.tipo==="conta"&&p.pagamento){if(p.pago){log("Pix pelo celular",`Mesa ${p.mesa} · ${reais(p.total)}`);pagos.push(p);avisar(`✅ Mesa ${esc(p.mesa)} pagou ${reais(p.total)} no Pix: mesa liberada sozinha.`);setTimeout(()=>liberar(p.mesa),1200);return}const m=mesas[p.mesa];if(m){m.estado="conta";mapa()}
const a=alerta(`<b>Mesa ${esc(p.mesa)} fechou a conta</b><span>${reais(p.total)} no ${esc(p.pagamento)}${p.partes?` · cada um paga o seu: ${p.partes.map(x=>esc(x.nome)+" "+reais(x.total)).join(", ")}`:p.pessoas>1?` · dividir em ${p.pessoas} (${reais(p.total/p.pessoas)} cada)`:""}${p.servico?"":" · sem os 10%"} ${p.pago?" · pago no Pix pelo celular: confira no app do banco":" · levar a maquininha"}</span>`,p.mesa,`<button data-pago>${p.pago?"Pix confirmado: liberar mesa":"Pago na maquininha"}</button>`);
a.querySelector("[data-pago]").onclick=()=>{a.remove();pagos.push(p);liberar(p.mesa)};return}
if(p.tipo==="garcom"||p.tipo==="conta"){const m=mesas[p.mesa];if(p.tipo==="conta"&&m){m.estado="conta";mapa()}
const a=alerta(`<b>Mesa ${esc(p.mesa)}</b><span>${p.tipo==="conta"?"pediu a conta":"chamou o garçom"}</span>`,p.mesa,`<button data-vou>Estou indo</button>`);a.querySelector("[data-vou]").onclick=()=>{a.remove();contar()}}});
// reservas (exemplo)
const reservas=[["19:30","Família Souza",4,"5511900000001","pendente","Aniversário"],["20:00","Carlos Mendes",2,"5511900000002","confirmada",""],["20:30","Ana Lima",6,"5511900000003","pendente","Cadeirão para criança"],["21:00","Pedro Alves",2,"5511900000004","pendente","Jantar a dois"]];
function listaReservas(){$("#reservas").innerHTML=reservas.map((r,i)=>`<div class="linha"><span class="q">${r[0]}</span><span class="d"><b>${esc(r[1])}</b> · ${r[2]} pessoas<small>${esc(r[5]||"Sem observações")}</small></span><span class="st ${r[4]}">${r[4]}</span>
${r[4]==="pendente"?`<a href="https://wa.me/${r[3]}?text=${encodeURIComponent(`Olá, ${r[1]}! Aqui é da ${MARCA.nome}. Confirmamos sua reserva hoje às ${r[0]} para ${r[2]} pessoas. Até logo!`)}" target="_blank" rel="noopener"><button data-conf="${i}">Confirmar no WhatsApp</button></a>`:""}</div>`).join("")}
$("#reservas").onclick=e=>{const b=e.target.closest("[data-conf]");if(b)setTimeout(()=>{reservas[b.dataset.conf][4]="confirmada";listaReservas()},300)};
// gerência e CRM
const crm=[["Marina Costa","5511900000011","34 dias","Picanha na brasa"],["Rafael Nunes","5511900000012","41 dias","Tagliatelle da Dona Lúcia"],["Juliana Prado","5511900000013","52 dias","Cheesecake de mirtilo"]];
function listaCrm(){$("#crm").innerHTML=crm.map((c,i)=>`<div class="linha"><span class="d"><b>${esc(c[0])}</b><small>Última visita há ${c[2]} · gosta de ${esc(c[3])}</small></span><a href="https://wa.me/${c[1]}?text=${encodeURIComponent(`Olá, ${c[0]}! Sentimos sua falta na ${MARCA.nome}. Esta semana a sobremesa é por nossa conta. Reserve pelo site!`)}" target="_blank" rel="noopener"><button class="sec">Mandar convite</button></a><button class="sec apagar" data-apagar="${i}" title="Apagar dados do cliente (LGPD)">Apagar</button></div>`).join("")||'<p class="nota">Nenhum cliente nesta lista.</p>'}listaCrm();
function gerencia(){const ocup=Object.values(mesas).filter(m=>m.total).length||1;$("#g-ped").textContent=ped;$("#g-fat").textContent=reais(fat);$("#g-tkt").textContent=reais(fat/Math.max(1,new Set(Object.values(mesas).filter(m=>m.ultimo).map(m=>m.n)).size));$("#g-sug").textContent=reais(sug);try{rede()}catch(e){}if(typeof cardapio==="function"&&$('.esg[data-setor="todos"]').innerHTML)cardapio();if(tempos.length){const md=tempos.reduce((a,b)=>a+b,0)/tempos.length;$("#g-tmp").textContent=`${Math.floor(md/60)}:${String(Math.round(md%60)).padStart(2,"0")} min`}
if(cancel.length)$("#g-canc").innerHTML=cancel.map(x=>`<p class="nota" style="margin:4px 0">${x}</p>`).join("");
const top=Object.entries(vendidos).sort((a,b)=>b[1]-a[1]).slice(0,5),max=top[0]?top[0][1]:1;
$("#g-top").innerHTML=top.length?top.map(([n,q])=>`<div class="barra"><span style="flex:0 0 46%">${esc(n)}</span><i style="width:${q/max*45}%"></i><b>${q}</b></div>`).join(""):'<p class="nota">Faça um pedido no celular.</p>'}
$("#modo-tela").onclick=e=>{const c=document.body.classList.toggle("modo-cel");e.target.textContent=c?"💻 Ver no PC":"📱 Ver no celular"};
// login por função: cada um vê só a sua tela
let funcaoAtual="",tipoAtual="restaurante";const OCULTAS={restaurante:[],pizzaria:[],hamburgueria:["reservas","bar"],cafeteria:["reservas","bar","mesas"],bar:["balcao"]};
function aplicarVisao(ir){document.querySelector("nav").classList.toggle("so-uma",!!funcaoAtual);document.querySelectorAll("nav button[data-aba]").forEach(b=>b.hidden=(!!funcaoAtual&&b.dataset.aba!==funcaoAtual)||OCULTAS[tipoAtual].includes(b.dataset.aba));
const alvo=ir&&document.querySelector(`nav [data-aba="${ir}"]`),at=document.querySelector('nav [aria-selected="true"]');if(alvo&&!alvo.hidden)alvo.click();else if(!at||at.hidden)[...document.querySelectorAll("nav button[data-aba]")].find(b=>!b.hidden)?.click()}
$("#funcao").onchange=e=>{funcaoAtual=e.target.value;usuario=ROTULO_F[funcaoAtual];aplicarVisao(funcaoAtual||"cozinha")};
// esgotado hoje
const esgot=new Set();function cardapio(){$('.esg[data-setor="todos"]').innerHTML=MENU.map(i=>`<tr><td>${esc(i.nome)}</td><td>${esc(i.cat)}</td><td>${BAR.includes(i.cat)?"Bar":"Cozinha"}</td><td>${reais(i.preco)}</td><td>${vendidos[i.nome]||0}</td><td><button class="${esgot.has(i.id)?"on":""}" data-id="${i.id}">${esgot.has(i.id)?"Esgotado":"Disponível"}</button> <button class="sec" data-editar="${i.id}">Editar</button></td></tr>`).join("")}
document.querySelectorAll(".esg").forEach(el=>{const bar=el.dataset.setor==="bar";if(el.dataset.setor!=="todos")el.innerHTML=MENU.filter(i=>BAR.includes(i.cat)===bar).map(i=>`<button data-id="${i.id}">${esc(i.nome)}</button>`).join("");
el.onclick=e=>{const b=e.target.closest("[data-id]");if(!b)return;const id=b.dataset.id,on=!esgot.has(id);on?esgot.add(id):esgot.delete(id);log(on?"Marcou esgotado":"Voltou ao cardápio",(MENU.find(i=>i.id===id)||{}).nome||id);
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
log("Cancelamento",`${p.mesa?"Mesa "+p.mesa:"Balcão"} #${p.num} · ${itens.map(i=>i.nome).join(", ")} · ${$("#motivo").value}`);c.remove();reg(p,"Cancelado");site().postMessage({tipo:"status",num:p.num,status:"Item cancelado pela casa: "+$("#motivo").value},"*");$("#modal").hidden=true;gerencia();mapa()}}
// aniversários (exemplo)
$("#aniv").innerHTML=[["Bruno Teixeira","5511900000021","sexta-feira"],["Camila Rocha","5511900000022","domingo"]].map(c=>`<div class="linha"><span class="d"><b>${esc(c[0])}</b><small>Aniversário ${c[2]}</small></span><a href="https://wa.me/${c[1]}?text=${encodeURIComponent(`Feliz aniversário, ${c[0]}! Venha comemorar na ${MARCA.nome}: a sobremesa é por nossa conta. Reserve pelo site!`)}" target="_blank" rel="noopener"><button class="sec">Mandar parabéns</button></a></div>`).join("");
// comanda individual no fechamento
function comandas(m){const g={};m.itens.forEach(i=>{const k=i.pessoa||"Mesa";g[k]=(g[k]||0)+i.qtd*i.preco});const k=Object.keys(g);
return k.length>1?`<p class="nota" style="margin:8px 0">Comanda individual (com ${servOn?servPct:0}%): ${k.map(n=>`<b>${esc(n)}</b> ${reais(g[n]*(1+taxaServ()))}`).join(" · ")}</p>`:""}
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
<header><div><h1 data-ini="${MARCA.ini}">Relatório de ${mes}</h1><p class="sub">${MARCA.nome} · gerado em ${hoje.toLocaleDateString("pt-BR")}</p></div><p class="sub">Stack Solution</p></header>
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
function pronta(p){p.pronta=Date.now();reg(p,"Pronto");tv();bip(990);setTimeout(()=>{if(!p.retirada)retirar(p)},5*60000)}
function tv(){const prep=balcao.filter(o=>!o.pronta&&!o.retirada),pr=balcao.filter(o=>o.pronta&&!o.retirada).sort((a,b)=>b.pronta-a.pronta),ult=pr[0];
$("#tv-prep").innerHTML=prep.map(o=>`<span>${o.senha}</span>`).join("")||"<em>Nenhum pedido no momento</em>";
const ag=$("#tv-agora");const novo=ult&&ag.dataset.num!==String(ult.num)+ult.pronta;ag.dataset.num=ult?String(ult.num)+ult.pronta:"";
ag.className="tv-agora"+(ult?"":" vazio");ag.innerHTML=ult?`<small>Senha chamada</small><b>${ult.senha}</b><span>${esc(ult.nome&&ult.nome!=="Mesa"?ult.nome:"")}</span>`:`<small>Pode retirar</small><span>As senhas prontas aparecem aqui em destaque.</span>`;
if(novo){void ag.offsetWidth;ag.classList.add("chama")}
$("#tv-prontos").innerHTML=pr.slice(1).map(o=>`<span>${o.senha}</span>`).join("");
const linha=(o,b)=>`<div class="linha"><span class="q">${o.senha}</span><span class="d"><b>${esc(o.nome||"Cliente")}</b><small>${o.itens.map(i=>i.qtd+"× "+esc(i.nome)).join(", ")}</small></span>${b}</div>`;
$("#b-prep").innerHTML=prep.map(o=>linha(o,`<span class="st pendente">${(pedidos.find(x=>x.num===o.num)||{}).status||"Recebido"}</span>`)).join("")||'<p class="nota">Nenhum pedido do balcão.</p>';
$("#b-prontos").innerHTML=pr.map(o=>linha(o,`<span class="mx"><button class="sec" data-de-novo="${o.num}">Chamar de novo</button><button data-retirado="${o.num}">${o.pagar==="pix"||o.pago?"Retirado":"Cobrou "+reais(o.total)+" e entregou"}</button></span>`)).join("")||'<p class="nota">—</p>';
const n=pr.length+new Set(prontosMesa.map(x=>x.mesa)).size,bb=$("#b-balcao");bb.hidden=!n;bb.textContent=n}
$("#b-prontos").onclick=e=>{const r=e.target.closest("[data-retirado]"),d=e.target.closest("[data-de-novo]");
if(r)retirar(balcao.find(x=>String(x.num)===r.dataset.retirado))
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
${f.avisado?`<span class="mx"><button data-sentou="${fila.indexOf(f)}">Sentou</button><button class="sec" data-desistiu="${fila.indexOf(f)}">Desistiu</button></span>`:`<a href="https://wa.me/${f.tel}?text=${encodeURIComponent(`Olá, ${f.nome}! Sua mesa na ${MARCA.nome} está pronta. Te esperamos em até 10 minutos.`)}" target="_blank" rel="noopener"><button data-avisar="${fila.indexOf(f)}">Mesa pronta: avisar</button></a>`}</div>`}).join("")||'<p class="nota">Ninguém na fila.</p>'}
$("#fila").onclick=e=>{const a=e.target.closest("[data-avisar]"),s=e.target.closest("[data-sentou]"),d=e.target.closest("[data-desistiu]");
if(a)setTimeout(()=>{fila[a.dataset.avisar].avisado=true;listaFila()},200);if(s){fila[s.dataset.sentou].fim=1;listaFila()}if(d){fila[d.dataset.desistiu].fim=1;listaFila()}};
$("#f-entrar").onclick=()=>{const nome=$("#f-nome").value.trim();if(!nome)return $("#f-nome").focus();const f={nome,pes:+$("#f-pes").value,tel:$("#f-tel").value.replace(/\D/g,"")||"5511900000000",desde:Date.now()};fila.push(f);listaFila();
const pos=fila.filter(x=>!x.fim).indexOf(f)+1;const cel=$("#cel-fila");cel.hidden=false;cel.innerHTML=`<small>${MARCA.nome} · fila de espera</small><b>Olá, ${esc(nome)}!</b>Você é o<div class="grande">${pos}º</div>da fila. Espera estimada: ~${pos*8} min.<br><br>Pode esperar onde quiser: avisamos no WhatsApp quando a mesa estiver pronta.`;$("#f-nome").value="";$("#f-tel").value=""};
setInterval(listaFila,30000);
// resumo do dia no WhatsApp do dono
$("#btn-zap").onclick=()=>{const top=Object.entries(vendidos).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1])[0],tm=tempos.length?tempos.reduce((a,b)=>a+b,0)/tempos.length/60:0,hoje=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const linhas=[`*${MARCA.nome} · resumo de hoje (${hoje})*`,"",`💰 Faturamento: ${reais(fat)}`,`🧾 Pedidos: ${ped} · ticket médio ${reais(fat/Math.max(1,new Set(pedidos.filter(o=>o.mesa).map(o=>o.mesa)).size))}`,`🏆 Campeão do dia: ${top?top[0]+" ("+top[1]+")":"—"}`,`⏱️ Preparo médio: ${tm?tm.toFixed(1).replace(".",",")+" min":"—"}`,`✨ Vendas extras (sugestão): ${reais(sug)}`,`🎁 Cashback dado: ${reais(fidDist)}`,`❌ Cancelamentos: ${cancel.length}`,`📅 Reservas amanhã: 4 (1 aniversário)`,"","Bom descanso! Relatório completo no painel."];
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
function avisar(t){document.querySelector(".aviso-flutua")?.remove();document.body.insertAdjacentHTML("beforeend",`<div class="aviso-flutua" role="status">${t}</div>`);clearTimeout(avisar.t);avisar.t=setTimeout(()=>document.querySelector(".aviso-flutua")?.remove(),4200)}
// menu ⚙ Demo
$("#btn-demo").onclick=e=>{e.stopPropagation();const p=$("#demo-pop");p.hidden=!p.hidden;$("#btn-demo").setAttribute("aria-expanded",!p.hidden)};
document.addEventListener("click",e=>{if(e.isTrusted&&!e.target.closest(".demo-menu"))$("#demo-pop").hidden=true});
// tipo de negócio: liga só os recursos daquele tipo
const TIPOS={restaurante:"Restaurante: mesas, reservas, cozinha e bar.",pizzaria:"Pizzaria: mesa e retirada; pizza com tamanho, borda e adicionais.",hamburgueria:"Hamburgueria: pedido no balcão com senha na TV. Reservas e bar desligados.",cafeteria:"Cafeteria: pedido rápido no balcão com senha. Sem mesas e reservas.",bar:"Bar: comandas por mesa e por pessoa, cozinha e bar. Sem senha de balcão."};
$("#tipo-neg").onchange=e=>{tipoAtual=e.target.value;aplicarVisao(["hamburgueria","cafeteria"].includes(tipoAtual)?"balcao":null);avisar(TIPOS[tipoAtual])};
// marca do cliente
const CORES=["#b23a1e","#c2410c","#1f6f5c","#2457a6","#6b2fa0","#1f2937"];
$("#btn-marca").onclick=()=>{$("#demo-pop").hidden=true;
$("#caixa").innerHTML=`<h3>Marca do cliente</h3><label>Nome do restaurante<input id="m-nome" value="${esc(MARCA.nome)}"></label><label>Iniciais do logo<input id="m-ini" maxlength="3" value="${esc(MARCA.ini)}"></label>
<label>Cor principal</label><div class="cores">${CORES.map(c=>`<button type="button" data-cor="${c}" class="${c===MARCA.cor?"on":""}" style="background:${c}" aria-label="Cor ${c}"></button>`).join("")}<input type="color" id="m-cor" value="${MARCA.cor}" aria-label="Outra cor"></div>
<p class="nota">Muda o painel, a TV e o cardápio do cliente na hora.</p><div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="m-ok">Aplicar</button></div>`;$("#modal").hidden=false;
$(".cores").onclick=e=>{const b=e.target.closest("[data-cor]");if(!b)return;$("#m-cor").value=b.dataset.cor;document.querySelectorAll(".cores [data-cor]").forEach(x=>x.classList.toggle("on",x===b))};
$("#m-ok").onclick=()=>{const nome=$("#m-nome").value.trim()||MARCA.nome,ini=($("#m-ini").value.trim()||nome.split(/\s+/).map(w=>w[0]).join("").slice(0,2)).toUpperCase(),cor=$("#m-cor").value;
const r=document.documentElement.style;r.setProperty("--brasa",cor);r.setProperty("--brasa-cl",`color-mix(in srgb, ${cor} 12%, white)`);
$("#marca-nome").textContent=nome;$("#tv-nome").textContent=nome;document.querySelector("header h1").dataset.ini=ini;document.title=document.title.split(MARCA.nome).join(nome);
site().postMessage({tipo:"marca",nome,ini,cor},"*");Object.assign(MARCA,{nome,ini,cor});$("#modal").hidden=true;avisar(`Pronto: o sistema agora está com a marca <b>${esc(nome)}</b>.`)}};
// ===== impressão da comanda (impressora térmica de 80 mm)
function ticket(p,itens,setor){const h=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
return `<div class="ticket"><div class="tk-c"><b>${esc(MARCA.nome)}</b><br>${setor==="bar"?"BAR":"COZINHA"} · ${p.mesa?"MESA "+esc(p.mesa):"BALCÃO · SENHA "+(p.senha||"")}<br>Pedido #${p.num} · ${h}</div><hr>
${itens.map(i=>`<div><b>${i.qtd}x</b> ${esc(i.nome)}${i.obs?`<div class="tk-o">» ${esc(i.obs)}</div>`:""}</div>`).join("")}<hr>${p.nome&&p.nome!=="Mesa"?"Cliente: "+esc(p.nome)+"<br>":""}${p.origem==="garcom"?"Lançado pelo garçom<br>":""}</div>`}
function imprimir(html,cls){const el=$("#impressao");el.className=cls||"";el.innerHTML=html;el.hidden=false;setTimeout(()=>{window.print();el.hidden=true},50)}
function comanda(p,itens,setor){$("#caixa").innerHTML=`<h3>Comanda para imprimir</h3>${ticket(p,itens,setor)}<p class="nota">Sai na ${esc($("#c-imp").value||"impressora padrão")}. Escolha a impressora térmica na janela de impressão.</p><div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="tk-ok">🖨 Imprimir</button></div>`;
$("#modal").hidden=false;$("#tk-ok").onclick=()=>{log("Imprimiu comanda",`#${p.num} · ${setor}`);$("#modal").hidden=true;imprimir(ticket(p,itens,setor),"ticket-p")}}
$("#c-teste-imp").onclick=()=>comanda({num:"TESTE",mesa:"1",nome:"Teste"},[{qtd:1,nome:"Impressão de teste",obs:"Se você está lendo isto, a impressora funciona"}],"cozinha");
// ===== queda de internet
function faixaRede(msg){const f=$("#aviso-rede"),t=$("#tag-rede");t.textContent=offline?"Sem internet":"Ao vivo";t.classList.toggle("off",offline);
if(offline){f.className="aviso-rede";f.hidden=false;f.textContent=`📶 Sem internet. Nada se perde: os pedidos ficam guardados no celular do cliente e entram sozinhos quando a conexão voltar.${esperando.size?` (${esperando.size} aguardando)`:""}`}
else if(msg){f.className="aviso-rede ok";f.hidden=false;f.textContent=msg;clearTimeout(faixaRede.t);faixaRede.t=setTimeout(()=>{if(!offline)f.hidden=true},6000)}else f.hidden=true}
$("#btn-off").onclick=()=>{offline=!offline;$("#btn-off").textContent=offline?"📶 Voltar a internet":"📶 Simular queda de internet";
if(offline){esperando.clear();faixaRede();log("Internet caiu","modo offline")}else{const n=esperando.size;faixaRede(n?`✅ Conexão voltou: ${n} envio(s) guardado(s) estão entrando agora.`:"✅ Conexão voltou.");log("Internet voltou",`${n} envio(s) sincronizado(s)`)}};
// ===== aviso no celular do garçom
$("#btn-notif").onclick=()=>{if(!("Notification" in window)){avisar("Este navegador não mostra notificações. No app do garçom elas chegam com vibração.");return}
Notification.requestPermission().then(r=>{if(r==="granted"){notificar(MARCA.nome,"Avisos ligados: você recebe chamados, contas e pratos prontos.");avisar("🔔 Avisos ligados: o celular vibra e mostra a notificação mesmo com a tela bloqueada.")}else avisar("O navegador bloqueou as notificações. Libere nas configurações do site.")})};
// ===== histórico (dias anteriores de exemplo + pedidos de hoje)
let HIST=null,histAtual=[];
function gerarHist(){let sd=11;const r=()=>(sd=(sd*9301+49297)%233280)/233280,out=[],nomes=["Ana","Bruno","Carla","Diego","Lia","Rafa","Theo","Bia","Júlia","Caio","Marina","Lucas"];
for(let d=1;d<=7;d++){const dia=new Date();dia.setDate(dia.getDate()-d);const n=14+Math.floor(r()*12);for(let k=0;k<n;k++){const h=new Date(dia);h.setHours(11+Math.floor(r()*12),Math.floor(r()*60),0,0);
const its=[...Array(1+Math.floor(r()*3))].map(()=>{const i=MENU[Math.floor(r()*MENU.length)];return {nome:i.nome,qtd:1,preco:i.preco}}),balc=r()<.25;
out.push({num:20000+d*100+k,hora:h,mesa:balc?"":String(1+Math.floor(r()*12)),nome:nomes[Math.floor(r()*nomes.length)],itens:its,total:its.reduce((t,i)=>t+i.preco,0),status:r()<.04?"Cancelado":"Conta fechada"})}}return out}
const semAc=t=>String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function historico(){HIST=HIST||gerarHist();const per=$("#h-per").value,q=semAc($("#h-q").value.trim()),hoje=new Date();hoje.setHours(0,0,0,0);
let l=[...pedidos,...HIST].filter(o=>{const d=new Date(o.hora);d.setHours(0,0,0,0);const dd=Math.round((hoje-d)/864e5);return per==="hoje"?dd===0:per==="ontem"?dd===1:dd<=7}).sort((a,b)=>new Date(b.hora)-new Date(a.hora));
if(q)l=l.filter(o=>semAc([o.mesa?"mesa "+o.mesa:"balcao",o.nome||"",o.itens.map(i=>i.nome).join(" "),"#"+o.num].join(" ")).includes(q));histAtual=l;
$("#h-res").textContent=`${l.length} pedido(s) · ${reais(l.filter(o=>o.status!=="Cancelado").reduce((t,o)=>t+o.total,0))}`;
$("#h-lista").innerHTML=l.slice(0,150).map(o=>{const h=new Date(o.hora);return `<tr><td>${h.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} ${h.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</td><td>#${o.num}</td><td>${o.mesa?"Mesa "+esc(o.mesa):"Balcão"}</td><td>${esc(o.nome&&o.nome!=="Mesa"?o.nome:"")}</td><td>${o.itens.map(i=>`${i.qtd}× ${esc(i.nome)}`).join("<br>")}</td><td>${reais(o.total)}</td><td><span class="ps p-${String(o.status||"").split(" ")[0]}">${esc(o.status||"")}</span></td></tr>`}).join("")||'<tr><td colspan="7">Nada encontrado.</td></tr>'}
$("#h-per").onchange=historico;$("#h-q").oninput=historico;
$("#h-exp").onclick=()=>{const l=[["Data","Hora","Pedido","Mesa","Cliente","Itens","Total","Status"],...histAtual.map(o=>{const h=new Date(o.hora);return [h.toLocaleDateString("pt-BR"),h.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),o.num,o.mesa?"Mesa "+o.mesa:"Balcão",o.nome||"",o.itens.map(i=>i.qtd+"x "+i.nome).join(", "),o.total.toFixed(2).replace(".",","),o.status||""]})];
const csv="﻿"+l.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\r\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
a.download=`historico-${semAc(MARCA.nome).replace(/[^a-z0-9]+/g,"-")}.csv`;document.body.append(a);a.click();a.remove();log("Exportou histórico",`${histAtual.length} pedidos`)};
// ===== registro de atividades
function listaAudit(){$("#audit").innerHTML=auditoria.slice(0,60).map(a=>`<tr><td>${a.h}</td><td>${esc(a.quem)}</td><td><b>${esc(a.acao)}</b></td><td>${esc(a.det||"")}</td></tr>`).join("")||'<tr><td colspan="4">Nada registrado ainda.</td></tr>'}
// ===== desconto e cortesia com senha do gerente
function desconto(m){descMesa[m.n]=0;$("#d-ok").onclick=()=>{if($("#d-pin").value!==gerentePin()){$("#d-erro").textContent="Senha do gerente errada.";return}
const sub=m.total,serv=sub*taxaServ(),t=$("#d-tipo").value,v=+$("#d-val").value||0,d=Math.min(sub+serv,t==="cortesia"?sub+serv:t==="pct"?(sub+serv)*v/100:v);descMesa[m.n]=d;
$("#l-desc").hidden=false;$("#v-desc").textContent="− "+reais(d);$("#v-tot").textContent=reais(sub+serv-d);$("#d-erro").textContent="";$("#d-pin").value="";
log(t==="cortesia"?"Cortesia":"Desconto",`Mesa ${m.n}: ${reais(d)} · ${$("#d-mot").value}`)}}
// ===== LGPD: apagar os dados de um cliente
$("#crm").addEventListener("click",e=>{const b=e.target.closest("[data-apagar]");if(!b)return;const c=crm[b.dataset.apagar];
$("#caixa").innerHTML=`<h3>Apagar dados de ${esc(c[0])}?</h3><p>Some do CRM: telefone, visitas, preferências e aniversário. Os pedidos ficam no histórico sem o nome. Não dá para desfazer.</p><label>Senha do gerente<input id="lg-pin" type="password" inputmode="numeric"></label><p class="erro" id="lg-erro"></p><div class="pe"><button class="sec" data-cancelar>Voltar</button><button class="perigo" id="lg-ok">Apagar dados</button></div>`;$("#modal").hidden=false;
$("#lg-ok").onclick=()=>{if($("#lg-pin").value!==gerentePin()){$("#lg-erro").textContent="Senha do gerente errada.";return}crm.splice(+b.dataset.apagar,1);listaCrm();$("#modal").hidden=true;log("LGPD: dados apagados",`${c[0]} pediu para apagar`);avisar(`Dados de ${esc(c[0])} apagados (LGPD).`)}});
// ===== cardápio: editar e criar prato (muda no celular do cliente na hora)
function editarPrato(id){const it=id?MENU.find(i=>i.id===id):null;
$("#caixa").innerHTML=`<h3>${it?"Editar prato":"Novo prato"}</h3><label>Nome<input id="ep-nome" value="${esc(it?it.nome:"")}"></label><label>Categoria<select id="ep-cat">${CATS.map(c=>`<option ${it&&it.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label>
<label>Preço (R$)<input id="ep-preco" type="number" step="0.5" min="0" value="${it?it.preco:""}"></label><label>Descrição<input id="ep-desc" placeholder="${it?"Deixe em branco para manter a atual":"Ex.: com molho da casa"}"></label><label>Foto<input id="ep-foto" type="file" accept="image/*"></label>
<p class="erro" id="ep-erro"></p><div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="ep-ok">Salvar e publicar</button></div>`;$("#modal").hidden=false;
$("#ep-ok").onclick=()=>{const nome=$("#ep-nome").value.trim(),preco=+$("#ep-preco").value,cat=$("#ep-cat").value,desc=$("#ep-desc").value.trim();if(!nome||!(preco>0)){$("#ep-erro").textContent="Preencha nome e preço.";return}
const salvar=foto=>{const id2=it?it.id:"novo-"+semAc(nome).replace(/[^a-z0-9]+/g,"-")+"-"+Date.now()%1000,dados={id:id2,nome,preco,categoria:cat};if(desc)dados.descricao=desc;if(foto)dados.fotoRedonda=foto;
if(it){if(it.preco!==preco)log("Mudou preço",`${it.nome}: ${reais(it.preco)} → ${reais(preco)}`);if(it.nome!==nome)log("Mudou nome",`${it.nome} → ${nome}`);Object.assign(it,{nome,preco,cat})}else{MENU.push({id:id2,nome,cat,preco,opc:0});log("Criou prato",`${nome} · ${reais(preco)}`)}
site().postMessage({tipo:"menu",item:dados},"*");cardapio();$("#modal").hidden=true;avisar(`✅ ${esc(nome)} publicado: já aparece no cardápio do cliente.`)};
const f=$("#ep-foto").files[0];if(f){const r=new FileReader();r.onload=()=>salvar(r.result);r.readAsDataURL(f)}else salvar()}}
$('.esg[data-setor="todos"]').addEventListener("click",e=>{const b=e.target.closest("[data-editar]");if(b)editarPrato(b.dataset.editar)});
$("#novo-prato").onclick=()=>editarPrato(null);
// ===== configurações: mesas e QR, taxa, horário, funcionários
function setMesas(n){n=Math.max(1,Math.min(30,n));for(let i=1;i<=n;i++)if(!mesas[i])mesas[i]={n:i,estado:"livre",total:0,itens:[],aceita:false,pronto:0,qr:qr()};
Object.keys(mesas).forEach(k=>{if(+k>n&&mesas[k].estado==="livre"&&!mesas[k].total)delete mesas[k]});$("#c-mesas").value=n;mapa();placas()}
function placas(){$("#placas-mini").innerHTML=Object.keys(mesas).map(n=>`<div>${QRS[n]||""}Mesa ${n}</div>`).join("")}
$("#c-mesas-ok").onclick=()=>{setMesas(+$("#c-mesas").value||12);log("Mudou mesas",`${Object.keys(mesas).length} mesas`);avisar("Mesas atualizadas: imprima as plaquinhas novas.")};
$("#c-placas").onclick=()=>{log("Imprimiu plaquinhas",`${Object.keys(mesas).length} mesas`);imprimir(Object.keys(mesas).map(n=>`<div class="placa-p"><b>${esc(MARCA.nome)}</b>Mesa ${n}${QRS[n]||""}<br>Aponte a câmera para ver o cardápio e pedir</div>`).join(""),"")};
$("#c-serv").onchange=$("#c-pct").onchange=()=>{servOn=$("#c-serv").checked;servPct=Math.max(0,Math.min(20,+$("#c-pct").value||0));log("Mudou taxa de serviço",servOn?servPct+"%":"desligada")};
const DIAS=[["Seg","","",1],["Ter","11:30","23:00"],["Qua","11:30","23:00"],["Qui","11:30","23:00"],["Sex","11:30","00:00"],["Sáb","11:30","00:00"],["Dom","11:30","17:00"]];
$("#horarios").innerHTML=DIAS.map((d,i)=>`<div><b>${d[0]}</b><input type="time" value="${d[1]}" ${d[3]?"disabled":""} aria-label="${d[0]} abre"><input type="time" value="${d[2]}" ${d[3]?"disabled":""} aria-label="${d[0]} fecha"><label><input type="checkbox" data-fecha="${i}" ${d[3]?"checked":""}> fechado</label></div>`).join("");
$("#horarios").onchange=e=>{const c=e.target.closest("[data-fecha]");if(c)c.closest("div").querySelectorAll("input[type=time]").forEach(x=>x.disabled=c.checked)};
$("#c-hor-ok").onclick=()=>{const CH=["segunda","terca","quarta","quinta","sexta","sabado","domingo"],h={};[...$("#horarios").children].forEach((row,i)=>{const t=row.querySelectorAll("input[type=time]"),f=row.querySelector("[data-fecha]").checked;h[CH[i]]=f||!t[0].value||!t[1].value?[]:[{abre:t[0].value,fecha:t[1].value}]});site().postMessage({tipo:"horario",horarios:h},"*");log("Mudou horário","funcionamento atualizado");avisar("Horário salvo: aparece no site e no aviso de “Aberto agora”.")};
function listaFunc(){$("#funcs").innerHTML=FUNC.map((f,i)=>`<div class="linha"><span class="d"><b>${esc(f.nome)}</b><small>${ROTULO_F[f.funcao]} · senha ••••</small></span>${f.funcao==="gerente"&&FUNC.filter(x=>x.funcao==="gerente").length===1?"":`<button class="sec" data-rm="${i}">Remover</button>`}</div>`).join("")}
$("#funcs").onclick=e=>{const b=e.target.closest("[data-rm]");if(!b)return;const f=FUNC.splice(+b.dataset.rm,1)[0];log("Removeu funcionário",f.nome);listaFunc()};
$("#fu-add").onclick=()=>{const nome=$("#fu-nome").value.trim(),pin=$("#fu-pin").value.trim();if(!nome||!/^\d{4}$/.test(pin)){avisar("Informe o nome e uma senha de 4 números.");return}
FUNC.push({nome,funcao:$("#fu-f").value,pin});log("Cadastrou funcionário",`${nome} · ${ROTULO_F[$("#fu-f").value]}`);$("#fu-nome").value="";$("#fu-pin").value="";listaFunc()};
$("#btn-login").onclick=()=>{$("#caixa").innerHTML=`<h3>Entrar com senha</h3><label>Funcionário<select id="lo-f">${FUNC.map((f,i)=>`<option value="${i}">${esc(f.nome)} · ${ROTULO_F[f.funcao]}</option>`).join("")}</select></label><label>Senha<input id="lo-pin" type="password" inputmode="numeric" maxlength="4"></label><p class="erro" id="lo-erro"></p><div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="lo-ok">Entrar</button></div>`;$("#modal").hidden=false;
$("#lo-ok").onclick=()=>{const f=FUNC[$("#lo-f").value];if($("#lo-pin").value!==f.pin){$("#lo-erro").textContent="Senha errada.";log("Senha errada",f.nome);return}
$("#funcao").value=f.funcao==="gerente"?"":f.funcao;$("#funcao").onchange({target:$("#funcao")});usuario=`${f.nome} (${ROTULO_F[f.funcao]})`;log("Entrou",usuario);$("#modal").hidden=true;avisar(`Olá, ${esc(f.nome)}! Você vê só a tela de ${ROTULO_F[f.funcao]}.`)}};
// ===== cadastro de restaurante novo (sem programador)
function marcar(nome,ini,cor){const r=document.documentElement.style;r.setProperty("--brasa",cor);r.setProperty("--brasa-cl",`color-mix(in srgb, ${cor} 12%, white)`);
$("#marca-nome").textContent=nome;$("#tv-nome").textContent=nome;document.querySelector("header h1").dataset.ini=ini;document.title=document.title.split(MARCA.nome).join(nome);site().postMessage({tipo:"marca",nome,ini,cor},"*");Object.assign(MARCA,{nome,ini,cor})}
function cadastro(){const w={passo:0,nome:"",tipo:"restaurante",cidade:"",ini:"",cor:CORES[2],cardapio:"modelo",mesas:12};
const tela=()=>{const P=[
`<label>Nome do restaurante<input id="w-nome" value="${esc(w.nome)}" placeholder="Ex.: Burger Top"></label><label>Tipo de negócio<select id="w-tipo">${Object.keys(TIPOS).map(t=>`<option value="${t}" ${w.tipo===t?"selected":""}>${$(`#tipo-neg option[value="${t}"]`).textContent}</option>`).join("")}</select></label><label>Cidade<input id="w-cid" value="${esc(w.cidade)}" placeholder="Ex.: Campinas"></label>`,
`<label>Iniciais do logo<input id="w-ini" maxlength="3" value="${esc(w.ini||w.nome.split(/\s+/).map(x=>x[0]||"").join("").slice(0,2).toUpperCase())}"></label><label>Cor principal</label><div class="cores">${CORES.map(c=>`<button type="button" data-cor="${c}" class="${c===w.cor?"on":""}" style="background:${c}" aria-label="Cor ${c}"></button>`).join("")}</div>`,
`<label>Cardápio<select id="w-card"><option value="modelo">Começar com o cardápio modelo (editar depois)</option><option value="planilha" ${w.cardapio==="planilha"?"selected":""}>Importar planilha (Excel)</option></select></label><label id="w-arq" ${w.cardapio==="planilha"?"":"hidden"}>Planilha<input type="file" accept=".xlsx,.csv"></label><label>Quantidade de mesas<input id="w-mesas" type="number" min="1" max="30" value="${w.mesas}"></label>`,
`<p><b>${esc(w.nome)}</b> · ${$(`#tipo-neg option[value="${w.tipo}"]`).textContent}${w.cidade?" · "+esc(w.cidade):""}<br>Logo ${esc(w.ini)} · ${w.mesas} mesas · cardápio ${w.cardapio==="modelo"?"modelo":"da planilha"}</p><p class="nota">Ao publicar: site e cardápio no ar, QR Codes prontos para imprimir e painel liberado para a equipe.</p>`];
$("#caixa").innerHTML=`<h3>Restaurante novo · passo ${w.passo+1} de 4</h3><div class="wiz-passos">${P.map((_,i)=>`<span class="${i<=w.passo?"on":""}"></span>`).join("")}</div>${P[w.passo]}<p class="erro" id="w-erro"></p><div class="pe"><button class="sec" id="w-volta">${w.passo?"Voltar":"Cancelar"}</button><button id="w-prox">${w.passo<3?"Próximo":"🚀 Publicar"}</button></div>`;$("#modal").hidden=false;
$(".cores")&&($(".cores").onclick=e=>{const b=e.target.closest("[data-cor]");if(!b)return;w.cor=b.dataset.cor;document.querySelectorAll(".cores [data-cor]").forEach(x=>x.classList.toggle("on",x===b))});
$("#w-card")&&($("#w-card").onchange=e=>{$("#w-arq").hidden=e.target.value!=="planilha"});
const ler=()=>{if(w.passo===0){w.nome=$("#w-nome").value.trim();w.tipo=$("#w-tipo").value;w.cidade=$("#w-cid").value.trim()}if(w.passo===1)w.ini=($("#w-ini").value.trim()||"R").toUpperCase();if(w.passo===2){w.cardapio=$("#w-card").value;w.mesas=Math.max(1,Math.min(30,+$("#w-mesas").value||12))}};
$("#w-volta").onclick=()=>{if(!w.passo){$("#modal").hidden=true;return}ler();w.passo--;tela()};
$("#w-prox").onclick=()=>{ler();if(w.passo===0&&!w.nome){$("#w-erro").textContent="Informe o nome do restaurante.";return}
if(w.passo<3){w.passo++;tela();return}
marcar(w.nome,w.ini,w.cor);$("#tipo-neg").value=w.tipo;tipoAtual=w.tipo;aplicarVisao();setMesas(w.mesas);log("Cadastrou restaurante",`${w.nome} · ${w.mesas} mesas`);
const slug=semAc(w.nome).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
$("#caixa").innerHTML=`<div class="wiz-ok"><div class="grande">🚀</div><h3>${esc(w.nome)} está no ar!</h3><code>https://${slug}.stacksolution.com.br</code><p class="nota">Cardápio publicado, ${w.mesas} QR Codes prontos (Configurações > Imprimir plaquinhas) e painel liberado. Tudo sem programador.</p><div class="pe" style="justify-content:center"><button data-cancelar>Ver o painel</button></div></div>`}};tela()}
$("#btn-novo-rest").onclick=cadastro;$("#btn-novo-rest2").onclick=()=>{$("#demo-pop").hidden=true;cadastro()};
listaFunc();placas();historico();
// "Mesas prontas" no Balcão: pratos prontos agrupados por mesa, para o garçom levar
function listaProntas(){const g={};prontosMesa.forEach(x=>{(g[x.mesa]=g[x.mesa]||[]).push(x)});const ms=Object.keys(g).sort((a,b)=>g[a][0].hora-g[b][0].hora);
$("#mesas-prontas").innerHTML=ms.map(n=>{const l=g[n],min=Math.round((Date.now()-l[0].hora)/60000);return `<div class="linha pronta-mesa"><span class="q">Mesa ${n}</span><span class="d">${l.map(x=>x.itens.map(i=>`<b>${i.qtd}×</b> ${esc(i.nome)}${i.obs?` <small>(${esc(i.obs)})</small>`:""}`).join("<br>")).join("<br>")}<small class="${min>=3?"alerta-t":""}">${l.map(x=>x.setor==="bar"?"bar":"cozinha").filter((v,i,a)=>a.indexOf(v)===i).join(" + ")} · pronto há ${min} min</small></span><span class="mx"><button class="sec" data-imp-mesa="${n}" title="Imprimir" aria-label="Imprimir">🖨</button><button data-levei-mesa="${n}">Levei ✓</button></span></div>`}).join("")||'<p class="nota">Nenhum prato esperando. Quando a cozinha ou o bar marcam pronto, o prato aparece aqui com o número da mesa.</p>';try{tv()}catch(e){}}
$("#mesas-prontas").onclick=e=>{const l=e.target.closest("[data-levei-mesa]"),i=e.target.closest("[data-imp-mesa]");if(l)entregue(l.dataset.leveiMesa);
if(i){const x=prontosMesa.filter(y=>String(y.mesa)===i.dataset.impMesa);comanda(x[0].p,x.flatMap(y=>y.itens),x[0].setor)}};
setInterval(()=>{if(prontosMesa.length)listaProntas()},30000);
// garçom levou: mesa volta a "ocupada" e o cliente vê "Entregue na mesa"
function entregue(n){const m=mesas[n];if(!m)return;m.pronto=0;m.estado=m.estado==="conta"?"conta":"ocupada";pedidos.filter(o=>+o.mesa===+m.n&&o.status==="Pronto").forEach(o=>{o.status="Entregue";(o.tempos=o.tempos||{}).Entregue=new Date();site().postMessage({tipo:"status",num:o.num,status:"Entregue na mesa"},"*")});
document.querySelectorAll(`.alerta[data-mesa="${m.n}"]`).forEach(a=>{if(a.querySelector("[data-levei]"))a.remove()});for(let i=prontosMesa.length-1;i>=0;i--)if(+prontosMesa[i].mesa===+m.n)prontosMesa.splice(i,1);listaProntas();listaPedidos();mapa();contar()}
// balcão retirado (pelo botão ou sozinho depois de 5 min na TV)
function retirar(o){if(!o||o.retirada)return;o.retirada=true;reg(o,"Entregue");const cb=+(o.total*fidPct()/100).toFixed(2);fidDist+=cb;fidelidade();site().postMessage({tipo:"status",num:o.num,status:"Retirado. Bom apetite!"+(cb?` Você ganhou ${reais(cb)} de cashback.`:"")},"*");tv()}
// configurações que o celular do cliente precisa saber (pagamento do balcão e Pix)
const cfgSite=()=>site().postMessage({tipo:"config",balcaoPagar:$("#c-balcao").value,pix:PIXCFG()},"*");
function PIXCFG(){try{return PIX}catch(e){return null}}
$("#c-balcao").onchange=()=>{cfgSite();log("Pagamento do balcão",$("#c-balcao").selectedOptions[0].textContent);avisar("Balcão: "+esc($("#c-balcao").selectedOptions[0].textContent))};
window.addEventListener("message",ev=>{if(ev.data?.tipo==="oi")cfgSite()});
// menu de baixo no celular: principais + "Mais"
["pedidos","cozinha","mesas","balcao"].forEach(a=>document.querySelector(`nav [data-aba="${a}"]`)?.classList.add("prim"));
$("#nav-mais").onclick=()=>{const n=document.querySelector("nav"),ab=n.classList.toggle("aberta");$("#nav-mais").setAttribute("aria-expanded",ab);$("#nav-mais").textContent=ab?"✕ Fechar":"☰ Mais"};
document.querySelectorAll("nav button[data-aba]").forEach(b=>b.addEventListener("click",()=>{document.querySelector("nav").classList.remove("aberta");$("#nav-mais").textContent="☰ Mais";$("#nav-mais").setAttribute("aria-expanded",false)}));
// detalhe do pedido: itens, observações, horário de cada etapa e reimpressão
$("#lista-pedidos").addEventListener("click",e=>{const tr=e.target.closest("tr[data-num]");if(!tr)return;const o=pedidos.find(x=>String(x.num)===tr.dataset.num);if(!o)return;
const h=d=>new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
$("#caixa").innerHTML=`<h3>Pedido #${o.num} · ${o.mesa?"Mesa "+esc(o.mesa):"Balcão"+(o.senha?" · senha "+o.senha:"")}</h3><p class="nota" style="margin-top:0">${o.nome&&o.nome!=="Mesa"?esc(o.nome)+" · ":""}${o.origem==="garcom"?"lançado pelo garçom":"pedido pelo QR"}</p>
${o.itens.map(i=>`<div class="l"><span>${i.qtd}× ${esc(i.nome)}${i.obs?`<br><small class="nota">${esc(i.obs)}</small>`:""}</span><span>${reais(i.qtd*i.preco)}</span></div>`).join("")}<div class="l t"><span>Total</span><span>${reais(o.total)}</span></div>
<ul class="linha-tempo">${Object.entries(o.tempos||{}).map(([st,d])=>`<li><b>${esc(st)}</b><small>${h(d)}</small></li>`).join("")}</ul>
<div class="pe"><button class="sec" data-cancelar>Fechar</button><button id="dp-imp">🖨 Imprimir comanda</button></div>`;$("#modal").hidden=false;
$("#dp-imp").onclick=()=>comanda(o,o.itens,o.itens.every(i=>BAR.includes(i.cat))?"bar":"cozinha")});
setInterval(()=>{if($("#aba-pedidos").classList.contains("ativa"))listaPedidos()},30000);
// ===== estoque simples
const PIX=%%PIX%%;
const INSUMOS=[{nome:"Picanha",un:"kg",qtd:4.2,min:2,usa:{"picanha-brasa":.35}},{nome:"Costela",un:"kg",qtd:5,min:2,usa:{"costela-12h":.45}},{nome:"Filé-mignon",un:"kg",qtd:3,min:1.5,usa:{"file-espaguete":.25,"file-roti":.25}},
{nome:"Massa fresca",un:"kg",qtd:2.4,min:1.5,usa:{"ravioli-dona-lucia":.15,"espaguete-camarao":.15,"espaguete-arrabbiata":.15,"lasanha-berinjela":.2,"carbonara":.15}},
{nome:"Camarão",un:"kg",qtd:1.2,min:1,usa:{"camarao-alho":.2,"moqueca-camarao":.3,"espaguete-camarao":.15}},{nome:"Chope (barril)",un:"L",qtd:18,min:10,usa:{"chope-pilsen":.4,"chope-ipa":.4}},{nome:"Tiramisù",un:"porções",qtd:4,min:3,usa:{"tiramisu":1}}];
const num=v=>(+v.toFixed(2)).toLocaleString("pt-BR");
function setEsgotado(id,on){on?esgot.add(id):esgot.delete(id);document.querySelectorAll(`.esg:not(tbody) [data-id="${id}"]`).forEach(x=>x.classList.toggle("on",on));cardapio();site().postMessage({tipo:"esgotado",id,ativo:on},"*")}
function listaEstoque(){$("#estoque").innerHTML=INSUMOS.map((x,i)=>{const pct=Math.min(100,x.qtd/(x.min*3)*100),baixo=x.qtd<x.min;return `<div class="linha"><span class="d"><b>${esc(x.nome)}</b><small class="${baixo?"alerta-t":""}">${num(x.qtd)} ${x.un} · mínimo ${num(x.min)} ${x.un}${x.qtd<=0?" · ZERADO":baixo?" · baixo":""}</small><i class="est-barra"><i style="width:${pct}%;background:${x.qtd<=0?"var(--brasa)":baixo?"var(--ouro)":"var(--verde)"}"></i></i></span><button class="sec" data-repor="${i}">+ Repor</button></div>`}).join("")}
function baixarEstoque(p){p.itens.forEach(it=>{const m=MENU.find(i=>i.nome===it.nome);if(!m)return;INSUMOS.forEach(x=>{const u=x.usa[m.id];if(!u)return;const antes=x.qtd;x.qtd=Math.max(0,x.qtd-u*it.qtd);
if(antes>=x.min&&x.qtd<x.min&&x.qtd>0){avisar(`⚠ Estoque baixo: ${esc(x.nome)} com ${num(x.qtd)} ${x.un}`);log("Estoque baixo",`${x.nome}: ${num(x.qtd)} ${x.un}`)}
if(antes>0&&x.qtd<=0){Object.keys(x.usa).forEach(id=>setEsgotado(id,true));avisar(`⛔ ${esc(x.nome)} acabou: pratos marcados como esgotados.`);log("Estoque zerado",x.nome)}})});listaEstoque()}
$("#estoque").onclick=e=>{const b=e.target.closest("[data-repor]");if(!b)return;const x=INSUMOS[b.dataset.repor];
$("#caixa").innerHTML=`<h3>Repor ${esc(x.nome)}</h3><label>Quantidade (${x.un})<input id="rp-q" type="number" step="0.1" min="0" value="${x.min*2}"></label><div class="pe"><button class="sec" data-cancelar>Voltar</button><button id="rp-ok">Repor</button></div>`;$("#modal").hidden=false;
$("#rp-ok").onclick=()=>{const q=+$("#rp-q").value||0;if(x.qtd<=0&&q>0)Object.keys(x.usa).forEach(id=>setEsgotado(id,false));x.qtd+=q;log("Repôs estoque",`${x.nome}: +${num(q)} ${x.un}`);listaEstoque();$("#modal").hidden=true}};
listaEstoque();
// modo apresentação: pedidos de exemplo chegando sozinhos e a casa trabalhando
let autoT=null,autoN=0;const NOMES=["Ana","Bruno","Carla","Diego","Lia","Rafa","Theo","Bia","Júlia","Caio"];
const sorteia=a=>a[Math.floor(Math.random()*a.length)];
function autoPedido(){const balc=tipoAtual==="hamburgueria"||tipoAtual==="cafeteria"||Math.random()<.3,mesa=balc?"":String(sorteia([1,2,3,4,6,7,8,9,10,11,12]));
const disp=MENU.filter(i=>!esgot.has(i.id)),its=[...Array(1+Math.floor(Math.random()*3))].map(()=>{const i=sorteia(disp);return {nome:i.nome,qtd:1+(Math.random()<.25?1:0),obs:"",preco:i.preco,cat:i.cat,sug:Math.random()<.2}});
window.dispatchEvent(new MessageEvent("message",{data:{tipo:"pedido",num:Date.now()%100000,mesa,modo:balc?"Retirada":"Mesa",nome:sorteia(NOMES),pagar:balc&&$("#c-balcao").value==="antes"?"pix":undefined,itens:its,total:its.reduce((t,i)=>t+i.qtd*i.preco,0)}}))}
function autoPasso(){autoN++;document.querySelectorAll(".alerta [data-ok]").forEach(b=>b.click());
const cards=[...document.querySelectorAll(".card [data-av]")];if(cards.length&&autoN%2===0)sorteia(cards).click();
if(autoN%2===1&&document.querySelectorAll(".card").length<10)autoPedido();
if(autoN%5===0)document.querySelector("[data-entregar]")?.click();
if(autoN%6===0)document.querySelector("[data-retirado]")?.click();
if(autoN%7===0){const m=sorteia(Object.values(mesas).filter(x=>x.estado==="ocupada"&&+x.n!==5));if(m)window.dispatchEvent(new MessageEvent("message",{data:{tipo:"garcom",mesa:String(m.n)}}))}
if(autoN%9===0)document.querySelectorAll(".alerta [data-vou]").forEach(b=>b.click())}
$("#btn-auto").onclick=()=>{const b=$("#btn-auto");$("#demo-pop").hidden=true;if(autoT){clearInterval(autoT);autoT=null;b.classList.remove("on");b.textContent="▶ Modo apresentação";avisar("Modo apresentação desligado.")}
else{autoPedido();autoT=setInterval(autoPasso,2600);b.classList.add("on");b.textContent="■ Parar apresentação";$("#demo-pop").hidden=true;avisar("Modo apresentação ligado: pedidos de exemplo chegando sozinhos. Navegue pelas abas.")}};
// botão fixo: abre a Gerência direto no assistente
$("#btn-ia").onclick=()=>{$("#funcao").value="";$("#funcao").onchange({target:$("#funcao")});document.querySelector('nav [data-aba="gerencia"]').click();$("#assistente").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>$("#ia-q").focus({preventScroll:true}),400)};
integ();
mapa();listaReservas();gerencia();listaPedidos();
</script></body></html>"""

destino = AQUI / "demo-pdv.html"
destino.write_text(PAINEL.replace("%%MENU%%", MENU).replace("%%QRS%%", QRS).replace("%%PIX%%", PIX).replace("%%SITE%%", base64.b64encode(site.encode("utf-8")).decode()), encoding="utf-8")
print(f"{destino.name}: {destino.stat().st_size // 1024} KB")

# ---- duas telas separadas: cliente.html (o que o cliente vê) e restaurante.html (o que a casa vê)
# Abertas no mesmo navegador (duas janelas, ou PC e TV espelhada), conversam por um canal local.
CANAL = "casa-brasa-pdv"
PONTE = """<script>(()=>{const c=new BroadcastChannel("%s");
window.addEventListener("message",e=>{if(e.source===window&&e.data&&["pedido","garcom","conta","ver-conta","oi"].includes(e.data.tipo))c.postMessage(e.data)});
c.onmessage=e=>window.postMessage(e.data,"*")})();</script></body>""" % CANAL
cli = site.replace("</body>", PONTE, 1) if "</body>" in site else site + PONTE
(AQUI / "cliente.html").write_text(cli, encoding="utf-8")

rest = PAINEL.replace("%%MENU%%", MENU).replace("%%QRS%%", QRS).replace("%%PIX%%", PIX)
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
.troca .tour-btn{color:var(--brasa);font-weight:700;border-left:1px solid var(--linha);border-radius:0 99px 99px 0}
.tour{position:fixed;inset:0;z-index:70}.tour-luz{position:fixed;border-radius:14px;box-shadow:0 0 0 9999px rgba(30,20,12,.62);transition:all .3s ease;pointer-events:none}
.tour-card{position:fixed;width:min(340px,90vw);background:var(--cartao);color:var(--texto);border-radius:16px;padding:18px 18px 14px;box-shadow:0 20px 50px rgba(0,0,0,.35);transition:top .3s,left .3s}
.tour-card p{margin:0 0 14px;font-size:15px;line-height:1.5}.tour-card small{color:var(--suave);font-weight:700;letter-spacing:.08em}.tour-card .pe{gap:8px}
body.ver-cliente .lado{border:0}body.ver-cliente .lado p{display:none}
body.um .celular{height:min(800px,calc(100vh - 100px))}
body.ver-restaurante .painel{height:calc(100vh - 64px)}
@media(max-width:600px){body.ver-cliente .lado{padding:0}body.ver-cliente .celular{width:100vw;height:calc(100vh - 64px);border:0;border-radius:0;box-shadow:none}}
</style></head>"""
TROCA_HTML = """<body class="um ver-cliente"><div class="troca" role="group" aria-label="Escolher a tela">
<button type="button" data-ver="cliente" aria-pressed="true">Cliente</button><button type="button" data-ver="restaurante" aria-pressed="false">Restaurante<span class="bolinha" id="b-troca" hidden></span></button><button type="button" data-ver="tv" aria-pressed="false">TV senhas</button><button type="button" class="tour-btn" id="tour-btn">▶<span class="t"> Tour</span></button></div>"""
TROCA_JS = """<script>
(()=>{const ver=v=>{document.body.classList.toggle("ver-cliente",v==="cliente");document.body.classList.toggle("ver-restaurante",v==="restaurante");
document.body.classList.toggle("ver-tv",v==="tv");document.getElementById("tv").hidden=v!=="tv";document.querySelectorAll(".troca [data-ver]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ver===v));try{localStorage.setItem("cb-ver",v)}catch(e){}};
document.querySelectorAll(".troca [data-ver]").forEach(b=>b.onclick=()=>ver(b.dataset.ver));
try{const v=localStorage.getItem("cb-ver");if(v)ver(v)}catch(e){}
// tour guiado
const PASSOS=[["cliente",".celular","Este é o celular do cliente na mesa. Ele escaneia o QR, escolhe os pratos (com adicionais) e envia o pedido."],
["cliente",".troca","Aqui você troca entre o que o cliente vê, o painel do restaurante e a TV de senhas do balcão."],
["restaurante","nav","Este é o painel do restaurante. Cada função (cozinha, bar, garçom, caixa, dono) vê só a sua tela."],
["restaurante",'nav [data-aba="cozinha"]',"Os pedidos chegam na Cozinha e no Bar separados, com som e o tempo correndo."],
["restaurante",'nav [data-aba="mesas"]',"O garçom vê o mapa das mesas, aceita o primeiro pedido, lança pedidos e fecha a conta."],
["restaurante","#btn-demo","Em ⚙ Demo você escolhe o tipo de negócio, coloca a marca do cliente e liga o modo apresentação."],
["restaurante","#btn-ia","O assistente com IA responde perguntas do dono sobre vendas, horários e clientes."],
["tv","#tv-agora","Na TV, a senha do balcão é chamada quando o pedido fica pronto. Pronto, é só usar!"]];
function tour(i){document.querySelector(".tour")?.remove();if(i>=PASSOS.length){ver("cliente");return}const [v,sel,txt]=PASSOS[i];ver(v);
setTimeout(()=>{const el=document.querySelector(sel);if(!el)return tour(i+1);const r=el.getBoundingClientRect(),pad=8;
document.body.insertAdjacentHTML("beforeend",`<div class="tour" role="dialog" aria-label="Tour"><div class="tour-luz" style="top:${r.top-pad}px;left:${r.left-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px"></div>
<div class="tour-card"><small>${i+1} DE ${PASSOS.length}</small><p>${txt}</p><div class="pe"><button class="sec" data-tour-sair>Pular</button><button data-tour-prox>${i+1<PASSOS.length?"Próximo":"Começar"}</button></div></div></div>`);
const c=document.querySelector(".tour-card"),cw=c.offsetWidth,ch=c.offsetHeight,abaixo=r.bottom+pad+16+ch<innerHeight;
c.style.top=Math.max(12,Math.min(innerHeight-ch-12,abaixo?r.bottom+pad+12:r.top-pad-12-ch))+"px";c.style.left=Math.max(12,Math.min(innerWidth-cw-12,r.left+r.width/2-cw/2))+"px";
if(r.height>innerHeight*.6){c.style.top=Math.max(12,r.top+20)+"px";c.style.left=(r.right+16+cw<innerWidth?r.right+16:Math.max(12,r.left-cw-16))+"px"}
document.querySelector("[data-tour-prox]").onclick=()=>tour(i+1);document.querySelector("[data-tour-sair]").onclick=()=>{document.querySelector(".tour").remove();ver("cliente")};document.querySelector("[data-tour-prox]").focus()},250)}
document.getElementById("tour-btn").onclick=()=>tour(0);
// avisa no botão "Restaurante" quando chega algo novo enquanto se está na tela do cliente
setInterval(()=>{const n=document.querySelectorAll(".alerta").length+document.querySelectorAll(".card.novo").length,b=document.getElementById("b-troca");b.hidden=!n;b.textContent=n},500)})();
</script></body></html>"""
um = PAINEL.replace("%%MENU%%", MENU).replace("%%QRS%%", QRS).replace("%%PIX%%", PIX).replace("%%SITE%%", base64.b64encode(site.encode("utf-8")).decode())
um = um.replace("</style></head>", "</style>" + TROCA_CSS, 1).replace("<body>", TROCA_HTML, 1)
um = um.replace("<title>Demonstração: pedido na mesa e painel da casa</title>", "<title>Casa Brasa · Sistema</title>")
assert um.rstrip().endswith("</body></html>")
um = um.rstrip()[: -len("</body></html>")] + TROCA_JS
(AQUI / "sistema.html").write_text(um, encoding="utf-8")
print("sistema.html")
