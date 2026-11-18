"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export type Prato3DCenaProps = {
  imagem: string;
  quente: boolean;
  /** Renderiza só quando visível (economiza bateria e mantém 60fps) */
  ativo: boolean;
};

/** Pseudoaleatório fixo (mesmo resultado a cada renderização). */
const aleatorio = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Perfil da louça (meia seção do prato), girado em torno do eixo Y. */
function usePerfilPrato() {
  return useMemo(() => {
    const pts = [
      [0, 0.0], [0.86, 0.0], [0.9, 0.02], [0.95, 0.06], [1.22, 0.12], [1.3, 0.15],
      [1.32, 0.17], [1.3, 0.19], [1.22, 0.16], [0.95, 0.09], [0.9, 0.05], [0, 0.04],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
}

/** Carrega a foto como textura, recortando um quadrado central. Sem foto, usa uma cor quente. */
function useTexturaComida(url: string) {
  const [textura, setTextura] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let vivo = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (!vivo) return t.dispose();
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        const img = t.image as { width: number; height: number };
        const aspecto = img.width / img.height;
        if (aspecto > 1) {
          t.repeat.set(1 / aspecto, 1);
          t.offset.set((1 - 1 / aspecto) / 2, 0);
        } else {
          t.repeat.set(1, aspecto);
          t.offset.set(0, (1 - aspecto) / 2);
        }
        setTextura(t);
      },
      undefined,
      () => vivo && setTextura(null),
    );
    return () => {
      vivo = false;
    };
  }, [url]);
  return textura;
}

/** Textura redonda e suave para as partículas de vapor. */
function useSpriteVapor() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

function Vapor() {
  const sprite = useSpriteVapor();
  const N = 46;
  const ref = useRef<THREE.Points>(null);
  const dados = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        x: (aleatorio(i + 1) - 0.5) * 1.1,
        z: (aleatorio(i + 101) - 0.5) * 1.1,
        fase: aleatorio(i + 201),
        vel: 0.12 + aleatorio(i + 301) * 0.1,
      })),
    [],
  );
  const posicoes = useMemo(() => new Float32Array(N * 3), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    dados.forEach((d, i) => {
      d.fase = (d.fase + dt * d.vel) % 1;
      posicoes[i * 3] = d.x + Math.sin(t * 0.8 + i) * 0.08 * d.fase;
      posicoes[i * 3 + 1] = 0.35 + d.fase * 1.4;
      posicoes[i * 3 + 2] = d.z + Math.cos(t * 0.6 + i) * 0.08 * d.fase;
    });
    const geo = ref.current?.geometry;
    if (geo) geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posicoes, 3]} />
      </bufferGeometry>
      <pointsMaterial map={sprite} size={0.7} transparent depthWrite={false} opacity={0.1} color="#ffffff" />
    </points>
  );
}

function Prato({ imagem, quente }: Omit<Prato3DCenaProps, "ativo">) {
  const grupo = useRef<THREE.Group>(null);
  const giro = useRef({ velocidade: 0.35, arrastando: false });
  const perfil = usePerfilPrato();
  const textura = useTexturaComida(imagem);
  const tela = useThree((s) => s.gl.domElement);

  // Arrastar com o dedo ou o mouse gira o prato; ao soltar, continua com inércia
  useEffect(() => {
    let ultimoX = 0;
    let ultimoT = 0;
    const down = (e: PointerEvent) => {
      giro.current.arrastando = true;
      ultimoX = e.clientX;
      ultimoT = performance.now();
      tela.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!giro.current.arrastando) return;
      const agora = performance.now();
      const dt = Math.max(16, agora - ultimoT) / 1000;
      giro.current.velocidade = ((e.clientX - ultimoX) / tela.clientWidth) * 3 / dt;
      ultimoX = e.clientX;
      ultimoT = agora;
    };
    const up = () => {
      giro.current.arrastando = false;
    };
    tela.addEventListener("pointerdown", down);
    tela.addEventListener("pointermove", move);
    tela.addEventListener("pointerup", up);
    tela.addEventListener("pointercancel", up);
    return () => {
      tela.removeEventListener("pointerdown", down);
      tela.removeEventListener("pointermove", move);
      tela.removeEventListener("pointerup", up);
      tela.removeEventListener("pointercancel", up);
    };
  }, [tela]);

  useFrame((_, dt) => {
    const g = grupo.current;
    const s = giro.current;
    if (!g) return;
    if (!s.arrastando) {
      // Inércia: a velocidade do arrasto vai diminuindo até o giro automático
      s.velocidade = THREE.MathUtils.damp(s.velocidade, 0.35, 1.6, dt);
    }
    g.rotation.y += s.velocidade * dt;
  });

  return (
    <group ref={grupo}>
      {/* Louça */}
      <mesh geometry={perfil} castShadow receiveShadow>
        <meshPhysicalMaterial color="#ffffff" roughness={0.28} clearcoat={0.7} clearcoatRoughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Comida: a foto em um disco levemente elevado */}
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.88, 96]} />
        <meshStandardMaterial map={textura} color={textura ? "#ffffff" : "#9a4c2a"} roughness={0.75} />
      </mesh>
      {quente ? <Vapor /> : null}
    </group>
  );
}

/** Cena 3D: prato sobre a mesa, luz quente de restaurante e sombra de contato. */
export default function Prato3DCena({ imagem, quente, ativo }: Prato3DCenaProps) {
  return (
    <Canvas
      frameloop={ativo ? "always" : "never"}
      dpr={[1, 1.75]}
      shadows
      camera={{ position: [0, 3.45, 4.15], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.05, 0)}
    >
      <ambientLight intensity={0.9} color="#ffffff" />
      {/* Luz principal amarelada, como pendente de restaurante */}
      <directionalLight
        position={[2.2, 4.5, 1.6]}
        intensity={1.9}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Contraluz fria e suave para destacar a borda da louça */}
      <directionalLight position={[-3, 2, -2.5]} intensity={0.7} color="#dfe8ff" />
      <Prato imagem={imagem} quente={quente} />
      <ContactShadows position={[0, -0.005, 0]} opacity={0.45} scale={4} blur={2.4} far={1.2} color="#2a1d14" />
    </Canvas>
  );
}
