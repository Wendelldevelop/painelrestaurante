// cliente.html e restaurante.html abertos em janelas separadas do mesmo navegador
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const errs = [];
  const r = await ctx.newPage(); r.on('pageerror', e => errs.push(e.message)); await r.goto(RAIZ + 'restaurante.html');
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
  console.log(chegou === 1 && /preparo/i.test(st) && !errs.length ? 'FALHAS 0' : 'FALHA', chegou, st, errs);
  await b.close();
})();
