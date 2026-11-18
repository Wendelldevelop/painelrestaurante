"""Gera demo-pdv.html: tela dividida com o cliente na mesa 5 (o site) e o painel da casa.

Uso (depois do montar.py):
    python3 templates/restaurante-site/demo-pdv.py

É só demonstração: tudo roda dentro do navegador, sem servidor. Pedidos, mesas, reservas e
números da gerência que não vêm do celular são dados de exemplo. O sistema de verdade está
descrito em PROMPT-PAINEL.md.
"""
import base64
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent
site = (AQUI / "casa-brasa.html").read_text(encoding="utf-8")
# liga o modo painel e fixa a mesa 5 só nesta demonstração
site, n = re.subn(r'"pedidos": (false|true|"painel")', '"pedidos": "painel", "mesa": 5', site, count=1)
assert n == 1, "rode o montar.py antes"

PAINEL = r"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demonstração: pedido na mesa e painel da casa</title>
<style>
:root{--fundo:#17100b;--cartao:#231710;--cartao2:#2c1d14;--linha:rgba(241,230,208,.14);--texto:#f1e6d0;--suave:#bcaa8f;--brasa:#b23a1e;--ouro:#dba63a;--verde:#6fae5a;--azul:#5b8fd6}
*{box-sizing:border-box}body{margin:0;background:#0d0906;color:var(--texto);font:15px/1.5 system-ui,sans-serif;height:100vh;display:grid;grid-template-columns:auto 1fr;overflow:hidden}
button{font:600 13px system-ui;border:0;border-radius:6px;padding:9px 14px;cursor:pointer;background:var(--ouro);color:#1f150e}
button.sec{background:transparent;color:var(--texto);border:1px solid var(--linha)}button.perigo{background:var(--brasa);color:var(--texto)}
.lado{display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 50% 30%,#2a1b12,#0d0906)}
.lado p{margin:0 0 10px;color:var(--suave);font-size:13px;text-align:center;max-width:390px}
.celular{width:390px;height:min(800px,calc(100vh - 80px));border:10px solid #000;border-radius:44px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.6);background:#000}
.celular iframe{width:100%;height:100%;border:0;display:block}
.painel{display:flex;flex-direction:column;min-width:0;border-left:1px solid var(--linha);background:var(--fundo)}
header{display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--linha)}
header h1{margin:0;font:600 19px/1 Georgia,serif}.tag{padding:3px 9px;border-radius:99px;background:var(--brasa);font-size:11px;font-weight:700}
.usuario{margin-left:auto;font-size:12px;color:var(--suave)}.usuario b{color:var(--texto)}
nav{display:flex;gap:4px;padding:0 20px;border-bottom:1px solid var(--linha);overflow-x:auto}
nav button{background:none;color:var(--suave);border-radius:0;padding:12px 14px;border-bottom:2px solid transparent;position:relative;white-space:nowrap}
nav button[aria-selected=true]{color:var(--texto);border-color:var(--ouro)}
nav .bolinha{position:absolute;top:6px;right:2px;min-width:18px;height:18px;border-radius:9px;background:var(--brasa);color:#fff;font-size:11px;display:grid;place-items:center;padding:0 4px}
main{flex:1;overflow:auto;padding:16px 20px}.aba{display:none}.aba.ativa{display:block}
.alertas{display:grid;gap:8px;margin-bottom:12px}.alerta{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:#3a1a10;border:1px solid var(--brasa);animation:chega .3s ease}
.alerta b{font-size:16px}.alerta .mx{margin-left:auto;display:flex;gap:8px}
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.col h2{margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--suave)}
.card{background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:12px;margin-bottom:10px;animation:chega .35s ease}
.card.novo{border-color:var(--ouro);box-shadow:0 0 0 1px var(--ouro)}.card.atraso{border-color:var(--brasa)}
.topo{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.mesa{font:600 20px/1 Georgia,serif}.hora{color:var(--suave);font-size:12px}
.tempo{font-variant-numeric:tabular-nums}.atraso .tempo{color:#ff9b85;font-weight:700}
.card ul{list-style:none;margin:8px 0;padding:0}.card li{padding:3px 0;border-top:1px solid var(--linha)}.card li small{display:block;color:var(--ouro)}
.pe{display:flex;justify-content:space-between;align-items:center;gap:8px}.total{font-weight:700}
.vazio{color:var(--suave);font-size:13px;padding:16px;border:1px dashed var(--linha);border-radius:10px;text-align:center}
.mapa{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.m{background:var(--cartao);border:1px solid var(--linha);border-radius:12px;padding:12px;min-height:118px;display:flex;flex-direction:column;gap:4px}
.m .n{font:600 22px/1 Georgia,serif}.m .s{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.m .v{color:var(--suave);font-size:13px}.m button{margin-top:auto}
.m.livre{opacity:.6}.m.livre .s{color:var(--verde)}.m.ocupada .s{color:var(--ouro)}.m.pronto{border-color:var(--verde)}.m.pronto .s{color:var(--verde)}
.m.conta{border-color:var(--brasa);background:#2e140d}.m.conta .s{color:#ff9b85}
.lista{display:grid;gap:8px}.linha{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--cartao);border:1px solid var(--linha);border-radius:10px}
.linha .q{font:600 18px/1 Georgia,serif;min-width:58px}.linha .d{flex:1;min-width:0}.linha .d small{display:block;color:var(--suave)}
.st{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:99px;border:1px solid currentColor}
.st.pendente{color:var(--ouro)}.st.confirmada{color:var(--verde)}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.k{background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:12px}
.k small{color:var(--suave);font-size:12px}.k b{display:block;font:600 24px/1.2 Georgia,serif}.k.lucro{border-color:var(--verde)}.k.lucro b{color:var(--verde)}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:14px}.bloco{background:var(--cartao);border:1px solid var(--linha);border-radius:10px;padding:14px}
.bloco h3{margin:0 0 8px;font:600 15px system-ui}.barra{display:flex;align-items:center;gap:8px;font-size:13px;margin:6px 0}.barra i{height:8px;border-radius:4px;background:var(--ouro);display:block}
.nota{color:var(--suave);font-size:12px;margin-top:10px}.seguro{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.seguro span{font-size:12px;padding:4px 9px;border-radius:99px;background:var(--cartao2);color:var(--suave)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:9}.modal[hidden]{display:none}
.caixa{background:var(--cartao);border:1px solid var(--linha);border-radius:14px;padding:20px;width:min(420px,92vw)}.caixa h3{margin:0 0 10px;font:600 20px Georgia,serif}
.caixa .l{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--linha)}.caixa .t{font-size:20px;font-weight:700;border:0}
@keyframes chega{from{opacity:0;transform:translateY(-6px)}}
@media(max-width:1000px){body{grid-template-columns:1fr;height:auto;overflow:auto}.celular{width:100%;max-width:390px;height:720px}.cols,.kpis,.duas{grid-template-columns:1fr 1fr}}
</style></head><body>
<section class="lado"><div><p>Cliente na <b>mesa 5</b>: escolha os pratos, aceite a sugestão de bebida, finalize e use "Chamar garçom" e "Pedir a conta".</p>
<div class="celular"><iframe id="site" title="Cardápio do cliente"></iframe></div></div></section>
<section class="painel">
<header><h1>Casa Brasa · Painel</h1><span class="tag">Ao vivo</span><span class="usuario">Entrou como <b>Gerente</b> · cada função vê só a sua tela</span></header>
<nav role="tablist">
<button role="tab" aria-selected="true" data-aba="cozinha">Cozinha<span class="bolinha" id="b-cozinha" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="bar">Bar<span class="bolinha" id="b-bar" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="mesas">Mesas (garçom)<span class="bolinha" id="b-mesas" hidden></span></button>
<button role="tab" aria-selected="false" data-aba="reservas">Reservas</button>
<button role="tab" aria-selected="false" data-aba="gerencia">Gerência e CRM</button>
</nav>
<main>
<div class="alertas" id="alertas"></div>
<section class="aba ativa" id="aba-cozinha"><div class="cols">
<div class="col"><h2>Novos</h2><div id="cozinha-Recebido"><p class="vazio">Pratos dos pedidos aceitos aparecem aqui, com tempo correndo.</p></div></div>
<div class="col"><h2>Em preparo</h2><div id="cozinha-Em preparo"></div></div><div class="col"><h2>Prontos</h2><div id="cozinha-Pronto"></div></div></div></section>
<section class="aba" id="aba-bar"><div class="cols">
<div class="col"><h2>Novos</h2><div id="bar-Recebido"><p class="vazio">Bebidas e vinhos vêm direto para cá, separados da cozinha.</p></div></div>
<div class="col"><h2>Em preparo</h2><div id="bar-Em preparo"></div></div><div class="col"><h2>Prontos</h2><div id="bar-Pronto"></div></div></div></section>
<section class="aba" id="aba-mesas"><div class="mapa" id="mapa"></div><p class="nota">O garçom vê o mapa no celular dele: aceita o primeiro pedido de cada mesa, leva o que ficou pronto e fecha a conta.</p></section>
<section class="aba" id="aba-reservas"><div class="lista" id="reservas"></div><p class="nota">Reservas feitas pelo site chegam aqui. "Confirmar no WhatsApp" abre a conversa com a mensagem pronta. Lista de exemplo.</p></section>
<section class="aba" id="aba-gerencia">
<div class="kpis"><div class="k"><small>Pedidos hoje</small><b id="g-ped">0</b></div><div class="k"><small>Faturamento hoje</small><b id="g-fat">R$ 0,00</b></div>
<div class="k"><small>Ticket médio por mesa</small><b id="g-tkt">R$ 0,00</b></div><div class="k lucro"><small>Vendas extras por sugestão</small><b id="g-sug">R$ 0,00</b></div></div>
<div class="duas"><div class="bloco"><h3>Mais pedidos hoje</h3><div id="g-top"><p class="nota">Faça um pedido no celular.</p></div></div>
<div class="bloco"><h3>Clientes que não voltam há 30 dias</h3><div class="lista" id="crm"></div></div></div>
<div class="bloco" style="margin-top:14px"><h3>Segurança</h3><div class="seguro"><span>Primeiro pedido da mesa só entra com aceite do garçom</span><span>QR muda quando a mesa é fechada</span><span>Cancelar item só com senha do gerente</span><span>Cada restaurante vê só os próprios dados</span><span>Pedido não se perde se a internet oscilar</span></div></div>
<p class="nota">Números do celular são reais nesta demonstração; clientes e reservas são exemplos.</p></section>
</main></section>
<div class="modal" id="modal" hidden><div class="caixa" id="caixa"></div></div>
<script id="site-html" type="text/plain">%%SITE%%</script>
<script>
(()=>{const b=atob(document.getElementById("site-html").textContent.trim()),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
document.getElementById("site").src=URL.createObjectURL(new Blob([u],{type:"text/html"}))+"#cardapio"})();
const $=s=>document.querySelector(s),reais=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const site=()=>document.getElementById("site").contentWindow;
const BAR=["bebidas","vinhos"],PROX={"Recebido":["Em preparo","Começar"],"Em preparo":["Pronto","Pronto"]};
const mesas={};for(let i=1;i<=12;i++)mesas[i]={n:i,estado:"livre",total:0,itens:[],aceita:false,pronto:0};
Object.assign(mesas[2],{estado:"ocupada",total:186,aceita:true,itens:[{nome:"Picanha na brasa",qtd:2,preco:89}]});
Object.assign(mesas[7],{estado:"ocupada",total:64,aceita:true,itens:[{nome:"Tagliatelle da Dona Lúcia",qtd:1,preco:64}]});
Object.assign(mesas[9],{estado:"conta",total:212,aceita:true,itens:[{nome:"Costela 12 horas",qtd:2,preco:84},{nome:"Chope pilsen",qtd:3,preco:14}]});
let ped=0,fat=0,sug=0;const vendidos={};
function bip(f=880){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.setValueAtTime(.18,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.45);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+.45)}catch(e){}}
function bolinha(id,n){const b=$("#b-"+id);b.hidden=!n;b.textContent=n}
function contar(){bolinha("cozinha",document.querySelectorAll("#cozinha-Recebido .card").length);bolinha("bar",document.querySelectorAll("#bar-Recebido .card").length);
bolinha("mesas",Object.values(mesas).filter(m=>["conta","pronto"].includes(m.estado)).length+document.querySelectorAll(".alerta").length)}
// abas
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-selected",x===b));document.querySelectorAll(".aba").forEach(a=>a.classList.toggle("ativa",a.id==="aba-"+b.dataset.aba))});
// mapa das mesas
const ROT={livre:"Livre",ocupada:"Ocupada",pronto:"Pronto para levar",conta:"Pediu a conta"};
function mapa(){$("#mapa").innerHTML=Object.values(mesas).map(m=>`<div class="m ${m.estado}"><span class="n">Mesa ${m.n}</span><span class="s">${ROT[m.estado]}</span>${m.total?`<span class="v">${reais(m.total)} até agora</span>`:""}
${m.estado==="pronto"?`<button data-entregar="${m.n}">Entregue na mesa</button>`:m.estado==="conta"||(m.estado==="ocupada"&&m.total)?`<button class="${m.estado==="conta"?"perigo":"sec"}" data-fechar="${m.n}">Fechar conta</button>`:""}</div>`).join("");contar()}
$("#mapa").onclick=e=>{const en=e.target.closest("[data-entregar]"),fe=e.target.closest("[data-fechar]");
if(en){const m=mesas[en.dataset.entregar];m.pronto=0;m.estado="ocupada";if(+m.n===5)site().postMessage({tipo:"status",num:m.ultimo,status:"Entregue na mesa"},"*");mapa()}
if(fe){const m=mesas[fe.dataset.fechar],serv=m.total*.1;$("#caixa").innerHTML=`<h3>Fechar mesa ${m.n}</h3>${m.itens.map(i=>`<div class="l"><span>${i.qtd}× ${esc(i.nome)}</span><span>${reais(i.qtd*i.preco)}</span></div>`).join("")}
<div class="l"><span>Subtotal</span><span>${reais(m.total)}</span></div><div class="l"><span>Serviço (10%)</span><span>${reais(serv)}</span></div><div class="l t"><span>Total</span><span>${reais(m.total+serv)}</span></div>
<p class="nota">O resumo vai para o caixa lançar no sistema dele. A mesa é liberada e o QR troca de código.</p><div class="pe" style="margin-top:12px"><button class="sec" data-cancelar>Voltar</button><button data-confirmar="${m.n}">Enviar ao caixa e liberar</button></div>`;$("#modal").hidden=false}};
$("#caixa").onclick=e=>{if(e.target.closest("[data-cancelar]"))$("#modal").hidden=true;const c=e.target.closest("[data-confirmar]");
if(c){const m=mesas[c.dataset.confirmar];if(+m.n===5)site().postMessage({tipo:"fechada"},"*");Object.assign(m,{estado:"livre",total:0,itens:[],aceita:false,pronto:0});document.querySelectorAll(`.alerta[data-mesa="${m.n}"]`).forEach(a=>a.remove());$("#modal").hidden=true;mapa()}};
// cozinha e bar
function cartao(p,setor,itens){const c=document.createElement("article");c.className="card novo";c.dataset.status="Recebido";c.dataset.ini=Date.now();
c.innerHTML=`<div class="topo"><span class="mesa">${p.mesa?"Mesa "+esc(p.mesa):"Retirada"}</span><span class="hora">#${p.num} · <span class="tempo">0:00</span></span></div>
<ul>${itens.map(i=>`<li>${i.qtd}× ${esc(i.nome)}${i.obs?`<small>${esc(i.obs)}</small>`:""}</li>`).join("")}</ul><div class="pe"><span class="hora">${setor==="bar"?"Bar":"Cozinha"}</span><button>Começar</button></div>`;
c.querySelector("button").onclick=()=>{const s=PROX[c.dataset.status][0];c.dataset.status=s;c.classList.remove("novo");
if(s==="Pronto"){c.querySelector("button").remove();const m=mesas[p.mesa];if(m){m.estado="pronto";m.pronto++;}mapa()}else c.querySelector("button").textContent=PROX[s][1];
site().postMessage({tipo:"status",num:p.num,status:s==="Pronto"?"Pronto, saindo para a mesa":"Em preparo"},"*");document.getElementById(`${setor}-${s}`).prepend(c);contar()};
$(`#${setor}-Recebido .vazio`)?.remove();$(`#${setor}-Recebido`).prepend(c)}
setInterval(()=>document.querySelectorAll(".card[data-ini]").forEach(c=>{if(c.dataset.status==="Pronto")return;const s=Math.floor((Date.now()-c.dataset.ini)/1000);
c.querySelector(".tempo").textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;c.classList.toggle("atraso",s>90)}),1000);
function entrar(p){const coz=p.itens.filter(i=>!BAR.includes(i.cat)),bar=p.itens.filter(i=>BAR.includes(i.cat));
if(coz.length)cartao(p,"cozinha",coz);if(bar.length)cartao(p,"bar",bar);
const m=mesas[p.mesa];if(m){m.estado="ocupada";m.total+=p.total;m.ultimo=p.num;p.itens.forEach(i=>m.itens.push(i))}
ped++;fat+=p.total;p.itens.forEach(i=>{vendidos[i.nome]=(vendidos[i.nome]||0)+i.qtd;if(i.sug)sug+=i.qtd*i.preco});gerencia();mapa();bip()}
// alertas: aceite do primeiro pedido, garçom, conta
function alerta(html,mesa,acoes){const a=document.createElement("div");a.className="alerta";a.dataset.mesa=mesa;a.innerHTML=html+`<span class="mx">${acoes}</span>`;$("#alertas").prepend(a);bip(660);contar();return a}
window.addEventListener("message",ev=>{const p=ev.data;if(!p||!p.tipo)return;
if(p.tipo==="pedido"){const m=mesas[p.mesa];
if(m&&!m.aceita){const a=alerta(`<b>Mesa ${esc(p.mesa)}: primeiro pedido</b><span>${p.itens.length} item(ns) · ${reais(p.total)} · confirme que tem gente na mesa</span>`,p.mesa,`<button data-ok>Aceitar</button><button class="sec" data-nao>Recusar</button>`);
a.querySelector("[data-ok]").onclick=()=>{m.aceita=true;a.remove();entrar(p)};a.querySelector("[data-nao]").onclick=()=>{a.remove();site().postMessage({tipo:"status",num:p.num,status:"Recusado: chame o garçom"},"*");contar()}}
else entrar(p)}
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
function gerencia(){const ocup=Object.values(mesas).filter(m=>m.total).length||1;$("#g-ped").textContent=ped;$("#g-fat").textContent=reais(fat);$("#g-tkt").textContent=reais(fat/Math.max(1,new Set(Object.values(mesas).filter(m=>m.ultimo).map(m=>m.n)).size));$("#g-sug").textContent=reais(sug);
const top=Object.entries(vendidos).sort((a,b)=>b[1]-a[1]).slice(0,5),max=top[0]?top[0][1]:1;
$("#g-top").innerHTML=top.length?top.map(([n,q])=>`<div class="barra"><span style="flex:0 0 46%">${esc(n)}</span><i style="width:${q/max*45}%"></i><b>${q}</b></div>`).join(""):'<p class="nota">Faça um pedido no celular.</p>'}
mapa();listaReservas();gerencia();
</script></body></html>"""

destino = AQUI / "demo-pdv.html"
destino.write_text(PAINEL.replace("%%SITE%%", base64.b64encode(site.encode("utf-8")).decode()), encoding="utf-8")
print(f"{destino.name}: {destino.stat().st_size // 1024} KB")
