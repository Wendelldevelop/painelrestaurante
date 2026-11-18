import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarItem, config, listarCardapio } from "@/lib/dados";
import { NOME_CATEGORIA, reais } from "@/lib/rotulos";
import { PratoDesmontado } from "@/components/prato-desmontado";
import { AdicionarComObservacao } from "@/components/adicionar-com-observacao";
import { Alergenicos, Restricoes } from "@/components/selos";
import { CartaoPrato } from "@/components/cartao-prato";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return listarCardapio().map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = buscarItem((await params).id);
  if (!item) return {};
  return {
    title: item.nome,
    description: `${item.descricao} ${reais(item.preco)} no ${config.nome}.`,
    openGraph: { title: `${item.nome} — ${config.nome}`, description: item.descricao, images: [{ url: item.imagem }] },
  };
}

export default async function PratoPage({ params }: Props) {
  const item = buscarItem((await params).id);
  if (!item) notFound();

  const harmonizacao = item.harmonizacao.map(buscarItem).filter((i) => i !== undefined);

  return (
    <article className="pb-24">
      <div className="container-site pt-6">
        <nav aria-label="Caminho" className="text-sm text-suave">
          <Link href="/cardapio" className="hover:text-terra">Cardápio</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href={`/cardapio#cat-${item.categoria}`} className="hover:text-terra">{NOME_CATEGORIA[item.categoria]}</Link>
        </nav>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          {/* Na etapa 3 este bloco ganha o prato 3D; a vista desmontada continua como alternativa */}
          <div className="relative bg-salvia px-2 py-6">
            <PratoDesmontado item={item} />
          </div>

          <div className="lg:pt-6">
            <div className="flex flex-wrap gap-1.5">
              <Restricoes item={item} />
            </div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-none text-verde md:text-6xl">{item.nome}</h1>
            <p className="mt-3 font-serif text-3xl text-terra">{reais(item.preco)}</p>
            <p className="mt-5 text-lg leading-relaxed text-suave">{item.descricao}</p>

            <h2 className="rotulo mt-8">Ingredientes</h2>
            <p className="mt-2 text-tinta/90">{item.ingredientes.join(", ")}.</p>

            <h2 className="rotulo mt-6">Alergênicos</h2>
            <div className="mt-3">
              <Alergenicos item={item} detalhado />
            </div>

            <div className="mt-8">
              <AdicionarComObservacao item={item} />
            </div>
          </div>
        </div>
      </div>

      {harmonizacao.length ? (
        <section className="container-site mt-20">
          <p className="rotulo">Harmonização sugerida</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold text-verde md:text-5xl">Para acompanhar</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {harmonizacao.map((h) => (
              <li key={h.id}>
                <CartaoPrato item={h} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
