import type { ConfigRestaurante } from "@/types";
import { DIAS, NOME_DIA, agoraNoFuso, fimDoTurno, minutos } from "./horarios";

/** Reserva já feita, usada para descontar lugares. Hoje a lista vem vazia; ligue aqui um banco ou API. */
export type ReservaExistente = { data: string; horario: string; pessoas: number };

export type Horario = {
  horario: string; // "19:30"
  turno: "Almoço" | "Jantar";
  lugaresLivres: number;
  disponivel: boolean;
};

export type DiaReserva = { data: string; diaSemana: number; aberto: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** "2026-11-13" no fuso do restaurante. */
export function hojeNoFuso(fuso: string, agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

export function somarDias(data: string, dias: number) {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function diaDaSemana(data: string) {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Próximos dias em que dá para reservar, a partir de hoje. */
export function diasDisponiveis(config: ConfigRestaurante, agora = new Date()): DiaReserva[] {
  const hoje = hojeNoFuso(config.fuso, agora);
  return Array.from({ length: config.reservas.diasAFrente }, (_, i) => {
    const data = somarDias(hoje, i);
    const diaSemana = diaDaSemana(data);
    return { data, diaSemana, aberto: config.horarios[DIAS[diaSemana]].length > 0 };
  });
}

/**
 * Horários de chegada de um dia, a partir dos turnos de funcionamento:
 * de "abre" até "fecha" menos a última chegada, de intervalo em intervalo.
 * Desconta as reservas existentes da capacidade de cada horário e, para hoje,
 * esconde o que já passou ou está dentro da antecedência mínima.
 */
export function gerarHorarios(
  config: ConfigRestaurante,
  data: string,
  pessoas: number,
  reservas: ReservaExistente[] = [],
  agora = new Date(),
): Horario[] {
  const r = config.reservas;
  const turnos = config.horarios[DIAS[diaDaSemana(data)]];
  const ehHoje = data === hojeNoFuso(config.fuso, agora);
  const limiteHoje = ehHoje ? agoraNoFuso(config.fuso, agora).minutos + r.antecedenciaMinimaHoras * 60 : -1;

  const lista: Horario[] = [];
  for (const t of turnos) {
    const inicio = minutos(t.abre);
    const ultimo = fimDoTurno(t) - r.ultimaChegadaAntesDeFecharMin;
    for (let m = inicio; m <= ultimo; m += r.intervaloMinutos) {
      if (m < limiteHoje) continue;
      const horario = hhmm(m);
      const ocupados = reservas
        .filter((x) => x.data === data && x.horario === horario)
        .reduce((s, x) => s + x.pessoas, 0);
      const lugaresLivres = Math.max(0, r.capacidadePorHorario - ocupados);
      lista.push({
        horario,
        turno: inicio < 17 * 60 ? "Almoço" : "Jantar",
        lugaresLivres,
        disponivel: lugaresLivres >= pessoas,
      });
    }
  }
  return lista;
}

export function dataPorExtenso(data: string) {
  const [, m, d] = data.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${NOME_DIA[DIAS[diaDaSemana(data)]].toLowerCase()}, ${d} de ${meses[m - 1]}`;
}

export function mensagemReserva(p: {
  restaurante: string;
  nome: string;
  telefone: string;
  data: string;
  horario: string;
  pessoas: number;
  ocasiao?: string;
  observacoes?: string;
}) {
  return [
    `*Pedido de reserva — ${p.restaurante}*`,
    "",
    `*Data:* ${dataPorExtenso(p.data)}`,
    `*Horário:* ${p.horario}`,
    `*Pessoas:* ${p.pessoas}`,
    ...(p.ocasiao ? [`*Ocasião:* ${p.ocasiao}`] : []),
    ...(p.observacoes ? [`*Observações:* ${p.observacoes}`] : []),
    "",
    `*Nome:* ${p.nome}`,
    `*Telefone:* ${p.telefone}`,
    "",
    "Aguardo a confirmação. Obrigado!",
  ].join("\n");
}
