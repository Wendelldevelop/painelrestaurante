import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Este app é independente: não usar a pasta do projeto de cima como raiz
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    // Fotos de exemplo vêm do Unsplash direto para o navegador. Com fotos próprias em /public,
    // pode remover esta linha para o Next otimizar as imagens.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
