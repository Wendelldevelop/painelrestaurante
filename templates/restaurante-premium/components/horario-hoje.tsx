"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/dados";
import { DIAS, agoraNoFuso, estaAberto, textoHorario } from "@/lib/horarios";

/** Horário de hoje no fuso do restaurante, com "aberto agora" ou "fechado". */
export function HorarioHoje() {
  const [texto, setTexto] = useState("");
  useEffect(() => {
    const atualizar = () => {
      const { dia } = agoraNoFuso(config.fuso);
      const turnos = config.horarios[DIAS[dia]];
      setTexto(`${textoHorario(turnos)}${turnos.length ? (estaAberto(config) ? " · aberto agora" : " · fechado agora") : ""}`);
    };
    atualizar();
    const id = setInterval(atualizar, 60_000);
    return () => clearInterval(id);
  }, []);
  return <span>{texto || "Confira nossos horários abaixo"}</span>;
}
