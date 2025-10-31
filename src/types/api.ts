import type { Filial } from "../constants/api";
import type { GrupoItem, ProdutoItem } from "../constants/fallbacks";
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  success: boolean;
  username: string;
  id_grupo_usuario?: string;
  lotacao?: string;
}

export interface ApiRequestBody {
  AttApi: {
    tipoOperacao: string;
    filtro_filial?: Filial;
    filtro_servico?: Record<string, 0 | 1>;
    filtro_op_padrao?: Record<string, 0 | 1>;
    filtro_grupo?: GrupoItem[];
    filtro_tp_prod?: ProdutoItem[];
    filial?: Filial;
    fila?: string;
    grupo?: string;
    prod?: string;
    [key: string]: any;
  };
}
export interface ApiResponse<T = any> {
  dados: T;
  [key: string]: any;
}

export interface VehicleListResponse {
  transitoVeiculos?: any[];
  filaDescargaVeiculos?: any[];
  filaCargaVeiculos?: any[];
  patioDescargaVeiculos?: any[];
  patioCargaVeiculos?: any[];
  DescargaVeiculos?: any[];
  CargaVeiculos?: any[];
  [key: string]: any;
}

export interface MonitorDataResponse {
  dados: {
    listaTransito?: VehicleListResponse;
    listaFilaDescarga?: VehicleListResponse;
    listaFilaCarga?: VehicleListResponse;
    listaPatioDescarga?: VehicleListResponse;
    listaPatioCarga?: VehicleListResponse;
    listaDescarga?: VehicleListResponse;
    listaCarga?: VehicleListResponse;
    [key: string]: any;
  };
}

export interface ContratosResponse {
  dados: {
    contratos?: any[];
    CortesFila?: any[];
  };
}

export interface FilterResponse {
  dados: {
    grupos?: string[];
    produtos?: string[];
    servicos?: string[];
    op_padrao?: string[];
    [key: string]: any;
  };
}
export interface MonitorFilters {
  filtro_filial: Filial;
  filtro_servico?: Record<string, 0 | 1>;
  filtro_op_padrao?: Record<string, 0 | 1>;
}

export interface ContratosFilters extends MonitorFilters {
  filtro_grupo?: GrupoItem[];
  filtro_tp_prod?: ProdutoItem[];
}

export interface ContratosFilaParams {
  filial: Filial;
  fila: string;
  grupo: string;
  prod: string;
  dadosCorte?: {
    peso_origem?: number;
    peso_descarga?: number;
    peso_carga?: number;
    peso_meia_carga?: number;
    peso_destino?: number;
    dif_peso_descarga_origem?: number;
    pdif_peso_descarga_origem?: number;
    dif_peso_carga_descarga?: number;
    pdif_peso_carga_descarga?: number;
    dif_peso_destino_carga?: number;
    pdif_peso_destino_carga?: number;
    veiculos_descarga?: string;
    veiculos_descarga_med?: number;
    veiculos_carga?: string;
    veiculos_carga_med?: number;
    veiculos_meia_carga?: number;
  };
}
