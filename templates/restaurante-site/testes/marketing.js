// resumo no WhatsApp, assistente, promoção por horário, fila de espera e cashback
const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 860 } }); const errs = [], falhas = [];
  const ok = (n, c, v) => { if (!c) falhas.push(n + ': ' + v); };
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(RAIZ + 'sistema.html'); await p.waitForTimeout(2500);
  const f = p.frameLocator('#site'); const ver = (v) => p.click(`.troca [data-ver="${v}"]`), aba = (a) => p.evaluate(x => document.querySelector(`nav [data-aba="${x}"]`).click(), a);
  // promoção liga e muda o preço no cardápio do cliente
  await ver('restaurante'); await aba('marketing'); await p.click('[data-promo="0"]'); await p.waitForTimeout(300);
  await ver('cliente'); await p.waitForTimeout(300);
  const txt = await f.locator('#conteudo').textContent(); ok('faixa da promoção', /Happy hour/.test(txt), 'sem faixa'); ok('preço com desconto', /R\$\s?7,00/.test(txt), 'sem preço novo');
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-promo.png' });
  // pedido e fechamento com cashback
  await f.locator('[data-add]').nth(2).click(); await p.waitForTimeout(200);
  await f.locator('.barra-cel [data-abrir-pedido]').click(); await p.waitForTimeout(500); await f.locator('#gaveta a.btn-pri').click(); await p.waitForTimeout(700);
  await f.locator('#enviar-pedido').click(); await p.waitForTimeout(700);
  await ver('restaurante'); await p.locator('.alerta [data-ok]').click(); await aba('mesas'); await p.click('[data-fechar="5"]'); await p.click('[data-confirmar]'); await p.waitForTimeout(400);
  await ver('cliente'); ok('cashback no celular', /cashback/.test(await f.locator('body').textContent()), 'sem cashback');
  await ver('restaurante'); await aba('marketing'); ok('cashback no painel', !/R\$\s?0,00/.test(await p.locator('#fid-dist').textContent()), await p.locator('#fid-dist').textContent());
  // fila de espera
  await aba('reservas'); await p.fill('#f-nome', 'Leo'); await p.click('#f-entrar');
  ok('entrou na fila', /Leo/.test(await p.locator('#fila').textContent()) && /3º/.test(await p.locator('#cel-fila').textContent()), await p.locator('#cel-fila').textContent());
  // resumo no WhatsApp e assistente
  await aba('gerencia'); await p.click('#btn-zap'); ok('resumo', /Faturamento/.test(await p.locator('.zap-msg').textContent()), 'sem resumo');
  await p.click('[data-cancelar]');
  await aba('pedidos'); await p.click('#btn-ia'); await p.waitForTimeout(300); ok('botão assistente', await p.locator('#aba-gerencia').isVisible(), 'não abriu');
  await p.click('#ia-chips [data-q]'); await p.waitForTimeout(900);
  ok('assistente responde', /Picanha|campeão/.test(await p.locator('#ia-conversa .ia-r').first().textContent()), await p.locator('#ia-conversa').textContent());
  if (process.env.FOTO) await p.screenshot({ path: process.env.FOTO + '-ger.png' });
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''), errs);
  await b.close();
})();
