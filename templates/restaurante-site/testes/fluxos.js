// Testa os dois fluxos completos nos dois formatos do site, em 375, 768 e 1440 px.
const { chromium } = require('playwright');
const fs = require('fs');
const RAIZ = require('path').resolve(__dirname, '..') + '/';
const MODOS = { pasta: 'file://' + RAIZ + 'site/index.html', unico: 'file://' + RAIZ + 'casa-brasa.html' };
(async () => {
  const b = await chromium.launch(); let falhas = 0;
  for (const [modo, inicio] of Object.entries(MODOS)) for (const w of [375, 768, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 } });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__abertos = []; window.open = (u) => { window.__abertos.push(u); return null; }; });
    const ok = (n, c, x = '') => { if (!c) { falhas++; console.log(modo, w, 'FALHA', n, x); } };
    const larg = async (n) => ok('sem sobra lateral em ' + n, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), String(await p.evaluate(() => document.documentElement.scrollWidth)));
    const espera = (ms = 700) => p.waitForTimeout(ms);

    // ---- abrir o site
    await p.goto(inicio); await espera(1500);
    const hero = await p.evaluate(() => ({ status: document.querySelector('.capa-estado')?.textContent || '', cta: [...document.querySelectorAll('.capa .acoes a.btn')].map(a => a.textContent), acima: [...document.querySelectorAll('.capa .acoes a.btn')].every(a => a.getBoundingClientRect().bottom <= innerHeight), tel: document.querySelector('a.fone')?.href, waze: !!document.querySelector('a[href*="waze.com"]'), eventos: document.querySelectorAll('.linhas li').length, insta: document.querySelectorAll('.insta-grade li').length, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)['@type']) }));
    ok('status na primeira tela', /Aberto agora · fecha|Fechado · abre/.test(hero.status), hero.status);
    ok('CTAs Reservar e Pedir', hero.cta.join('|') === 'Reservar mesa|Pedir delivery', hero.cta.join('|'));
    ok('CTAs acima da dobra', hero.acima);
    ok('telefone clicável', /^tel:\+55\d{10,11}$/.test(hero.tel || ''), hero.tel);
    ok('Waze, eventos e Instagram', hero.waze && hero.eventos === 3, JSON.stringify(hero));
    ok('dados estruturados', hero.ld.includes('Restaurant'), hero.ld.join());
    await larg('início');

    // ---- fluxo 1: ver cardápio -> reservar
    await p.click('.capa .acoes a.link >> nth=0'); await espera(1200);
    ok('cardápio abre', await p.evaluate(() => document.querySelector('h1')?.textContent.toUpperCase().includes('CARDÁPIO') && document.querySelectorAll('[data-cat]').length >= 7));
    await larg('cardápio');
    await p.click('a[data-nav="reservas"]:visible'); await espera(1200);
    ok('reservas abre', await p.evaluate(() => !!document.getElementById('form-reserva')));
    await larg('reservas');
    await p.click('#dias .dia:not([disabled]) >> nth=1'); await p.click('#horas .hora >> nth=0'); await p.click('[data-p="1"]');
    await p.fill('#r-nome', 'Cliente Teste'); await p.fill('#r-tel', '11999990000'); await p.click('#form-reserva button[type=submit]'); await espera(300);
    let r = decodeURIComponent(await p.evaluate(() => window.__abertos.at(-1) || ''));
    ok('reserva gera mensagem no WhatsApp', /wa\.me\/55\d+/.test(r) && /Pedido de reserva/.test(r) && /Pessoas:\* 3/.test(r) && /Data:\*/.test(r) && /Horário:\*/.test(r), r.slice(0, 80));

    // ---- fluxo 2: pedir delivery
    await p.goto(inicio); await espera(1200);
    await p.click('.capa .acoes a.btn >> nth=1'); await espera(1200);
    await p.locator('#cat-principais [data-add]').first().scrollIntoViewIfNeeded(); await p.locator('#cat-principais [data-add]').first().click(); await espera(1100);
    await p.locator('#cat-entradas h3 a').first().click(); await espera(1300);
    ok('tela do prato abre', await p.evaluate(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal h1')));
    await p.click('#add-modal'); await espera(900);
    ok('sacola com 2 itens', await p.evaluate(() => document.querySelector('[data-contador]').textContent === '2' && !document.getElementById('gaveta').hidden));
    await p.click('#gaveta a.btn-pri'); await espera(1200);
    ok('página de pedido', await p.evaluate(() => !!document.getElementById('form-pedido')));
    await larg('pedido');
    await p.fill('[name=nome]', 'Cliente Teste'); await p.fill('[name=tel]', '11999990000'); await p.fill('[name=end]', 'Rua A, 10'); await p.click('#enviar-pedido'); await espera(300);
    r = decodeURIComponent(await p.evaluate(() => window.__abertos.at(-1) || ''));
    ok('pedido gera mensagem no WhatsApp', /Novo pedido/.test(r) && /Delivery/.test(r) && /Total: R\$\s\d/.test(r) && /Rua A, 10/.test(r), r.slice(0, 80));

    // ---- sobre: mapa e contato
    await p.goto(modo === 'pasta' ? inicio.replace('index.html', 'sobre.html') : inicio + '#sobre'); await espera(1200);
    ok('mapa e contato', await p.evaluate(() => !!document.querySelector('#mapa iframe[src*="google.com/maps"]') && !!document.querySelector('a[href*="waze.com"]') && !!document.querySelector('a[href^="tel:+55"]')));
    await larg('sobre');
    // links internos da pasta existem
    if (modo === 'pasta') {
      const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /^[a-z-]+\.html/.test(h)).map(h => h.split('#')[0]))]);
      ok('links internos existem', hrefs.every(h => fs.existsSync(RAIZ + 'site/' + h)), hrefs.join());
    }
    ok('sem erros de script', errs.length === 0, errs.join(' ; '));
    console.log(modo, w, 'concluído');
    await ctx.close();
  }
  console.log('FALHAS', falhas);process.exitCode=falhas?1:0; await b.close();
})();
