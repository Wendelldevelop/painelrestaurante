import cardapioJson from "@/data/cardapio.json";
import configJson from "@/data/config.json";
import type { Categoria, ConfigRestaurante, ItemCardapio } from "@/types";

/**
 * Ponto único de acesso aos dados. Hoje lê os JSON locais; para usar um banco,
 * troque só estas funções (as páginas não precisam mudar).
 */
export const config = configJson as ConfigRestaurante;
const cardapio = cardapioJson as ItemCardapio[];

export function listarCardapio(): ItemCardapio[] {
  return cardapio;
}

export function buscarItem(id: string): ItemCardapio | undefined {
  return cardapio.find((i) => i.id === id);
}

export function itensPorCategoria(categoria: Categoria): ItemCardapio[] {
  return cardapio.filter((i) => i.categoria === categoria);
}

export function destaques(): ItemCardapio[] {
  return cardapio.filter((i) => i.destaque);
}
