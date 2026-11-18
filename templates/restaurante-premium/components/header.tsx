"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { config } from "@/lib/dados";
import { totalDeItens, useCarrinho } from "@/store/carrinho";
import { StatusAberto } from "./status-aberto";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/reservas", label: "Reservas" },
  { href: "/sobre", label: "Sobre e contato" },
];

export function Header() {
  const pathname = usePathname();
  const itens = useCarrinho((s) => s.itens);
  const abrirCarrinho = useCarrinho((s) => s.abrir);
  const qtd = totalDeItens(itens);
  const [menu, setMenu] = useState(false);
  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-white">
      <div className="container-site flex h-16 items-center gap-4 md:h-20">
        <Link href="/" className="mr-auto whitespace-nowrap font-serif text-2xl font-semibold tracking-tight text-verde md:text-3xl">
          {config.nome}
          <span className="text-terra">.</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo(l.href) ? "page" : undefined}
              className={clsx(
                "whitespace-nowrap border-b py-1 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:text-verde",
                ativo(l.href) ? "border-terra text-tinta" : "border-transparent text-suave",
              )}
            >
              {l.label}
            </Link>
          ))}
          <StatusAberto />
        </nav>

        <button
          type="button"
          onClick={() => {
            setMenu(false);
            abrirCarrinho();
          }}
          aria-label={`Abrir pedido, ${qtd} ${qtd === 1 ? "item" : "itens"}`}
          className="relative flex h-11 items-center gap-2 rounded-sm bg-verde px-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-verde-escuro"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="hidden sm:inline">Pedido</span>
          <AnimatePresence>
            {qtd > 0 ? (
              <motion.span
                key={qtd}
                initial={{ scale: 0.4, y: -6, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="flex h-6 min-w-6 items-center justify-center rounded-full bg-terra px-1.5 text-xs font-bold tracking-normal text-white"
              >
                {qtd}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </button>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-sm border border-linha lg:hidden"
          aria-expanded={menu}
          aria-controls="menu-celular"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenu((m) => !m)}
        >
          <span className="relative block h-3 w-4">
            <span className={clsx("absolute left-0 h-0.5 w-4 bg-tinta transition-all", menu ? "top-1.5 rotate-45" : "top-0")} />
            <span className={clsx("absolute left-0 top-1.5 h-0.5 w-4 bg-tinta transition-opacity", menu && "opacity-0")} />
            <span className={clsx("absolute left-0 h-0.5 w-4 bg-tinta transition-all", menu ? "top-1.5 -rotate-45" : "top-3")} />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {menu ? (
          <motion.nav
            id="menu-celular"
            aria-label="Menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-linha lg:hidden"
          >
            <div className="container-site flex flex-col py-3">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenu(false)}
                  aria-current={ativo(l.href) ? "page" : undefined}
                  className={clsx("border-b border-linha py-4 font-serif text-3xl", ativo(l.href) ? "text-terra" : "text-tinta")}
                >
                  {l.label}
                </Link>
              ))}
              <div className="py-4">
                <StatusAberto />
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
