import Link from "next/link";
import { buscarItem, config, listarCardapio } from "@/lib/dados";
import { DIAS, NOME_DIA, textoHorario } from "@/lib/horarios";
import { Foto } from "@/components/foto";
import { StatusAberto } from "@/components/status-aberto";
import { HorarioHoje } from "@/components/horario-hoje";
import { PratoDoChefe } from "@/components/cardapio-secoes";
import { Estrelas, IconeEspecialidade } from "@/components/icones";

const anos = new Date().getFullYear() - config.fundacao;
const nota = config.avaliacao.media.toLocaleString("pt-BR", { minimumFractionDigits: 1 });

export default function Home() {
  const e = config.endereco;
  const ordem = [...DIAS.slice(1), DIAS[0]];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${config.coordenadas.lat},${config.coordenadas.lng}`;
  const chefe = buscarItem(config.pratoDoChefe) ?? listarCardapio()[0];

  return (
    <>
      {/* Abertura: a frente do restaurante */}
      <section className="relative isolate overflow-hidden">
        <Foto
          src={config.sobre.fotos.entrada}
          alt={`Frente do ${config.nome}: casarão com mesas na varanda e lanternas acesas`}
          priority
          sizes="100vw"
          className="!absolute inset-0 -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-[#17261c]/60" aria-hidden />
        <div className="container-site flex min-h-[78svh] flex-col justify-end pb-12 pt-24 text-white md:min-h-[82svh] md:pb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/85">{config.cozinha}</p>
          <h1 className="mt-4 font-serif text-6xl font-semibold leading-[0.92] md:text-8xl">{config.nome}</h1>
          <p className="mt-3 max-w-xl font-serif text-2xl italic text-white/90 md:text-3xl">{config.slogan}</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Estrelas nota={config.avaliacao.media} className="text-lg tracking-wider" />
            <span className="font-bold">{nota}</span>
            <span className="text-white/80">
              · {config.avaliacao.total.toLocaleString("pt-BR")} avaliações no {config.avaliacao.fonte}
            </span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cardapio" className="flex h-14 items-center justify-center rounded-sm bg-white px-10 text-sm font-bold uppercase tracking-[0.18em] text-verde hover:bg-salvia">
              Ver cardápio
            </Link>
            <Link href="/reservas" className="flex h-14 items-center justify-center rounded-sm border border-white px-10 text-sm font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10">
              Reservar mesa
            </Link>
          </div>
        </div>
      </section>

      {/* Faixa com informação útil logo de cara */}
      <section className="bg-verde text-white">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-center text-sm sm:flex-row sm:text-left">
          <p>
            <span className="font-bold uppercase tracking-[0.15em]">Hoje</span>
            <span className="mx-2 opacity-60">·</span>
            <HorarioHoje />
          </p>
          <p className="opacity-90">
            {e.rua}, {e.bairro}
          </p>
        </div>
      </section>

      {/* Tipo de culinária */}
      <section className="py-16 md:py-24">
        <div className="container-site text-center">
          <p className="ornamento rotulo justify-center">Nossa cozinha</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold text-verde md:text-6xl">{config.cozinha}</h2>
          <ul className="mt-12 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-linha">
            {config.especialidades.map((esp) => (
              <li key={esp.titulo} className="flex flex-col items-center px-4">
                <IconeEspecialidade tipo={esp.icone} className="h-11 w-11 text-terra" />
                <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.18em]">{esp.titulo}</h3>
                <p className="mt-2 max-w-[22ch] text-sm leading-relaxed text-suave">{esp.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* História e foto do restaurante */}
      <section className="bg-salvia py-16 md:py-24">
        <div className="container-site grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[5/4] w-full">
            <Foto src={config.sobre.fotos.salao} alt="Salão do restaurante com mesas de madeira" className="!absolute left-0 top-0 h-[82%] w-[80%]" sizes="(max-width: 768px) 80vw, 40vw" />
            <Foto src={config.sobre.chef.foto} alt={`Chef ${config.sobre.chef.nome}`} className="!absolute bottom-0 right-0 aspect-square w-[42%] border-8 border-salvia" sizes="240px" />
          </div>
          <div>
            <p className="rotulo">Nossa história</p>
            <h2 className="mt-3 font-serif text-5xl font-semibold leading-none text-verde md:text-6xl">
              Uma família, um fogo e {anos} anos de mesa cheia
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-suave">{config.sobre.historiaResumo}</p>
            <div className="mt-8 flex items-center gap-5">
              <span className="font-serif text-6xl font-semibold text-terra">{config.fundacao}</span>
              <span className="text-sm text-suave">
                fundado por
                <br />
                <strong className="text-tinta">{config.fundadores}</strong>
              </span>
            </div>
            <Link href="/sobre" className="mt-8 inline-flex h-12 items-center rounded-sm border border-verde px-6 text-xs font-bold uppercase tracking-[0.15em] text-verde hover:bg-verde hover:text-white">
              Conheça nossa história
            </Link>
          </div>
        </div>
      </section>

      {/* Prato do chefe girando */}
      <PratoDoChefe item={chefe} />
      <div className="border-b border-linha bg-salvia pb-14 text-center">
        <Link href="/cardapio" className="inline-flex h-14 items-center rounded-sm bg-verde px-10 text-sm font-bold uppercase tracking-[0.18em] text-white hover:bg-verde-escuro">
          Ver cardápio completo
        </Link>
      </div>

      {/* Comentários de quem foi */}
      <section className="py-16 md:py-24" aria-labelledby="titulo-depoimentos">
        <div className="container-site">
          <div className="flex flex-col items-center text-center">
            <p className="rotulo">Quem foi, voltou</p>
            <h2 id="titulo-depoimentos" className="mt-3 font-serif text-5xl font-semibold text-verde md:text-6xl">
              O que dizem da casa
            </h2>
            <p className="mt-4 flex items-center gap-3">
              <span className="font-serif text-5xl font-semibold text-tinta">{nota}</span>
              <span className="text-left text-sm text-suave">
                <Estrelas nota={config.avaliacao.media} className="block text-lg" />
                {config.avaliacao.total.toLocaleString("pt-BR")} avaliações no {config.avaliacao.fonte}
              </span>
            </p>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {config.depoimentos.map((d) => (
              <li key={d.nome} className="flex flex-col border border-linha bg-white p-7">
                <Estrelas nota={d.nota} className="text-base" />
                <blockquote className="mt-4 flex-1 font-serif text-xl italic leading-snug text-tinta">“{d.texto}”</blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-linha pt-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-salvia font-serif text-lg font-semibold text-verde" aria-hidden>
                    {d.nome[0]}
                  </span>
                  <div className="text-sm">
                    <p className="font-bold">{d.nome}</p>
                    <p className="text-suave">
                      {d.origem} · {d.quando}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Horários e localização */}
      <section id="visite" className="scroll-mt-20 bg-salvia py-16 md:py-24">
        <div className="container-site grid gap-6 lg:grid-cols-3">
          <div>
            <p className="rotulo">Visite</p>
            <h2 className="mt-3 font-serif text-5xl font-semibold text-verde">Horários e endereço</h2>
            <address className="mt-6 text-lg not-italic leading-relaxed">
              {e.rua}
              <br />
              {e.bairro} · {e.cidade} — {e.estado}
            </address>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center rounded-sm bg-verde px-6 text-xs font-bold uppercase tracking-[0.15em] text-white hover:bg-verde-escuro">
                Como chegar
              </a>
              <Link href="/sobre#contato" className="inline-flex h-12 items-center rounded-sm border border-verde px-6 text-xs font-bold uppercase tracking-[0.15em] text-verde hover:bg-white">
                Ver mapa
              </Link>
            </div>
          </div>
          <div className="border border-linha bg-white p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-3xl font-semibold">Horários</h3>
              <StatusAberto />
            </div>
            <dl className="mt-4 divide-y divide-linha">
              {ordem.map((d) => (
                <div key={d} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="font-bold">{NOME_DIA[d]}</dt>
                  <dd className={`tabular-nums ${config.horarios[d].length ? "text-suave" : "text-terra"}`}>{textoHorario(config.horarios[d])}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="border border-linha bg-white">
            <Foto src={config.sobre.fotos.entrada} alt="Fachada do restaurante vista da rua" className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 33vw" />
            <figcaption className="p-6 text-sm text-suave">
              <span className="font-bold text-tinta">Como nos achar:</span> {e.referencia}
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
