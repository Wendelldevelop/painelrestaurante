const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
for(const [modo,base] of [['unico',RAIZ+'casa-brasa.html'],['pasta',RAIZ+'site/index.html']]){
 for(const [w,h] of [[1440,900],[390,812]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(base);await p.waitForTimeout(1500);
 const vis=(sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').length,sel);
 const r={sw:await p.evaluate(()=>document.documentElement.scrollWidth),add:await vis('[data-add]'),reservar:await vis('a[href*="reservas"]'),pedido:await vis('[data-abrir-pedido]'),insta:await vis('[data-insta], a[href*="instagram"]'),txt:await p.evaluate(()=>/Pedir delivery|Reservar mesa/.test(document.body.innerText))};

 const card=modo==='pasta'?base.replace('index.html','cardapio.html'):base+'#cardapio';await p.goto(card);await p.waitForTimeout(1200);
 r.addCard=await vis('[data-add]');r.roletaAdd=await vis('[data-roleta-add]');r.aviso=await vis('.aviso-mesa');
 await p.click('.exec-item >> nth=1');await p.waitForTimeout(1000);r.roleta=await p.evaluate(()=>document.querySelector('.roleta-nome').textContent);
 await p.goto(card.replace(/#.*$/,'')+'#prato-picanha-brasa');await p.waitForTimeout(1200);r.fichaBarra=await vis('.ficha-barra');r.fichaIngr=await p.evaluate(()=>document.querySelector('.ficha-grupo p')?.textContent);

 if(modo==='unico'){await p.goto(base+'#reservas');await p.waitForTimeout(600);r.rotaReserva=await p.evaluate(()=>location.hash+' '+!!document.getElementById('form-reserva'));}
 if(r.add||r.reservar||r.pedido||r.addCard||r.roletaAdd||r.fichaBarra||r.sw>w||errs.length){process.exitCode=1;console.log('FALHA');}console.log(modo,w,JSON.stringify(r),errs);await p.close();}}
await b.close()})();
