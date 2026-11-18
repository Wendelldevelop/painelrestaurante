import type { Alergenico, Categoria, Restricao } from "@/types";

export const NOME_CATEGORIA: Record<Categoria, string> = {
  entradas: "Entradas",
  principais: "Principais",
  executivo: "Executivo",
  massas: "Massas",
  sobremesas: "Sobremesas",
  bebidas: "Bebidas",
  vinhos: "Vinhos",
};

/** Frase de apoio de cada categoria no cardápio. */
export const DESCRICAO_CATEGORIA: Record<Categoria, string> = {
  entradas: "Para abrir o apetite e dividir na mesa",
  principais: "Do fogo de chão, com o tempo que cada corte pede",
  executivo: "Almoço completo de terça a sexta",
  massas: "Feitas à mão todos os dias",
  sobremesas: "Para fechar com doçura",
  bebidas: "Sucos da fruta, chopes e drinques da casa",
  vinhos: "Taças escolhidas para acompanhar a brasa",
};

export const ALERGENICO_INFO: Record<Alergenico, { nome: string; icone: string }> = {
  gluten: { nome: "Glúten", icone: "🌾" },
  lactose: { nome: "Lactose", icone: "🥛" },
  frutos_do_mar: { nome: "Frutos do mar", icone: "🦐" },
  amendoim: { nome: "Amendoim", icone: "🥜" },
  ovo: { nome: "Ovo", icone: "🥚" },
  soja: { nome: "Soja", icone: "🫘" },
};

export const RESTRICAO_INFO: Record<Restricao, { nome: string; icone: string }> = {
  vegetariano: { nome: "Vegetariano", icone: "🥕" },
  vegano: { nome: "Vegano", icone: "🌱" },
  sem_gluten: { nome: "Sem glúten", icone: "🚫🌾" },
};

export function reais(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
