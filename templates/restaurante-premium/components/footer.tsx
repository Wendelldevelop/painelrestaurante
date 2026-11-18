import Link from "next/link";
import { config } from "@/lib/dados";
import { DIAS, NOME_DIA, textoHorario } from "@/lib/horarios";

export function Footer() {
  const e = config.endereco;
  const ordem = [...DIAS.slice(1), DIAS[0]];
  return (
    <footer className="border-t border-linha bg-white">
      <div className="container-site grid gap-10 py-14 text-sm text-suave md:grid-cols-4">
        <div>
          <p className="font-serif text-3xl text-tinta">
            {config.nome}
            <span className="text-terra">.</span>
          </p>
          <p className="mt-3 max-w-xs">{config.slogan}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terra">Navegue</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/cardapio" className="hover:text-tinta">Cardápio</Link></li>
            <li><Link href="/pedido" className="hover:text-tinta">Fazer pedido</Link></li>
            <li><Link href="/reservas" className="hover:text-tinta">Reservas</Link></li>
            <li><Link href="/sobre" className="hover:text-tinta">Sobre e contato</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terra">Endereço</p>
          <address className="mt-3 not-italic">
            {e.rua}
            <br />
            {e.bairro} · {e.cidade} — {e.estado}
          </address>
          <p className="mt-3">{config.telefone}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terra">Horários</p>
          <ul className="mt-3 space-y-1">
            {ordem.map((d) => (
              <li key={d} className="flex justify-between gap-3">
                <span>{NOME_DIA[d]}</span>
                <span className="text-right">{textoHorario(config.horarios[d])}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-linha">
        <div className="container-site flex flex-col justify-between gap-2 py-6 text-xs text-suave sm:flex-row">
          <p>© {new Date().getFullYear()} {config.nome}. Todos os direitos reservados.</p>
          <p>
            <a href={config.instagram} className="hover:text-tinta" target="_blank" rel="noopener noreferrer">Instagram</a>
            {" · "}
            <a href={config.facebook} className="hover:text-tinta" target="_blank" rel="noopener noreferrer">Facebook</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
