import type { Categoria, ItemCardapio } from "@/types";

export const FILTROS = ["vegetariano", "vegano", "sem_gluten", "sem_lactose", "picante"] as const;
export type Filtro = (typeof FILTROS)[number];

export const NOME_FILTRO: Record<Filtro, string> = {
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  sem_gluten: "Sem glúten",
  sem_lactose: "Sem lactose",
  picante: "Picante",
};

/** Regras de cada filtro. Sem glúten e sem lactose olham os alergênicos declarados. */
export function atendeFiltro(item: ItemCardapio, filtro: Filtro): boolean {
  switch (filtro) {
    case "vegetariano":
      return item.restricoes.includes("vegetariano") || item.restricoes.includes("vegano");
    case "vegano":
      return item.restricoes.includes("vegano");
    case "sem_gluten":
      return !item.alergenicos.includes("gluten");
    case "sem_lactose":
      return !item.alergenicos.includes("lactose");
    case "picante":
      return item.picante > 0;
  }
}

/** Remove acentos e caixa para a busca achar "pao" em "Pão". */
export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filtrarCardapio(
  itens: ItemCardapio[],
  { filtros, busca, categoria }: { filtros: Filtro[]; busca: string; categoria?: Categoria },
) {
  const termo = normalizar(busca.trim());
  return itens.filter(
    (item) =>
      (!categoria || item.categoria === categoria) &&
      filtros.every((f) => atendeFiltro(item, f)) &&
      (!termo ||
        normalizar(item.nome).includes(termo) ||
        normalizar(item.descricao).includes(termo) ||
        item.ingredientes.some((i) => normalizar(i).includes(termo))),
  );
}
