"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ItemCarrinho } from "@/types";

type EstadoCarrinho = {
  itens: ItemCarrinho[];
  aberto: boolean;
  adicionar: (id: string, qtd?: number, observacao?: string) => void;
  alterarQtd: (chave: string, qtd: number) => void;
  remover: (chave: string) => void;
  limpar: () => void;
  abrir: () => void;
  fechar: () => void;
};

const chaveDe = (id: string, observacao: string) => `${id}::${observacao.trim().toLowerCase()}`;

/** Carrinho salvo no localStorage: continua lá se a pessoa fechar a aba. */
export const useCarrinho = create<EstadoCarrinho>()(
  persist(
    (set) => ({
      itens: [],
      aberto: false,
      adicionar: (id, qtd = 1, observacao = "") =>
        set((s) => {
          const chave = chaveDe(id, observacao);
          const existente = s.itens.find((i) => i.chave === chave);
          const itens = existente
            ? s.itens.map((i) => (i.chave === chave ? { ...i, qtd: i.qtd + qtd } : i))
            : [...s.itens, { chave, id, qtd, observacao: observacao.trim() }];
          return { itens };
        }),
      alterarQtd: (chave, qtd) =>
        set((s) => ({
          itens: qtd <= 0 ? s.itens.filter((i) => i.chave !== chave) : s.itens.map((i) => (i.chave === chave ? { ...i, qtd } : i)),
        })),
      remover: (chave) => set((s) => ({ itens: s.itens.filter((i) => i.chave !== chave) })),
      limpar: () => set({ itens: [] }),
      abrir: () => set({ aberto: true }),
      fechar: () => set({ aberto: false }),
    }),
    {
      name: "casa-brasa-carrinho",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ itens: s.itens }),
      // Hidrata manualmente no cliente para não divergir do HTML do servidor
      skipHydration: true,
    },
  ),
);

export const totalDeItens = (itens: ItemCarrinho[]) => itens.reduce((s, i) => s + i.qtd, 0);
