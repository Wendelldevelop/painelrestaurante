// recursos de mercado: adicionais no prato, comanda individual, pedido do garçom, integração com o caixa, relatório
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site'); const R = () => p.click('.troca [data-ver="restaurante"]'), C = () => p.click('.troca [data-ver="cliente"]');
  // integração ligada antes dos pedidos
  await R(); await p.evaluate(() => document.querySelector('nav [data-aba="integracoes"]').click()); await p.click('[data-ig="saipos"]'); await p.waitForTimeout(800); await C();
  // 1) adicionais no prato
  await f.locator('a[href$="#prato-picanha-brasa"]').first().click(); await p.waitForTimeout(700);
  await f.locator('.opc[data-g="0"] [data-o="1"]').click(); await f.locator('.opc[data-g="1"] [data-o="0"]').click();
  const preco = await f.locator('#add-preco').textContent(); ok('preço com adicional', /97,00/.test(preco), preco);
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-prato.png' });
  await f.locator('#add-modal').click(); await p.waitForTimeout(500);
  await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  await f.locator('input[name=nome]').fill('Ana'); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(700);
  await R(); await p.locator('.alerta [data-ok]').click(); await p.waitForTimeout(300);
  const cozinha = await p.locator('#cozinha-Recebido .card').first().textContent(); ok('opções na cozinha', /Fritas/.test(cozinha) && /Queijo coalho/.test(cozinha) && /Ana/.test(cozinha), cozinha);
  // 2) segunda pessoa no mesmo celular
  await C(); await f.locator('a:has-text("Pedir mais")').click(); await p.waitForTimeout(700);
  await f.locator('[data-add]').nth(2).click(); await p.waitForTimeout(200);
  await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  ok('nome lembrado', await f.locator('input[name=nome]').inputValue() === 'Ana', 'sem nome');
  await f.locator('input[name=nome]').fill('Bruno'); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(700);
  // 3) garçom lança pedido para a Carla
  await R(); await p.evaluate(() => document.querySelector('nav [data-aba="mesas"]').click()); await p.click('[data-lancar="5"]');
  await p.fill('#l-pessoa', 'Carla'); await p.locator('.l-it [data-m="1"]').first().click(); await p.locator('.l-it [data-m="1"]').first().click(); await p.click('#l-ok'); await p.waitForTimeout(300);
  ok('pedido do garçom na lista', /lançado pelo garçom/.test(await p.locator('#aba-cozinha').textContent()), 'nao achou');
  // 4) conta com comanda individual
  await C(); await f.locator('[data-chamar="conta"]').first().click(); await p.waitForTimeout(700);
  const nomes = await f.locator('.comanda-nome').count(); ok('3 comandas', nomes === 3, nomes);
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-conta.png' });
  ok('cada um paga o seu', await f.locator('#pessoas').inputValue() === 'pessoa', 'select');
  await f.locator('[data-fechar-conta]').click(); await p.waitForTimeout(600);
  await R(); const aviso = await p.locator('.alerta').first().textContent(); ok('alerta por pessoa', /Ana/.test(aviso) && /Bruno/.test(aviso) && /Carla/.test(aviso), aviso);
  await p.locator('[data-pago]').click(); await p.waitForTimeout(300);
  // 5) integração registrou pedidos e a conta
  await p.evaluate(() => document.querySelector('nav [data-aba="integracoes"]').click());
  const log = await p.locator('#integ-log').textContent(); ok('envios ao caixa', /Conta da mesa 5/.test(log) && (log.match(/Pedido #/g) || []).length === 3, log);
  // 6) relatório do mês
  await p.evaluate(() => document.querySelector('nav [data-aba="gerencia"]').click()); await p.click('#btn-rel'); await p.waitForTimeout(300);
  ok('relatório', /Relatório de/.test(await p.locator('.folha h1').textContent()), 'sem relatório');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-rel.png', fullPage: false });
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
