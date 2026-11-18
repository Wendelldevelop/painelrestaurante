import type { Especialidade } from "@/types";

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Ícones de traço fino, no estilo dos cardápios de referência. */
export function IconeEspecialidade({ tipo, className }: { tipo: Especialidade["icone"]; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden {...base}>
      {tipo === "brasa" ? (
        <>
          <path d="M16 4c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 1 4 3 5 0-4-1-7 0-10Z" />
          <path d="M7 27h18M10 24l-2 3M22 24l2 3" />
        </>
      ) : tipo === "massa" ? (
        <>
          <path d="M5 18h22a11 9 0 0 1-22 0Z" />
          <path d="M9 18c0-6 2-9 4-11M14 18c0-5 1-8 3-11M19 18c0-4 1-7 4-10" />
        </>
      ) : tipo === "folha" ? (
        <>
          <path d="M6 26C6 13 14 6 26 6c0 12-7 20-20 20Z" />
          <path d="M6 26 18 14" />
        </>
      ) : (
        <>
          <path d="M5 15 16 6l11 9" />
          <path d="M8 13v13h16V13" />
          <path d="M16 23s-4-2.5-4-5a2 2 0 0 1 4-.5 2 2 0 0 1 4 .5c0 2.5-4 5-4 5Z" />
        </>
      )}
    </svg>
  );
}

export function Estrelas({ nota, className }: { nota: number; className?: string }) {
  return (
    <span className={className} aria-label={`${nota} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden className={i < Math.round(nota) ? "text-mostarda" : "text-linha"}>
          ★
        </span>
      ))}
    </span>
  );
}
