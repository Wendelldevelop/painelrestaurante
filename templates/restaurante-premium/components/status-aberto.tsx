"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { config } from "@/lib/dados";
import { estaAberto } from "@/lib/horarios";

/** "Aberto agora" ou "Fechado", calculado no fuso do restaurante. */
export function StatusAberto({ className }: { className?: string }) {
  const [aberto, setAberto] = useState<boolean | null>(null);
  useEffect(() => {
    const atualizar = () => setAberto(estaAberto(config));
    atualizar();
    const id = setInterval(atualizar, 60_000);
    return () => clearInterval(id);
  }, []);
  if (aberto === null) return null;
  return (
    <span
      className={clsx(
        "inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        aberto ? "bg-salvia text-verde" : "bg-terra-claro text-terra",
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", aberto ? "bg-verde" : "bg-terra")} />
      {aberto ? "Aberto agora" : "Fechado"}
    </span>
  );
}
