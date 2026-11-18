"use client";

import { useState } from "react";
import clsx from "clsx";
import { useCarrinho } from "@/store/carrinho";
import { reais } from "@/lib/rotulos";
import type { ItemCardapio } from "@/types";

/** Itens grelhados em que faz sentido escolher o ponto. */
const TEM_PONTO = ["picanha", "salmão"];

/** Sugestões rápidas de observação conforme o prato. */
function sugestoes(item: ItemCardapio) {
  const lista: string[] = [];
  const ing = item.ingredientes.join(" ").toLowerCase();
  if (item.categoria === "principais" && TEM_PONTO.some((c) => ing.includes(c))) {
    lista.push("Mal passada", "Ao ponto", "Bem passada");
  }
  if (ing.includes("cebola")) lista.push("Sem cebola");
  if (ing.includes("pimenta") || item.picante > 0) lista.push("Sem pimenta");
  if (ing.includes("alho")) lista.push("Pouco alho");
  if (["bebidas", "vinhos"].includes(item.categoria)) lista.push("Sem gelo");
  return lista;
}

export function AdicionarComObservacao({ item }: { item: ItemCardapio }) {
  const adicionar = useCarrinho((s) => s.adicionar);
  const abrir = useCarrinho((s) => s.abrir);
  const [qtd, setQtd] = useState(1);
  const [obs, setObs] = useState("");

  const alternar = (s: string) => {
    const partes = obs.split(",").map((p) => p.trim()).filter(Boolean);
    const ponto = ["Mal passada", "Ao ponto", "Bem passada"];
    let novas = partes.includes(s) ? partes.filter((p) => p !== s) : [...partes.filter((p) => !(ponto.includes(s) && ponto.includes(p))), s];
    novas = novas.slice(0, 6);
    setObs(novas.join(", "));
  };

  return (
    <div className="rounded-md border border-linha bg-white p-5 md:p-6">
      <label htmlFor="obs" className="rotulo">
        Observações
      </label>
      {sugestoes(item).length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sugestoes(item).map((s) => {
            const marcado = obs.split(",").map((p) => p.trim()).includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={marcado}
                onClick={() => alternar(s)}
                className={clsx(
                  "min-h-10 rounded-sm border px-3.5 text-sm font-semibold transition-colors",
                  marcado ? "border-verde bg-verde text-white" : "border-linha text-tinta hover:border-verde/60",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : null}
      <textarea
        id="obs"
        value={obs}
        onChange={(e) => setObs(e.target.value.slice(0, 140))}
        rows={2}
        placeholder="Ex.: sem cebola, molho à parte…"
        className="mt-3 w-full resize-none rounded-2xl border border-linha bg-papel px-4 py-3 text-base text-tinta placeholder:text-suave/60 focus:border-verde focus:outline-none"
      />

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center rounded-sm border border-linha" role="group" aria-label="Quantidade">
          <button type="button" className="h-12 w-12 text-xl" onClick={() => setQtd((q) => Math.max(1, q - 1))} aria-label="Diminuir quantidade">−</button>
          <span className="w-8 text-center text-lg font-bold" aria-live="polite">{qtd}</span>
          <button type="button" className="h-12 w-12 text-xl" onClick={() => setQtd((q) => Math.min(20, q + 1))} aria-label="Aumentar quantidade">+</button>
        </div>
        <button
          type="button"
          onClick={() => {
            adicionar(item.id, qtd, obs);
            setQtd(1);
            setObs("");
            abrir();
          }}
          className="flex h-14 flex-1 items-center justify-between gap-3 rounded-sm bg-verde px-6 text-base font-bold text-white transition-colors hover:bg-verde-escuro"
        >
          <span>Adicionar</span>
          <span>{reais(item.preco * qtd)}</span>
        </button>
      </div>
    </div>
  );
}
