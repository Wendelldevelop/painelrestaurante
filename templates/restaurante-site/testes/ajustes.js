// 🖨 no pedido pronto, horário no site, Pix pelo celular, estoque e cardápio em inglês/espanhol
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site'); const ver = (v) => p.click(`.troca [data-ver="${v}"]`), aba = (a) => p.evaluate(x => document.querySelector(`nav [data-aba="${x}"]`).click(), a);
  // cardápio em inglês; cozinha recebe em português
  await f.locator('[data-lang="en"]').click(); await p.waitForTimeout(500);
  const en = await f.locator('#conteudo').textContent(); ok('inglês', /Garlic shrimp/.test(en) && /Starters/.test(en), 'sem tradução');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-en.png' });
  await f.locator('[data-add="camarao-alho"]').first().click(); await p.waitForTimeout(200); await f.locator('[data-add="camarao-alho"]').first().click(); await p.waitForTimeout(200);
  await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  await f.locator('#enviar-pedido').click(); await p.waitForTimeout(600);
  await ver('restaurante'); await p.locator('.alerta [data-ok]').click(); await p.waitForTimeout(300);
  ok('cozinha em português', /Camarão no alho/.test(await p.locator('#cozinha-Recebido .card').first().textContent()), 'nome');
  // estoque: 2 camarões = 0,4 kg → abaixo do mínimo
  await aba('cardapio'); ok('estoque baixou', /0,8 kg/.test(await p.locator('#estoque').textContent()), await p.locator('#estoque').textContent());
  // 🖨 continua no pedido pronto
  await aba('cozinha'); await p.locator('#cozinha-Recebido [data-av]').first().click(); await p.locator('#cozinha-Em\\ preparo [data-av]').first().click(); await p.waitForTimeout(200);
  ok('🖨 no pronto', await p.locator('#cozinha-Pronto .card [data-imp]').count() === 1, 'sem botão');
  // detalhe do pedido com horário de cada etapa
  await aba('pedidos'); await p.locator('#lista-pedidos tr.clic').first().click(); await p.waitForTimeout(200);
  ok('detalhe do pedido', await p.locator('.linha-tempo li').count() >= 3, await p.locator('.linha-tempo li').count()); await p.click('[data-cancelar]');
  // Pix pelo celular
  await ver('cliente'); await f.locator('[data-chamar="conta"]').first().click(); await p.waitForTimeout(700);
  await f.locator('input[value="Pix agora"]').check(); ok('QR Pix', await f.locator('#pix-box svg').isVisible(), 'sem QR');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-pix.png' });
  await f.locator('[data-fechar-conta]').click(); await p.waitForTimeout(400);
  await ver('restaurante'); const al = await p.locator('.alerta').first().textContent(); ok('alerta Pix', /Pix pelo celular/.test(al), al);
  await p.click('[data-pago]'); await p.waitForTimeout(400); await ver('cliente'); ok('conta fechada', /Thank|Obrigado/.test(await f.locator('body').textContent()), 'não fechou');
  // horário vai para o site
  await ver('restaurante'); await aba('config'); for (const c of await p.locator('[data-fecha]').all()) await c.check();
  await p.click('#c-hor-ok'); await p.waitForTimeout(300); await ver('cliente');
  ok('site fechado', /Fechado/.test(await f.locator('body').textContent()), 'horário não mudou');
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
