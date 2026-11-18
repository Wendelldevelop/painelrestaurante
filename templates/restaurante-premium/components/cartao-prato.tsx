import Link from "next/link";
import type { ItemCardapio } from "@/types";
import { reais } from "@/lib/rotulos";
import { Foto } from "./foto";
import { Alergenicos, Restricoes } from "./selos";
import { BotaoAdicionarRapido } from "./botao-adicionar";

export function CartaoPrato({ item }: { item: ItemCardapio }) {
  return (
    <article className="group relative flex h-full flex-col border border-linha bg-white transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(29,36,31,0.45)]">
      <Link href={`/cardapio/${item.id}`} className="absolute inset-0 z-10" aria-label={`Ver ${item.nome}`} />
      <Foto
        src={item.imagem}
        alt={item.nome}
        className="aspect-[4/3]"
        imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline gap-2">
          <h3 className="font-serif text-2xl font-semibold leading-tight text-tinta">{item.nome}</h3>
          <span className="pontilhado" aria-hidden />
          <p className="shrink-0 font-serif text-xl font-semibold text-terra">{reais(item.preco)}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-suave">{item.descricao}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Restricoes item={item} />
            <Alergenicos item={item} />
          </div>
          {/* acima do link do cartão */}
          <BotaoAdicionarRapido id={item.id} nome={item.nome} className="relative z-20" />
        </div>
      </div>
    </article>
  );
}
