"""Roda todos os testes do site nos três modos e deixa o config como estava.

Uso:
    python3 templates/restaurante-site/testes/testar.py

Precisa de Node com Playwright (já vem no ambiente da nuvem). Imprime só o resumo.
"""
import json
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SITE = AQUI.parent
CONFIG = SITE.parent / "restaurante-premium" / "data" / "config.json"

# modo do config -> testes que valem para ele
PLANO = [
    (True, ["fluxos.js", "mesa.js"]),        # pedido e reserva pelo WhatsApp
    ("painel", ["painel-qr.js"]),            # pedido para o PDV, só com QR da mesa
    (False, ["cardapio.js"]),                # só cardápio
]


def rodar(cmd):
    r = subprocess.run(cmd, cwd=SITE, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()


original = CONFIG.read_text(encoding="utf-8")
falhou = False
try:
    for modo, testes in PLANO:
        conf = json.loads(original)
        conf["pedidos"] = modo
        conf["entrega"]["delivery"] = True  # testa o modo mais completo
        CONFIG.write_text(json.dumps(conf, ensure_ascii=False, indent=2), encoding="utf-8")
        codigo, saida = rodar([sys.executable, "montar.py"])
        if codigo:
            print(f"[{modo}] montar.py falhou:\n{saida}")
            falhou = True
            continue
        for t in testes:
            codigo, saida = rodar(["node", str(AQUI / t)])
            linhas = [l for l in saida.splitlines() if "FALHA" in l or "Error" in l]
            ok = codigo == 0 and not [l for l in linhas if "FALHAS 0" not in l]
            falhou |= not ok
            print(f"[pedidos={modo}] {t}: {'ok' if ok else 'FALHOU'}")
            if not ok:
                print("   " + "\n   ".join(linhas or saida.splitlines()[-5:]))
finally:
    CONFIG.write_text(original, encoding="utf-8")
    rodar([sys.executable, "montar.py"])
    codigo, saida = rodar([sys.executable, "demo-pdv.py"])
    if not codigo:
        codigo, saida = rodar(["node", str(AQUI / "pdv.js")])
        ok = codigo == 0 and "PDV cards: 1" in saida and "Em preparo" in saida
        falhou |= not ok
        print(f"[demo PDV] pdv.js: {'ok' if ok else 'FALHOU'}")
        codigo, saida = rodar(["node", str(AQUI / "duas-telas.js")])
        ok = codigo == 0 and "FALHAS 0" in saida
        falhou |= not ok
        print(f"[cliente + restaurante] duas-telas.js: {'ok' if ok else 'FALHOU'}")
        codigo, saida = rodar(["node", str(AQUI / "sistema.js")])
        ok = codigo == 0 and "FALHAS 0" in saida
        falhou |= not ok
        print(f"[tudo em um] sistema.js: {'ok' if ok else 'FALHOU'}")
print("RESULTADO:", "FALHOU" if falhou else "tudo ok")
sys.exit(1 if falhou else 0)
