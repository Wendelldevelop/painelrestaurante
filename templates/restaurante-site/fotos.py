"""Baixa e trata as fotos do site para parecerem uma sessão só.

Uso:
    pip install pillow
    python3 templates/restaurante-site/fotos.py

Lê ../restaurante-premium/data/fotos.json e grava em ../restaurante-premium/public/fotos/:
    <nome>-640.webp e <nome>-1280.webp   fotos de prato e da casa
    <nome>.webp                          pratos da roleta (recorte redondo, fundo transparente)

Tratamento igual para todas: mesmo enquadramento (4:3 nos pratos), exposição aproximada,
tom levemente quente e saturação contida. Para trocar uma foto, mude o link no fotos.json
(ou ponha o arquivo do cliente em "arquivo") e rode de novo.

Tipos:
    prato     foto de prato, cortada em 4:3
    foto      foto da casa (salão, chef...), mantém a proporção
    redondo   prato visto de cima para a roleta: "centro" [x, y] e "raio" em fração da imagem
"""
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps, ImageStat

AQUI = Path(__file__).resolve().parent
DADOS = AQUI.parent / "restaurante-premium" / "data"
SAIDA = AQUI.parent / "restaurante-premium" / "public" / "fotos"


def abrir(info: dict) -> Image.Image:
    if info.get("arquivo"):
        return Image.open(AQUI.parent / info["arquivo"]).convert("RGB")
    with urllib.request.urlopen(urllib.request.Request(info["url"], headers={"User-Agent": "site-restaurante"}), timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def tratar(im: Image.Image) -> Image.Image:
    """Mesma luz e mesma cor para todas as fotos."""
    lum = ImageStat.Stat(im.convert("L")).mean[0] / 255
    alvo = 0.5
    im = ImageEnhance.Brightness(im).enhance(max(.85, min(1.2, 1 + (alvo - lum) * .6)))
    im = ImageEnhance.Contrast(im).enhance(1.04)
    im = ImageEnhance.Color(im).enhance(.92)
    r, g, b = im.split()                                   # tom quente e discreto
    r = r.point(lambda v: min(255, int(v * 1.03 + 2)))
    b = b.point(lambda v: int(v * .95))
    return Image.merge("RGB", (r, g, b))


def gravar(nome: str, info: dict) -> None:
    im = tratar(abrir(info))
    if info["tipo"] == "redondo":
        w, h = im.size
        cx, cy = info["centro"][0] * w, info["centro"][1] * h
        # "auto": o maior círculo que cabe na foto, centrado
        raio = min(w, h) / 2 * .98 if info["raio"] == "auto" else info["raio"] * w
        cx = min(max(cx, raio), w - raio)
        cy = min(max(cy, raio), h - raio)
        lado = info.get("lado", 900)
        c = im.crop((int(cx - raio), int(cy - raio), int(cx + raio), int(cy + raio))).resize((lado, lado), Image.LANCZOS)
        m = Image.new("L", (lado * 2, lado * 2), 0)
        ImageDraw.Draw(m).ellipse((4, 4, lado * 2 - 4, lado * 2 - 4), fill=255)
        c.putalpha(m.resize((lado, lado), Image.LANCZOS))
        c.save(SAIDA / f"{nome}.webp", "WEBP", quality=82, method=6)
        return
    if info["tipo"] == "prato":
        im = ImageOps.fit(im, (1600, 1200), Image.LANCZOS, centering=info.get("foco", (.5, .5)))
    for lado in (640, 1280):
        c = im.copy()
        c.thumbnail((lado, lado * 2), Image.LANCZOS)
        c.save(SAIDA / f"{nome}-{lado}.webp", "WEBP", quality=78, method=6)


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    fotos = json.loads((DADOS / "fotos.json").read_text(encoding="utf-8"))
    so = set(sys.argv[1:])
    for nome, info in fotos.items():
        if so and nome not in so:
            continue
        try:
            gravar(nome, info)
            print("ok", nome)
        except Exception as erro:  # noqa: BLE001
            print("falhou", nome, erro)
