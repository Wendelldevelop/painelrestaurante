"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CATEGORIAS, type Categoria, type ItemCardapio } from "@/types";
import { NOME_CATEGORIA } from "@/lib/rotulos";
import { FILTROS, NOME_FILTRO, filtrarCardapio, type Filtro } from "@/lib/filtros";
import { CartaoPrato } from "./cartao-prato";
import { Foto } from "./foto";

/**
 * Barra fixa do cardápio: categorias com foto, busca e filtros.
 * Sem busca nem filtro, mostra o cardápio ilustrado (children).
 * Com busca ou filtro, mostra só os resultados em grade.
 */
export function NavegadorCardapio({ itens, children }: { itens: ItemCardapio[]; children: React.ReactNode }) {
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [busca, setBusca] = useState("");
  const [ativa, setAtiva] = useState<Categoria | null>(null);
  const [abrirFiltros, setAbrirFiltros] = useState(false);

  const filtrando = filtros.length > 0 || busca.trim().length > 0;
  const resultados = useMemo(() => filtrarCardapio(itens, { filtros, busca }), [itens, filtros, busca]);
  const capa = (c: Categoria) => itens.find((i) => i.categoria === c && i.destaque) ?? itens.find((i) => i.categoria === c);

  // Destaca a categoria que está na tela
  useEffect(() => {
    if (filtrando) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const v = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setAtiva(v.target.id.replace("cat-", "") as Categoria);
      },
      { rootMargin: "-180px 0px -60% 0px" },
    );
    document.querySelectorAll("[data-categoria]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filtrando]);

  const alternar = (f: Filtro) => setFiltros((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  const limpar = () => {
    setFiltros([]);
    setBusca("");
  };

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-linha bg-white/95 backdrop-blur md:top-20">
        <div className="container-site">
          {/* Categorias com foto: toque para ir direto */}
          <nav aria-label="Categorias do cardápio" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <ul className="flex gap-4 py-3 md:justify-center md:gap-7">
              {CATEGORIAS.map((c) => {
                const item = capa(c);
                const atual = !filtrando && ativa === c;
                return (
                  <li key={c}>
                    <a
                      href={`#cat-${c}`}
                      onClick={limpar}
                      aria-current={atual ? "true" : undefined}
                      className="group flex w-16 flex-col items-center gap-1.5 md:w-20"
                    >
                      <span
                        className={clsx(
                          "block rounded-full p-0.5 ring-2 transition-colors",
                          atual ? "ring-terra" : "ring-transparent group-hover:ring-linha",
                        )}
                      >
                        {item ? <Foto src={item.imagem} alt="" sizes="64px" semLegenda className="h-12 w-12 rounded-full md:h-14 md:w-14" /> : null}
                      </span>
                      <span className={clsx("text-[11px] font-bold uppercase tracking-[0.12em]", atual ? "text-terra" : "text-suave")}>
                        {NOME_CATEGORIA[c]}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2 pb-3">
            <label className="relative flex-1 md:max-w-sm">
              <span className="sr-only">Buscar no cardápio</span>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-suave" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar prato ou ingrediente"
                className="h-11 w-full rounded-sm border border-linha bg-white pl-10 pr-3 text-base text-tinta placeholder:text-suave/70 focus:border-verde focus:outline-none"
              />
            </label>
            <button
              type="button"
              aria-expanded={abrirFiltros}
              aria-controls="filtros"
              onClick={() => setAbrirFiltros((a) => !a)}
              className={clsx(
                "flex h-11 shrink-0 items-center gap-2 rounded-sm border px-4 text-xs font-bold uppercase tracking-[0.12em]",
                filtros.length ? "border-verde bg-verde text-white" : "border-linha text-tinta hover:border-verde",
              )}
            >
              Filtros{filtros.length ? ` (${filtros.length})` : ""}
            </button>
          </div>

          {abrirFiltros ? (
            <div id="filtros" role="group" aria-label="Filtros" className="flex flex-wrap gap-2 pb-3">
              {FILTROS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filtros.includes(f)}
                  onClick={() => alternar(f)}
                  className={clsx(
                    "h-10 rounded-sm border px-3.5 text-sm transition-colors",
                    filtros.includes(f) ? "border-verde bg-verde text-white" : "border-linha text-tinta hover:border-verde",
                  )}
                >
                  {filtros.includes(f) ? "✓ " : ""}
                  {NOME_FILTRO[f]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filtrando ? (
        <section className="container-site min-h-[60vh] py-10" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-4xl font-semibold text-verde">
              {resultados.length} {resultados.length === 1 ? "prato encontrado" : "pratos encontrados"}
            </h2>
            <button type="button" onClick={limpar} className="text-sm font-bold text-verde underline underline-offset-4">
              Limpar e ver o cardápio completo
            </button>
          </div>
          {resultados.length ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((item) => (
                <li key={item.id}>
                  <CartaoPrato item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-suave">Nada com essa combinação. Tente outra busca ou tire algum filtro.</p>
          )}
        </section>
      ) : (
        children
      )}
    </>
  );
}
