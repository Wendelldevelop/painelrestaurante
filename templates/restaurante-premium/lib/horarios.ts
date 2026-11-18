import type { ConfigRestaurante, DiaSemana, Turno } from "@/types";

export const DIAS: DiaSemana[] = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
export const NOME_DIA: Record<DiaSemana, string> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
};

export const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Fecha "00:00" ou "01:00" depois de abrir às 18:00 = passa da meia-noite. */
export const fimDoTurno = (t: Turno) => {
  const a = minutos(t.abre);
  const f = minutos(t.fecha);
  return f <= a ? f + 24 * 60 : f;
};

/** Dia da semana (0–6) e minutos do dia no fuso do restaurante. */
export function agoraNoFuso(fuso: string, data = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "0";
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { dia, minutos: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function estaAberto(config: ConfigRestaurante, data = new Date()) {
  const { dia, minutos: agora } = agoraNoFuso(config.fuso, data);
  const hoje = config.horarios[DIAS[dia]];
  const ontem = config.horarios[DIAS[(dia + 6) % 7]];
  if (hoje.some((t) => agora >= minutos(t.abre) && agora < fimDoTurno(t))) return true;
  // turno de ontem que passou da meia-noite
  return ontem.some((t) => fimDoTurno(t) > 24 * 60 && agora < fimDoTurno(t) - 24 * 60);
}

export function textoHorario(turnos: Turno[]) {
  return turnos.length ? turnos.map((t) => `${t.abre} – ${t.fecha}`).join(" · ") : "Fechado";
}
