"""Monta o site do restaurante a partir das fontes.

Uso:
    python3 templates/restaurante-site/montar.py

Gera duas saídas com o mesmo conteúdo:
    casa-brasa.html   arquivo único, para abrir com dois cliques e conferir
    site/             pasta para publicar: uma página por arquivo, fontes hospedadas junto,
                      sitemap.xml e dados estruturados para o Google

Fontes: fonte/modelo.html, fonte/premium.css, fonte/premium.js, fonte/fontes/*.woff2
Dados:  ../restaurante-premium/data/config.json e cardapio.json

Para o conteúdo já vir escrito no HTML da pasta (melhor para o Google), o montador
usa Node + Playwright se estiverem instalados; sem eles a pasta funciona igual,
só que o conteúdo é escrito pelo script ao abrir.
"""
import base64
import copy
import json
import re
from urllib.parse import quote
import shutil
import subprocess
from pathlib import Path

AQUI = Path(__file__).resolve().parent
FONTE = AQUI / "fonte"
DADOS = AQUI.parent / "restaurante-premium" / "data"
PUBLICO = AQUI.parent / "restaurante-premium" / "public"

config = json.loads((DADOS / "config.json").read_text(encoding="utf-8"))
cardapio = json.loads((DADOS / "cardapio.json").read_text(encoding="utf-8"))
modelo = (FONTE / "modelo.html").read_text(encoding="utf-8")
css = (FONTE / "premium.css").read_text(encoding="utf-8")
js = (FONTE / "premium.js").read_text(encoding="utf-8")

SITE = config.get("site", {})
URL = SITE.get("url", "").rstrip("/")
e = config["endereco"]
NOME = config["nome"]
PRATO_CASA = next((i for i in cardapio if i["id"] == config.get("pratoDoChefe")), cardapio[0])
OG = f"assets/fotos/{PRATO_CASA['id']}-1280.webp" if PRATO_CASA.get("foto") else ""


def logo_svg() -> str:
    """Selo redondo com as iniciais e o ano de fundação."""
    ini = config.get("logo", {}).get("iniciais") or "".join(p[0] for p in NOME.split()[:2]).upper()
    roda = f"{NOME.upper()} · DESDE {config['fundacao']} · "
    return ('<svg class="selo-marca" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="roda" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs>'
            '<circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" stroke-width=".8"/>'
            f'<text font-size="8.6" letter-spacing="1.6" fill="currentColor"><textPath href="#roda">{roda}</textPath></text>'
            f'<text x="50" y="59" text-anchor="middle" font-size="26" font-style="italic" fill="currentColor">{ini}</text></svg>')


def icone() -> str:
    ini = config.get("logo", {}).get("iniciais") or NOME[:2]
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='#b23a1e'/>"
           f"<text x='16' y='21' font-family='Georgia,serif' font-style='italic' font-size='14' fill='#f4ead6' text-anchor='middle'>{ini}</text></svg>")
    return "data:image/svg+xml," + quote(svg)

PAGINAS = {
    "inicio": ("index.html", SITE.get("titulo", f"{NOME} | {config['cozinha']} em {e['cidade']}"), SITE.get("descricao", config["descricao"])),
    "cardapio": ("cardapio.html", f"Cardápio | {NOME} — {e['bairro']}, {e['cidade']}", f"Cardápio do {NOME}: entradas, carnes na brasa, massas, executivo, sobremesas, bebidas e vinhos, com preços. Peça delivery ou retire no balcão."),
    "reservas": ("reservas.html", f"Reservar mesa | {NOME} — {e['bairro']}, {e['cidade']}", f"Reserve uma mesa no {NOME}: escolha o dia, o horário e o número de pessoas e confirme pelo WhatsApp."),
    "sobre": ("sobre.html", f"A casa, endereço e contato | {NOME}", f"A história do {NOME}, o casarão, quem cozinha, endereço com mapa, horários e contato."),
    "pedido": ("pedido.html", f"Seu pedido | {NOME}", "Finalize seu pedido de delivery ou retirada."),
}
# "pedidos": false = site só de cardápio: não gera as páginas de reserva e de pedido
VITRINE = config.get("pedidos") is False
ATIVAS = [p for p in PAGINAS if not (VITRINE and p in ("reservas", "pedido"))]
DIAS = {"domingo": "Sunday", "segunda": "Monday", "terca": "Tuesday", "quarta": "Wednesday", "quinta": "Thursday", "sexta": "Friday", "sabado": "Saturday"}

# fontes: no arquivo único vêm do Google; na pasta ficam hospedadas junto, com as duas principais pré-carregadas
FONTES_ARQ = {
    "fraunces-latin-opsz-normal": ("Fraunces", "normal", "100 900"),
    "fraunces-latin-opsz-italic": ("Fraunces", "italic", "100 900"),
    "hanken-grotesk-latin-wght-normal": ("Hanken Grotesk", "normal", "100 900"),
    "allura-latin-400-normal": ("Allura", "normal", "400"),
}
GOOGLE = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Hanken+Grotesk:wght@400..700&family=Allura&display=swap"
FONTES_UNICO = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                f'<link rel="stylesheet" href="{GOOGLE}">')
FONTES_PASTA = "\n".join(f'<link rel="preload" as="font" type="font/woff2" href="assets/fontes/{f}.woff2" crossorigin>'
                         for f in ("fraunces-latin-opsz-normal", "hanken-grotesk-latin-wght-normal"))


def css_fontes() -> str:
    return "".join(f'@font-face{{font-family:"{fam}";font-style:{estilo};font-weight:{peso};font-display:swap;'
                   f'src:url(fontes/{arq}.woff2) format("woff2")}}' for arq, (fam, estilo, peso) in FONTES_ARQ.items())


def dados_estruturados(pagina: str, base: str) -> str:
    """Schema.org para o Google: restaurante em todas as páginas e o cardápio na página do cardápio."""
    rest = {
        "@context": "https://schema.org", "@type": "Restaurant", "@id": f"{base}/#restaurante", "name": NOME, "description": config["descricao"],
        "url": f"{base}/", "servesCuisine": config["cozinha"], "priceRange": config["faixaPreco"], "telephone": "+55" + "".join(c for c in config["telefone"] if c.isdigit()),
        "image": f"{base}/{OG}" if OG else "", "hasMenu": f"{base}/cardapio.html", "acceptsReservations": not VITRINE, "paymentAccepted": ", ".join(config["pagamentos"]),
        "address": {"@type": "PostalAddress", "streetAddress": e["rua"], "addressLocality": e["cidade"], "addressRegion": e["estado"], "postalCode": e["cep"], "addressCountry": "BR"},
        "geo": {"@type": "GeoCoordinates", "latitude": config["coordenadas"]["lat"], "longitude": config["coordenadas"]["lng"]},
        "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": DIAS[d], "opens": t["abre"], "closes": t["fecha"]} for d, ts in config["horarios"].items() for t in ts],
        "sameAs": [u for u in (config.get("instagram"), config.get("facebook")) if u and len(u) > 24],
    }
    # nota e avaliações só entram se forem reais (o Google pune avaliação inventada)
    av = config.get("avaliacao", {})
    if av.get("verificada"):
        rest["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": av["media"], "reviewCount": av["total"]}
    blocos = [rest]
    if pagina == "cardapio":
        nomes = {"entradas": "Entradas", "principais": "Principais", "executivo": "Executivo", "massas": "Massas", "sobremesas": "Sobremesas", "bebidas": "Bebidas", "vinhos": "Vinhos"}
        blocos.append({
            "@context": "https://schema.org", "@type": "Menu", "name": f"Cardápio {NOME}", "url": f"{base}/cardapio.html",
            "hasMenuSection": [{"@type": "MenuSection", "name": n, "hasMenuItem": [
                {"@type": "MenuItem", "name": i["nome"], "description": i["descricao"], "offers": {"@type": "Offer", "price": f"{i['preco']:.2f}", "priceCurrency": "BRL"}}
                for i in cardapio if i["categoria"] == c]} for c, n in nomes.items()],
        })
    return "\n".join(f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocos)


def cabeca(pagina: str, multi: bool) -> str:
    arquivo, titulo, desc = PAGINAS[pagina]
    linhas = [
        f"<title>{titulo}</title>",
        f'<meta name="description" content="{desc}">',
        '<meta name="theme-color" content="#17100b">',
        '<meta property="og:type" content="restaurant">', '<meta property="og:locale" content="pt_BR">',
        f'<meta property="og:site_name" content="{NOME}">', f'<meta property="og:title" content="{titulo}">', f'<meta property="og:description" content="{desc}">',
    ]
    if OG and URL:
        linhas += [f'<meta property="og:image" content="{URL}/{OG}">', '<meta name="twitter:card" content="summary_large_image">']
    if multi:
        if URL:
            alvo = f"{URL}/{'' if pagina == 'inicio' else arquivo}"
            linhas += [f'<link rel="canonical" href="{alvo}">', f'<meta property="og:url" content="{alvo}">']
        if pagina == "pedido":
            linhas.append('<meta name="robots" content="noindex">')
        if pagina == "inicio" and config.get("capa", {}).get("poster"):
            linhas.append(f'<link rel="preload" as="image" href="assets/{config["capa"]["poster"]}" fetchpriority="high">')
    linhas.append(dados_estruturados(pagina, URL or "."))
    return "\n".join(linhas)


def pagina_html(pagina: str, multi: bool, estilo: str, scripts: str, conteudo: str = "") -> str:
    h = modelo
    for k, v in PAGINAS.items():
        h = h.replace(f"%%L.{k}%%", v[0] if multi else f"#{k}")
    return (h.replace("%%NOME%%", NOME).replace("%%LOGO%%", logo_svg()).replace("%%ICONE%%", icone()).replace("%%VITRINE%%", " data-vitrine" if VITRINE else "").replace("%%MODO%%", "pasta" if multi else "unico").replace("%%PAGINA%%", pagina if multi else "")
            .replace("%%CABECA%%", cabeca(pagina, multi)).replace("%%FONTES%%", FONTES_PASTA if multi else FONTES_UNICO)
            .replace("%%ESTILO%%", estilo).replace("%%SCRIPTS%%", scripts)
            .replace("%%PRE%%", f' data-pre="{pagina}"' if conteudo else "").replace("%%CONTEUDO%%", conteudo))


def caminhos(dado, trocar):
    """Aplica `trocar` em todo texto que começa com fotos/ ou video/ dentro dos dados."""
    if isinstance(dado, dict):
        return {k: caminhos(v, trocar) for k, v in dado.items()}
    if isinstance(dado, list):
        return [caminhos(v, trocar) for v in dado]
    if isinstance(dado, str) and re.match(r"^(fotos|video)/", dado):
        return trocar(dado)
    return dado


def embutir(caminho: str) -> str:
    arq = PUBLICO / caminho if Path(caminho).suffix else PUBLICO / f"{caminho}-640.webp"
    tipo = {".webp": "image/webp", ".mp4": "video/mp4", ".jpg": "image/jpeg"}[arq.suffix]
    return f"data:{tipo};base64," + base64.b64encode(arq.read_bytes()).decode()


def js_dados(conf=None, card=None) -> str:
    conf, card = conf or config, card or cardapio
    return ("/* Dados do restaurante. Edite templates/restaurante-premium/data/*.json e monte de novo. */\n"
            f"const CONFIG = {json.dumps(conf, ensure_ascii=False)};\nconst CARDAPIO = {json.dumps(card, ensure_ascii=False)};\n")


def compactar_css(texto: str) -> str:
    texto = re.sub(r"/\*.*?\*/", "", texto, flags=re.S)
    texto = re.sub(r"\s+", " ", texto)
    return re.sub(r"\s*([{};,>])\s*", r"\1", texto).replace(";}", "}").strip()


def compactar_js(texto: str) -> str:
    """Usa o terser se o Node estiver instalado; senão publica o arquivo como está."""
    try:
        r = subprocess.run(["npx", "-y", "terser@5", "--compress", "--mangle"], input=texto, capture_output=True, text=True, timeout=120)
        return r.stdout if r.returncode == 0 and len(r.stdout) > 1000 else texto
    except (OSError, subprocess.SubprocessError):
        return texto


def plaquinhas(site: Path) -> None:
    """Folha para imprimir: uma plaquinha por mesa, com QR Code que abre o cardápio no modo mesa."""
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        print("aviso: instale 'qrcode' (pip install qrcode) para gerar as plaquinhas de mesa")
        return
    base = (URL or "https://seurestaurante.com.br") + "/cardapio.html?mesa="
    cartoes = []
    for n in range(1, int(config.get("mesas", 12)) + 1):
        q = qrcode.make(base + str(n), image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1)
        svg = q.to_string(encoding="unicode")
        svg = re.sub(r"<\?xml[^>]*>", "", svg).replace("<svg ", '<svg class="qr" ', 1)
        cartoes.append(f'<article class="placa">{logo_svg()}<p class="nome">{NOME}</p><p class="mesa">Mesa {n}</p>{svg}'
                       f'<p class="como">Aponte a câmera do celular<br>para ver o cardápio{"" if VITRINE else " e pedir"}</p></article>')
    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Plaquinhas de mesa | {NOME}</title><link rel="stylesheet" href="assets/premium.css">
<style>body{{background:#ddd;padding:1rem}}main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(9.5cm,100%),1fr));gap:1rem;max-width:21cm;margin:auto}}
.placa{{display:grid;justify-items:center;gap:.4rem;padding:1.2cm .8cm;background:#f4ead6;color:#1f150e;text-align:center;border-radius:6px;break-inside:avoid}}
.placa .selo-marca{{width:2.2cm;height:2.2cm;color:#b23a1e}}.nome{{font:500 1.4rem/1 var(--display)}}.mesa{{font:italic 400 2.6rem/1 var(--display);color:#b23a1e}}
.qr{{width:4.6cm;height:4.6cm}}.como{{font-size:.85rem;color:#5f4a3a}}.dica{{max-width:21cm;margin:0 auto 1rem;font:400 1rem/1.5 var(--sans);color:#1f150e}}
@media print{{body{{background:none;padding:0}}.dica{{display:none}}main{{gap:0}}.placa{{border:1px dashed #bbb;border-radius:0}}}}</style></head>
<body><p class="dica">Imprima esta página (Ctrl+P). Cada QR Code abre o cardápio já na mesa certa. Endereço usado: {base}N</p><main>{''.join(cartoes)}</main></body></html>"""
    (site / "mesas.html").write_text(html, encoding="utf-8")


def montar_unico() -> Path:
    html = pagina_html("inicio", False, f"<style>\n{css}\n</style>", f"<script>\n{js_dados(caminhos(config, embutir), caminhos(cardapio, embutir))}</script>\n<script>\n{js}\n</script>")
    destino = AQUI / "casa-brasa.html"
    destino.write_text(html, encoding="utf-8")
    return destino


def montar_pasta() -> Path:
    site = AQUI / "site"
    if site.exists():
        shutil.rmtree(site)
    ativos = site / "assets"
    (ativos / "fontes").mkdir(parents=True)
    for f in FONTES_ARQ:
        shutil.copy(FONTE / "fontes" / f"{f}.woff2", ativos / "fontes" / f"{f}.woff2")
    (ativos / "premium.css").write_text(css_fontes() + compactar_css(css), encoding="utf-8")
    (ativos / "premium.js").write_text(compactar_js(js), encoding="utf-8")
    for pasta in ("fotos", "video"):
        if (PUBLICO / pasta).exists():
            shutil.copytree(PUBLICO / pasta, ativos / pasta)
    na_pasta = lambda c: "assets/" + c
    (ativos / "dados.js").write_text(js_dados(caminhos(config, na_pasta), caminhos(cardapio, na_pasta)), encoding="utf-8")

    estilo = '<link rel="stylesheet" href="assets/premium.css">'
    scripts = '<script src="assets/dados.js" defer></script>\n<script src="assets/premium.js" defer></script>'
    for pagina in ATIVAS:
        (site / PAGINAS[pagina][0]).write_text(pagina_html(pagina, True, estilo, scripts), encoding="utf-8")

    # conteúdo já escrito no HTML (início, cardápio e a casa): abre mais rápido e o Google lê sem rodar script
    try:
        r = subprocess.run(["node", str(AQUI / "prerender.js"), str(site), "index.html", "cardapio.html", "sobre.html"], capture_output=True, text=True, timeout=180)
        prontos = json.loads(r.stdout) if r.returncode == 0 else {}
    except (OSError, subprocess.SubprocessError, ValueError):
        prontos = {}
    for pagina in ATIVAS:
        arquivo = PAGINAS[pagina][0]
        if arquivo in prontos:
            (site / arquivo).write_text(pagina_html(pagina, True, estilo, scripts, prontos[arquivo]), encoding="utf-8")
    if not prontos:
        print("aviso: sem Node/Playwright, as páginas da pasta são escritas pelo script ao abrir")

    plaquinhas(site)
    if URL:
        urls = "".join(f"<url><loc>{URL}/{'' if p == 'inicio' else a}</loc></url>" for p, (a, _, _) in PAGINAS.items() if p in ATIVAS and p != "pedido")
        (site / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding="utf-8")
        (site / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {URL}/sitemap.xml\n", encoding="utf-8")
    return site


if __name__ == "__main__":
    unico = montar_unico()
    print(f"{unico.name}: {unico.stat().st_size // 1024} KB")
    pasta = montar_pasta()
    total = sum(f.stat().st_size for f in pasta.rglob("*") if f.is_file())
    print(f"{pasta.name}/: {len(list(pasta.rglob('*.html')))} páginas, {total // 1024} KB no total")
