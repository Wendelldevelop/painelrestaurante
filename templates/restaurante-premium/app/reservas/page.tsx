import type { Metadata } from "next";
import { config } from "@/lib/dados";
import { ReservaForm } from "@/components/reserva-form";

export const metadata: Metadata = {
  title: "Reservas",
  description: `Reserve sua mesa no ${config.nome}: escolha o dia, o horário e o número de pessoas e confirme pelo WhatsApp.`,
};

export default function ReservasPage() {
  return (
    <div className="container-site pb-24 pt-8 md:pt-12">
      <p className="rotulo">Reservas</p>
      <h1 className="mt-2 font-serif text-5xl font-semibold leading-none text-verde md:text-7xl">Reserve sua mesa</h1>
      <p className="mt-4 max-w-xl text-suave">
        Tolerância de 15 minutos. Para grupos acima de {config.reservas.maxPessoas} pessoas e eventos, fale com a gente.
      </p>
      <div className="mt-10">
        <ReservaForm />
      </div>
    </div>
  );
}
