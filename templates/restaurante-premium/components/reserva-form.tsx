"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { config } from "@/lib/dados";
import { DIAS, NOME_DIA } from "@/lib/horarios";
import { dataPorExtenso, diasDisponiveis, gerarHorarios, mensagemReserva, type DiaReserva } from "@/lib/reservas";
import { linkWhatsApp } from "@/lib/whatsapp";

const semInscricao = () => () => {};
const OCASIOES = ["Aniversário", "Jantar romântico", "Negócios", "Família", "Outra"];
const campo =
  "w-full rounded-sm border border-linha bg-white px-4 py-3.5 text-base text-tinta placeholder:text-suave/70 focus:border-verde focus:outline-none";
const rotulo = "rotulo mb-2 block";

export function ReservaForm() {
  // As datas dependem do "agora": calcula só no navegador para não congelar no build.
  const noNavegador = useSyncExternalStore(semInscricao, () => true, () => false);
  const dias: DiaReserva[] | null = useMemo(() => (noNavegador ? diasDisponiveis(config) : null), [noNavegador]);
  const [pessoas, setPessoas] = useState(2);
  const [dataEscolhida, setData] = useState("");
  const data = dataEscolhida || dias?.find((d) => d.aberto)?.data || "";
  const [horario, setHorario] = useState("");
  const [ocasiao, setOcasiao] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  const horarios = useMemo(() => (data ? gerarHorarios(config, data, pessoas) : []), [data, pessoas]);
  const turnos = (["Almoço", "Jantar"] as const)
    .map((t) => ({ turno: t, itens: horarios.filter((h) => h.turno === t) }))
    .filter((t) => t.itens.length);
  const grupoGrande = pessoas > config.reservas.maxPessoas;

  // Se o horário escolhido sumiu (mudou o dia ou as pessoas), limpa a escolha
  const horarioValido = horarios.some((h) => h.horario === horario && h.disponivel) ? horario : "";

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const nome = String(d.get("nome") ?? "").trim();
    const telefone = String(d.get("telefone") ?? "").trim();
    const observacoes = String(d.get("observacoes") ?? "").trim();
    const problemas: string[] = [];
    if (!horarioValido) problemas.push("Escolha um horário.");
    if (!nome) problemas.push("Informe seu nome.");
    if (telefone.replace(/\D/g, "").length < 10) problemas.push("Informe um telefone com DDD.");
    setErros(problemas);
    if (problemas.length) return;

    const msg = mensagemReserva({ restaurante: config.nome, nome, telefone, data, horario: horarioValido, pessoas, ocasiao, observacoes });
    window.open(linkWhatsApp(config.whatsapp, msg), "_blank", "noopener,noreferrer");
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="border border-verde bg-salvia p-8 text-center">
        <p className="font-serif text-4xl font-semibold text-verde">Pedido de reserva enviado</p>
        <p className="mx-auto mt-3 max-w-md text-suave">
          Confirme a mensagem no WhatsApp que abriu. A reserva vale depois que nossa equipe responder.
        </p>
        <button type="button" onClick={() => setEnviado(false)} className="mt-6 rounded-sm border border-verde px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-verde">
          Fazer outra reserva
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
      <div className="min-w-0 space-y-9">
        {/* 1. Pessoas */}
        <fieldset className="min-w-0">
          <legend className={rotulo}>1. Quantas pessoas?</legend>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-linha" role="group" aria-label="Número de pessoas">
              <button type="button" onClick={() => setPessoas((p) => Math.max(1, p - 1))} className="h-12 w-12 text-xl" aria-label="Menos uma pessoa">−</button>
              <output className="w-12 text-center font-serif text-3xl font-semibold" aria-live="polite">{pessoas}</output>
              <button type="button" onClick={() => setPessoas((p) => Math.min(30, p + 1))} className="h-12 w-12 text-xl" aria-label="Mais uma pessoa">+</button>
            </div>
            <span className="text-sm text-suave">{pessoas === 1 ? "pessoa" : "pessoas"}</span>
          </div>
          {grupoGrande ? (
            <p className="mt-3 border-l-2 border-terra bg-terra-claro px-4 py-3 text-sm">
              Para mais de {config.reservas.maxPessoas} pessoas, montamos um espaço sob medida.{" "}
              <a
                className="font-bold text-terra underline"
                target="_blank"
                rel="noopener noreferrer"
                href={linkWhatsApp(config.whatsapp, `Olá, ${config.nome}! Quero reservar para um grupo de ${pessoas} pessoas.`)}
              >
                Fale com a gente pelo WhatsApp
              </a>
              .
            </p>
          ) : null}
        </fieldset>

        {/* 2. Dia */}
        <fieldset disabled={grupoGrande} className="min-w-0 disabled:opacity-40">
          <legend className={rotulo}>2. Qual dia?</legend>
          {dias === null ? (
            <div className="flex gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="h-20 w-16 shrink-0 animate-pulse bg-salvia" />
              ))}
            </div>
          ) : (
            <>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] md:mx-0 md:px-0">
                {dias.slice(0, 14).map((d, i) => {
                  const [, , dia] = d.data.split("-");
                  const ativo = data === d.data;
                  return (
                    <button
                      key={d.data}
                      type="button"
                      disabled={!d.aberto}
                      aria-pressed={ativo}
                      aria-label={`${dataPorExtenso(d.data)}${d.aberto ? "" : ", fechado"}`}
                      onClick={() => setData(d.data)}
                      className={clsx(
                        "flex h-20 w-16 shrink-0 flex-col items-center justify-center border transition-colors",
                        ativo ? "border-verde bg-verde text-white" : "border-linha bg-white hover:border-verde",
                        !d.aberto && "cursor-not-allowed bg-salvia text-suave/60 line-through",
                      )}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {i === 0 ? "Hoje" : i === 1 ? "Amanhã" : NOME_DIA[DIAS[d.diaSemana]].slice(0, 3)}
                      </span>
                      <span className="font-serif text-2xl font-semibold">{Number(dia)}</span>
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 flex items-center gap-3 text-sm text-suave">
                Outra data:
                <input
                  type="date"
                  value={data}
                  min={dias[0]?.data}
                  max={dias.at(-1)?.data}
                  onChange={(e) => setData(e.target.value)}
                  className="rounded-sm border border-linha bg-white px-3 py-2 text-tinta"
                />
              </label>
            </>
          )}
        </fieldset>

        {/* 3. Horário */}
        <fieldset disabled={grupoGrande} className="min-w-0 disabled:opacity-40">
          <legend className={rotulo}>3. Que horas?</legend>
          {data && turnos.length === 0 ? (
            <p className="text-suave">
              {dias?.find((d) => d.data === data)?.aberto === false
                ? "Estamos fechados neste dia. Escolha outra data."
                : "Não há mais horários para hoje. Escolha outro dia."}
            </p>
          ) : (
            <div className="space-y-5">
              {turnos.map((t) => (
                <div key={t.turno}>
                  <p className="mb-2 font-serif text-xl italic text-suave">{t.turno}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {t.itens.map((h) => (
                      <button
                        key={h.horario}
                        type="button"
                        disabled={!h.disponivel}
                        aria-pressed={horarioValido === h.horario}
                        onClick={() => setHorario(h.horario)}
                        className={clsx(
                          "h-12 border text-sm font-bold tabular-nums transition-colors",
                          horarioValido === h.horario ? "border-verde bg-verde text-white" : "border-linha bg-white hover:border-verde",
                          !h.disponivel && "cursor-not-allowed bg-salvia text-suave/50 line-through",
                        )}
                      >
                        {h.horario}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      {/* Resumo e dados */}
      <aside className="min-w-0 self-start border border-linha bg-white p-6 md:p-8 lg:sticky lg:top-28">
        <p className="rotulo">Sua reserva</p>
        <p className="mt-3 font-serif text-3xl font-semibold leading-tight text-verde">
          {data ? dataPorExtenso(data) : "Escolha o dia"}
        </p>
        <p className="mt-1 text-lg">
          {horarioValido ? `às ${horarioValido}` : "Escolha o horário"} · {pessoas} {pessoas === 1 ? "pessoa" : "pessoas"}
        </p>

        <div className="mt-6 space-y-4 border-t border-linha pt-6">
          <label className="block">
            <span className={rotulo}>Nome</span>
            <input name="nome" autoComplete="name" className={campo} placeholder="Seu nome" />
          </label>
          <label className="block">
            <span className={rotulo}>Telefone</span>
            <input name="telefone" type="tel" inputMode="tel" autoComplete="tel" className={campo} placeholder="(11) 90000-0000" />
          </label>
          <fieldset className="min-w-0">
            <legend className={rotulo}>Ocasião (opcional)</legend>
            <div className="flex flex-wrap gap-2">
              {OCASIOES.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={ocasiao === o}
                  onClick={() => setOcasiao((atual) => (atual === o ? "" : o))}
                  className={clsx(
                    "min-h-10 rounded-sm border px-3 text-sm transition-colors",
                    ocasiao === o ? "border-verde bg-verde text-white" : "border-linha hover:border-verde",
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className={rotulo}>Observações (opcional)</span>
            <textarea name="observacoes" rows={2} className={`${campo} resize-none`} placeholder="Cadeirão, acessibilidade, alergias…" />
          </label>
        </div>

        {erros.length ? (
          <ul role="alert" className="mt-5 space-y-1 border-l-2 border-terra bg-terra-claro px-4 py-3 text-sm">
            {erros.map((e) => <li key={e}>{e}</li>)}
          </ul>
        ) : null}

        <button
          type="submit"
          disabled={grupoGrande}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-sm bg-verde text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-verde-escuro disabled:opacity-40"
        >
          Enviar pelo WhatsApp
        </button>
        <p className="mt-3 text-center text-xs text-suave">A reserva é confirmada pela nossa equipe no WhatsApp.</p>
      </aside>
    </form>
  );
}
