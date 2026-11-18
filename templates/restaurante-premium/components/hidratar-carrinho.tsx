"use client";

import { useEffect } from "react";
import { useCarrinho } from "@/store/carrinho";

/** Carrega o carrinho salvo no navegador depois da primeira renderização. */
export function HidratarCarrinho() {
  useEffect(() => {
    useCarrinho.persist.rehydrate();
  }, []);
  return null;
}
