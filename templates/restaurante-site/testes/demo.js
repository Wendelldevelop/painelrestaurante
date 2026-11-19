// tour guiado, tipo de negócio, marca do cliente e modo apresentação
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site');
  // tour
  await p.click('#tour-btn'); await p.waitForTimeout(400);
  ok('tour abre', /1 DE 8/.test(await p.locator('.tour-card').textContent()), 'sem tour');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-tour.png' });
  for (let i = 0; i < 8; i++) { await p.click('[data-tour-prox]'); await p.waitForTimeout(350); }
  ok('tour fecha', await p.locator('.tour').count() === 0, 'ficou aberto');
  // tipo de negócio
  await p.click('.troca [data-ver="restaurante"]'); await p.click('#btn-demo'); await p.selectOption('#tipo-neg', 'hamburgueria'); await p.waitForTimeout(200);
  ok('hamburgueria esconde reservas', await p.locator('nav [data-aba="reservas"]').isHidden(), 'reservas visível');
  ok('abre balcão', await p.locator('#aba-balcao').isVisible(), 'balcão fechado');
  await p.selectOption('#tipo-neg', 'restaurante');
  // marca
  await p.click('#btn-marca'); await p.fill('#m-nome', 'Burger Top'); await p.fill('#m-ini', 'BT'); await p.click('.cores [data-cor="#2457a6"]'); await p.click('#m-ok'); await p.waitForTimeout(400);
  ok('marca no painel', /Burger Top/.test(await p.locator('header h1').textContent()), 'nome');
  await p.click('.troca [data-ver="cliente"]'); ok('marca no cliente', /Burger Top/.test(await f.locator('body').textContent()), 'cliente');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-marca.png' });
  // modo apresentação
  await p.click('.troca [data-ver="restaurante"]'); await p.click('#btn-demo'); await p.click('#btn-auto'); await p.waitForTimeout(11000);
  const n = await p.locator('#lista-pedidos tr').count(); ok('pedidos automáticos', n >= 3, n);
  if (process.env.FOTO) { await p.evaluate(() => document.querySelector('nav [data-aba="cozinha"]').click()); await p.screenshot({ path: process.env.FOTO + '-auto.png' }); }
  await p.click('#btn-demo'); await p.click('#btn-auto');
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
