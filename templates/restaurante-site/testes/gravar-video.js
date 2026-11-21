// Uso: node templates/restaurante-site/testes/gravar-video.js (depois do demo-pdv.py)
// grava um vídeo do teste: pedido na mesa e pedido no balcão (com legendas e destaque nos cliques)
const { chromium } = require('playwright');
const path = require('path');
const DIR = path.resolve(__dirname, '..', 'video') + '/'; // depois: ffmpeg -i video/*.webm -c:v libx264 -pix_fmt yuv420p video/teste.mp4
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: DIR, size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'sistema.html')); await p.waitForTimeout(1500);
  const f = p.frameLocator('#site');
  const espera = (ms) => p.waitForTimeout(ms);
  async function legenda(txt, ms = 2600) {
    await p.evaluate((t) => {
      let el = document.getElementById('legenda-video');
      if (!el) { el = document.createElement('div'); el.id = 'legenda-video'; el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9999;max-width:980px;padding:14px 24px;border-radius:14px;background:rgba(20,14,10,.92);color:#fff;font:600 21px/1.35 system-ui;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.35);pointer-events:none'; document.body.append(el); }
      el.innerHTML = t;
    }, txt);
    await espera(ms);
  }
  async function marcar(loc) {
    const box = await loc.boundingBox(); if (!box) return;
    await p.evaluate((b) => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${b.x - 6}px;top:${b.y - 6}px;width:${b.width + 12}px;height:${b.height + 12}px;border:4px solid #ffc531;border-radius:12px;z-index:9998;pointer-events:none;box-shadow:0 0 0 6px rgba(255,197,49,.25);transition:opacity .6s`;
      document.body.append(r); setTimeout(() => (r.style.opacity = '0'), 900); setTimeout(() => r.remove(), 1600);
    }, box);
    await espera(700);
  }
  async function clicar(loc, depois = 900) { await loc.scrollIntoViewIfNeeded().catch(() => {}); await marcar(loc); await loc.click(); await espera(depois); }
  const ver = async (v) => { await clicar(p.locator(`.troca [data-ver="${v}"]`), 900);
    if (await p.locator('#login:not([hidden])').count()) { await legenda('O restaurante entra no painel <b>Comanda+</b> com e-mail e senha', 2200); await clicar(p.locator('#login-ok'), 1400); } };
  const GR = { bar: 'cozinha', balcao: 'mesas', reservas: 'mesas', historico: 'pedidos', marketing: 'cardapio', rede: 'gerencia', integracoes: 'config' };
  const aba = async (a) => { if (GR[a]) { if (!(await p.locator(`#subnav [data-sub="${a}"]`).isVisible().catch(() => false))) await clicar(p.locator(`nav [data-aba="${GR[a]}"]`), 600); await clicar(p.locator(`#subnav [data-sub="${a}"]`), 800); } else await clicar(p.locator(`nav [data-aba="${a}"]`), 800); };
  const fecharSug = async () => { const s = f.locator('[data-sug-fechar]'); if (await s.count()) await s.first().click().catch(() => {}); };

  await legenda('🎬 Teste do sistema: um pedido <b>NA MESA</b> e um pedido <b>NO BALCÃO</b>', 3200);

  // ---------- PEDIDO NA MESA
  await legenda('1. O cliente escaneou o QR da <b>mesa 5</b> e abre um prato', 2400);
  await clicar(f.locator('a[href$="#prato-picanha-brasa"]').first(), 1200);
  await legenda('Escolhe o acompanhamento (Fritas) e um adicional (Queijo coalho)', 1500);
  await clicar(f.locator('.opc[data-g="0"] [data-o="1"]'), 500);
  await clicar(f.locator('.opc[data-g="1"] [data-o="0"]'), 800);
  await clicar(f.locator('#add-modal'), 1200);
  await fecharSug();
  await legenda('2. Finaliza o pedido', 1200);
  await clicar(f.locator('#gaveta a.btn-pri'), 1200);
  await f.locator('input[name=nome]').fill('Ana'); await espera(600);
  await legenda('Escolhe <b>"Na mesa 5"</b>: o pedido vai para a cozinha e o garçom leva até a mesa', 2600);
  await clicar(f.locator('input[name=tipo][value=mesa]').locator('xpath=..'), 700);
  await clicar(f.locator('#enviar-pedido'), 1400);

  await legenda('3. No restaurante: o <b>primeiro pedido da mesa</b> precisa do aceite do garçom', 1800);
  await ver('restaurante');
  await clicar(p.locator('.alerta [data-ok]'), 1000);
  await aba('cozinha');
  await legenda('4. Na cozinha o cartão aparece como <b>"Mesa 5"</b>, com o nome e o adicional', 2600);
  await legenda('A cozinha toca <b>uma vez só</b> em ✓ Pronto', 1400);
  await clicar(p.locator('#cozinha-Recebido [data-av]').first(), 1000);
  await legenda('5. Ficou pronto: o cartão <b>sai da cozinha</b> e o garçom recebe o aviso (o celular vibra)', 2600);
  await legenda('Pedido de mesa <b>não vai para a TV</b>: o garçom leva e toca em <b>"Levei ✓"</b>', 2000);
  await aba('balcao');
  await legenda('No <b>Balcão</b>, a parte <b>"Mesas prontas"</b> mostra os pratos de cada mesa esperando o garçom', 2800);
  await clicar(p.locator('#mesas-prontas [data-levei-mesa]').first(), 1000);
  await ver('cliente');
  await legenda('6. No celular do cliente aparece <b>"Entregue na mesa"</b>', 2600);

  // ---------- PEDIDO NO BALCÃO
  await legenda('Agora um pedido para <b>RETIRAR NO BALCÃO</b>', 2400);
  await clicar(f.locator('a:has-text("Pedir mais")'), 1200);
  await clicar(f.locator('[data-add="bruschetta-tomate"]').first(), 600);
  await clicar(f.locator('[data-add="chope-pilsen"]').first(), 800);
  await fecharSug();
  await clicar(f.locator('.barra-cel [data-abrir-pedido]'), 1000);
  await clicar(f.locator('#gaveta a.btn-pri'), 1200);
  await legenda('O cliente escolhe <b>"Retirar no balcão"</b> e coloca o nome', 2000);
  await clicar(f.locator('input[name=tipo][value=retirada]').locator('xpath=..'), 700);
  await f.locator('input[name=nome]').fill('Rafa'); await espera(600);
  await clicar(f.locator('#enviar-pedido'), 1200);
  await legenda('7. No balcão o cliente <b>paga antes</b>: Pix pelo celular ou no caixa (o restaurante escolhe nas Configurações)', 3200);
  await clicar(f.locator('[data-pagar="pix"]'), 1400);
  await legenda('Pagou: recebe uma <b>senha</b> no celular e o pedido vai direto para a cozinha', 3000);

  await ver('restaurante');
  await aba('cozinha');
  await legenda('8. Na cozinha: <b>laranja = mesa</b>, <b>azul = balcão</b> (com "✓ Pago no Pix"). A bebida vai para o Bar', 3400);
  await clicar(p.locator('#cozinha-Recebido [data-av]').first(), 900);
  await aba('bar');
  await clicar(p.locator('#bar-Recebido [data-av]').first(), 1000);
  await legenda('9. Quando <b>cozinha e bar</b> ficam prontos, a <b>TV chama a senha</b>', 1600);
  await ver('tv');
  await espera(2600);
  await ver('cliente');
  await legenda('10. O celular do cliente avisa: <b>"Pronto! Retire no balcão"</b>', 2800);
  await ver('restaurante');
  await aba('balcao');
  await legenda('11. O atendente entrega e toca em <b>"Retirado"</b> (ou a senha sai sozinha da TV em 5 min)', 1800);
  await clicar(p.locator('[data-retirado]').first(), 1200);
  await legenda('✅ Resumo: <b>mesa</b> → garçom leva até a mesa · <b>balcão</b> → senha chamada na TV', 4200);

  await p.close(); await ctx.close(); await b.close();
})();
