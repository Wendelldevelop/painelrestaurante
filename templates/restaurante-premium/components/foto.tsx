"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";

/**
 * Foto com fallback: se a imagem não carregar, fica um gradiente quente
 * com o nome do prato no lugar (o layout nunca quebra).
 */
export function Foto({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority,
  imgClassName,
  semLegenda,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  imgClassName?: string;
  /** Miniaturas: não escreve o nome por cima quando a foto falha */
  semLegenda?: boolean;
}) {
  const [falhou, setFalhou] = useState(false);
  return (
    <div className={clsx("relative overflow-hidden bg-salvia", className)}>
      {falhou ? (
        semLegenda ? null : (
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center font-serif text-base italic text-suave">
          {alt}
        </span>
        )
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFalhou(true)}
          className={clsx("object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
