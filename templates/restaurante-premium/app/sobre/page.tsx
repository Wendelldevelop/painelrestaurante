import type { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/dados";
import { DIAS, NOME_DIA, textoHorario } from "@/lib/horarios";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Foto } from "@/components/foto";
import { Mapa } from "@/components/mapa";
import { StatusAberto } from "@/components/status-aberto";

export const metadata: Metadata = {
  title: "Sobre e contato",
  description: `A história do ${config.nome} desde ${config.fundacao}, a chef, o ambiente, o endereço com mapa, os horários e os contatos.`,
};

const anos = new Date().getFullYear() - config.fundacao;

export default function SobrePage() {
  const e = config.endereco;
  const enderecoTexto = `${e.rua}, ${e.bairro}, ${e.cidade} — ${e.estado}`;
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${config.coordenadas.lat},${config.coordenadas.lng}`;
  const ordem = [...DIAS.slice(1), DIAS[0]];
  const galeria = [
    { src: config.sobre.fotos.entrada, alt: "Entrada do casarão, com mesas na varanda" },
    { src: config.sobre.fotos.salao, alt: "Salão interno com mesas de madeira" },
    ...config.sobre.fotos.galeria.map((src, i) => ({ src, alt: `Ambiente do restaurante, foto ${i + 1}` })),
  ].slice(0, 5); // 1 grande + 4 pequenas fecham a grade sem buracos

  return (
    <>
      {/* Abertura */}
      <section className="border-b border-linha">
        <div className="container-site py-12 md:py-20">
          <p className="rotulo">Desde {config.fundacao}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] text-verde md:text-7xl">
            {anos} anos de fogo, família e mesa cheia
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-suave">{config.sobre.historiaResumo}</p>
          <p className="mt-4 text-sm">
            Fundado por <strong>{config.fundadores}</strong>
          </p>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="py-16 md:py-24">
        <div className="container-site grid gap-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-16">
          <div className="md:sticky md:top-28 md:self-start">
            <p className="rotulo">Nossa história</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-verde md:text-5xl">Da garagem ao casarão</h2>
            <Foto src={config.sobre.fotos.entrada} alt="Fachada do casarão de 1920" className="mt-8 aspect-[4/3]" sizes="(max-width: 768px) 100vw, 45vw" />
            <p className="mt-3 text-sm text-suave">
              <span className="font-bold text-tinta">Nossa entrada:</span> {e.referencia}
            </p>
          </div>
          <ol className="border-l border-terra/40 pl-8">
            {config.sobre.historia.map((m) => (
              <li key={m.ano} className="relative pb-12 last:pb-0">
                <span className="absolute -left-[37px] top-3 h-2.5 w-2.5 rotate-45 bg-terra" aria-hidden />
                <p className="font-serif text-5xl font-semibold text-terra">{m.ano}</p>
                <h3 className="mt-1 font-serif text-2xl font-semibold">{m.titulo}</h3>
                <p className="mt-2 leading-relaxed text-suave">{m.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Chef */}
      <section className="bg-verde text-white">
        <div className="container-site grid items-center gap-10 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:py-20">
          <Foto src={config.sobre.chef.foto} alt={`Chef ${config.sobre.chef.nome}`} className="aspect-[4/5] border-8 border-white/10" sizes="(max-width: 768px) 100vw, 40vw" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Quem cozinha</p>
            <blockquote className="mt-5 font-serif text-3xl italic leading-snug md:text-4xl">“{config.sobre.chef.texto}”</blockquote>
            <p className="mt-6 font-bold">{config.sobre.chef.nome}</p>
            <p className="text-sm text-white/75">{config.sobre.chef.cargo}</p>
          </div>
        </div>
      </section>

      {/* Ambiente */}
      <section className="py-16 md:py-24" aria-labelledby="titulo-ambiente">
        <div className="container-site">
          <p className="rotulo">Ambiente</p>
          <h2 id="titulo-ambiente" className="mt-3 font-serif text-4xl font-semibold text-verde md:text-5xl">Um casarão de 1920</h2>
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {galeria.map((f, i) => (
              <li key={f.src + i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <Foto src={f.src} alt={f.alt} className="aspect-square h-full" sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="scroll-mt-24 border-t border-linha bg-salvia py-16 md:py-24">
        <div className="container-site">
          <p className="rotulo">Contato</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-verde md:text-5xl">Como chegar e falar com a gente</h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="space-y-6">
              <div className="border border-linha bg-white p-6 md:p-8">
                <h3 className="rotulo">Endereço</h3>
                <address className="mt-3 font-serif text-2xl not-italic leading-snug">
                  {e.rua}
                  <br />
                  {e.bairro} · {e.cidade} — {e.estado}
                  <br />
                  <span className="text-lg text-suave">CEP {e.cep}</span>
                </address>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={rota} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center whitespace-nowrap rounded-sm bg-verde px-6 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-verde-escuro">
                    Como chegar
                  </a>
                  <a
                    href={linkWhatsApp(config.whatsapp, `Olá, ${config.nome}!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center whitespace-nowrap rounded-sm border border-verde px-6 text-xs font-bold uppercase tracking-[0.15em] text-verde hover:bg-salvia"
                  >
                    WhatsApp {config.telefone}
                  </a>
                </div>
              </div>

              <div className="border border-linha bg-white p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="rotulo">Horários</h3>
                  <StatusAberto />
                </div>
                <dl className="mt-3 divide-y divide-linha">
                  {ordem.map((d) => (
                    <div key={d} className="flex justify-between gap-4 py-2.5 text-sm">
                      <dt className="font-bold">{NOME_DIA[d]}</dt>
                      <dd className={`tabular-nums ${config.horarios[d].length ? "text-suave" : "text-terra"}`}>{textoHorario(config.horarios[d])}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border border-linha bg-white p-6 md:p-8">
                <h3 className="rotulo">Redes sociais</h3>
                <ul className="mt-3 flex gap-6 font-bold text-verde">
                  <li><a href={config.instagram} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Instagram</a></li>
                  <li><a href={config.facebook} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">Facebook</a></li>
                </ul>
              </div>
            </div>

            <Mapa lat={config.coordenadas.lat} lng={config.coordenadas.lng} titulo={config.nome} endereco={enderecoTexto} />
          </div>

          <div className="mt-12 flex flex-col items-center gap-3 border-t border-linha pt-10 text-center">
            <p className="font-serif text-3xl text-verde">Vamos guardar uma mesa para você?</p>
            <Link href="/reservas" className="flex h-12 items-center rounded-sm bg-terra px-8 text-xs font-bold uppercase tracking-[0.15em] text-white hover:brightness-110">
              Reservar mesa
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
