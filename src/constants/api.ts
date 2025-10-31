export const API_CONFIG = {
  FILIAL_URLS: {
    LDA: "http://200.150.120.54:9090/attmonitor/api",
    CHP: "http://45.4.111.173:9090/attmonitor/api",
    FND: "http://177.84.63.82:9090/attmonitor/api",
    NMD: "http://168.195.5.254:9090/attmonitor/api",
    NMG: "http://138.186.125.143:9090/attmonitor/api",
  } as const,

  CACHE_TIME: 3 * 60 * 1000,
  AUTO_REFRESH: 60 * 1000,
  BACKGROUND_REFRESH: 90 * 1000,
  STALE_TIME: 5 * 60 * 1000,
  BACKGROUND_STALE_TIME: 10 * 60 * 1000,

  RETRY_ATTEMPTS: 1,
  RETRY_DELAY: 1000,

  REQUEST_TIMEOUT: 30000,
  LONG_REQUEST_TIMEOUT: 60000,
} as const;

export type Filial = keyof typeof API_CONFIG.FILIAL_URLS;

export const FILIAIS: readonly Filial[] = ["LDA", "CHP", "FND", "NMD", "NMG"];

export const BACKUP_URLS: Record<Filial, string | null> = {
  LDA: null,
  CHP: null,
  FND: null,
  NMD: null,
  NMG: null,
};

export interface OperationType {
  key: string;
  endpoint: string;
  label: string;
  dataPrefix: string | null;
  icon: string;
}

export const OPERATION_TYPES: Record<string, OperationType> = {
  MONITOR_TRANSITO: {
    key: "monitor_transito",
    endpoint: "monitor_transito",
    label: "Trânsito",
    dataPrefix: "t_",
    icon: "🚛",
  },
  MONITOR_FILA_DESCARGA: {
    key: "monitor_fila_desc",
    endpoint: "monitor_fila_desc",
    label: "Fila de Descarga",
    dataPrefix: "fd_",
    icon: "⏳",
  },
  MONITOR_FILA_CARGA: {
    key: "monitor_fila_carga",
    endpoint: "monitor_fila_carga",
    label: "Fila de Carga",
    dataPrefix: "fc_",
    icon: "⏰",
  },
  MONITOR_PATIO_DESCARGA_LOCAL: {
    key: "monitor_patio_desc_local",
    endpoint: "monitor_patio_desc_local",
    label: "Pátio de Descarga (Local)",
    dataPrefix: "pd_",
    icon: "📦",
  },
  MONITOR_PATIO_CARGA: {
    key: "monitor_patio_carga",
    endpoint: "monitor_patio_carga",
    label: "Pátio de Carga",
    dataPrefix: "pc_",
    icon: "🏗️",
  },

  DESCARGAS_HOJE: {
    key: "descargas_hoje",
    endpoint: "descargas_hoje",
    label: "Descargas Hoje",
    dataPrefix: "d_",
    icon: "📤",
  },
  CARGAS_HOJE: {
    key: "cargas_hoje",
    endpoint: "cargas_hoje",
    label: "Cargas Hoje",
    dataPrefix: "c_",
    icon: "📦",
  },

  MONITOR_CORTE: {
    key: "monitor_corte",
    endpoint: "monitor_corte",
    label: "Monitor de Corte",
    dataPrefix: null,
    icon: "📊",
  },
};

export const API_ENDPOINTS = {
  LOGIN: "login",
  LOGOUT: "logout",
  REFRESH_TOKEN: "refresh_token",

  DASHBOARD: "dashboard",
  TRANSPORT_DATA: "transport_data",

  MONITOR_TRANSITO: "monitor_transito",
  MONITOR_FILA_DESC: "monitor_fila_desc",
  MONITOR_FILA_CARGA: "monitor_fila_carga",
  MONITOR_PATIO_DESC_LOCAL: "monitor_patio_desc_local",
  MONITOR_PATIO_CARGA: "monitor_patio_carga",

  DESCARGAS_HOJE: "descargas_hoje",
  CARGAS_HOJE: "cargas_hoje",

  MONITOR_CORTE: "monitor_corte",
  CONTRATOS_FILA: "contratos_fila",

  GET_GRUPOS: "get_grupos",
  GET_PRODUTOS: "get_produtos",
  GET_FILTER_OPTIONS: "get_filter_options",
} as const;

export const STORAGE_KEYS = {
  USER_TOKEN: "userToken",
  USERNAME: "username",
  USER_ROLE: "userRole",
  USER_FILIAL: "userFilial",
  TRANSPORT_CACHE: "transportCache",
  CONTRATOS_CACHE: "contratosCache",
  FILTERS_CACHE: "filtersCache",
  LAST_FILIAL: "lastFilial",
} as const;

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 408,
  NETWORK_ERROR: 0,
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export const API_ERROR_MESSAGES: Record<ApiErrorCode | "DEFAULT", string> = {
  [API_ERROR_CODES.UNAUTHORIZED]: "Sessão expirada. Faça login novamente.",
  [API_ERROR_CODES.FORBIDDEN]:
    "Você não tem permissão para acessar este recurso.",
  [API_ERROR_CODES.NOT_FOUND]: "Recurso não encontrado.",
  [API_ERROR_CODES.INTERNAL_SERVER_ERROR]:
    "Erro interno do servidor. Tente novamente mais tarde.",
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]:
    "Serviço temporariamente indisponível.",
  [API_ERROR_CODES.TIMEOUT]: "A requisição demorou muito. Tente novamente.",
  [API_ERROR_CODES.NETWORK_ERROR]: "Erro de conexão. Verifique sua internet.",
  DEFAULT: "Erro ao processar requisição. Tente novamente.",
};

export const getFilialUrl = (filial: Filial): string => {
  return API_CONFIG.FILIAL_URLS[filial] || API_CONFIG.FILIAL_URLS.LDA;
};

export const getOperationType = (
  operationKey: string
): OperationType | null => {
  return (
    Object.values(OPERATION_TYPES).find((op) => op.key === operationKey) || null
  );
};

export const getOperationEndpoint = (operationKey: string): string => {
  const operation = getOperationType(operationKey);
  return operation ? operation.endpoint : operationKey;
};

export const getErrorMessage = (errorCode: number): string => {
  return (
    API_ERROR_MESSAGES[errorCode as ApiErrorCode] || API_ERROR_MESSAGES.DEFAULT
  );
};
