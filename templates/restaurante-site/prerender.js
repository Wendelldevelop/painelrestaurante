/* Abre cada página da pasta do site, deixa o script escrever o conteúdo e devolve esse HTML.
   Usado pelo montar.py para o conteúdo já vir pronto no arquivo (melhor para o Google e mais rápido).
   Uso: node prerender.js <pasta-do-site> index.html cardapio.html ... */
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

(async () => {
  const [pasta, ...arquivos] = process.argv.slice(2);
  const navegador = await chromium.launch();
  const saida = {};
  for (const arquivo of arquivos) {
    const pagina = await navegador.newPage();
    await pagina.route(/^https?:\/\//, (r) => r.abort()); // não precisa de rede para escrever o HTML
    await pagina.addInitScript(() => { window.PRERENDER = true; });
    await pagina.goto(pathToFileURL(path.join(pasta, arquivo)).href, { waitUntil: "domcontentloaded" });
    await pagina.waitForFunction(() => document.getElementById("conteudo").children.length > 0);
    saida[arquivo] = await pagina.evaluate(() => {
      const raiz = document.getElementById("conteudo");
      // tira marcas que só fazem sentido depois que o script roda
      raiz.querySelectorAll("img.ok").forEach((i) => i.classList.remove("ok"));
      raiz.querySelectorAll(".falhou").forEach((f) => f.classList.remove("falhou"));
      raiz.querySelectorAll("img[class='']").forEach((i) => i.removeAttribute("class"));
      return raiz.innerHTML;
    });
    await pagina.close();
  }
  await navegador.close();
  process.stdout.write(JSON.stringify(saida));
})().catch((erro) => { console.error(erro); process.exit(1); });
