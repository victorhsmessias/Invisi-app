export const API_CONFIG = {
  BASE_URL: "http://192.168.10.201/attmonitor/api",
  BACKUP_URL: "http://45.4.111.173:9090/attmonitor/api",
  CACHE_TIME: 2 * 60 * 1000, // 2 minutos
  AUTO_REFRESH: 30 * 1000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const STORAGE_KEYS = {
  USER_TOKEN: "userToken",
  USERNAME: "username",
  TRANSPORT_CACHE: "transportCache",
  CONTRATOS_CACHE: "contratosCache",
};

export const FILIAIS = ["LDA", "CHP"];

export const SERVICO_OPTIONS = [
  { key: "armazenagem", label: "Armazenagem" },
  { key: "transbordo", label: "Transbordo" },
  { key: "pesagem", label: "Pesagem" },
];

export const OP_PADRAO_LABELS = {
  rodo_ferro: "Rodo-Ferro",
  ferro_rodo: "Ferro-Rodo",
  rodo_rodo: "Rodo-Rodo",
  outros: "Outros",
};

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
};

export const SCREEN_NAMES = {
  LOGIN: "Login",
  HOME: "Home",
  CONTRATOS: "Contratos",
  CARGAS_HOJE: "CargasHoje",
  DESCARGAS_HOJE: "DescargasHoje",
  TRANSITO: "Transito",
  FILA_DESCARGA: "FilaDescarga",
  FILA_CARGA: "FilaCarga",
  PATIO_DESCARGA: "PatioDescarga",
  PATIO_CARGA: "PatioCarga",
};