export { API_CONFIG, STORAGE_KEYS, FILIAIS } from "./api";
export type { Filial } from "./api";

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
    pesagem: 1,
  },
  opPadrao: {
    rodo_ferro: 1,
    ferro_rodo: 1,
    rodo_rodo: 1,
    outros: 0,
  },
};

export const DEFAULT_API_FILTERS = {
  SERVICO: {
    armazenagem: 1,
    transbordo: 1,
    pesagem: 1,
  } as const,
  OP_PADRAO: {
    rodo_ferro: 1,
    ferro_rodo: 1,
    rodo_rodo: 1,
    outros: 0,
  } as const,
} as const;

export const getDefaultFilters = (
  customFilters: Partial<{
    filtro_servico: Record<string, 0 | 1>;
    filtro_op_padrao: Record<string, 0 | 1>;
  }> = {}
) => ({
  filtro_servico: customFilters.filtro_servico || DEFAULT_API_FILTERS.SERVICO,
  filtro_op_padrao:
    customFilters.filtro_op_padrao || DEFAULT_API_FILTERS.OP_PADRAO,
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

export type ScreenName = (typeof SCREEN_NAMES)[keyof typeof SCREEN_NAMES];
