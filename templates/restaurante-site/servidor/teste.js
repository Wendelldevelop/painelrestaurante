// Teste de ponta a ponta do servidor: 3 aparelhos separados (celular do cliente, painel e TV) conversando pela internet.
// Uso: node teste.js   (cria um banco temporário, sobe o servidor numa porta livre e apaga tudo no fim)
'use strict';
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const AQUI = __dirname;
const DADOS = fs.mkdtempSync(path.join(os.tmpdir(), 'comanda-teste-'));
const PORTA = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORTA}`;
const env = { ...process.env, COMANDA_DADOS: DADOS, PORT: String(PORTA) };
const falhas = [], ok = (n, c, v) => { if (!c) falhas.push(`${n}: ${v}`); };

(async () => {
  execFileSync('python3', [path.join(AQUI, 'admin.py'), 'criar', 'teste', 'Casa Teste', '--mesas', '6', '--email', 'gerente@teste.com', '--senha', 'senha-forte-123'], { env });
  for (const [em, fu] of [['cozinha@teste.com', 'cozinha'], ['garcom@teste.com', 'mesas']]) execFileSync('python3', [path.join(AQUI, 'admin.py'), 'usuario', 'teste', em, 'senha-forte-123', '--funcao', fu], { env });
  const db = new (require('node:sqlite').DatabaseSync)(path.join(DADOS, 'comanda.db'));
  const tok = (n) => db.prepare("SELECT token FROM mesas WHERE numero = ? AND restaurante_id = (SELECT id FROM restaurantes WHERE slug = 'teste')").get(n).token;
  const srv = spawn(process.execPath, ['--no-warnings', path.join(AQUI, 'servidor.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 50 && !log.includes('no ar'); i++) await new Promise((r) => setTimeout(r, 100));

  const b = await chromium.launch();
  const erros = [];
  try {
    // QR inválido é recusado
    const ruim = await fetch(`${BASE}/teste/mesa/3?t=errado`); ok('QR inválido recusado', ruim.status === 403, ruim.status);
    const login = await fetch(`${BASE}/api/teste/login`, { method: 'POST', body: JSON.stringify({ email: 'gerente@teste.com', senha: 'errada' }) });
    ok('senha errada recusada', login.status === 401, login.status);

    // preço adulterado pelo celular é corrigido pelo servidor; prato inexistente é recusado
    const urlMsg = `${BASE}/api/teste/msg?papel=cliente&mesa=2&t=${tok(2)}&cid=hacker`;
    const golpe = await fetch(urlMsg, { method: 'POST', body: JSON.stringify({ tipo: 'pedido', num: 77777, itens: [{ nome: 'Picanha na brasa', qtd: 1, preco: 0.01 }], total: 0.01 }) });
    const salvo = JSON.parse(db.prepare("SELECT dados FROM eventos WHERE num = 77777").get()?.dados || '{}');
    ok('preço adulterado corrigido', golpe.status === 200 && salvo.total === 89, golpe.status + ' total ' + salvo.total);
    const falso = await fetch(urlMsg, { method: 'POST', body: JSON.stringify({ tipo: 'pedido', num: 77778, itens: [{ nome: 'Prato inventado', qtd: 1, preco: 1 }] }) });
    ok('prato inexistente recusado', falso.status === 400, falso.status);
    db.prepare("DELETE FROM eventos WHERE num = 77777").run();

    // aparelho 1: painel do restaurante (com login de verdade)
    const pc = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); pc.on('pageerror', (e) => erros.push('painel: ' + e.message));
    await pc.goto(`${BASE}/teste/painel`); await pc.waitForTimeout(800);
    ok('painel pede login', await pc.locator('#login').isVisible(), 'sem login');
    await pc.fill('#login-email', 'gerente@teste.com'); await pc.fill('#login-senha', 'senha-forte-123'); await pc.click('#login-ok'); await pc.waitForTimeout(800);
    ok('login entra', await pc.locator('#login').isHidden(), 'não entrou');
    ok('sem dados de demonstração', await pc.locator('#mapa .m.ocupada').count() === 0, 'mesa de exemplo ocupada');
    ok('mesas do banco', await pc.locator('#mapa .m').count() === 6, await pc.locator('#mapa .m').count());

    // aparelho 2: TV
    const tv = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); tv.on('pageerror', (e) => erros.push('tv: ' + e.message));
    await tv.goto(`${BASE}/teste/tv`); await tv.waitForTimeout(600);
    await tv.fill('#login-email', 'gerente@teste.com'); await tv.fill('#login-senha', 'senha-forte-123'); await tv.click('#login-ok'); await tv.waitForTimeout(600);
    ok('TV aberta', await tv.locator('#tv').isVisible(), 'sem TV');

    // aparelho 3: celular do cliente na mesa 3
    const cel = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); cel.on('pageerror', (e) => erros.push('cliente: ' + e.message));
    await cel.goto(`${BASE}/teste/mesa/3?t=${tok(3)}#cardapio`); await cel.waitForTimeout(1200);
    await cel.locator('[data-add="bruschetta-tomate"]').first().click(); await cel.waitForTimeout(200);
    await cel.locator('.barra-cel [data-abrir-pedido]').click(); await cel.waitForTimeout(400); await cel.locator('#gaveta a.btn-pri').click(); await cel.waitForTimeout(600);
    await cel.locator('input[name=nome]').fill('Ana'); await cel.locator('#enviar-pedido').click(); await cel.waitForTimeout(1500);
    ok('servidor confirmou', /Recebido|preparo/i.test(await cel.locator('#status-pedido').textContent()), await cel.locator('#status-pedido').textContent());

    // painel recebe pela internet, aceita e a cozinha marca pronto
    ok('pedido chegou no painel', await pc.locator('.alerta [data-ok]').count() === 1, 'não chegou');
    await pc.locator('.alerta [data-ok]').click(); await pc.waitForTimeout(500);
    ok('celular vê em preparo', /preparo/i.test(await cel.locator('#status-pedido').textContent()), await cel.locator('#status-pedido').textContent());
    await pc.evaluate(() => document.querySelector('nav [data-aba="cozinha"]').click());
    await pc.locator('#cozinha-Recebido [data-av]').first().click(); await pc.waitForTimeout(700);
    ok('celular vê pronto', /Pronto/.test(await cel.locator('#status-pedido').textContent()), await cel.locator('#status-pedido').textContent());

    // painel recarrega: o pedido aberto volta (nada se perde)
    await pc.reload(); await pc.waitForTimeout(1500);
    ok('pedido volta depois de recarregar', /Ana|Mesa 3/.test(await pc.locator('#alertas, #cozinha-Recebido').first().textContent() + await pc.locator('#lista-pedidos').textContent()), 'sumiu');

    // balcão: pede, paga no Pix e a TV (outro aparelho) chama a senha
    const bal = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); bal.on('pageerror', (e) => erros.push('balcão: ' + e.message));
    await bal.goto(`${BASE}/teste/balcao?balcao=1&t=${tok(0)}#cardapio`); await bal.waitForTimeout(1200);
    await bal.locator('[data-add="bruschetta-tomate"]').first().click(); await bal.waitForTimeout(200);
    await bal.locator('.barra-cel [data-abrir-pedido]').click(); await bal.waitForTimeout(400); await bal.locator('#gaveta a.btn-pri').click(); await bal.waitForTimeout(600);
    await bal.locator('input[name=nome]').fill('Rafa'); await bal.locator('#enviar-pedido').click(); await bal.waitForTimeout(500);
    await bal.locator('[data-pagar="pix"]').click(); await bal.waitForTimeout(1500);
    const pend = pc.locator('.alerta [data-ok]'); if (await pend.count()) { await pend.first().click(); await pc.waitForTimeout(300); }
    await pc.evaluate(() => document.querySelector('nav [data-aba="cozinha"]').click()); await pc.waitForTimeout(300);
    const card = pc.locator('#cozinha-Recebido .card.balc-c [data-av]'); ok('balcão na cozinha', await card.count() >= 1, await card.count());
    if (await card.count()) await card.first().click();
    await pc.waitForTimeout(1200);
    ok('TV chama a senha', /Rafa/.test(await tv.locator('#tv-agora').textContent()), await tv.locator('#tv-agora').textContent());
    ok('celular do balcão avisado', /retire no balcão/i.test(await bal.locator('#status-pedido').textContent()), await bal.locator('#status-pedido').textContent());

    // ===== vários aparelhos da equipe ao mesmo tempo (fase 2)
    const entra = async (email, vp) => { const pg = await (await b.newContext({ viewport: vp })).newPage(); pg.on('pageerror', (e) => erros.push(email + ': ' + e.message));
      await pg.goto(`${BASE}/teste/painel`); await pg.waitForTimeout(500); await pg.fill('#login-email', email); await pg.fill('#login-senha', 'senha-forte-123'); await pg.click('#login-ok'); await pg.waitForTimeout(1200); return pg; };
    const coz = await entra('cozinha@teste.com', { width: 1024, height: 768 });
    const gar = await entra('garcom@teste.com', { width: 390, height: 844 });
    ok('cozinha vê só a cozinha', await coz.locator('#aba-cozinha').isVisible() && !(await coz.locator('nav [data-aba="gerencia"]').isVisible()), 'abas');
    ok('garçom vê o salão', await gar.locator('#aba-mesas').isVisible(), 'abas garçom');
    const c4 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); c4.on('pageerror', (e) => erros.push('mesa4: ' + e.message));
    await c4.goto(`${BASE}/teste/mesa/4?t=${tok(4)}#cardapio`); await c4.waitForTimeout(1200);
    await c4.locator('[data-add="bruschetta-tomate"]').first().click(); await c4.waitForTimeout(200);
    await c4.locator('.barra-cel [data-abrir-pedido]').click(); await c4.waitForTimeout(400); await c4.locator('#gaveta a.btn-pri').click(); await c4.waitForTimeout(600);
    await c4.locator('input[name=nome]').fill('Bia'); await c4.locator('#enviar-pedido').click(); await c4.waitForTimeout(1500);
    ok('garçom recebe o 1º pedido', await gar.locator('.alerta [data-ok]').count() >= 1, await gar.locator('.alerta').count());
    await gar.locator('.alerta [data-ok]').last().click(); await gar.waitForTimeout(1200);
    ok('aceite sumiu nos outros aparelhos', await pc.locator('.alerta[data-mesa="4"] [data-ok]').count() === 0 && await coz.locator('.alerta[data-mesa="4"] [data-ok]').count() === 0, 'alerta ficou');
    const cart = coz.locator('#cozinha-Recebido .card', { hasText: 'Mesa 4' }); ok('cozinha (outro aparelho) recebe', await cart.count() === 1, await cart.count());
    await cart.locator('[data-av]').click(); await coz.waitForTimeout(1200);
    ok('garçom vê mesa pronta', /pronto/i.test(await gar.locator('#mapa .m').nth(3).textContent()), await gar.locator('#mapa .m').nth(3).textContent());
    ok('gerente também vê', await pc.locator('#cozinha-Recebido .card', { hasText: 'Mesa 4' }).count() === 0, 'card ficou no gerente');
    await gar.locator('[data-entregar="4"]').click(); await gar.waitForTimeout(1200);
    ok('cliente vê entregue', /Entregue na mesa/.test(await c4.locator('#status-pedido').textContent()), await c4.locator('#status-pedido').textContent());
    // esgotado marcado na cozinha vale para todos e fica salvo
    await coz.locator('#aba-cozinha .esg-box summary').click(); await coz.locator('#aba-cozinha .esg [data-id="camarao-alho"]').click(); await coz.waitForTimeout(1200);
    ok('esgotado no gerente', await pc.locator('#aba-cozinha .esg [data-id="camarao-alho"].on').count() === 1, 'gerente não viu');
    await c4.goto(`${BASE}/teste/mesa/4?t=${tok(4)}#cardapio`); await c4.waitForTimeout(1500);
    ok('esgotado no cliente (salvo)', await c4.locator('[data-add="camarao-alho"]').first().isDisabled(), 'cliente pode pedir');
    // aparelho que entra depois fica igual aos outros
    const novo = await entra('gerente@teste.com', { width: 1280, height: 800 });
    await novo.evaluate(() => document.querySelector('nav [data-aba="pedidos"]').click());
    const lista = await novo.locator('#lista-pedidos').textContent();
    ok('aparelho novo com o mesmo estado', /Entregue/.test(lista) && /Bia/.test(lista), lista.slice(0, 200));
    ok('aparelho novo com o esgotado', await novo.locator('#aba-cozinha .esg [data-id="camarao-alho"].on').count() === 1, 'sem esgotado');
    // demonstração online e saúde
    const demo = await fetch(`${BASE}/demo`); ok('página de demonstração', demo.status === 200 && /gerente@demo.com/.test(await demo.text()), demo.status);
    const saude = await (await fetch(`${BASE}/saude`)).json(); ok('saúde', saude.ok && saude.banco === 'ok' && saude.conexoes > 0, JSON.stringify(saude));
  } catch (e) { falhas.push('erro: ' + e.message.split('\n')[0]); }
  if (erros.length) falhas.push('erros de página: ' + erros.join(' | '));
  await b.close(); srv.kill(); fs.rmSync(DADOS, { recursive: true, force: true });
  console.log('FALHAS ' + falhas.length + (falhas.length ? '\n' + falhas.join('\n') : ''));
  if (falhas.length && log.includes('Error')) console.log(log.slice(-1500));
  process.exit(falhas.length ? 1 : 0);
})();
