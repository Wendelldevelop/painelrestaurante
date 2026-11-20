// balcão com senha + TV, e várias unidades com painel da rede
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site'); const ver = (v) => p.click(`.troca [data-ver="${v}"]`);
  // cliente pede para retirar no balcão (sem aceite do garçom)
  await f.locator('[data-add]').nth(2).click(); await p.waitForTimeout(200);
  await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  await f.locator('input[name=tipo][value=retirada]').check(); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(400);
  ok('pede nome no balcão', await f.locator('#enviar-pedido').count() === 1, 'enviou sem nome');
  await f.locator('input[name=nome]').fill('Rafa'); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(500);
  ok('tela de pagamento', await f.locator('[data-pagar="pix"]').count() === 1, 'sem pagamento'); await f.locator('[data-pagar="pix"]').click(); await p.waitForTimeout(800);
  const st1 = await f.locator('#status-pedido').textContent(); ok('senha no celular', /senha:? 041/i.test(st1), st1);
  ok('sem botões de mesa', await f.locator('[data-chamar]').count() === 0, 'tem chamar garçom');
  await ver('restaurante'); ok('sem aceite', await p.locator('.alerta').count() === 0, 'pediu aceite');
  const card = await p.locator('#cozinha-Recebido .card').first().textContent(); ok('cartão com senha', /senha 041/.test(card), card);
  ok('cor do balcão e pago', await p.locator('#cozinha-Recebido .card.balc-c').count() === 1 && /Pago no Pix/.test(card), card);
  await p.locator('#cozinha-Recebido [data-av]').first().click(); await p.waitForTimeout(300);
  await ver('tv'); await p.waitForTimeout(300);
  const tv = await p.locator('#tv-agora').textContent(); ok('TV chama a senha', /041/.test(tv) && /Rafa/.test(tv), tv);
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-tv.png' });
  await ver('cliente'); const st2 = await f.locator('#status-pedido').textContent(); ok('celular avisa', /retire no balcão/.test(st2), st2);
  await ver('restaurante'); await p.evaluate(() => document.querySelector('nav [data-aba="balcao"]').click()); await p.click('[data-retirado]'); await p.waitForTimeout(200);
  ok('saiu da TV', !/041/.test(await p.locator('#tv-agora').textContent()), 'ainda na TV');
  // pagar no caixa: só vai para a cozinha depois que o caixa confirma
  await ver('cliente'); await f.locator('a:has-text("Pedir mais")').click().catch(() => {}); await f.locator('.barra-cel a').first().click(); await p.waitForTimeout(600);
  await f.locator('[data-add]').nth(3).click(); await p.waitForTimeout(200); await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  await f.locator('input[name=tipo][value=retirada]').check(); await f.locator('input[name=nome]').fill('Bia'); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(400);
  await f.locator('[data-pagar="caixa"]').click(); await p.waitForTimeout(800);
  ok('senha e pagar no caixa', /Pague .* no caixa/.test(await f.locator('#status-pedido').textContent()), await f.locator('#status-pedido').textContent());
  await ver('restaurante'); await p.evaluate(() => document.querySelector('nav [data-aba="cozinha"]').click());
  const antes = await p.locator('#cozinha-Recebido .card').count(); await p.locator('.alerta [data-ok]').click(); await p.waitForTimeout(300);
  ok('caixa libera para a cozinha', await p.locator('#cozinha-Recebido .card').count() === antes + 1 && /Pago no caixa/.test(await p.locator('#cozinha-Recebido .card').first().textContent()), 'não entrou');
  // rede de lojas
  await p.evaluate(() => document.querySelector('nav [data-aba="rede"]').click()); await p.waitForTimeout(200);
  ok('3 lojas', await p.locator('#r-lojas tr').count() === 3, await p.locator('#r-lojas tr').count());
  await p.click('#nova-unidade'); ok('nova unidade', await p.locator('#r-lojas tr').count() === 4 && await p.locator('#unidade option').count() === 4, 'nao criou');
  await p.selectOption('#unidade', 'jardins'); ok('aviso da unidade', /Jardins/.test(await p.locator('#aviso-unidade').textContent()), 'sem aviso');
  if (process.env.FOTO) { await p.selectOption('#unidade', 'centro'); await p.screenshot({ path: process.env.FOTO + '-rede.png' }); }
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
