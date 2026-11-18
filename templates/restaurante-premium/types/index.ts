/* Tipos compartilhados do site. Os dados vêm de /data/*.json. */

export const CATEGORIAS = ["entradas", "principais", "executivo", "massas", "sobremesas", "bebidas", "vinhos"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ALERGENICOS = ["gluten", "lactose", "frutos_do_mar", "amendoim", "ovo", "soja"] as const;
export type Alergenico = (typeof ALERGENICOS)[number];

export const RESTRICOES = ["vegetariano", "vegano", "sem_gluten"] as const;
export type Restricao = (typeof RESTRICOES)[number];

export type ItemCardapio = {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: number;
  descricao: string;
  ingredientes: string[];
  alergenicos: Alergenico[];
  restricoes: Restricao[];
  /** 0 = não picante, até 3 = muito picante */
  picante: 0 | 1 | 2 | 3;
  /** Prato servido quente (mostra vapor no 3D) */
  quente: boolean;
  /** Ids de bebidas/vinhos que combinam */
  harmonizacao: string[];
  imagem: string;
  /** Modelo .glb opcional para o 3D */
  modelo3d?: string;
  destaque: boolean;
  /** Selo curto no cartão, ex.: "Mais pedido", "Novidade" */
  selo?: string;
};

export type Turno = { abre: string; fecha: string };
export type DiaSemana = "domingo" | "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado";

export type MarcoHistoria = { ano: string; titulo: string; texto: string };

export type Depoimento = { nome: string; origem: string; nota: number; quando: string; texto: string };

export type Especialidade = { titulo: string; texto: string; icone: "brasa" | "massa" | "folha" | "familia" };

export type ConfigRestaurante = {
  nome: string;
  slogan: string;
  descricao: string;
  cozinha: string;
  faixaPreco: string;
  fundacao: number;
  fundadores: string;
  whatsapp: string;
  telefone: string;
  instagram: string;
  facebook: string;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    referencia: string;
  };
  coordenadas: { lat: number; lng: number };
  fuso: string;
  horarios: Record<DiaSemana, Turno[]>;
  reservas: {
    /** Lugares disponíveis em cada horário de chegada */
    capacidadePorHorario: number;
    intervaloMinutos: number;
    /** Última chegada aceita antes do fechamento do turno */
    ultimaChegadaAntesDeFecharMin: number;
    antecedenciaMinimaHoras: number;
    diasAFrente: number;
    maxPessoas: number;
  };
  entrega: {
    taxa: number;
    pedidoMinimo: number;
    tempoDelivery: string;
    tempoRetirada: string;
  };
  pagamentos: string[];
  /** id do prato que abre o cardápio, girando em 3D */
  pratoDoChefe: string;
  executivo: { dias: string; inclui: string };
  avaliacao: { media: number; total: number; fonte: string };
  depoimentos: Depoimento[];
  especialidades: Especialidade[];
  sobre: {
    historiaResumo: string;
    historia: MarcoHistoria[];
    chef: { nome: string; cargo: string; texto: string; foto: string };
    fotos: { hero: string; entrada: string; salao: string; galeria: string[] };
  };
};

export type ItemCarrinho = {
  /** Chave única: id do prato + observação */
  chave: string;
  id: string;
  qtd: number;
  observacao: string;
};

export type TipoPedido = "delivery" | "retirada";
