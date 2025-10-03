import type { Filial } from './api';

export const API_CONFIG = {
  CACHE_TIME: 2 * 60 * 1000,
  AUTO_REFRESH: 30 * 1000,
  BACKGROUND_REFRESH: 45 * 1000, // Refresh mais espaçado para background
  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,
  STALE_TIME: 5 * 60 * 1000, // Dados ficam "stale" após 5 min
  BACKGROUND_STALE_TIME: 10 * 60 * 1000, // Stale time maior para background
  FILIAL_URLS: {
    LDA: "http://192.168.10.201/attmonitor/api",
    CHP: "http://45.4.111.173:9090/attmonitor/api",
    FND: "http://177.84.63.82:9090/attmonitor/api",
    NMD: "http://168.195.5.254:9090/attmonitor/api",
    NMG: "http://138.186.125.143:9090/attmonitor/api",
  } as const,
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: "userToken",
  USERNAME: "username",
  TRANSPORT_CACHE: "transportCache",
  CONTRATOS_CACHE: "contratosCache",
} as const;

export const FILIAIS: readonly Filial[] = ["LDA", "CHP", "FND", "NMD", "NMG"];

export interface FilterOption {
  key: string;
  label: string;
}

export const SERVICO_OPTIONS: FilterOption[] = [
  { key: "armazenagem", label: "Armazenagem" },
  { key: "transbordo", label: "Transbordo" },
  { key: "pesagem", label: "Pesagem" },
];

export const OP_PADRAO_OPTIONS: FilterOption[] = [
  { key: "rodo_ferro", label: "Rodo-Ferro" },
  { key: "ferro_rodo", label: "Ferro-Rodo" },
  { key: "rodo_rodo", label: "Rodo-Rodo" },
  { key: "outros", label: "Outros" },
];

export const OP_PADRAO_LABELS: Record<string, string> = {
  rodo_ferro: "Rodo-Ferro",
  ferro_rodo: "Ferro-Rodo",
  rodo_rodo: "Rodo-Rodo",
  outros: "Outros",
};

export interface ApiFilters {
  servico: Record<string, 0 | 1>;
  opPadrao: Record<string, 0 | 1>;
}

export const DEFAULT_FILTERS: ApiFilters = {
  servico: {
    armazenagem: 1,
    transbordo: 1,
    pesagem: 0,
  },
  opPadrao: {
    rodo_ferro: 1,
    ferro_rodo: 1,
    rodo_rodo: 1,
    outros: 0,
  },
};

/**
 * Filtros padrão para requisições da API
 * Centralizados para evitar duplicação em múltiplos métodos
 */
export const DEFAULT_API_FILTERS = {
  SERVICO: {
    armazenagem: 1,
    transbordo: 1,
    pesagem: 0,
  } as const,
  OP_PADRAO: {
    rodo_ferro: 1,
    ferro_rodo: 1,
    rodo_rodo: 1,
    outros: 0,
  } as const,
} as const;

/**
 * Helper para obter filtros padrão com possibilidade de override
 */
export const getDefaultFilters = (customFilters: Partial<{
  filtro_servico: Record<string, 0 | 1>;
  filtro_op_padrao: Record<string, 0 | 1>;
}> = {}) => ({
  filtro_servico: customFilters.filtro_servico || DEFAULT_API_FILTERS.SERVICO,
  filtro_op_padrao: customFilters.filtro_op_padrao || DEFAULT_API_FILTERS.OP_PADRAO,
});

export const COLORS = {
  primary: "#007AFF",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545",
  info: "#17a2b8",
  orange: "#fd7e14",
  purple: "#6f42c1",
  teal: "#20c997",
  gray: "#666",
  lightGray: "#f8f9fa",
  white: "#ffffff",
  black: "#1a1a1a",
} as const;

export const SCREEN_NAMES = {
  LOGIN: "Login",
  HOME: "Home",
  MONITOR_CORTE: "MonitorCorte",
  CONTRATOS_DETALHES: "ContratosDetalhes",
  CARGAS_HOJE: "CargasHoje",
  DESCARGAS_HOJE: "DescargasHoje",
  TRANSITO: "Transito",
  FILA_DESCARGA: "FilaDescarga",
  FILA_CARGA: "FilaCarga",
  PATIO_DESCARGA: "PatioDescarga",
  PATIO_CARGA: "PatioCarga",
} as const;

export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];
