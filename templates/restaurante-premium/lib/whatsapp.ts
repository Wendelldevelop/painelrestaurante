import type { ItemCardapio, ItemCarrinho, TipoPedido } from "@/types";
import { reais } from "./rotulos";

export function linkWhatsApp(numero: string, mensagem: string) {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
}

export type DadosPedido = {
  tipo: TipoPedido;
  nome: string;
  telefone: string;
  endereco?: string;
  complemento?: string;
  pagamento: string;
  troco?: string;
  observacoes?: string;
};

export type LinhaPedido = ItemCarrinho & { item: ItemCardapio };

/** Monta a mensagem formatada do pedido (negrito do WhatsApp com *texto*). */
export function mensagemPedido({
  restaurante,
  linhas,
  dados,
  taxaEntrega,
}: {
  restaurante: string;
  linhas: LinhaPedido[];
  dados: DadosPedido;
  taxaEntrega: number;
}) {
  const subtotal = linhas.reduce((s, l) => s + l.item.preco * l.qtd, 0);
  const taxa = dados.tipo === "delivery" ? taxaEntrega : 0;
  const total = subtotal + taxa;

  const itens = linhas.map((l) => {
    const obs = l.observacao ? `\n   _Obs.: ${l.observacao}_` : "";
    return `• ${l.qtd}x ${l.item.nome} — ${reais(l.item.preco * l.qtd)}${obs}`;
  });

  const partes = [
    `*Novo pedido — ${restaurante}*`,
    `*Tipo:* ${dados.tipo === "delivery" ? "Delivery" : "Retirada no balcão"}`,
    "",
    "*Itens*",
    ...itens,
    "",
    `Subtotal: ${reais(subtotal)}`,
    ...(dados.tipo === "delivery" ? [`Taxa de entrega: ${reais(taxa)}`] : []),
    `*Total: ${reais(total)}*`,
    "",
    `*Nome:* ${dados.nome}`,
    `*Telefone:* ${dados.telefone}`,
    ...(dados.tipo === "delivery"
      ? [`*Endereço:* ${dados.endereco}${dados.complemento ? ` — ${dados.complemento}` : ""}`]
      : []),
    `*Pagamento:* ${dados.pagamento}${dados.troco ? ` (troco para ${dados.troco})` : ""}`,
    ...(dados.observacoes ? [`*Observações:* ${dados.observacoes}`] : []),
  ];

  return { texto: partes.join("\n"), subtotal, taxa, total };
}
