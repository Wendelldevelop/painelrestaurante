"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { Foto } from "./foto";

const Cena = dynamic(() => import("./prato-3d-cena"), { ssr: false });

const semInscricao = () => () => {};

/** WebGL disponível e sem pedido de "reduzir movimento". */
function pode3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Prato em 3D que gira 360°. Arraste para girar (com inércia ao soltar).
 * O 3D só é baixado quando o prato chega perto da tela e pausa fora dela.
 * Sem WebGL ou com "reduzir movimento", mostra a foto parada.
 */
export function Prato3D({
  imagem,
  nome,
  quente,
  className,
}: {
  imagem: string;
  nome: string;
  quente: boolean;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  const [jaApareceu, setJaApareceu] = useState(false);
  const com3D = useSyncExternalStore(semInscricao, pode3D, () => false);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setVisivel(e.isIntersecting);
        if (e.isIntersecting) setJaApareceu(true);
      },
      { rootMargin: "150px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={caixa}
      className={clsx("relative aspect-square w-full select-none", com3D && "cursor-grab touch-pan-y active:cursor-grabbing", className)}
      role="img"
      aria-label={`${nome} em 3D. Arraste para girar.`}
    >
      {com3D && jaApareceu ? (
        <Cena imagem={imagem} quente={quente} ativo={visivel} />
      ) : com3D ? (
        <div className="absolute inset-[12%] animate-pulse rounded-full bg-salvia" aria-hidden />
      ) : (
        <div className="absolute inset-[10%] overflow-hidden rounded-full bg-white p-3 shadow-[0_30px_50px_-30px_rgba(29,36,31,0.6)] ring-1 ring-linha">
          <Foto src={imagem} alt={nome} sizes="480px" className="h-full w-full rounded-full" imgClassName="zoom-suave" />
        </div>
      )}
    </div>
  );
}
