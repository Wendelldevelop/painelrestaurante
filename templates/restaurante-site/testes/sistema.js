// sistema.html: um arquivo só, com a escolha Cliente | Restaurante no topo
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html#semlogin'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site');
  await f.locator('[data-add]').nth(2).click(); await p.waitForTimeout(300);
  await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500);
  await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(800);
  await f.locator('#enviar-pedido').click(); await p.waitForTimeout(800);
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-cliente.png' });
  const aviso = await p.locator('#b-troca').textContent();
  await p.click('.troca [data-ver="restaurante"]'); await p.waitForTimeout(300);
  await p.locator('.alerta [data-ok]').click(); await p.waitForTimeout(300);
  await p.locator('.card button').first().click(); await p.waitForTimeout(500);
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-rest.png' });
  await p.click('.troca [data-ver="cliente"]'); await p.waitForTimeout(300);
  const st = await f.locator('#status-pedido').textContent();
  const ok = aviso === '1' && /preparo|Pronto/i.test(st) && !errs.length;
  console.log(ok ? 'FALHAS 0' : 'FALHA', aviso, st, errs);
  await b.close();
})();
