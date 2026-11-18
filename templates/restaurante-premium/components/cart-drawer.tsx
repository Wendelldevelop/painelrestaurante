"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import cardapio from "@/data/cardapio.json";
import type { ItemCardapio } from "@/types";
import { config } from "@/lib/dados";
import { reais } from "@/lib/rotulos";
import { useCarrinho } from "@/store/carrinho";
import { Foto } from "./foto";

const ITENS = cardapio as ItemCardapio[];

export function CartDrawer() {
  const { itens, aberto, fechar, alterarQtd, remover } = useCarrinho();
  const fecharRef = useRef<HTMLButtonElement>(null);

  const linhas = itens
    .map((c) => ({ ...c, item: ITENS.find((i) => i.id === c.id) }))
    .filter((l): l is typeof l & { item: ItemCardapio } => Boolean(l.item));
  const subtotal = linhas.reduce((s, l) => s + l.item.preco * l.qtd, 0);
  const falta = Math.max(0, config.entrega.pedidoMinimo - subtotal);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, fechar]);

  return (
    <AnimatePresence>
      {aberto ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="titulo-carrinho">
          <motion.div
            className="absolute inset-0 bg-tinta/50"
            onClick={fechar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-linha bg-white"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-linha px-5 py-4">
              <h2 id="titulo-carrinho" className="font-serif text-3xl font-semibold text-verde">Seu pedido</h2>
              <button ref={fecharRef} type="button" onClick={fechar} aria-label="Fechar pedido" className="flex h-11 w-11 items-center justify-center rounded-sm border border-linha text-lg">
                ✕
              </button>
            </div>

            {linhas.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="font-serif text-2xl">Seu pedido está vazio</p>
                <p className="text-sm text-suave">Escolha seus pratos no cardápio e eles aparecem aqui.</p>
                <Link href="/cardapio" onClick={fechar} className="rounded-sm bg-verde px-6 py-3 font-bold text-white">
                  Ver cardápio
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-linha overflow-y-auto px-5">
                  <AnimatePresence initial={false}>
                    {linhas.map((l) => (
                      <motion.li
                        key={l.chave}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="flex gap-4 py-4"
                      >
                        <Foto src={l.item.imagem} alt={l.item.nome} sizes="64px" semLegenda className="h-16 w-16 shrink-0 rounded-2xl" />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <p className="font-semibold leading-tight">{l.item.nome}</p>
                            <p className="shrink-0 font-semibold text-terra">{reais(l.item.preco * l.qtd)}</p>
                          </div>
                          {l.observacao ? <p className="mt-0.5 text-xs italic text-suave">Obs.: {l.observacao}</p> : null}
                          <div className="mt-2 flex items-center gap-2">
                            <button type="button" onClick={() => alterarQtd(l.chave, l.qtd - 1)} aria-label={`Diminuir ${l.item.nome}`} className="h-9 w-9 rounded-sm border border-linha">−</button>
                            <span className="w-6 text-center font-bold">{l.qtd}</span>
                            <button type="button" onClick={() => alterarQtd(l.chave, l.qtd + 1)} aria-label={`Aumentar ${l.item.nome}`} className="h-9 w-9 rounded-sm border border-linha">+</button>
                            <button type="button" onClick={() => remover(l.chave)} className="ml-auto text-xs text-suave underline-offset-2 hover:text-terra hover:underline">
                              Remover
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="border-t border-linha px-5 pb-6 pt-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal</span>
                    <span className="font-bold">{reais(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-suave">
                    Delivery: + {reais(config.entrega.taxa)} · {config.entrega.tempoDelivery}. Retirada sem taxa em {config.entrega.tempoRetirada}.
                  </p>
                  {falta > 0 ? (
                    <p className="mt-2 text-xs text-terra">Faltam {reais(falta)} para o pedido mínimo de delivery.</p>
                  ) : null}
                  <Link
                    href="/pedido"
                    onClick={fechar}
                    className="mt-4 flex h-14 items-center justify-center rounded-sm bg-verde text-base font-bold text-white hover:bg-verde-escuro"
                  >
                    Finalizar pedido
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
