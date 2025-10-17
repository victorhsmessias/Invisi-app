export { API_CONFIG, STORAGE_KEYS, FILIAIS } from "./api";
export type { Filial } from "./api";
export { colors, typography, spacing, borderRadius, shadows, theme, lightTheme, darkTheme } from "./theme";

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
