// comanda, queda de internet, histórico + Excel, registro, desconto, LGPD, configurações, cardápio e cadastro novo
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html#semlogin'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site'); const ver = (v) => p.click(`.troca [data-ver="${v}"]`), aba = (a) => p.evaluate(x => document.querySelector(`nav [data-aba="${x}"]`).click(), a);
  const pedir = async () => { await f.locator('[data-add]').nth(2).click(); await p.waitForTimeout(200); await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700); await f.locator('#enviar-pedido').click(); await p.waitForTimeout(500); };
  // queda de internet: pedido espera e entra quando volta
  await ver('restaurante'); await p.click('#btn-demo'); await p.click('#btn-off'); await ver('cliente'); await pedir();
  await ver('restaurante'); ok('offline segura', await p.locator('.alerta').count() === 0 && /Sem internet/.test(await p.locator('#aviso-rede').textContent()), 'entrou offline');
  await p.click('#btn-demo'); await p.click('#btn-off'); await p.waitForTimeout(3600);
  ok('volta e entra', await p.locator('.alerta [data-ok]').count() === 1, 'não entrou');
  await p.locator('.alerta [data-ok]').click(); await p.waitForTimeout(200);
  // comanda
  await p.locator('.card [data-imp]').first().click(); ok('comanda', /COZINHA/.test(await p.locator('.ticket').textContent()), 'sem ticket'); await p.click('[data-cancelar]');
  // desconto com senha + taxa configurável
  await aba('config'); await p.fill('#c-pct', '12'); await p.dispatchEvent('#c-pct', 'change');
  await aba('mesas'); await p.click('[data-fechar="5"]'); ok('taxa 12%', /Serviço \(12%\)/.test(await p.locator('#caixa').textContent()), 'taxa');
  await p.click('.desc summary'); await p.fill('#d-val', '10'); await p.fill('#d-pin', '0000'); await p.click('#d-ok'); ok('senha errada', /errada/.test(await p.locator('#d-erro').textContent()), 'aceitou');
  await p.fill('#d-pin', '1234'); await p.click('#d-ok'); ok('desconto aplicado', await p.locator('#l-desc').isVisible(), 'sem desconto');
  await p.click('[data-confirmar]'); await p.waitForTimeout(300);
  // histórico e Excel
  await aba('historico'); const n7 = await p.locator('#h-lista tr').count(); ok('histórico 7 dias', n7 > 50, n7);
  await p.fill('#h-q', 'mesa 3'); const n3 = await p.locator('#h-lista tr').count(); ok('busca', n3 > 0 && n3 < n7, n3);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#h-exp')]); ok('excel', /historico-.*\.csv/.test(dl.suggestedFilename()), dl.suggestedFilename());
  // LGPD
  await aba('gerencia'); await p.locator('#crm [data-apagar]').first().click(); await p.fill('#lg-pin', '1234'); await p.click('#lg-ok');
  ok('LGPD', await p.locator('#crm .linha').count() === 2, await p.locator('#crm .linha').count());
  // cardápio: preço novo e prato novo aparecem no cliente
  await aba('cardapio'); await p.locator('[data-editar="picanha-brasa"]').click(); await p.fill('#ep-preco', '95'); await p.click('#ep-ok');
  await p.click('#novo-prato'); await p.fill('#ep-nome', 'Burger da Casa'); await p.fill('#ep-preco', '42'); await p.click('#ep-ok'); await p.waitForTimeout(300);
  await ver('cliente'); await f.locator('.barra-cel a').first().click(); await p.waitForTimeout(800);
  const txt = await f.locator('#conteudo').textContent(); ok('preço novo no cliente', /95,00/.test(txt), 'sem 95'); ok('prato novo no cliente', /Burger da Casa/.test(txt), 'sem prato');
  // funcionários e login com senha
  await ver('restaurante'); await aba('config'); await p.fill('#fu-nome', 'Leo'); await p.selectOption('#fu-f', 'cozinha'); await p.fill('#fu-pin', '4321'); await p.click('#fu-add');
  await p.click('#btn-login'); await p.selectOption('#lo-f', { label: 'Leo · Cozinha' }); await p.fill('#lo-pin', '4321'); await p.click('#lo-ok');
  ok('login cozinha', await p.locator('nav button:visible').count() === 1, await p.locator('nav button:visible').count());
  await p.selectOption('#funcao', '');
  // registro de atividades
  await aba('config'); const aud = await p.locator('#audit').textContent();
  ok('registro', ['Desconto', 'LGPD', 'Mudou preço', 'Criou prato', 'Entrou', 'Internet caiu'].every(x => aud.includes(x)), aud.slice(0, 300));
  // cadastro de restaurante novo
  await p.click('#btn-novo-rest'); await p.fill('#w-nome', 'Pizza Nostra'); await p.selectOption('#w-tipo', 'pizzaria'); await p.click('#w-prox'); await p.click('#w-prox'); await p.fill('#w-mesas', '8'); await p.click('#w-prox');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-wiz.png' });
  await p.click('#w-prox'); ok('no ar', /Pizza Nostra está no ar/.test(await p.locator('#caixa').textContent()), 'wizard');
  await p.click('[data-cancelar]'); ok('8 mesas (a 9 está ocupada e fica)', await p.locator('#placas-mini > div').count() === 9, await p.locator('#placas-mini > div').count());
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-config.png', fullPage: false });
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
