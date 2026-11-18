import { describe, expect, it } from "vitest";
import { config } from "@/lib/dados";
import { diasDisponiveis, gerarHorarios, mensagemReserva } from "@/lib/reservas";

// Sexta, 13/11/2026, 10h em São Paulo (13h UTC)
const SEXTA_10H = new Date("2026-11-13T13:00:00Z");

describe("gerarHorarios", () => {
  it("não oferece horários na segunda (fechado)", () => {
    expect(gerarHorarios(config, "2026-11-16", 2, [], SEXTA_10H)).toEqual([]);
  });

  it("gera almoço e jantar da terça respeitando a última chegada", () => {
    const h = gerarHorarios(config, "2026-11-17", 2, [], SEXTA_10H).map((x) => x.horario);
    // almoço 11:30–15:00, última chegada 13:30; jantar 18:30–23:00, última chegada 21:30
    expect(h[0]).toBe("11:30");
    expect(h).toContain("13:30");
    expect(h).not.toContain("14:00");
    expect(h).toContain("18:30");
    expect(h.at(-1)).toBe("21:30");
  });

  it("aceita turno que passa da meia-noite (sexta fecha 00:00)", () => {
    const h = gerarHorarios(config, "2026-11-20", 2, [], SEXTA_10H).map((x) => x.horario);
    expect(h.at(-1)).toBe("22:30");
  });

  it("hoje esconde horários dentro da antecedência mínima de 2h", () => {
    const h = gerarHorarios(config, "2026-11-13", 2, [], SEXTA_10H).map((x) => x.horario);
    expect(h).not.toContain("11:30");
    expect(h[0]).toBe("12:00");
  });

  it("desconta reservas existentes da capacidade", () => {
    const reservas = [{ data: "2026-11-17", horario: "20:00", pessoas: 36 }];
    const h = gerarHorarios(config, "2026-11-17", 6, reservas, SEXTA_10H);
    const vinte = h.find((x) => x.horario === "20:00")!;
    expect(vinte.lugaresLivres).toBe(4);
    expect(vinte.disponivel).toBe(false);
    expect(h.find((x) => x.horario === "20:30")!.disponivel).toBe(true);
  });
});

describe("diasDisponiveis", () => {
  it("começa hoje e marca a segunda como fechada", () => {
    const dias = diasDisponiveis(config, SEXTA_10H);
    expect(dias).toHaveLength(config.reservas.diasAFrente);
    expect(dias[0].data).toBe("2026-11-13");
    expect(dias.find((d) => d.data === "2026-11-16")!.aberto).toBe(false);
  });
});

describe("mensagemReserva", () => {
  it("monta o resumo com data por extenso", () => {
    const msg = mensagemReserva({ restaurante: "Casa Brasa", nome: "Ana", telefone: "11999990000", data: "2026-11-17", horario: "20:00", pessoas: 4, ocasiao: "Aniversário" });
    expect(msg).toContain("terça, 17 de novembro");
    expect(msg).toContain("*Pessoas:* 4");
    expect(msg).toContain("*Ocasião:* Aniversário");
  });
});
