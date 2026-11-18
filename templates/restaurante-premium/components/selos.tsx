import clsx from "clsx";
import type { ItemCardapio } from "@/types";
import { ALERGENICO_INFO, RESTRICAO_INFO } from "@/lib/rotulos";

/** Ícones de alergênicos com texto acessível. */
export function Alergenicos({ item, detalhado }: { item: ItemCardapio; detalhado?: boolean }) {
  if (!item.alergenicos.length) {
    return detalhado ? <p className="text-sm text-suave">Sem alergênicos declarados.</p> : null;
  }
  return (
    <ul className={clsx("flex flex-wrap", detalhado ? "gap-2" : "gap-1")} aria-label="Alergênicos">
      {item.alergenicos.map((a) => (
        <li
          key={a}
          title={`Contém ${ALERGENICO_INFO[a].nome.toLowerCase()}`}
          className={clsx(
            "inline-flex items-center gap-1 rounded-sm border border-terra/30 bg-terra-claro",
            detalhado ? "px-3 py-1.5 text-sm" : "px-1.5 py-0.5 text-xs",
          )}
        >
          <span aria-hidden>{ALERGENICO_INFO[a].icone}</span>
          <span className={detalhado ? "" : "sr-only"}>Contém {ALERGENICO_INFO[a].nome.toLowerCase()}</span>
        </li>
      ))}
    </ul>
  );
}

export function Restricoes({ item }: { item: ItemCardapio }) {
  const vegano = item.restricoes.includes("vegano");
  const lista = item.restricoes.filter((r) => !(vegano && r === "vegetariano"));
  return (
    <>
      {lista.map((r) => (
        <span key={r} className="rounded-sm bg-salvia px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-verde">
          {RESTRICAO_INFO[r].nome}
        </span>
      ))}
      {item.picante > 0 ? (
        <span className="rounded-sm bg-terra-claro px-2 py-0.5 text-[11px] font-semibold text-terra" title={`Picância ${item.picante} de 3`}>
          <span aria-hidden>{"🌶️".repeat(item.picante)}</span>
          <span className="sr-only">Picante, nível {item.picante} de 3</span>
        </span>
      ) : null}
    </>
  );
}
