"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import cardapio from "@/data/cardapio.json";
import type { ItemCardapio, TipoPedido } from "@/types";
import { config } from "@/lib/dados";
import { reais } from "@/lib/rotulos";
import { linkWhatsApp, mensagemPedido, type LinhaPedido } from "@/lib/whatsapp";
import { useCarrinho } from "@/store/carrinho";

const ITENS = cardapio as ItemCardapio[];

const campo =
  "h-13 w-full rounded-2xl border border-linha bg-white px-4 py-3.5 text-base text-tinta placeholder:text-suave/60 focus:border-verde focus:outline-none";
const rotulo = "mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-suave";

export function FinalizarPedido() {
  const { itens, alterarQtd, limpar } = useCarrinho();
  const [tipo, setTipo] = useState<TipoPedido>("delivery");
  const [pagamento, setPagamento] = useState(config.pagamentos[0]);
  const [erros, setErros] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  const linhas: LinhaPedido[] = itens
    .map((c) => ({ ...c, item: ITENS.find((i) => i.id === c.id) }))
    .filter((l): l is LinhaPedido => Boolean(l.item));
  const subtotal = linhas.reduce((s, l) => s + l.item.preco * l.qtd, 0);
  const taxa = tipo === "delivery" ? config.entrega.taxa : 0;

  if (enviado) {
    return (
      <div className="mt-10 rounded-md border border-verde/40 bg-white p-8 text-center">
        <p className="font-serif text-4xl">Pedido enviado!</p>
        <p className="mt-3 text-suave">Confirme no WhatsApp que abriu. Se não abriu, volte e toque em enviar de novo.</p>
        <Link href="/cardapio" className="mt-6 inline-flex h-12 items-center rounded-sm bg-verde px-6 font-bold text-white">
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  if (linhas.length === 0) {
    return (
      <div className="mt-10 rounded-md border border-linha bg-white p-8 text-center">
        <p className="font-serif text-3xl">Seu pedido está vazio</p>
        <Link href="/cardapio" className="mt-6 inline-flex h-12 items-center rounded-sm bg-verde px-6 font-bold text-white">
          Escolher pratos
        </Link>
      </div>
    );
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const dados = {
      tipo,
      nome: get("nome"),
      telefone: get("telefone"),
      endereco: get("endereco"),
      complemento: get("complemento"),
      pagamento,
      troco: pagamento === "Dinheiro" ? get("troco") : "",
      observacoes: get("observacoes"),
    };

    const problemas: string[] = [];
    if (!dados.nome) problemas.push("Informe seu nome.");
    if (dados.telefone.replace(/\D/g, "").length < 10) problemas.push("Informe um telefone com DDD.");
    if (tipo === "delivery" && !dados.endereco) problemas.push("Informe o endereço de entrega.");
    if (tipo === "delivery" && subtotal < config.entrega.pedidoMinimo)
      problemas.push(`O pedido mínimo para delivery é ${reais(config.entrega.pedidoMinimo)}.`);
    setErros(problemas);
    if (problemas.length) return;

    const { texto } = mensagemPedido({ restaurante: config.nome, linhas, dados, taxaEntrega: config.entrega.taxa });
    window.open(linkWhatsApp(config.whatsapp, texto), "_blank", "noopener,noreferrer");
    limpar();
    setEnviado(true);
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-8" noValidate>
      {/* Tipo */}
      <fieldset className="min-w-0">
        <legend className={rotulo}>Como você quer receber?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["delivery", "retirada"] as TipoPedido[]).map((t) => (
            <label
              key={t}
              className={clsx(
                "flex cursor-pointer flex-col rounded-2xl border p-4 transition-colors",
                tipo === t ? "border-verde bg-salvia" : "border-linha hover:border-tinta/30",
              )}
            >
              <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="sr-only" />
              <span className="font-serif text-2xl">{t === "delivery" ? "Delivery" : "Retirada"}</span>
              <span className="text-sm text-suave">
                {t === "delivery" ? `${reais(config.entrega.taxa)} · ${config.entrega.tempoDelivery}` : `Grátis · ${config.entrega.tempoRetirada}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Itens */}
      <section aria-label="Itens do pedido" className="rounded-md border border-linha bg-white p-5">
        <ul className="divide-y divide-linha">
          {linhas.map((l) => (
            <li key={l.chave} className="flex items-center gap-3 py-3">
              <div className="flex items-center rounded-sm border border-linha">
                <button type="button" onClick={() => alterarQtd(l.chave, l.qtd - 1)} className="h-9 w-9" aria-label={`Diminuir ${l.item.nome}`}>−</button>
                <span className="w-6 text-center font-bold">{l.qtd}</span>
                <button type="button" onClick={() => alterarQtd(l.chave, l.qtd + 1)} className="h-9 w-9" aria-label={`Aumentar ${l.item.nome}`}>+</button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{l.item.nome}</p>
                {l.observacao ? <p className="text-xs italic text-suave">Obs.: {l.observacao}</p> : null}
              </div>
              <p className="font-semibold text-terra">{reais(l.item.preco * l.qtd)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-linha pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-suave">Subtotal</dt><dd>{reais(subtotal)}</dd></div>
          {tipo === "delivery" ? (
            <div className="flex justify-between"><dt className="text-suave">Taxa de entrega</dt><dd>{reais(taxa)}</dd></div>
          ) : null}
          <div className="flex justify-between pt-1 text-lg font-bold"><dt>Total</dt><dd className="text-terra">{reais(subtotal + taxa)}</dd></div>
        </dl>
      </section>

      {/* Dados */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={rotulo}>Nome</span>
          <input name="nome" autoComplete="name" className={campo} placeholder="Seu nome" />
        </label>
        <label>
          <span className={rotulo}>Telefone</span>
          <input name="telefone" type="tel" inputMode="tel" autoComplete="tel" className={campo} placeholder="(11) 90000-0000" />
        </label>
        {tipo === "delivery" ? (
          <>
            <label className="sm:col-span-2">
              <span className={rotulo}>Endereço de entrega</span>
              <input name="endereco" autoComplete="street-address" className={campo} placeholder="Rua, número e bairro" />
            </label>
            <label className="sm:col-span-2">
              <span className={rotulo}>Complemento (opcional)</span>
              <input name="complemento" className={campo} placeholder="Apto, bloco, referência" />
            </label>
          </>
        ) : null}
      </div>

      <fieldset className="min-w-0">
        <legend className={rotulo}>Pagamento na entrega</legend>
        <div className="flex flex-wrap gap-2">
          {config.pagamentos.map((p) => (
            <label key={p} className={clsx("flex min-h-11 cursor-pointer items-center rounded-sm border px-4 text-sm font-semibold", pagamento === p ? "border-verde bg-verde text-white" : "border-linha")}>
              <input type="radio" name="pagamento" value={p} checked={pagamento === p} onChange={() => setPagamento(p)} className="sr-only" />
              {p}
            </label>
          ))}
        </div>
        {pagamento === "Dinheiro" ? (
          <label className="mt-4 block">
            <span className={rotulo}>Troco para quanto? (opcional)</span>
            <input name="troco" inputMode="decimal" className={campo} placeholder="Ex.: R$ 200" />
          </label>
        ) : null}
      </fieldset>

      <label className="block">
        <span className={rotulo}>Observações do pedido (opcional)</span>
        <textarea name="observacoes" rows={3} className={`${campo} h-auto resize-none`} placeholder="Ex.: interfone quebrado, ligar ao chegar" />
      </label>

      {erros.length ? (
        <ul role="alert" className="space-y-1 rounded-2xl border border-terra/50 bg-terra/10 p-4 text-sm text-tinta">
          {erros.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      ) : null}

      <button type="submit" className="flex h-16 w-full items-center justify-center gap-3 rounded-sm bg-verde text-base font-bold uppercase tracking-[0.12em] text-white hover:bg-verde-escuro">
        Enviar pedido pelo WhatsApp · {reais(subtotal + taxa)}
      </button>
    </form>
  );
}
