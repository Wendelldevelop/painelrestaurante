const path = require('path');
const RAIZ = 'file://' + path.resolve(__dirname, '..') + '/';
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:812}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(RAIZ+'casa-brasa.html#cardapio');await p.waitForTimeout(1200);
const semQR=await p.evaluate(()=>document.querySelectorAll('[data-add]').length);console.log('sem QR:',semQR);if(semQR)process.exitCode=1;
await p.goto(RAIZ+'site/cardapio.html?mesa=3');await p.waitForTimeout(1200);
const comQR=await p.evaluate(()=>document.querySelectorAll('[data-add]').length>0);console.log('com QR:',comQR,errs);if(!comQR||errs.length)process.exitCode=1;await b.close()})();
