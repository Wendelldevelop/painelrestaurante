"use client";

import { useState } from "react";
import clsx from "clsx";
import { useCarrinho } from "@/store/carrinho";

/** Botão rápido de "+" nos cartões do cardápio. */
export function BotaoAdicionarRapido({
  id,
  nome,
  className,
  tom = "claro",
}: {
  id: string;
  nome: string;
  className?: string;
  /** "escuro" para usar sobre fundo verde, vinho ou foto */
  tom?: "claro" | "escuro";
}) {
  const adicionar = useCarrinho((s) => s.adicionar);
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        adicionar(id);
        setFeito(true);
        setTimeout(() => setFeito(false), 1200);
      }}
      aria-label={`Adicionar ${nome} ao pedido`}
      className={clsx(
        "flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-sm border px-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
        tom === "escuro"
          ? feito
            ? "border-white bg-white text-verde"
            : "border-white/80 text-white hover:bg-white hover:text-verde"
          : feito
            ? "border-verde bg-verde text-white"
            : "border-verde text-verde hover:bg-verde hover:text-white",
        className,
      )}
    >
      <span aria-hidden>{feito ? "✓ Adicionado" : "+ Adicionar"}</span>
      <span aria-live="polite" className="sr-only">{feito ? `${nome} adicionado` : ""}</span>
    </button>
  );
}
