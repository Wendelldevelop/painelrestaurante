import type { Metadata } from "next";
import { FinalizarPedido } from "@/components/finalizar-pedido";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Revise seu pedido e envie pelo WhatsApp para retirada ou delivery.",
  robots: { index: false },
};

export default function PedidoPage() {
  return (
    <div className="container-site max-w-3xl pb-24 pt-8 md:pt-12">
      <p className="rotulo">Pedido</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold text-verde md:text-6xl">Finalizar pedido</h1>
      <FinalizarPedido />
    </div>
  );
}
