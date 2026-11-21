// Gera os PDFs da proposta comercial e do contrato modelo.
// Uso: node templates/restaurante-site/vendas/gerar-pdf.js
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [html, pdf, margem] of [['proposta.html', 'Proposta-Comanda-mais.pdf', false], ['contrato.html', 'Contrato-modelo-Comanda-mais.pdf', true]]) {
    await p.goto('file://' + path.join(__dirname, html)); await p.waitForTimeout(500);
    await p.pdf({ path: path.join(__dirname, pdf), format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log('gerado:', pdf);
  }
  await b.close();
})();
