"""Administração do Comanda+: cadastrar restaurante, mesas, equipe e gerar os QR Codes.

Exemplos:
  python3 admin.py criar casa-brasa "Casa Brasa" --mesas 12 --email gerente@casabrasa.com.br --senha "troque-esta-senha"
  python3 admin.py usuario casa-brasa cozinha@casabrasa.com.br "outra-senha" --nome "Dona Lúcia" --funcao cozinha
  python3 admin.py mesas casa-brasa 20
  python3 admin.py qrcodes casa-brasa --url https://app.comandamais.com.br
  python3 admin.py suspender casa-brasa      (ou: ativar)
  python3 admin.py listar

Os dados ficam em ./dados (ou na pasta indicada em COMANDA_DADOS), no mesmo banco que o servidor usa.
"""
import argparse
import hashlib
import os
import re
import secrets
import sqlite3
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
DADOS = Path(os.environ.get("COMANDA_DADOS", AQUI / "dados"))
DADOS.mkdir(parents=True, exist_ok=True)


def conecta():
    db = sqlite3.connect(DADOS / "comanda.db")
    db.executescript((AQUI / "esquema.sql").read_text(encoding="utf-8"))
    return db


def hash_senha(senha):
    if len(senha) < 8:
        sys.exit("A senha precisa ter pelo menos 8 caracteres.")
    sal = secrets.token_bytes(16)
    h = hashlib.scrypt(senha.encode(), salt=sal, n=16384, r=8, p=1, dklen=64, maxmem=64 * 1024 * 1024)
    return f"scrypt${sal.hex()}${h.hex()}"


def restaurante(db, slug):
    r = db.execute("SELECT id, nome FROM restaurantes WHERE slug = ?", (slug,)).fetchone()
    if not r:
        sys.exit(f"Restaurante '{slug}' não existe.")
    return r


def garante_mesas(db, rid, n):
    for numero in range(0, n + 1):  # 0 = balcão
        db.execute("INSERT OR IGNORE INTO mesas (restaurante_id, numero, token) VALUES (?, ?, ?)", (rid, numero, secrets.token_urlsafe(9)))
    db.execute("DELETE FROM mesas WHERE restaurante_id = ? AND numero > ?", (rid, n))


def cmd_criar(a):
    if not re.fullmatch(r"[a-z0-9-]{3,40}", a.slug):
        sys.exit("O identificador deve ter só letras minúsculas, números e hífen (ex.: casa-brasa).")
    db = conecta()
    db.execute("INSERT INTO restaurantes (slug, nome, plano) VALUES (?, ?, ?)", (a.slug, a.nome, a.plano))
    rid = db.execute("SELECT id FROM restaurantes WHERE slug = ?", (a.slug,)).fetchone()[0]
    garante_mesas(db, rid, a.mesas)
    db.execute("INSERT INTO usuarios (restaurante_id, nome, email, senha, funcao) VALUES (?, ?, ?, ?, 'gerente')", (rid, a.nome_gerente, a.email.lower(), hash_senha(a.senha)))
    db.commit()
    print(f"Restaurante '{a.nome}' criado com {a.mesas} mesas + balcão. Painel: /{a.slug}/painel  ·  TV: /{a.slug}/tv")


def cmd_usuario(a):
    db = conecta()
    rid = restaurante(db, a.slug)[0]
    db.execute("INSERT INTO usuarios (restaurante_id, nome, email, senha, funcao) VALUES (?, ?, ?, ?, ?) "
               "ON CONFLICT(restaurante_id, email) DO UPDATE SET senha = excluded.senha, nome = excluded.nome, funcao = excluded.funcao, ativo = 1",
               (rid, a.nome, a.email.lower(), hash_senha(a.senha), a.funcao))
    db.commit()
    print(f"Usuário {a.email} ({a.funcao}) salvo.")


def cmd_mesas(a):
    db = conecta()
    garante_mesas(db, restaurante(db, a.slug)[0], a.quantidade)
    db.commit()
    print(f"Agora são {a.quantidade} mesas + balcão. Gere os QR Codes de novo.")


def cmd_qrcodes(a):
    try:
        import qrcode
        import qrcode.image.svg
    except ImportError:
        sys.exit("Instale: pip install qrcode")
    db = conecta()
    rid, nome = restaurante(db, a.slug)
    base = a.url.rstrip("/")
    cartoes = []
    for numero, token in db.execute("SELECT numero, token FROM mesas WHERE restaurante_id = ? ORDER BY numero", (rid,)):
        url = f"{base}/{a.slug}/balcao?balcao=1&t={token}" if numero == 0 else f"{base}/{a.slug}/mesa/{numero}?t={token}"
        svg = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1).to_string(encoding="unicode")
        svg = re.sub(r"<\?xml[^>]*>", "", svg)
        titulo = "Balcão" if numero == 0 else f"Mesa {numero}"
        dica = "Peça aqui e retire com a sua senha" if numero == 0 else "Aponte a câmera para ver o cardápio e pedir"
        cartoes.append(f'<div class="placa"><b>{nome}</b><span>{titulo}</span>{svg}<small>{dica}</small></div>')
    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR Codes · {nome}</title><style>
body{{font-family:system-ui;margin:20px}}.placa{{display:inline-block;width:62mm;margin:4mm;padding:5mm;border:1px solid #000;border-radius:4mm;text-align:center;break-inside:avoid;vertical-align:top}}
.placa b{{display:block;font:700 18px Georgia,serif}}.placa span{{display:block;font-size:22px;font-weight:800;margin:2mm 0}}.placa svg{{width:42mm;height:42mm}}.placa small{{display:block;margin-top:2mm;font-size:11px}}
@media print{{button{{display:none}}}}</style></head><body><button onclick="print()">Imprimir</button><br>{''.join(cartoes)}</body></html>"""
    pasta = DADOS / "restaurantes" / a.slug
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / "qrcodes.html").write_text(html, encoding="utf-8")
    print(f"QR Codes gerados: {pasta / 'qrcodes.html'}  (também em /{a.slug}/qrcodes no servidor)")


def cmd_ativo(a, valor):
    db = conecta()
    restaurante(db, a.slug)
    db.execute("UPDATE restaurantes SET ativo = ? WHERE slug = ?", (valor, a.slug))
    db.commit()
    print(f"{a.slug}: {'ativo' if valor else 'suspenso'}.")


def cmd_listar(_):
    db = conecta()
    for slug, nome, plano, ativo, mesas in db.execute(
            "SELECT r.slug, r.nome, r.plano, r.ativo, (SELECT COUNT(*) FROM mesas m WHERE m.restaurante_id = r.id AND m.numero > 0) FROM restaurantes r ORDER BY r.id"):
        print(f"{slug:20} {nome:28} {plano:16} {mesas:3} mesas  {'ativo' if ativo else 'SUSPENSO'}")


p = argparse.ArgumentParser(description="Administração do Comanda+")
s = p.add_subparsers(dest="cmd", required=True)
c = s.add_parser("criar"); c.add_argument("slug"); c.add_argument("nome"); c.add_argument("--mesas", type=int, default=12)
c.add_argument("--email", required=True); c.add_argument("--senha", required=True); c.add_argument("--nome-gerente", default="Gerente"); c.add_argument("--plano", default="Mesa Completa")
c.set_defaults(f=cmd_criar)
c = s.add_parser("usuario"); c.add_argument("slug"); c.add_argument("email"); c.add_argument("senha"); c.add_argument("--nome", default="Equipe")
c.add_argument("--funcao", default="gerente", choices=["gerente", "cozinha", "bar", "mesas", "reservas", "pedidos", "balcao"]); c.set_defaults(f=cmd_usuario)
c = s.add_parser("mesas"); c.add_argument("slug"); c.add_argument("quantidade", type=int); c.set_defaults(f=cmd_mesas)
c = s.add_parser("qrcodes"); c.add_argument("slug"); c.add_argument("--url", required=True); c.set_defaults(f=cmd_qrcodes)
c = s.add_parser("suspender"); c.add_argument("slug"); c.set_defaults(f=lambda a: cmd_ativo(a, 0))
c = s.add_parser("ativar"); c.add_argument("slug"); c.set_defaults(f=lambda a: cmd_ativo(a, 1))
c = s.add_parser("listar"); c.set_defaults(f=cmd_listar)
a = p.parse_args()
a.f(a)
