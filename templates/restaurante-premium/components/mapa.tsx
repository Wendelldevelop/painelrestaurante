"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Mapa do OpenStreetMap com Leaflet, sem chave de API.
 * O Leaflet só é baixado quando o mapa chega perto da tela.
 */
export function Mapa({ lat, lng, titulo, endereco }: { lat: number; lng: number; titulo: string; endereco: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let mapa: import("leaflet").Map | undefined;
    let cancelado = false;

    const iniciar = async () => {
      try {
        const L = await import("leaflet");
        if (cancelado || !ref.current) return;
        mapa = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 16);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa);
        // Marcador desenhado em HTML (não depende das imagens padrão do Leaflet)
        const icone = L.divIcon({
          className: "",
          html: '<span style="display:block;width:22px;height:22px;background:#2d4a35;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.35)"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        });
        L.marker([lat, lng], { icon: icone, title: titulo, alt: titulo })
          .addTo(mapa)
          .bindPopup(`<strong>${titulo}</strong><br>${endereco}`);
      } catch {
        setFalhou(true);
      }
    };

    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          obs.disconnect();
          void iniciar();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);

    return () => {
      cancelado = true;
      obs.disconnect();
      mapa?.remove();
    };
  }, [lat, lng, titulo, endereco]);

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden border border-linha bg-salvia">
      <div ref={ref} className="absolute inset-0 z-0" role="region" aria-label={`Mapa com a localização do ${titulo}`} />
      {falhou ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-suave">
          Não foi possível carregar o mapa. Use o botão “Como chegar”.
        </p>
      ) : null}
    </div>
  );
}
