export interface VehicleData {
  placa?: string;
  motorista?: string;
  grupo?: string;
  produto?: string;
  tp_prod?: string;
  peso_origem?: number;
  peso_descarga?: number;
  peso_carga?: number;
  dt_entrada?: string;
  hr_entrada?: string;
  tempo_espera?: string;
  [key: string]: any;
}

export interface ContratoData {
  grupo: string;
  tp_prod: string;
  peso_origem: number;
  peso_descarga: number;
  peso_carga: number;
  peso_meia_carga: number;
  peso_destino: number;
  dif_peso_descarga_origem: number;
  pdif_peso_descarga_origem: number;
  dif_peso_carga_descarga: number;
  pdif_peso_carga_descarga: number;
  dif_peso_destino_carga: number;
  pdif_peso_destino_carga: number;
  veiculos_descarga: string;
  veiculos_descarga_med: number;
  veiculos_carga: string;
  veiculos_carga_med: number;
  veiculos_meia_carga: number;
  [key: string]: any;
}

export interface TransportData {
  emTransito: number;
  filaDescarga: number;
  filaCarga: number;
  patioDescarregando: number;
  patioCarregando: number;
  descargasHoje: number;
  cargasHoje: number;
}

export interface FilterState {
  servicos: string[];
  opPadrao: string[];
}

export interface ApiFilterObject {
  [key: string]: 0 | 1;
}

export interface CompleteFilterState extends FilterState {
  grupos: string[];
  produtos: string[];
}

export interface CacheData<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export type ErrorType =
  | "NETWORK"
  | "AUTHENTICATION"
  | "VALIDATION"
  | "SERVER"
  | "UNKNOWN";

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError: Error;
}

export interface DateTimeFormatOptions {
  includeTime?: boolean;
  includeDate?: boolean;
  format?: string;
}


export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MonitorCorte: undefined;
  ContratosDetalhes: {
    contrato: ContratoData;
    filial: string;
  };
  CargasHoje: undefined;
  DescargasHoje: undefined;
  Transito: undefined;
  FilaDescarga: undefined;
  FilaCarga: undefined;
  PatioDescarga: undefined;
  PatioCarga: undefined;
};

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

// Re-export API types
export * from './api';
export * from './context';
