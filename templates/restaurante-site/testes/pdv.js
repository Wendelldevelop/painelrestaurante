const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(RAIZ+'demo-pdv.html');await p.waitForTimeout(2500);
const f=p.frameLocator('#site');

await f.locator('[data-add]').nth(2).click();await f.locator('[data-add]').nth(5).click();await p.waitForTimeout(300);
await f.locator('.barra-cel [data-abrir-pedido]').click();await p.waitForTimeout(600);
await f.locator('#gaveta a.btn-pri').click();await p.waitForTimeout(800);
await f.locator('#enviar-pedido').click();await p.waitForTimeout(800);
await p.locator('.alerta [data-ok]').click();await p.waitForTimeout(400);
console.log('PDV cards:',await p.locator('#cozinha-Recebido .card, #bar-Recebido .card').count(),await p.locator('#g-fat').textContent());
await f.locator('[data-chamar="conta"]').first().click();await p.waitForTimeout(300);
console.log('alerta conta:',await p.locator('.alerta').count(),'mesa 5:',await p.locator('#mapa .m').nth(4).locator('.s').textContent());
await p.locator('#cozinha-Recebido .card button, #bar-Recebido .card button').first().click();await p.waitForTimeout(500);
console.log('status no celular:',await f.locator('#status-pedido').textContent());

console.log(errs);await b.close()})();
