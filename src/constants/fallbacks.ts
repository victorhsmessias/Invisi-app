export interface GrupoItem {
  grupo: string;
}

export interface ProdutoItem {
  tp_prod: string;
}
export const FALLBACK_SERVICOS: string[] = [
  "armazenagem",
  "transbordo",
  "pesagem",
];
export const FALLBACK_OP_PADRAO: string[] = [
  "rodo_ferro",
  "ferro_rodo",
  "rodo_rodo",
  "outros",
];

export const FALLBACK_GRUPOS: GrupoItem[] = [
  { grupo: "ADM-MGA" },
  { grupo: "ATT" },
  { grupo: "CARGILL" },
  { grupo: "BTG PACTUAL S/A" },
];

export const FALLBACK_PRODUTOS: ProdutoItem[] = [
  { tp_prod: "SOJA GRAOS" },
  { tp_prod: "MILHO GRAOS" },
  { tp_prod: "FARELO DE SOJA" },
];

export const FALLBACK_BASIC_FILTERS = {
  servicos: FALLBACK_SERVICOS,
  opPadrao: FALLBACK_OP_PADRAO,
} as const;

export const FALLBACK_COMPLETE_FILTERS = {
  servicos: FALLBACK_SERVICOS,
  opPadrao: FALLBACK_OP_PADRAO,
  grupos: FALLBACK_GRUPOS.map((g) => g.grupo),
  produtos: FALLBACK_PRODUTOS.map((p) => p.tp_prod),
} as const;

export const getFallbackGruposStrings = (): string[] => {
  return FALLBACK_GRUPOS.map((g) => g.grupo);
};

export const getFallbackProdutosStrings = (): string[] => {
  return FALLBACK_PRODUTOS.map((p) => p.tp_prod);
};

export const createGrupoStructure = (grupos: any): GrupoItem[] => {
  if (!Array.isArray(grupos)) return FALLBACK_GRUPOS;

  return grupos.map((grupo) => {
    if (typeof grupo === "string") {
      return { grupo };
    }
    if (grupo && typeof grupo === "object" && grupo.grupo) {
      return grupo;
    }
    return { grupo: String(grupo) };
  });
};

export const createProdutoStructure = (produtos: any): ProdutoItem[] => {
  if (!Array.isArray(produtos)) return FALLBACK_PRODUTOS;

  return produtos.map((produto) => {
    if (typeof produto === "string") {
      return { tp_prod: produto };
    }
    if (produto && typeof produto === "object" && produto.tp_prod) {
      return produto;
    }
    return { tp_prod: String(produto) };
  });
};

type FallbackType =
  | "servicos"
  | "servico"
  | "opPadrao"
  | "op_padrao"
  | "grupos"
  | "grupo"
  | "produtos"
  | "produto"
  | "tp_prod";

export const getFallbackByType = (type: FallbackType): string[] => {
  const fallbacks: Record<FallbackType, string[]> = {
    servicos: FALLBACK_SERVICOS,
    servico: FALLBACK_SERVICOS,
    opPadrao: FALLBACK_OP_PADRAO,
    op_padrao: FALLBACK_OP_PADRAO,
    grupos: getFallbackGruposStrings(),
    grupo: getFallbackGruposStrings(),
    produtos: getFallbackProdutosStrings(),
    produto: getFallbackProdutosStrings(),
    tp_prod: getFallbackProdutosStrings(),
  };

  return fallbacks[type] || [];
};

export interface NormalizedFilters {
  servicos: string[];
  opPadrao: string[];
  grupos: string[];
  produtos: string[];
}

export const normalizeFilters = (filters: any): NormalizedFilters => {
  if (!filters || typeof filters !== "object") {
    return {
      servicos: FALLBACK_SERVICOS,
      opPadrao: FALLBACK_OP_PADRAO,
      grupos: getFallbackGruposStrings(),
      produtos: getFallbackProdutosStrings(),
    };
  }

  return {
    servicos:
      Array.isArray(filters.servicos) && filters.servicos.length > 0
        ? filters.servicos
        : FALLBACK_SERVICOS,

    opPadrao:
      Array.isArray(filters.opPadrao) && filters.opPadrao.length > 0
        ? filters.opPadrao
        : FALLBACK_OP_PADRAO,

    grupos:
      Array.isArray(filters.grupos) && filters.grupos.length > 0
        ? filters.grupos
        : getFallbackGruposStrings(),

    produtos:
      Array.isArray(filters.produtos) && filters.produtos.length > 0
        ? filters.produtos
        : getFallbackProdutosStrings(),
  };
};

export const FALLBACK_CACHE_CONFIG = {
  CACHE_TIME: 1 * 60 * 1000,

  USE_AFTER_ATTEMPTS: 2,

  SHOW_WARNING: __DEV__,
} as const;

export const logFallbackUsage = (
  type: string,
  reason: string = "API falhou"
): void => {
  if (__DEV__) {
    console.warn(`[Fallback] Usando fallback para '${type}': ${reason}`);
  }
};

export default {
  FALLBACK_SERVICOS,
  FALLBACK_OP_PADRAO,
  FALLBACK_GRUPOS,
  FALLBACK_PRODUTOS,
  FALLBACK_BASIC_FILTERS,
  FALLBACK_COMPLETE_FILTERS,
  getFallbackGruposStrings,
  getFallbackProdutosStrings,
  createGrupoStructure,
  createProdutoStructure,
  getFallbackByType,
  normalizeFilters,
  FALLBACK_CACHE_CONFIG,
  logFallbackUsage,
};
