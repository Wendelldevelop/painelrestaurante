import Link from "next/link";
import clsx from "clsx";
import type { Categoria, ItemCardapio } from "@/types";
import { config } from "@/lib/dados";
import { DESCRICAO_CATEGORIA, NOME_CATEGORIA, reais } from "@/lib/rotulos";
import { Foto } from "./foto";
import { BotaoAdicionarRapido } from "./botao-adicionar";
import { IconeEspecialidade } from "./icones";
import { Alergenicos, Restricoes } from "./selos";
import { Prato3D } from "./prato-3d";

/* ---------- Peças comuns ---------- */

function PratoRedondo({ item, className, borda = "bg-white" }: { item: ItemCardapio; className?: string; borda?: string }) {
  return (
    <Link href={`/cardapio/${item.id}`} className={clsx("group block rounded-full p-2.5 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.6)]", borda, className)}>
      <Foto
        src={item.imagem}
        alt={item.nome}
        sizes="(max-width: 768px) 60vw, 320px"
        className="aspect-square rounded-full"
        imgClassName="transition-transform duration-700 group-hover:rotate-6 group-hover:scale-105"
      />
    </Link>
  );
}

function Selo({ texto, className }: { texto: string; className?: string }) {
  return (
    <span className={clsx("inline-block rounded-sm bg-mostarda px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white", className)}>
      {texto}
    </span>
  );
}

function Titulo({ categoria, claro, className }: { categoria: Categoria; claro?: boolean; className?: string }) {
  return (
    <div className={className}>
      <h2 className={clsx("font-serif text-5xl font-semibold leading-none md:text-6xl", claro ? "text-white" : "text-verde")}>
        {NOME_CATEGORIA[categoria]}
      </h2>
      <p className={clsx("mt-3 text-sm uppercase tracking-[0.2em]", claro ? "text-white/75" : "text-suave")}>{DESCRICAO_CATEGORIA[categoria]}</p>
    </div>
  );
}

/* ---------- Prato do chefe: grande, centralizado, girando 360° ---------- */

export function PratoDoChefe({ item }: { item: ItemCardapio }) {
  return (
    <section aria-labelledby="titulo-chefe" className="relative overflow-hidden border-b border-linha bg-salvia">
      {/* Palavra gigante e clara ao fundo */}
      <p aria-hidden className="pointer-events-none absolute inset-x-0 top-6 select-none text-center font-serif text-[22vw] font-semibold leading-none text-white/70 md:text-[200px]">
        Chefe
      </p>
      <div className="container-site relative flex flex-col items-center pb-14 pt-10 text-center md:pb-20">
        <p className="ornamento rotulo">Prato do chefe</p>
        <div className="mt-2 w-full max-w-[560px]">
          <Prato3D imagem={item.imagem} nome={item.nome} quente={item.quente} />
        </div>
        <p className="-mt-2 text-xs uppercase tracking-[0.2em] text-suave">Arraste para girar</p>
        <h2 id="titulo-chefe" className="mt-5 font-serif text-5xl font-semibold text-verde md:text-6xl">
          {item.nome}
        </h2>
        <p className="mt-3 max-w-lg text-lg leading-relaxed text-suave">{item.descricao}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="font-serif text-4xl font-semibold text-terra">{reais(item.preco)}</span>
          <BotaoAdicionarRapido id={item.id} nome={item.nome} />
          <Link href={`/cardapio/${item.id}`} className="text-sm font-bold text-verde underline-offset-4 hover:underline">
            Ver detalhes
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Principais: pratos em coluna sobre faixa verde translúcida ---------- */

export function SecaoColunaVerde({
  categoria,
  itens,
  fundo,
  translucido,
  lado = "direita",
}: {
  categoria: Categoria;
  itens: ItemCardapio[];
  /** Foto clara ao fundo (fica atrás do verde translúcido) */
  fundo?: string;
  translucido?: boolean;
  lado?: "direita" | "esquerda";
}) {
  const painelEsq = lado === "esquerda";
  return (
    <section id={`cat-${categoria}`} data-categoria className="relative scroll-mt-40 overflow-hidden">
      {fundo ? (
        <Foto src={fundo} alt="" sizes="100vw" className="!absolute inset-0 opacity-25" />
      ) : null}
      <div className="relative grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Lado claro: título e diferenciais */}
        <div className={clsx("bg-white/85 px-4 py-14 md:px-12 md:py-20", painelEsq && "md:order-2")}>
          <div className="md:sticky md:top-40">
            <Titulo categoria={categoria} />
            <ul className="mt-10 space-y-5">
              {config.especialidades.slice(0, 3).map((e) => (
                <li key={e.titulo} className="flex items-center gap-4">
                  <IconeEspecialidade tipo={e.icone} className="h-9 w-9 shrink-0 text-verde" />
                  <span className="text-xs font-bold uppercase leading-snug tracking-[0.16em] text-tinta">{e.titulo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Faixa verde com os pratos em coluna */}
        <div
          className={clsx(
            "px-4 py-12 md:px-10 md:py-20",
            translucido ? "bg-verde/85 backdrop-blur-[2px]" : "bg-oliva",
            painelEsq ? "md:order-1 md:rounded-r-[48px]" : "md:rounded-l-[48px]",
          )}
        >
          <ul className="space-y-10">
            {itens.map((item) => (
              <li key={item.id} className={clsx("flex items-center gap-5 md:gap-8", painelEsq && "md:flex-row-reverse md:text-right")}>
                <PratoRedondo item={item} borda="bg-noite" className={clsx("w-32 shrink-0 md:w-44", painelEsq ? "md:-mr-24" : "md:-ml-24")} />
                <div className="min-w-0 text-white">
                  {item.selo ? <Selo texto={item.selo} className="mb-2" /> : null}
                  <h3 className="font-serif text-2xl font-semibold uppercase leading-tight tracking-wide md:text-3xl">
                    <Link href={`/cardapio/${item.id}`} className="hover:underline">
                      {item.nome}
                    </Link>
                  </h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/80">{item.descricao}</p>
                  <div className={clsx("mt-3 flex items-center gap-4", painelEsq && "md:justify-end")}>
                    <span className="font-serif text-2xl font-semibold">{reais(item.preco)}</span>
                    <BotaoAdicionarRapido id={item.id} nome={item.nome} tom="escuro" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Entradas e massas: prato grande alternando com cartão de informação ---------- */

export function SecaoAlternada({ categoria, itens }: { categoria: Categoria; itens: ItemCardapio[] }) {
  return (
    <section id={`cat-${categoria}`} data-categoria className="scroll-mt-40 overflow-hidden bg-[#f6f7f2] py-16 md:py-24">
      <div className="container-site">
        <Titulo categoria={categoria} className="text-center" />
        <div className="mx-auto mt-3 flex justify-center">
          <span className="ornamento" aria-hidden>
            ◆
          </span>
        </div>
        <ul className="mt-12 space-y-14 md:space-y-6">
          {itens.map((item, i) => {
            const inverter = i % 2 === 1;
            return (
              <li key={item.id} className="relative grid items-center gap-6 md:grid-cols-2 md:gap-0">
                {/* Curva verde atrás do prato */}
                <div
                  aria-hidden
                  className={clsx(
                    "absolute top-1/2 hidden h-[70%] w-[60%] -translate-y-1/2 bg-verde md:block",
                    inverter ? "left-0 rounded-r-full" : "right-0 rounded-l-full",
                  )}
                />
                <div className={clsx("relative flex justify-center", inverter ? "md:order-1" : "md:order-2")}>
                  <PratoRedondo item={item} className="w-64 md:w-80" />
                </div>
                <div className={clsx("relative z-10", inverter ? "md:order-2 md:-ml-10" : "md:order-1 md:-mr-10 md:justify-self-end")}>
                  <div className="max-w-sm border border-white bg-white/90 p-6 shadow-[0_20px_40px_-30px_rgba(29,36,31,0.5)] backdrop-blur-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-serif text-3xl font-semibold uppercase leading-none text-verde">
                        <Link href={`/cardapio/${item.id}`} className="hover:underline">
                          {item.nome}
                        </Link>
                      </h3>
                      {item.selo ? <Selo texto={item.selo} /> : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-suave">{item.descricao}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Restricoes item={item} />
                      <Alergenicos item={item} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-sm bg-verde px-4 py-2 font-serif text-2xl font-semibold text-white">{reais(item.preco)}</span>
                      <BotaoAdicionarRapido id={item.id} nome={item.nome} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Executivo: lista numerada em painel vinho e pratos numerados na mesa ---------- */

export function SecaoExecutivo({ itens }: { itens: ItemCardapio[] }) {
  return (
    <section id="cat-executivo" data-categoria className="scroll-mt-40 bg-[#efe9e1] py-16 md:py-24">
      <div className="container-site">
        <div className="relative rounded-t-[28px] bg-vinho px-6 pb-36 pt-12 text-white md:px-14 md:pb-44">
          <p className="text-center font-serif text-6xl italic leading-none text-[#f0d9a8] md:text-7xl">Executivo</p>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-[0.35em] text-white/80">{config.executivo.dias}</p>
          <ol className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {itens.map((item, i) => (
              <li key={item.id} className="min-w-0">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-bold">
                    <span className="text-[#f0d9a8]">{i + 1}.</span>{" "}
                    <Link href={`/cardapio/${item.id}`} className="hover:underline">
                      {item.nome}
                    </Link>
                  </h3>
                  <span className="pontilhado !border-white/30" aria-hidden />
                  <span className="font-bold tabular-nums">{reais(item.preco)}</span>
                </div>
                {item.selo ? <p className="mt-0.5 text-sm font-bold text-[#e9b96a]">{item.selo}</p> : null}
                <p className="mt-1 text-sm leading-relaxed text-white/80">{item.descricao}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-sm text-white/70">{config.executivo.inclui}</p>
        </div>
        {/* "Mesa" com os pratos numerados */}
        <div className="relative -mt-28 rounded-b-[28px] bg-[linear-gradient(180deg,transparent_0,transparent_40%,#3a2a20_40%)] px-4 pb-10 md:-mt-32">
          <ul className="relative flex flex-wrap items-end justify-center gap-4 md:gap-8">
            {itens.map((item, i) => (
              <li key={item.id} className="relative w-[42%] max-w-[200px] md:w-[22%]">
                <span className="absolute -left-1 -top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3e2b8] font-bold text-vinho shadow">
                  {i + 1}
                </span>
                <PratoRedondo item={item} />
                <div className="mt-3 flex justify-center">
                  <BotaoAdicionarRapido id={item.id} nome={item.nome} tom="escuro" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bebidas e vinhos: colagem em arco sobre foto escura translúcida ---------- */

export function SecaoBar({ bebidas, vinhos, fundo }: { bebidas: ItemCardapio[]; vinhos: ItemCardapio[]; fundo: string }) {
  const arco = [...bebidas, ...vinhos].slice(0, 5);
  return (
    <section className="relative overflow-hidden bg-noite text-white">
      <Foto src={fundo} alt="" sizes="100vw" className="!absolute inset-0 opacity-30 grayscale" />
      <div className="absolute inset-0 bg-noite/60" aria-hidden />
      <div className="container-site relative grid items-center gap-12 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:py-24">
        <div>
          <span className="block h-px w-24 bg-white/70" aria-hidden />
          <h2 className="my-6 font-serif text-5xl font-semibold tracking-[0.18em] md:text-6xl">BAR</h2>
          <span className="block h-px w-24 bg-white/70" aria-hidden />
          <p className="mt-6 max-w-xs text-white/75">{DESCRICAO_CATEGORIA.bebidas}. {DESCRICAO_CATEGORIA.vinhos}.</p>
        </div>
        {/* Arco de fotos (no celular vira uma faixa que desliza) */}
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:relative md:block md:h-[460px] md:overflow-visible md:px-0" aria-label="Destaques do bar">
          {arco.map((item, i) => {
            const ang = -24 + i * 12; // graus ao longo do arco
            return (
              <li
                key={item.id}
                className="w-44 shrink-0 md:absolute md:right-[14%] md:top-1/2 md:w-[36%]"
                style={{ ["--ang" as string]: `${ang}deg` }}
              >
                <Link
                  href={`/cardapio/${item.id}`}
                  className="block overflow-hidden border-4 border-noite shadow-2xl md:origin-[230%_50%] md:[transform:translateY(-50%)_rotate(var(--ang))]"
                >
                  <Foto src={item.imagem} alt={item.nome} sizes="(max-width: 768px) 176px, 300px" className="aspect-[4/3]" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="container-site relative grid gap-10 pb-20 md:grid-cols-2">
        {([
          ["bebidas", bebidas],
          ["vinhos", vinhos],
        ] as const).map(([cat, lista]) => (
          <div key={cat} id={`cat-${cat}`} data-categoria className="scroll-mt-40">
            <h3 className="font-serif text-4xl font-semibold">{NOME_CATEGORIA[cat]}</h3>
            <ul className="mt-6 divide-y divide-white/15 border-y border-white/15">
              {lista.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <Link href={`/cardapio/${item.id}`} className="font-bold hover:underline">
                        {item.nome}
                      </Link>
                      <span className="pontilhado !border-white/30" aria-hidden />
                      <span className="font-serif text-xl font-semibold tabular-nums text-[#f0d9a8]">{reais(item.preco)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/65">{item.descricao}</p>
                  </div>
                  <BotaoAdicionarRapido id={item.id} nome={item.nome} tom="escuro" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
