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

// pedidos do dia que ainda não terminaram (reenviados quando o painel abre ou recarrega)
const FINAL = /^(Entregue na mesa|Retirado|Recusado|Item cancelado|Pedido cancelado)/;
function pedidosAbertos(rid) {
  const ev = q.doDia.all(rid), abertos = new Map();
  for (const e of ev) {
    const d = JSON.parse(e.dados);
    if (e.tipo === 'pedido') abertos.set(String(e.num), d);
    else if (e.tipo === 'status' && FINAL.test(d.status || '')) abertos.delete(String(e.num));
    else if (e.tipo === 'fechada') for (const [k, p] of abertos) if (String(p.mesa) === String(d.mesa)) abertos.delete(k);
  }
  return [...abertos.values()];
}

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

// ---------- regras de mensagens
const DO_CLIENTE = new Set(['pedido', 'garcom', 'conta', 'ver-conta', 'oi']);
const DO_PAINEL = new Set(['status', 'recebido', 'fechada', 'extrato', 'esgotado', 'promo', 'marca', 'menu', 'horario', 'config', 'tv-estado']);
const GUARDAR = new Set(['pedido', 'garcom', 'conta', 'status', 'fechada', 'esgotado']);

// ---------- páginas
const ler = (p) => fs.readFileSync(p, 'utf8');
function arquivo(slug, nome, padrao) { const prop = path.join(DADOS, 'restaurantes', slug, nome); return fs.existsSync(prop) ? prop : path.join(SITE, padrao); }
const js = (x) => JSON.stringify(x).replace(/</g, '\\u003c');

function paginaCliente(r, mesa, token, balcao) {
  let h = ler(arquivo(r.slug, 'site.html', 'casa-brasa.html'));
  h = h.replace(/"pedidos": (false|true|"painel")/, balcao ? '"pedidos": "painel"' : `"pedidos": "painel", "mesa": ${+mesa}`);
  const ponte = `<script>(()=>{const S=${js(r.slug)},M=${js(balcao ? '' : String(mesa))},T=${js(token)};
const cid=(()=>{try{let c=sessionStorage.getItem("cm-cid");if(!c){c=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem("cm-cid",c)}return c}catch(e){return Math.random().toString(36).slice(2)}})();
const qs="papel=cliente&mesa="+encodeURIComponent(M)+"&t="+encodeURIComponent(T)+"&cid="+cid,TIPOS=${js([...DO_CLIENTE])};
function aviso(t){let a=document.getElementById("cm-aviso");if(!a){a=document.createElement("div");a.id="cm-aviso";a.style.cssText="position:fixed;left:12px;right:12px;top:12px;z-index:999;padding:14px 16px;border-radius:12px;background:#b23a1e;color:#fff;font:600 15px system-ui;text-align:center";document.body.append(a)}a.textContent=t}
window.addEventListener("message",e=>{if(e.source!==window||!e.data||!TIPOS.includes(e.data.tipo))return;
fetch("/api/"+S+"/msg?"+qs,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e.data),keepalive:true}).then(r=>{if(r.status===403)aviso("Este QR Code não é válido. Chame o garçom.");if(r.status===429)aviso("Muitos pedidos em pouco tempo. Aguarde um instante.")}).catch(()=>{})});
const es=new EventSource("/api/"+S+"/stream?"+qs);es.onmessage=ev=>{try{window.postMessage(JSON.parse(ev.data),"*")}catch(x){}};})();</script></body>`;
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
window.__cmEnviar=d=>{if(!tok||TV)return;fetch("/api/"+S+"/msg?papel=painel&token="+encodeURIComponent(tok),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)}).then(r=>{if(r.status===401)sair()}).catch(()=>{})};
let es=null;function conectar(){if(es)es.close();es=new EventSource("/api/"+S+"/stream?papel="+(TV?"tv":"painel")+"&token="+encodeURIComponent(tok));
es.onmessage=ev=>{let d;try{d=JSON.parse(ev.data)}catch(x){return}if(TV){if(d.tipo==="tv-estado")tela(d);return}window.dispatchEvent(new MessageEvent("message",{data:d}))};
es.onerror=()=>{if(es.readyState===2)setTimeout(conectar,3000)}}
function sair(){tok=null;try{sessionStorage.removeItem("cm-tok-"+S)}catch(e){}document.getElementById("login").hidden=false}
let ultima="";function tela(d){document.getElementById("tv-prep").innerHTML=d.prep;const a=document.getElementById("tv-agora");a.className=d.agoraCls;a.innerHTML=d.agora;document.getElementById("tv-prontos").innerHTML=d.prontos;
if(d.chave&&d.chave!==ultima){ultima=d.chave;a.classList.add("chama");try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=990;g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.6);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.6)}catch(e){}}}
function iniciar(){document.getElementById("login").hidden=true;conectar();
if(TV){window.tv=function(){};document.getElementById("tv").hidden=false;return}
if(MESAS&&typeof setMesas==="function")setMesas(MESAS);if(typeof marcar==="function"&&NOME&&NOME!==MARCA.nome)marcar(NOME,NOME.split(/\\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase(),MARCA.cor);
const _tv=window.tv;let t=null;window.tv=function(){_tv.apply(this,arguments);clearTimeout(t);t=setTimeout(()=>{const a=document.getElementById("tv-agora");window.__cmEnviar({tipo:"tv-estado",prep:document.getElementById("tv-prep").innerHTML,agora:a.innerHTML,agoraCls:a.className.replace(" chama",""),chave:a.dataset.num||"",prontos:document.getElementById("tv-prontos").innerHTML})},250)}}
document.addEventListener("DOMContentLoaded",()=>{const box=document.querySelector(".login-box"),err=document.createElement("p");err.className="login-erro";box.insertBefore(err,document.getElementById("login-ok"));
document.getElementById("login-email").value="";document.getElementById("login-senha").value="";document.querySelector(".login-box .nota").textContent=NOME+(TV?" · Tela da TV":" · Painel");
document.getElementById("login-ok").onclick=async()=>{err.textContent="";try{const r=await fetch("/api/"+S+"/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:document.getElementById("login-email").value,senha:document.getElementById("login-senha").value})});
if(!r.ok){err.textContent=r.status===429?"Muitas tentativas. Espere um minuto.":"E-mail ou senha incorretos.";return}const d=await r.json();tok=d.token;try{sessionStorage.setItem("cm-tok-"+S,tok)}catch(e){}
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
    if (u.pathname === '/saude') return responde(res, 200, { ok: true });

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
        if (papel === 'painel') for (const p of pedidosAbertos(r.id)) envia(c, Object.assign({}, p, { reenviado: true }));
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
            q.evento.run(r.id, 'cliente', d.tipo, num, cli.mesa, cli.cid, JSON.stringify(d));
            paraPainel(r.slug, d);
            paraClientes(r.slug, { tipo: 'recebido', num }); // guardado no servidor: o celular pode parar de reenviar
            return responde(res, 200, { ok: true });
          }
          if (GUARDAR.has(d.tipo)) q.evento.run(r.id, 'cliente', d.tipo, null, cli.mesa, cli.cid, JSON.stringify(d));
          paraPainel(r.slug, d);
          return responde(res, 200, { ok: true });
        }
        if (equipe && papel === 'painel') {
          if (!DO_PAINEL.has(d.tipo)) return responde(res, 400, { erro: 'tipo' });
          if (d.tipo === 'tv-estado') { paraTV(r.slug, d); return responde(res, 200, { ok: true }); }
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
    console.error(e);
    if (!res.headersSent) responde(res, 500, { erro: 'interno' });
  }
});
servidor.listen(PORTA, () => console.log(`Comanda+ no ar na porta ${PORTA} (dados em ${DADOS})`));
