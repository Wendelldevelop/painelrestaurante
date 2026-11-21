// Servidor do Comanda+ (versão 1)
// Liga o celular do cliente, o painel do restaurante e a TV pela internet, guarda os pedidos num banco SQLite
// e protege tudo com login (painel) e código secreto por mesa (QR Code).
// Uso:   node servidor.js            (porta 8080; mude com PORT=3000)
// Dados: pasta ./dados (mude com COMANDA_DADOS=/caminho). Restaurantes e mesas: python3 admin.py
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const AQUI = __dirname;
const SITE = path.resolve(AQUI, '..');                       // templates/restaurante-site (arquivos gerados)
const DADOS = process.env.COMANDA_DADOS || path.join(AQUI, 'dados');
const PORTA = +process.env.PORT || 8080;
fs.mkdirSync(DADOS, { recursive: true });

// ---------- segredo para assinar os logins
const arqSegredo = path.join(DADOS, 'segredo.txt');
const SEGREDO = process.env.COMANDA_SEGREDO || (fs.existsSync(arqSegredo) ? fs.readFileSync(arqSegredo, 'utf8').trim()
  : (() => { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(arqSegredo, s, { mode: 0o600 }); return s; })());

// ---------- banco
const db = new DatabaseSync(path.join(DADOS, 'comanda.db'));
db.exec(fs.readFileSync(path.join(AQUI, 'esquema.sql'), 'utf8'));
const q = {
  rest: db.prepare('SELECT * FROM restaurantes WHERE slug = ? AND ativo = 1'),
  user: db.prepare('SELECT * FROM usuarios WHERE restaurante_id = ? AND email = ? AND ativo = 1'),
  mesa: db.prepare('SELECT * FROM mesas WHERE restaurante_id = ? AND numero = ?'),
  nMesas: db.prepare('SELECT COUNT(*) n FROM mesas WHERE restaurante_id = ? AND numero > 0'),
  evento: db.prepare('INSERT INTO eventos (restaurante_id, papel, tipo, num, mesa, cid, dados) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  pedidoExiste: db.prepare("SELECT 1 FROM eventos WHERE restaurante_id = ? AND tipo = 'pedido' AND num = ? AND cid = ?"),
  pedidosMinuto: db.prepare("SELECT COUNT(*) n FROM eventos WHERE restaurante_id = ? AND tipo = 'pedido' AND mesa = ? AND criado_em > datetime('now', '-1 minute')"),
  doDia: db.prepare("SELECT * FROM eventos WHERE restaurante_id = ? AND criado_em > datetime('now', '-16 hours') ORDER BY id"),
};

// ---------- senhas e login
function confereSenha(senha, guardada) {
  const [alg, sal, hash] = String(guardada).split('$');
  if (alg !== 'scrypt') return false;
  const calc = crypto.scryptSync(String(senha), Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(calc, Buffer.from(hash, 'hex'));
}
const b64 = (x) => Buffer.from(x).toString('base64url');
function assina(dados) { const corpo = b64(JSON.stringify(dados)); return corpo + '.' + crypto.createHmac('sha256', SEGREDO).update(corpo).digest('base64url'); }
function confereToken(tok, slug) {
  const [corpo, ass] = String(tok || '').split('.');
  if (!corpo || !ass) return null;
  const esperado = crypto.createHmac('sha256', SEGREDO).update(corpo).digest('base64url');
  if (ass.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(ass), Buffer.from(esperado))) return null;
  const d = JSON.parse(Buffer.from(corpo, 'base64url').toString());
  return d.slug === slug && d.exp > Date.now() ? d : null;
}

// ---------- conexões em tempo real (SSE), por restaurante
const salas = new Map(); // slug -> Set de { papel, mesa, cid, res }
const sala = (slug) => { if (!salas.has(slug)) salas.set(slug, new Set()); return salas.get(slug); };
const numDoCliente = new Map(); // `${slug}:${num}` -> cid
function envia(c, dados) { try { c.res.write(`data: ${JSON.stringify(dados)}\n\n`); } catch (e) {} }
function paraPainel(slug, dados) { for (const c of sala(slug)) if (c.papel === 'painel') envia(c, dados); }
function paraClientes(slug, dados) {
  const s = sala(slug);
  let alvo = null;
  if ((dados.tipo === 'status' || dados.tipo === 'recebido') && dados.num != null) alvo = numDoCliente.get(`${slug}:${dados.num}`);
  for (const c of s) {
    if (c.papel !== 'cliente') continue;
    if (alvo) { if (c.cid === alvo) envia(c, dados); continue; }
    if ((dados.tipo === 'extrato' || dados.tipo === 'fechada') && dados.mesa != null) { if (String(c.mesa) === String(dados.mesa)) envia(c, dados); continue; }
    envia(c, dados);
  }
}
function paraTV(slug, dados) { for (const c of sala(slug)) if (c.papel === 'tv') envia(c, dados); }
setInterval(() => { for (const s of salas.values()) for (const c of s) { try { c.res.write(': ping\n\n'); } catch (e) {} } }, 25000);

// ---------- cardápio: o preço vem daqui, não do celular (o cliente poderia alterar o preço pelo navegador)
const cardapios = new Map(); // slug -> { porNome: Map(nome -> {id, preco, extraMax}), porId: Map, promo: Map(id -> preco) }
function cardapio(slug) {
  if (cardapios.has(slug)) return cardapios.get(slug);
  const prop = path.join(DADOS, 'restaurantes', slug, 'cardapio.json');
  const arq = fs.existsSync(prop) ? prop : path.join(SITE, '..', 'restaurante-premium', 'data', 'cardapio.json');
  const c = { porNome: new Map(), porId: new Map(), promo: new Map() };
  for (const it of JSON.parse(ler(arq))) {
    const extraMax = (it.opcoes || []).reduce((t, g) => t + (g.escolha === 'varias' ? g.itens.reduce((u, o) => u + (o.preco || 0), 0) : Math.max(0, ...g.itens.map((o) => o.preco || 0))), 0);
    const x = { id: it.id, nome: it.nome, preco: it.preco, extraMax };
    c.porNome.set(it.nome, x); c.porId.set(it.id, x);
  }
  for (const it of Object.values(estado(slug).edits)) { const x = c.porId.get(it.id) || { id: it.id, extraMax: 0 }; if (it.nome) { c.porNome.delete(x.nome); x.nome = it.nome; } if (it.preco) x.preco = Number(it.preco); c.porId.set(x.id, x); c.porNome.set(x.nome, x); }
  for (const pr of Object.values(estado(slug).promos)) if (pr.ativa) for (const [id, v] of Object.entries(pr.precos || {})) c.promo.set(id, Number(v));
  cardapios.set(slug, c);
  return c;
}
function conferePrecos(slug, d) {
  const c = cardapio(slug);
  let total = 0;
  for (const i of d.itens) {
    const x = c.porNome.get(String(i.nome));
    if (!x) return false;                                     // prato que não existe no cardápio
    const qtd = Math.trunc(Number(i.qtd));
    if (!(qtd >= 1 && qtd <= 50)) return false;
    const base = c.promo.has(x.id) ? c.promo.get(x.id) : x.preco;
    let preco = Number(i.preco);
    if (!(preco >= base - 0.01 && preco <= base + x.extraMax + 0.01)) preco = base; // fora da faixa: usa o preço do cardápio
    i.qtd = qtd; i.preco = Math.round(preco * 100) / 100; total += i.qtd * i.preco;
  }
  d.total = Math.round(total * 100) / 100;
  return true;
}

// ---------- estado salvo por restaurante: edições do cardápio, esgotados do dia, promoções e configurações
const estados = new Map();
const hoje = () => new Date().toISOString().slice(0, 10);
function arqEstado(slug) { const d = path.join(DADOS, 'restaurantes', slug); fs.mkdirSync(d, { recursive: true }); return path.join(d, 'estado.json'); }
function estado(slug) {
  if (!estados.has(slug)) { const f = arqEstado(slug); estados.set(slug, fs.existsSync(f) ? JSON.parse(ler(f)) : {}); }
  const e = estados.get(slug);
  e.edits = e.edits || {}; e.promos = e.promos || {}; e.cfg = e.cfg || {};
  if (e.esgDia !== hoje()) { e.esgotados = {}; e.esgDia = hoje(); } // esgotado vale só para o dia
  return e;
}
function salvaEstado(slug) { fs.writeFileSync(arqEstado(slug), JSON.stringify(estados.get(slug))); }
function registraEstado(slug, d) {
  const e = estado(slug);
  if (d.tipo === 'esgotado' && d.id) { if (d.ativo) e.esgotados[d.id] = true; else delete e.esgotados[d.id]; }
  else if (d.tipo === 'promo' && d.id) e.promos[d.id] = { id: d.id, titulo: d.titulo, ativa: !!d.ativa, precos: d.precos || {} };
  else if (d.tipo === 'menu' && d.item && d.item.id) e.edits[d.item.id] = Object.assign(e.edits[d.item.id] || {}, d.item);
  else if (d.tipo === 'acao' && d.a === 'cfg' && /^c-[a-z]+$/.test(d.id || '')) e.cfg[d.id] = d.v;
  else return;
  salvaEstado(slug);
}
const ultimaTV = new Map();
const recentes = new Map(); // evita mandar a mesma mensagem duas vezes ao cliente (vários aparelhos da equipe)
function repetida(slug, d) {
  const k = slug + JSON.stringify(d), agora = Date.now();
  for (const [x, t] of recentes) if (agora - t > 5000) recentes.delete(x);
  if (recentes.has(k)) return true; recentes.set(k, agora); return false;
}
const ACOES = new Set(['k', 'esg', 'promo', 'fechar', 'retirado', 'cancelar', 'pedido', 'cfg']);
function guardaAcao(r, d, papel = 'painel') {
  const info = q.evento.run(r.id, papel, 'acao', null, d.mesa != null ? String(d.mesa) : null, null, JSON.stringify(d));
  d._id = Number(info.lastInsertRowid);
  registraEstado(r.slug, d);
  paraPainel(r.slug, d);
}

// ---------- regras de mensagens
const DO_CLIENTE = new Set(['pedido', 'garcom', 'conta', 'ver-conta', 'oi']);
const DO_PAINEL = new Set(['acao', 'status', 'recebido', 'fechada', 'extrato', 'esgotado', 'promo', 'marca', 'menu', 'horario', 'config', 'tv-estado']);
const GUARDAR = new Set(['pedido', 'garcom', 'conta', 'status', 'fechada', 'esgotado']);

// ---------- páginas
const ler = (p) => fs.readFileSync(p, 'utf8');
function arquivo(slug, nome, padrao) { const prop = path.join(DADOS, 'restaurantes', slug, nome); return fs.existsSync(prop) ? prop : path.join(SITE, padrao); }
const js = (x) => JSON.stringify(x).replace(/</g, '\\u003c');

function estadoCliente(slug) {
  const e = estado(slug), msgs = [];
  for (const it of Object.values(e.edits)) msgs.push({ tipo: 'menu', item: it });
  for (const id of Object.keys(e.esgotados)) msgs.push({ tipo: 'esgotado', id, ativo: true });
  for (const pr of Object.values(e.promos)) if (pr.ativa) msgs.push({ tipo: 'promo', id: pr.id, titulo: pr.titulo, ativa: true, precos: pr.precos });
  return msgs;
}
function paginaCliente(r, mesa, token, balcao) {
  let h = ler(arquivo(r.slug, 'site.html', 'casa-brasa.html'));
  h = h.replace(/"pedidos": (false|true|"painel")/, balcao ? '"pedidos": "painel"' : `"pedidos": "painel", "mesa": ${+mesa}`);
  const ponte = `<script>(()=>{const S=${js(r.slug)},M=${js(balcao ? '' : String(mesa))},T=${js(token)};
const cid=(()=>{try{let c=sessionStorage.getItem("cm-cid");if(!c){c=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem("cm-cid",c)}return c}catch(e){return Math.random().toString(36).slice(2)}})();
const qs="papel=cliente&mesa="+encodeURIComponent(M)+"&t="+encodeURIComponent(T)+"&cid="+cid,TIPOS=${js([...DO_CLIENTE])};
function aviso(t){let a=document.getElementById("cm-aviso");if(!a){a=document.createElement("div");a.id="cm-aviso";a.style.cssText="position:fixed;left:12px;right:12px;top:12px;z-index:999;padding:14px 16px;border-radius:12px;background:#b23a1e;color:#fff;font:600 15px system-ui;text-align:center";document.body.append(a)}a.textContent=t}
window.addEventListener("message",e=>{if(e.source!==window||!e.data||!TIPOS.includes(e.data.tipo))return;
fetch("/api/"+S+"/msg?"+qs,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e.data),keepalive:true}).then(r=>{if(r.status===403)aviso("Este QR Code não é válido. Chame o garçom.");if(r.status===429)aviso("Muitos pedidos em pouco tempo. Aguarde um instante.")}).catch(()=>{})});
const es=new EventSource("/api/"+S+"/stream?"+qs);es.onmessage=ev=>{try{window.postMessage(JSON.parse(ev.data),"*")}catch(x){}};
const E=${js(estadoCliente(r.slug))};setTimeout(()=>{E.forEach(m=>window.postMessage(m,"*"))},300);})();</script></body>`;
  return h.replace('</body>', ponte);
}

const LIMPAR = [ // tira os dados de demonstração do painel de produção
  [/Object\.assign\(mesas\[\d+\],\{.*?\}\);/g, ''],
  [/const reservas=\[\[.*?\]\];/, 'const reservas=[];'],
  [/const crm=\[\[.*?\]\];/, 'const crm=[];'],
  [/const fila=\[\{.*?\}\];/, 'const fila=[];'],
  [/\$\("#aniv"\)\.innerHTML=\[\[.*?\]\]\.map/, '$("#aniv").innerHTML=[].map'],
  ['let HIST=null,', 'let HIST=[],'],
];
function paginaPainel(r, tv) {
  let h = ler(arquivo(r.slug, 'painel.html', 'restaurante.html'));
  const canal = 'const canal=new BroadcastChannel("casa-brasa-pdv"),site=()=>({postMessage:d=>canal.postMessage(d)});canal.onmessage=e=>window.dispatchEvent(new MessageEvent("message",{data:e.data}));';
  if (!h.includes(canal)) throw new Error('painel: ponto de integração não encontrado (gere de novo com demo-pdv.py)');
  h = h.replace(canal, 'const site=()=>({postMessage:d=>window.__cmEnviar(d)});');
  for (const [de, para] of LIMPAR) h = h.replace(de, para);
  const ponte = `<style>.demo-menu,#modo-tela,#btn-rel,#btn-zap,#assistente,#btn-ia,#unidade,.bloco:has(#estoque),.kpis2 .k:not(.lucro),nav [data-aba="rede"],nav [data-aba="integracoes"],[data-sub="rede"],[data-sub="integracoes"]{display:none!important}
.login-erro{color:#b23a1e;font-size:14px;font-weight:600;margin:0;min-height:1.2em}</style>
<script>(()=>{const S=${js(r.slug)},MESAS=${+q.nMesas.get(r.id).n},NOME=${js(r.nome)},TV=new URLSearchParams(location.search).has("tv");
let tok=null;try{tok=sessionStorage.getItem("cm-tok-"+S)}catch(e){}
window.__cmSync=true;let APLICANDO=false,REPLAY=true;const EU=Math.random().toString(36).slice(2),fila=[];let enviando=false;
const CFG_IDS=["c-aceite","c-serv","c-pct","c-balcao"];
function faixa(on){let f=document.getElementById("cm-offline");if(!f){f=document.createElement("div");f.id="cm-offline";f.style.cssText="position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:90;padding:10px 16px;border-radius:10px;background:#b23a1e;color:#fff;font:600 14px system-ui;display:none";f.textContent="Sem conexão com o servidor: as ações entram assim que voltar.";document.body.append(f)}f.style.display=on?"block":"none"}
async function despacha(){if(enviando)return;enviando=true;while(fila.length){const d=fila[0];try{const r=await fetch("/api/"+S+"/msg?papel=painel&token="+encodeURIComponent(tok),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)});if(r.status===401){sair();break}fila.shift();faixa(false)}catch(e){faixa(true);await new Promise(x=>setTimeout(x,2000))}}enviando=false}
function acao(d){fila.push(Object.assign({tipo:"acao",de:EU},d));despacha()}
document.addEventListener("click",e=>{if(APLICANDO||TV)return;const el=e.target.closest("[data-k]");if(!el)return;e.preventDefault();e.stopImmediatePropagation();const k=el.dataset.k;
if(k.startsWith("esg-")){const id=k.slice(4);return acao({a:"esg",id,on:!esgot.has(id)})}if(k.startsWith("pro-")){const i=+k.slice(4);return acao({a:"promo",i,on:!PROMOS[i].ativa})}acao({a:"k",k})},true);
document.addEventListener("change",e=>{if(APLICANDO||REPLAY||!e.isTrusted||!CFG_IDS.includes(e.target.id))return;acao({a:"cfg",id:e.target.id,v:e.target.type==="checkbox"?e.target.checked:e.target.value})},true);
function aplicar(d){APLICANDO=true;try{
 if(d.a==="k"){const el=document.querySelector('[data-k="'+CSS.escape(d.k)+'"]');if(el)el.click()}
 else if(d.a==="esg"){if(esgot.has(d.id)!==!!d.on){const el=document.querySelector('[data-k="esg-'+CSS.escape(d.id)+'"]');if(el)el.click()}}
 else if(d.a==="promo"){const x=PROMOS[d.i];if(x&&!!x.ativa!==!!d.on){const el=document.querySelector('[data-k="pro-'+d.i+'"]');if(el)el.click()}}
 else if(d.a==="fechar"){if(typeof descMesa!=="undefined")descMesa[d.mesa]=d.desc||0;window.__fechar(d.mesa)}
 else if(d.a==="retirado"){const o=balcao.find(x=>String(x.num)===String(d.num));window.__retirar(o)}
 else if(d.a==="cancelar")window.__cancelar(d.chave,d.mot);
 else if(d.a==="pedido")window.__lancar(d.p);
 else if(d.a==="cfg"&&d.de!==EU){const el=document.getElementById(d.id);if(el){if(el.type==="checkbox")el.checked=d.v;else el.value=d.v;el.dispatchEvent(new Event("change"))}}
}catch(x){console.error(x)}finally{APLICANDO=false}}
function aplicarEstado(e){APLICANDO=true;try{
 for(const it of Object.values(e.edits||{})){const m=MENU.find(x=>x.id===it.id);if(m){if(it.nome)m.nome=it.nome;if(it.preco)m.preco=+it.preco;if(it.categoria)m.cat=it.categoria}else MENU.push({id:it.id,nome:it.nome,cat:it.categoria,preco:+it.preco,opc:0})}
 if(typeof cardapio==="function")cardapio();
 for(const id of Object.keys(e.esgotados||{}))if(!esgot.has(id))setEsgotado(id,true);
 for(const pr of Object.values(e.promos||{})){const x=PROMOS.find(y=>y.id===pr.id);if(x)x.ativa=!!pr.ativa}if(typeof promos==="function")promos();
 for(const [id,v] of Object.entries(e.cfg||{})){const el=document.getElementById(id);if(!el)continue;if(el.type==="checkbox")el.checked=v;else el.value=v;el.dispatchEvent(new Event("change"))}
}catch(x){console.error(x)}finally{APLICANDO=false}}
window.__cmEnviar=d=>{if(!tok||TV||REPLAY)return;fetch("/api/"+S+"/msg?papel=painel&token="+encodeURIComponent(tok),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}).then(r=>{if(r.status===401)sair()}).catch(()=>{})};
let es=null;function conectar(){if(es)es.close();es=new EventSource("/api/"+S+"/stream?papel="+(TV?"tv":"painel")+"&token="+encodeURIComponent(tok));
es.onmessage=ev=>{let d;try{d=JSON.parse(ev.data)}catch(x){return}if(TV){if(d.tipo==="tv-estado")tela(d);return}
if(d.tipo==="estado-painel"){REPLAY=true;aplicarEstado(d);return}
if(d.tipo==="replay-fim"){REPLAY=false;faixa(false);if(typeof tv==="function")tv();return}
if(d.tipo==="acao"){aplicar(d);return}
if(d.tipo==="menu-painel"){if(d.de!==EU)aplicarEstado({edits:{[d.item.id]:d.item}});return}
window.dispatchEvent(new MessageEvent("message",{data:d}))};
es.onerror=()=>{faixa(true);if(es.readyState===2)setTimeout(conectar,3000)};es.onopen=()=>faixa(false)}
function sair(){tok=null;try{sessionStorage.removeItem("cm-tok-"+S)}catch(e){}document.getElementById("login").hidden=false}
let ultima="";function tela(d){document.getElementById("tv-prep").innerHTML=d.prep;const a=document.getElementById("tv-agora");a.className=d.agoraCls;a.innerHTML=d.agora;document.getElementById("tv-prontos").innerHTML=d.prontos;
if(d.chave&&d.chave!==ultima){ultima=d.chave;a.classList.add("chama");try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=990;g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.6);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.6)}catch(e){}}}
function iniciar(){document.getElementById("login").hidden=true;
if(!TV){window.__fechar=window.fecharMesa;window.fecharMesa=function(n){if(APLICANDO)return window.__fechar(n);acao({a:"fechar",mesa:n,desc:(typeof descMesa!=="undefined"&&descMesa[n])||0})};
window.__retirar=window.retirar;window.retirar=function(o){if(APLICANDO)return window.__retirar(o);if(o)acao({a:"retirado",num:o.num})};
window.__cancelar=window.cmCancelar;window.cmCancelar=function(ch,mot){if(APLICANDO)return window.__cancelar(ch,mot);acao({a:"cancelar",chave:ch,mot})};
window.__lancar=window.lancarPedido;window.lancarPedido=function(p){if(APLICANDO)return window.__lancar(p);acao({a:"pedido",p})};
const _menu=window.__cmEnviar;window.__cmEnviar=d=>{if(d&&d.tipo==="menu")d.de=EU;_menu(d)};
for(const f of ["bip","notificar","avisar"]){const o=window[f];if(typeof o==="function")window[f]=function(){if(!REPLAY)return o.apply(this,arguments)}}
let fu="";try{fu=sessionStorage.getItem("cm-func-"+S)||""}catch(e){}if(fu&&fu!=="gerente"){const sel=document.getElementById("funcao");sel.value=fu;sel.dispatchEvent(new Event("change"))}}
conectar();
if(TV){window.tv=function(){};document.getElementById("tv").hidden=false;return}
if(MESAS&&typeof setMesas==="function")setMesas(MESAS);if(typeof marcar==="function"&&NOME&&NOME!==MARCA.nome)marcar(NOME,NOME.split(/\\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase(),MARCA.cor);
const _tv=window.tv;let t=null;window.tv=function(){_tv.apply(this,arguments);clearTimeout(t);t=setTimeout(()=>{const a=document.getElementById("tv-agora");window.__cmEnviar({tipo:"tv-estado",prep:document.getElementById("tv-prep").innerHTML,agora:a.innerHTML,agoraCls:a.className.replace(" chama",""),chave:a.dataset.num||"",prontos:document.getElementById("tv-prontos").innerHTML})},250)}}
document.addEventListener("DOMContentLoaded",()=>{const box=document.querySelector(".login-box"),err=document.createElement("p");err.className="login-erro";box.insertBefore(err,document.getElementById("login-ok"));
document.getElementById("login-email").value="";document.getElementById("login-senha").value="";document.querySelector(".login-box .nota").textContent=NOME+(TV?" · Tela da TV":" · Painel");
document.getElementById("login-ok").onclick=async()=>{err.textContent="";try{const r=await fetch("/api/"+S+"/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:document.getElementById("login-email").value,senha:document.getElementById("login-senha").value})});
if(!r.ok){err.textContent=r.status===429?"Muitas tentativas. Espere um minuto.":"E-mail ou senha incorretos.";return}const d=await r.json();tok=d.token;try{sessionStorage.setItem("cm-tok-"+S,tok);sessionStorage.setItem("cm-func-"+S,d.funcao||"")}catch(e){}
if(typeof usuario!=="undefined")usuario=d.nome+" ("+d.funcao+")";iniciar()}catch(e){err.textContent="Sem conexão com o servidor."}};
if(tok)iniciar();else document.getElementById("login").hidden=false})})();</script></head>`;
  return h.replace('</head>', ponte);
}

// ---------- http
const TIPOS_ARQ = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const SEGURANCA = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' };
function responde(res, cod, corpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(cod, { 'Content-Type': tipo, 'Cache-Control': 'no-store', ...SEGURANCA });
  res.end(typeof corpo === 'string' || Buffer.isBuffer(corpo) ? corpo : JSON.stringify(corpo));
}
function corpoJSON(req, limite = 65536) {
  return new Promise((ok, erro) => {
    let n = 0; const partes = [];
    req.on('data', (b) => { n += b.length; if (n > limite) { erro(new Error('grande')); req.destroy(); } else partes.push(b); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(partes).toString() || '{}')); } catch (e) { erro(e); } });
  });
}
const tentativas = new Map(); // limite de tentativas de login por IP
function muitasTentativas(ip) { const agora = Date.now(), l = (tentativas.get(ip) || []).filter((t) => agora - t < 60000); tentativas.set(ip, l); return l.length >= 8; }

const PUBLICOS = { '/': 'comanda-mais.html', '/index.html': 'comanda-mais.html', '/privacidade.html': 'privacidade.html', '/termos.html': 'termos.html', '/demonstracao': 'sistema.html', '/sistema.html': 'sistema.html' };

const servidor = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const partes = u.pathname.split('/').filter(Boolean);
    if (u.pathname === '/saude') {
      let banco = 'ok'; try { db.prepare('SELECT 1').get(); } catch (e) { banco = 'erro'; }
      let conexoes = 0; for (const s of salas.values()) conexoes += s.size;
      return responde(res, banco === 'ok' ? 200 : 503, { ok: banco === 'ok', banco, conexoes, ligado_ha_min: Math.round((Date.now() - INICIO) / 60000) });
    }
    if ((u.pathname === '/demo' || u.pathname === '/demo/') && DEMO) return responde(res, 200, paginaDemo(), 'text/html; charset=utf-8');

    // arquivos públicos: landing, páginas legais, demonstração, imagens e vídeo da landing
    if (PUBLICOS[u.pathname]) return responde(res, 200, fs.readFileSync(path.join(SITE, PUBLICOS[u.pathname])), TIPOS_ARQ['.html']);
    if (partes[0] === 'comanda-mais' && partes.length >= 2) {
      const alvo = path.resolve(SITE, 'comanda-mais', ...partes.slice(1));
      if (!alvo.startsWith(path.join(SITE, 'comanda-mais') + path.sep) || !fs.existsSync(alvo)) return responde(res, 404, 'Não encontrado', 'text/plain');
      res.writeHead(200, { 'Content-Type': TIPOS_ARQ[path.extname(alvo)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400', ...SEGURANCA });
      return fs.createReadStream(alvo).pipe(res);
    }

    // ---------- API
    if (partes[0] === 'api' && partes[1]) {
      const r = q.rest.get(partes[1]);
      if (!r) return responde(res, 404, { erro: 'restaurante' });
      const acao = partes[2], papel = u.searchParams.get('papel');

      if (acao === 'login' && req.method === 'POST') {
        const ip = req.socket.remoteAddress;
        if (muitasTentativas(ip)) return responde(res, 429, { erro: 'tentativas' });
        const d = await corpoJSON(req);
        const us = q.user.get(r.id, String(d.email || '').trim().toLowerCase());
        if (!us || !confereSenha(d.senha || '', us.senha)) { tentativas.get(ip).push(Date.now()); return responde(res, 401, { erro: 'login' }); }
        return responde(res, 200, { token: assina({ slug: r.slug, uid: us.id, funcao: us.funcao, exp: Date.now() + 14 * 3600e3 }), nome: us.nome, funcao: us.funcao });
      }

      // quem está falando: cliente (mesa + código do QR) ou equipe (token do login)
      let cli = null, equipe = null;
      if (papel === 'cliente') {
        const mesa = u.searchParams.get('mesa') || '0';
        const m = q.mesa.get(r.id, +mesa);
        if (!m || m.token !== u.searchParams.get('t')) return responde(res, 403, { erro: 'qr' });
        cli = { mesa: mesa === '0' ? '' : mesa, cid: String(u.searchParams.get('cid') || '').slice(0, 64) };
      } else if (papel === 'painel' || papel === 'tv') {
        equipe = confereToken(u.searchParams.get('token'), r.slug);
        if (!equipe) return responde(res, 401, { erro: 'login' });
      } else return responde(res, 400, { erro: 'papel' });

      if (acao === 'stream' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no', ...SEGURANCA });
        res.write('retry: 3000\n\n');
        const c = { papel, mesa: cli ? cli.mesa : '', cid: cli ? cli.cid : '', res };
        sala(r.slug).add(c);
        req.on('close', () => sala(r.slug).delete(c));
        if (papel === 'painel') {
          envia(c, Object.assign({ tipo: 'estado-painel' }, estado(r.slug)));
          for (const e of q.doDia.all(r.id)) {
            if (!((e.papel === 'cliente' && ['pedido', 'garcom', 'conta'].includes(e.tipo)) || e.tipo === 'acao')) continue;
            envia(c, Object.assign(JSON.parse(e.dados), { _id: e.id }));
          }
          envia(c, { tipo: 'replay-fim' });
        }
        if (papel === 'tv' && ultimaTV.has(r.slug)) envia(c, ultimaTV.get(r.slug));
        return;
      }

      if (acao === 'msg' && req.method === 'POST') {
        const d = await corpoJSON(req);
        if (!d || typeof d.tipo !== 'string') return responde(res, 400, { erro: 'msg' });
        if (cli) {
          if (!DO_CLIENTE.has(d.tipo)) return responde(res, 400, { erro: 'tipo' });
          d.mesa = cli.mesa; // a mesa vem do QR, nunca do que o celular diz
          if (d.tipo === 'pedido') {
            if (!Array.isArray(d.itens) || !d.itens.length || d.itens.length > 60 || !conferePrecos(r.slug, d)) return responde(res, 400, { erro: 'itens' });
            const num = Number(d.num);
            if (q.pedidoExiste.get(r.id, num, cli.cid)) { paraClientes(r.slug, { tipo: 'recebido', num }); return responde(res, 200, { ok: true, repetido: true }); }
            if (cli.mesa && q.pedidosMinuto.get(r.id, cli.mesa).n >= 6) return responde(res, 429, { erro: 'limite' });
            numDoCliente.set(`${r.slug}:${num}`, cli.cid);
            d._id = Number(q.evento.run(r.id, 'cliente', d.tipo, num, cli.mesa, cli.cid, JSON.stringify(d)).lastInsertRowid);
            paraPainel(r.slug, d);
            paraClientes(r.slug, { tipo: 'recebido', num }); // guardado no servidor: o celular pode parar de reenviar
            return responde(res, 200, { ok: true });
          }
          if (GUARDAR.has(d.tipo)) d._id = Number(q.evento.run(r.id, 'cliente', d.tipo, null, cli.mesa, cli.cid, JSON.stringify(d)).lastInsertRowid);
          paraPainel(r.slug, d);
          // Pix pago pelo celular: o servidor libera a mesa (no sistema final, quem confirma é o banco)
          if (d.tipo === 'conta' && d.pago && cli.mesa) setTimeout(() => guardaAcao(r, { tipo: 'acao', a: 'fechar', mesa: cli.mesa, desc: 0 }, 'servidor'), 1200);
          return responde(res, 200, { ok: true });
        }
        if (equipe && papel === 'painel') {
          if (!DO_PAINEL.has(d.tipo)) return responde(res, 400, { erro: 'tipo' });
          if (d.tipo === 'acao') {
            if (!ACOES.has(d.a)) return responde(res, 400, { erro: 'acao' });
            if (d.a === 'pedido' && d.p) { if (!Array.isArray(d.p.itens) || !conferePrecos(r.slug, d.p)) return responde(res, 400, { erro: 'itens' }); }
            guardaAcao(r, d); return responde(res, 200, { ok: true, _id: d._id });
          }
          if (d.tipo === 'tv-estado') { ultimaTV.set(r.slug, d); paraTV(r.slug, d); return responde(res, 200, { ok: true }); }
          if (repetida(r.slug, d)) return responde(res, 200, { ok: true, repetida: true });
          registraEstado(r.slug, d);
          if (d.tipo === 'menu' && d.item) paraPainel(r.slug, { tipo: 'menu-painel', item: d.item, de: d.de });
          if (d.tipo === 'promo') { const c = cardapio(r.slug); for (const [id, pr] of Object.entries(d.precos || {})) { if (d.ativa) c.promo.set(id, Number(pr)); else c.promo.delete(id); } }
          if (d.tipo === 'menu' && d.item) { const c = cardapio(r.slug), x = c.porId.get(d.item.id) || { id: d.item.id, extraMax: 0 }; if (d.item.nome) { c.porNome.delete(x.nome); x.nome = d.item.nome; } if (d.item.preco) x.preco = Number(d.item.preco); c.porId.set(x.id, x); c.porNome.set(x.nome, x); }
          if (GUARDAR.has(d.tipo)) q.evento.run(r.id, 'painel', d.tipo, d.num != null ? Number(d.num) : null, d.mesa != null ? String(d.mesa) : null, null, JSON.stringify(d));
          paraClientes(r.slug, d);
          return responde(res, 200, { ok: true });
        }
        return responde(res, 403, { erro: 'papel' });
      }
      return responde(res, 404, { erro: 'acao' });
    }

    // ---------- páginas de cada restaurante: /slug/mesa/5?t=..., /slug/balcao?t=..., /slug/painel, /slug/tv
    if (partes.length >= 2) {
      const r = q.rest.get(partes[0]);
      if (!r) return responde(res, 404, 'Restaurante não encontrado', 'text/plain; charset=utf-8');
      const t = u.searchParams.get('t') || '';
      if (partes[1] === 'mesa' && partes[2]) {
        const m = q.mesa.get(r.id, +partes[2]);
        if (!m || m.token !== t) return responde(res, 403, '<h1 style="font-family:system-ui">QR Code inválido</h1><p style="font-family:system-ui">Chame o garçom.</p>', TIPOS_ARQ['.html']);
        return responde(res, 200, paginaCliente(r, +partes[2], t, false), TIPOS_ARQ['.html']);
      }
      if (partes[1] === 'balcao') {
        const m = q.mesa.get(r.id, 0);
        if (!m || m.token !== t) return responde(res, 403, '<h1 style="font-family:system-ui">QR Code inválido</h1>', TIPOS_ARQ['.html']);
        return responde(res, 200, paginaCliente(r, 0, t, true), TIPOS_ARQ['.html']);
      }
      if (partes[1] === 'painel') return responde(res, 200, paginaPainel(r, false), TIPOS_ARQ['.html']);
      if (partes[1] === 'tv') { res.writeHead(302, { Location: `/${r.slug}/painel?tv=1` }); return res.end(); }
      if (partes[1] === 'qrcodes') { const f = path.join(DADOS, 'restaurantes', r.slug, 'qrcodes.html'); return fs.existsSync(f) ? responde(res, 200, ler(f), TIPOS_ARQ['.html']) : responde(res, 404, 'Gere com: python3 admin.py qrcodes ' + r.slug, 'text/plain; charset=utf-8'); }
    }
    responde(res, 404, 'Não encontrado', 'text/plain; charset=utf-8');
  } catch (e) {
    console.error(e); alerta('erro na página ' + req.url.split('?')[0] + ': ' + e.message);
    if (!res.headersSent) responde(res, 500, { erro: 'interno' });
  }
});
// ---------- demonstração online (/demo): restaurante "demo" com dados apagados a cada 4 horas
function criaDemo() {
  let r = db.prepare("SELECT * FROM restaurantes WHERE slug = 'demo'").get();
  if (!r) { db.prepare("INSERT INTO restaurantes (slug, nome, plano) VALUES ('demo', 'Casa Brasa', 'Mesa Completa')").run(); r = db.prepare("SELECT * FROM restaurantes WHERE slug = 'demo'").get(); }
  for (let n = 0; n <= 6; n++) db.prepare('INSERT OR IGNORE INTO mesas (restaurante_id, numero, token) VALUES (?, ?, ?)').run(r.id, n, crypto.randomBytes(9).toString('base64url'));
  const sal = crypto.randomBytes(16), hash = crypto.scryptSync('demonstracao', sal, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  for (const [nome, email, funcao] of [['Gerente', 'gerente@demo.com', 'gerente'], ['Cozinha', 'cozinha@demo.com', 'cozinha'], ['Garçom', 'garcom@demo.com', 'mesas']])
    db.prepare("INSERT INTO usuarios (restaurante_id, nome, email, senha, funcao) VALUES (?, ?, ?, ?, ?) ON CONFLICT(restaurante_id, email) DO NOTHING").run(r.id, nome, email, `scrypt$${sal.toString('hex')}$${hash}`, funcao);
  const limpa = () => { db.prepare("DELETE FROM eventos WHERE restaurante_id = ? AND criado_em < datetime('now', '-4 hours')").run(r.id); };
  limpa(); setInterval(limpa, 3600e3);
  return r;
}
const DEMO = process.env.COMANDA_DEMO === '0' ? null : criaDemo();
function paginaDemo(base) {
  const m = (n) => db.prepare('SELECT token FROM mesas WHERE restaurante_id = ? AND numero = ?').get(DEMO.id, n).token;
  const link = (u, t) => `<a href="${u}" target="_blank">${t}</a>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comanda+ · Demonstração ao vivo</title>
<style>body{margin:0;font:17px/1.6 system-ui;background:#f6efe4;color:#2b2018}main{width:min(760px,100% - 32px);margin:40px auto}h1{font:600 34px Georgia,serif;margin:0 0 6px}b{color:#b23a1e}
.c{background:#fff;border:1px solid #e4d9c7;border-radius:14px;padding:18px 20px;margin:14px 0}a{color:#b23a1e;font-weight:700}code{background:#f1e9dc;padding:2px 6px;border-radius:6px}</style></head><body><main>
<h1>Comanda+ · demonstração ao vivo</h1><p>Use aparelhos diferentes de verdade. Os dados desta demonstração são apagados a cada 4 horas.</p>
<div class="c"><h3>1. No computador ou tablet: o painel</h3>${link('/demo/painel', 'Abrir o painel')} · e-mail <code>gerente@demo.com</code> · senha <code>demonstracao</code><br>
Cozinha: <code>cozinha@demo.com</code> · Garçom: <code>garcom@demo.com</code> (mesma senha), cada um num aparelho.</div>
<div class="c"><h3>2. No celular: o cliente</h3>${[1, 2, 3].map((n) => link(`/demo/mesa/${n}?t=${m(n)}`, 'Mesa ' + n)).join(' · ')} · ${link(`/demo/balcao?balcao=1&t=${m(0)}`, 'Balcão')}<br>Dica: mande estes links para o seu celular pelo WhatsApp.</div>
<div class="c"><h3>3. Numa TV ou outra aba: as senhas</h3>${link('/demo/tv', 'Abrir a TV')} (mesmo login do painel)</div>
</main></body></html>`;
}

// ---------- monitoramento: /saude, registro de erros e alerta opcional (ALERTA_WEBHOOK: Discord, Slack, Telegram via bot)
const INICIO = Date.now();
function alerta(texto) {
  fs.appendFileSync(path.join(DADOS, 'erros.log'), `${new Date().toISOString()} ${texto}\n`);
  if (process.env.ALERTA_WEBHOOK) fetch(process.env.ALERTA_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: `Comanda+: ${texto}`, text: `Comanda+: ${texto}` }) }).catch(() => {});
}
process.on('uncaughtException', (e) => { alerta('erro grave: ' + e.message); console.error(e); });
process.on('unhandledRejection', (e) => { alerta('erro: ' + (e && e.message)); });
servidor.listen(PORTA, () => { console.log(`Comanda+ no ar na porta ${PORTA} (dados em ${DADOS})`); alerta('servidor iniciado'); });
