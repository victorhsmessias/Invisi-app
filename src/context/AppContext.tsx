import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, FILIAIS } from "../constants";
import type { Filial } from "../constants/api";
import type {
  AppState,
  AppAction,
  AppActions,
  AppContextValue,
  TransportData,
  ContratoData,
  FilterOptions,
} from "../types";

const initialState: AppState = {
  isLoggedIn: false,
  isLoading: true,
  isInitializing: false,
  username: "",
  token: null,
  userRole: null,
  userFilial: null,
  allowedFilials: [],

  selectedFilial: FILIAIS[0] as Filial,

  transportData: {
    emTransito: 0,
    filaDescarga: 0,
    filaCarga: 0,
    patioDescarregando: 0,
    patioCarregando: 0,
    descargasHoje: 0,
    cargasHoje: 0,
  },
  transportLoading: false,
  transportLastUpdate: null,

  contratosData: [],
  contratosLoading: false,
  contratosLastUpdate: null,

  filterOptions: {
    grupos: [],
    opPadrao: [],
    produtos: [],
    servicos: [],
  },
  filtersLoading: false,
  filtersCache: {},
  filtersCacheExpiry: {},

  error: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_INITIALIZING":
      return { ...state, isInitializing: action.payload };

    case "SET_AUTH":
      return {
        ...state,
        isLoggedIn: action.payload.isLoggedIn,
        token: action.payload.token,
        isLoading: false,
      };

    case "SET_USERNAME":
      return { ...state, username: action.payload };

    case "SET_USER_ROLE":
      return { ...state, userRole: action.payload };

    case "SET_USER_FILIAL":
      return { ...state, userFilial: action.payload };

    case "SET_ALLOWED_FILIALS":
      return { ...state, allowedFilials: action.payload };

    case "SET_FILIAL":
      return { ...state, selectedFilial: action.payload };

    case "SET_TRANSPORT_DATA":
      return {
        ...state,
        transportData: action.payload.data,
        transportLastUpdate: action.payload.lastUpdate || new Date(),
      };

    case "SET_TRANSPORT_LOADING":
      return { ...state, transportLoading: action.payload };

    case "SET_CONTRATOS_DATA":
      return {
        ...state,
        contratosData: action.payload.data,
        contratosLastUpdate: action.payload.lastUpdate || new Date(),
      };

    case "SET_CONTRATOS_LOADING":
      return { ...state, contratosLoading: action.payload };

    case "SET_FILTER_OPTIONS":
      return {
        ...state,
        filterOptions: { ...state.filterOptions, ...action.payload },
      };

    case "SET_FILTERS_LOADING":
      return { ...state, filtersLoading: action.payload };

    case "SET_FILTERS_CACHE":
      return {
        ...state,
        filtersCache: {
          ...state.filtersCache,
          [action.payload.filial]: action.payload.data,
        },
        filtersCacheExpiry: {
          ...state.filtersCacheExpiry,
          [action.payload.filial]: action.payload.expiry,
        },
      };

    case "CLEAR_FILTERS_CACHE":
      return {
        ...state,
        filtersCache: {},
        filtersCacheExpiry: {},
      };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "RESET_ERROR":
      return { ...state, error: null };

    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false,
        isLoggedIn: false,
      };

    default:
      return state;
  }
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions: AppActions = useMemo(
    () => ({
      setLoading: (loading: boolean) =>
        dispatch({ type: "SET_LOADING", payload: loading }),

      setInitializing: (initializing: boolean) =>
        dispatch({ type: "SET_INITIALIZING", payload: initializing }),

      setAuth: (isLoggedIn: boolean, token: string | null = null) =>
        dispatch({
          type: "SET_AUTH",
          payload: { isLoggedIn, token },
        }),

      setUsername: (username: string) =>
        dispatch({ type: "SET_USERNAME", payload: username }),

      setUserRole: (role: string | null) =>
        dispatch({ type: "SET_USER_ROLE", payload: role }),

      setUserFilial: (filial: Filial | null) =>
        dispatch({ type: "SET_USER_FILIAL", payload: filial }),

      setAllowedFilials: (filials: readonly Filial[]) =>
        dispatch({ type: "SET_ALLOWED_FILIALS", payload: filials }),

      setFilial: (filial: Filial) =>
        dispatch({ type: "SET_FILIAL", payload: filial }),

      setTransportData: (data: TransportData, lastUpdate: Date | null = null) =>
        dispatch({
          type: "SET_TRANSPORT_DATA",
          payload: { data, lastUpdate },
        }),

      setTransportLoading: (loading: boolean) =>
        dispatch({ type: "SET_TRANSPORT_LOADING", payload: loading }),

      setContratosData: (
        data: ContratoData[],
        lastUpdate: Date | null = null
      ) =>
        dispatch({
          type: "SET_CONTRATOS_DATA",
          payload: { data, lastUpdate },
        }),

      setContratosLoading: (loading: boolean) =>
        dispatch({ type: "SET_CONTRATOS_LOADING", payload: loading }),

      setFilterOptions: (options: Partial<FilterOptions>) =>
        dispatch({ type: "SET_FILTER_OPTIONS", payload: options }),

      setFiltersLoading: (loading: boolean) =>
        dispatch({ type: "SET_FILTERS_LOADING", payload: loading }),

      setFiltersCache: (filial: string, data: any) => {
        const expiry = Date.now() + 5 * 60 * 1000;
        dispatch({
          type: "SET_FILTERS_CACHE",
          payload: { filial, data, expiry },
        });
      },

      clearFiltersCache: () => dispatch({ type: "CLEAR_FILTERS_CACHE" }),

      setError: (error: string | null) =>
        dispatch({ type: "SET_ERROR", payload: error }),

      resetError: () => dispatch({ type: "RESET_ERROR" }),

      logout: async () => {
        try {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.USER_TOKEN,
            STORAGE_KEYS.USERNAME,
            STORAGE_KEYS.USER_ROLE,
            STORAGE_KEYS.USER_FILIAL,
          ]);
          dispatch({ type: "LOGOUT" });
        } catch (error) {
          console.error("Erro ao fazer logout:", error);
        }
      },
    }),
    []
  );

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const [token, username, userRole, userFilial] = await AsyncStorage.multiGet([
          STORAGE_KEYS.USER_TOKEN,
          STORAGE_KEYS.USERNAME,
          STORAGE_KEYS.USER_ROLE,
          STORAGE_KEYS.USER_FILIAL,
        ]);

        const userToken = token[1];
        const savedUsername = username[1];
        const savedUserRole = userRole[1];
        const savedUserFilial = userFilial[1] as Filial | null;

        if (userToken) {
          actions.setAuth(true, userToken);
          if (savedUsername) {
            actions.setUsername(savedUsername);
          }
          if (savedUserRole) {
            actions.setUserRole(savedUserRole);
          }
          if (savedUserFilial) {
            actions.setUserFilial(savedUserFilial);
          }
        } else {
          actions.setAuth(false);
        }
      } catch (error) {
        console.error("Erro ao verificar login:", error);
        actions.setAuth(false);
      }
    };

    checkLoginStatus();
  }, []);

  const value: AppContextValue = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
};

export default AppContext;
