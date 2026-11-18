"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { ItemCardapio } from "@/types";
import { Foto } from "./foto";

/**
 * Prato "desmontado": a foto no centro, em louça branca, e cada ingrediente
 * anotado ao redor, como numa ficha técnica de cozinha. Começa montado e se
 * solta ao aparecer; o botão alterna entre os dois estados.
 */
export function PratoDesmontado({ item }: { item: ItemCardapio }) {
  const [montado, setMontado] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setMontado(false)));
    return () => cancelAnimationFrame(id);
  }, []);

  const ingredientes = item.ingredientes.slice(0, 8);
  const n = ingredientes.length;

  return (
    <div className="mx-auto w-full max-w-[540px]">
      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className={clsx(
            "absolute left-1/2 top-1/2 w-[54%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-700",
            montado ? "scale-110" : "scale-100",
          )}
        >
          <div className="flutuar rounded-full bg-white p-3 shadow-[0_24px_40px_-24px_rgba(29,36,31,0.55)] ring-1 ring-linha">
            <Foto src={item.imagem} alt={item.nome} sizes="300px" className="aspect-square rounded-full" />
          </div>
        </div>

        {ingredientes.map((nome, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const raio = 41;
          const x = Math.cos(ang);
          return (
            <div
              key={nome}
              className="absolute transition-all ease-[cubic-bezier(.2,.8,.25,1)]"
              style={{
                left: montado ? "50%" : `${50 + x * raio}%`,
                top: montado ? "50%" : `${50 + Math.sin(ang) * raio}%`,
                transform: `translate(-50%, -50%) scale(${montado ? 0.4 : 1})`,
                opacity: montado ? 0 : 1,
                transitionDuration: "800ms",
                transitionDelay: montado ? `${i * 25}ms` : `${150 + i * 60}ms`,
              }}
            >
              <span className="flex max-w-[96px] flex-col sm:max-w-[120px] items-center gap-1 text-center">
                <span className="h-1.5 w-1.5 rotate-45 bg-terra" aria-hidden />
                <span className="font-serif text-base italic leading-tight text-tinta first-letter:uppercase sm:text-lg">{nome}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={() => setMontado((m) => !m)}
          className="min-h-11 rounded-sm border border-verde px-5 text-xs font-bold uppercase tracking-[0.18em] text-verde transition-colors hover:bg-verde hover:text-white"
        >
          {montado ? "Desmontar prato" : "Montar prato"}
        </button>
      </div>
    </div>
  );
}
