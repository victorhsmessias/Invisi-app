import type { Filial } from "../constants/api";
import type { TransportData, ContratoData } from "./index";

export interface FilterOptions {
  grupos: any[];
  opPadrao: any[];
  produtos: any[];
  servicos: any[];
}

export interface AppState {
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  username: string;
  token: string | null;
  userRole: string | null;
  userFilial: Filial | null;
  allowedFilials: readonly Filial[];
  selectedFilial: Filial;
  transportData: TransportData;
  transportLoading: boolean;
  transportLastUpdate: Date | null;
  contratosData: ContratoData[];
  contratosLoading: boolean;
  contratosLastUpdate: Date | null;
  filterOptions: FilterOptions;
  filtersLoading: boolean;
  filtersCache: Record<string, any>;
  filtersCacheExpiry: Record<string, number>;
  error: string | null;
}

export enum ActionTypes {
  SET_LOADING = "SET_LOADING",
  SET_INITIALIZING = "SET_INITIALIZING",
  SET_AUTH = "SET_AUTH",
  SET_USERNAME = "SET_USERNAME",
  SET_USER_ROLE = "SET_USER_ROLE",
  SET_USER_FILIAL = "SET_USER_FILIAL",
  SET_ALLOWED_FILIALS = "SET_ALLOWED_FILIALS",
  SET_FILIAL = "SET_FILIAL",
  SET_TRANSPORT_DATA = "SET_TRANSPORT_DATA",
  SET_TRANSPORT_LOADING = "SET_TRANSPORT_LOADING",
  SET_CONTRATOS_DATA = "SET_CONTRATOS_DATA",
  SET_CONTRATOS_LOADING = "SET_CONTRATOS_LOADING",
  SET_FILTER_OPTIONS = "SET_FILTER_OPTIONS",
  SET_FILTERS_LOADING = "SET_FILTERS_LOADING",
  SET_FILTERS_CACHE = "SET_FILTERS_CACHE",
  CLEAR_FILTERS_CACHE = "CLEAR_FILTERS_CACHE",
  SET_ERROR = "SET_ERROR",
  LOGOUT = "LOGOUT",
  RESET_ERROR = "RESET_ERROR",
}

export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | {
      type: 'SET_AUTH';
      payload: { isLoggedIn: boolean; token: string | null };
    }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_USER_ROLE'; payload: string | null }
  | { type: 'SET_USER_FILIAL'; payload: Filial | null }
  | { type: 'SET_ALLOWED_FILIALS'; payload: readonly Filial[] }
  | { type: 'SET_FILIAL'; payload: Filial }
  | {
      type: 'SET_TRANSPORT_DATA';
      payload: { data: TransportData; lastUpdate?: Date | null };
    }
  | { type: 'SET_TRANSPORT_LOADING'; payload: boolean }
  | {
      type: 'SET_CONTRATOS_DATA';
      payload: { data: ContratoData[]; lastUpdate?: Date | null };
    }
  | { type: 'SET_CONTRATOS_LOADING'; payload: boolean }
  | { type: 'SET_FILTER_OPTIONS'; payload: Partial<FilterOptions> }
  | { type: 'SET_FILTERS_LOADING'; payload: boolean }
  | {
      type: 'SET_FILTERS_CACHE';
      payload: { filial: string; data: any; expiry: number };
    }
  | { type: 'CLEAR_FILTERS_CACHE' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'RESET_ERROR' };

export interface AppActions {
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setAuth: (isLoggedIn: boolean, token?: string | null) => void;
  setUsername: (username: string) => void;
  setUserRole: (role: string | null) => void;
  setUserFilial: (filial: Filial | null) => void;
  setAllowedFilials: (filials: readonly Filial[]) => void;
  setFilial: (filial: Filial) => void;
  setTransportData: (data: TransportData, lastUpdate?: Date | null) => void;
  setTransportLoading: (loading: boolean) => void;
  setContratosData: (data: ContratoData[], lastUpdate?: Date | null) => void;
  setContratosLoading: (loading: boolean) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setFiltersLoading: (loading: boolean) => void;
  setFiltersCache: (filial: string, data: any) => void;
  clearFiltersCache: () => void;
  setError: (error: string | null) => void;
  resetError: () => void;
  logout: () => Promise<void>;
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}
