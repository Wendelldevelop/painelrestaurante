// cliente.html e restaurante.html abertos em janelas separadas do mesmo navegador
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const errs = [];
  const r = await ctx.newPage(); r.on('pageerror', e => errs.push(e.message)); await r.goto(RAIZ + 'restaurante.html#semlogin');
  const c = await ctx.newPage(); await c.setViewportSize({ width: 390, height: 800 }); c.on('pageerror', e => errs.push(e.message));
  await c.goto(RAIZ + 'cliente.html?mesa=3#cardapio'); await c.waitForTimeout(1500);
  await c.locator('[data-add]').first().click(); await c.waitForTimeout(300);
  await c.locator('.barra-cel [data-abrir-pedido]').click(); await c.waitForTimeout(500);
  await c.locator('#gaveta a.btn-pri').click(); await c.waitForTimeout(800);
  await c.locator('#enviar-pedido').click(); await c.waitForTimeout(1000);
  const chegou = await r.locator('.alerta').count();
  await r.locator('.alerta [data-ok]').click(); await r.waitForTimeout(300);
  await r.locator('.card button').first().click(); await r.waitForTimeout(500);
  const st = await c.locator('#status-pedido').textContent();
  await c.locator('[data-chamar="conta"]').first().click(); await c.waitForTimeout(700);
  const conta = await c.locator('.pagina-conta #v-total').textContent();
  await c.selectOption('#pessoas', '2'); await c.locator('[data-fechar-conta]').click(); await c.waitForTimeout(700);
  const aviso = await r.locator('.alerta').first().textContent();
  await r.locator('[data-pago]').click(); await c.waitForTimeout(700);
  const fim = await c.locator('h1').first().textContent();
  await r.locator('#modo-tela').click(); await r.setViewportSize({ width: 1280, height: 900 });
  if (process.env.FOTO) { await r.screenshot({ path: process.env.FOTO + '-cel.png' }); await r.locator('#modo-tela').click(); await r.locator('nav [data-aba="mesas"]').click(); await r.waitForTimeout(500); await r.screenshot({ path: process.env.FOTO + '-pc.png' }); await c.screenshot({ path: process.env.FOTO + '-cliente.png' }); }
  const ok = chegou === 1 && /preparo|Pronto/i.test(st) && /R\$/.test(conta) && /maquininha/.test(aviso) && /Obrigado/.test(fim) && !errs.length;
  console.log(ok ? 'FALHAS 0' : 'FALHA', chegou, st, conta, aviso, fim, errs);
  await b.close();
})();
