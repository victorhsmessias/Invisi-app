/**
 * Configuração de dados fallback para a aplicação
 * Centralizados para facilitar manutenção e consistência
 */

/**
 * Fallbacks para filtros de serviço
 */
export const FALLBACK_SERVICOS = [
  "armazenagem",
  "transbordo",
  "pesagem",
];

/**
 * Fallbacks para operação padrão
 */
export const FALLBACK_OP_PADRAO = [
  "rodo_ferro",
  "ferro_rodo",
  "rodo_rodo",
  "outros",
];

/**
 * Fallbacks para grupos de clientes
 */
export const FALLBACK_GRUPOS = [
  { grupo: "ADM-MGA" },
  { grupo: "ATT" },
  { grupo: "CARGILL" },
  { grupo: "BTG PACTUAL S/A" },
];

/**
 * Fallbacks para tipos de produto
 */
export const FALLBACK_PRODUTOS = [
  { tp_prod: "SOJA GRAOS" },
  { tp_prod: "MILHO GRAOS" },
  { tp_prod: "FARELO DE SOJA" },
];

/**
 * Fallbacks para filtros básicos (objeto simples)
 */
export const FALLBACK_BASIC_FILTERS = {
  servicos: FALLBACK_SERVICOS,
  opPadrao: FALLBACK_OP_PADRAO,
};

/**
 * Fallbacks para filtros completos
 */
export const FALLBACK_COMPLETE_FILTERS = {
  servicos: FALLBACK_SERVICOS,
  opPadrao: FALLBACK_OP_PADRAO,
  grupos: FALLBACK_GRUPOS.map(g => g.grupo),
  produtos: FALLBACK_PRODUTOS.map(p => p.tp_prod),
};

/**
 * Obter lista de grupos como strings simples
 */
export const getFallbackGruposStrings = () => {
  return FALLBACK_GRUPOS.map(g => g.grupo);
};

/**
 * Obter lista de produtos como strings simples
 */
export const getFallbackProdutosStrings = () => {
  return FALLBACK_PRODUTOS.map(p => p.tp_prod);
};

/**
 * Criar estrutura de grupo com formato esperado pela API
 */
export const createGrupoStructure = (grupos) => {
  if (!Array.isArray(grupos)) return FALLBACK_GRUPOS;

  return grupos.map(grupo => {
    if (typeof grupo === 'string') {
      return { grupo };
    }
    if (grupo && typeof grupo === 'object' && grupo.grupo) {
      return grupo;
    }
    return { grupo: String(grupo) };
  });
};

/**
 * Criar estrutura de produto com formato esperado pela API
 */
export const createProdutoStructure = (produtos) => {
  if (!Array.isArray(produtos)) return FALLBACK_PRODUTOS;

  return produtos.map(produto => {
    if (typeof produto === 'string') {
      return { tp_prod: produto };
    }
    if (produto && typeof produto === 'object' && produto.tp_prod) {
      return produto;
    }
    return { tp_prod: String(produto) };
  });
};

/**
 * Obter fallback por tipo de filtro
 */
export const getFallbackByType = (type) => {
  const fallbacks = {
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

/**
 * Validar e normalizar filtros com fallback automático
 */
export const normalizeFilters = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return FALLBACK_COMPLETE_FILTERS;
  }

  return {
    servicos: Array.isArray(filters.servicos) && filters.servicos.length > 0
      ? filters.servicos
      : FALLBACK_SERVICOS,

    opPadrao: Array.isArray(filters.opPadrao) && filters.opPadrao.length > 0
      ? filters.opPadrao
      : FALLBACK_OP_PADRAO,

    grupos: Array.isArray(filters.grupos) && filters.grupos.length > 0
      ? filters.grupos
      : getFallbackGruposStrings(),

    produtos: Array.isArray(filters.produtos) && filters.produtos.length > 0
      ? filters.produtos
      : getFallbackProdutosStrings(),
  };
};

/**
 * Configuração de cache para fallbacks
 */
export const FALLBACK_CACHE_CONFIG = {
  // Tempo de cache para fallbacks (menor que dados reais)
  CACHE_TIME: 1 * 60 * 1000, // 1 minuto

  // Usar fallback quando API falha após N tentativas
  USE_AFTER_ATTEMPTS: 2,

  // Mostrar aviso ao usar fallback
  SHOW_WARNING: __DEV__,
};

/**
 * Logger para uso de fallbacks (apenas em desenvolvimento)
 */
export const logFallbackUsage = (type, reason = 'API falhou') => {
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
