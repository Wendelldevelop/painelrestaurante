import type { Metadata } from "next";
import { buscarItem, config, itensPorCategoria, listarCardapio } from "@/lib/dados";
import { NavegadorCardapio } from "@/components/navegador-cardapio";
import {
  PratoDoChefe,
  SecaoAlternada,
  SecaoBar,
  SecaoColunaVerde,
  SecaoExecutivo,
} from "@/components/cardapio-secoes";

export const metadata: Metadata = {
  title: "Cardápio",
  description: `Cardápio do ${config.nome}: prato do chefe, entradas, pratos na brasa, executivo, massas artesanais, sobremesas, bebidas e vinhos.`,
};

export default function CardapioPage() {
  const chefe = buscarItem(config.pratoDoChefe) ?? listarCardapio()[0];

  return (
    <>
      <PratoDoChefe item={chefe} />
      <NavegadorCardapio itens={listarCardapio()}>
        <SecaoAlternada categoria="entradas" itens={itensPorCategoria("entradas")} />
        <SecaoColunaVerde categoria="principais" itens={itensPorCategoria("principais")} fundo={config.sobre.fotos.salao} translucido />
        <SecaoExecutivo itens={itensPorCategoria("executivo")} />
        <SecaoAlternada categoria="massas" itens={itensPorCategoria("massas")} />
        <SecaoColunaVerde categoria="sobremesas" itens={itensPorCategoria("sobremesas")} lado="esquerda" />
        <SecaoBar bebidas={itensPorCategoria("bebidas")} vinhos={itensPorCategoria("vinhos")} fundo={config.sobre.fotos.galeria[4]} />
      </NavegadorCardapio>
    </>
  );
}
