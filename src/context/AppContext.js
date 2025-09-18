import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, FILIAIS } from "../constants";

// Estados iniciais
const initialState = {
  // Auth
  isLoggedIn: false,
  isLoading: true,
  username: "",
  token: null,

  // App State
  selectedFilial: FILIAIS[0],

  // Transport Data
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

  // Contratos Data
  contratosData: [],
  contratosLoading: false,
  contratosLastUpdate: null,

  // Filters
  filterOptions: {
    grupos: [],
    opPadrao: [],
    produtos: [],
  },
  filtersLoading: false,

  // Error handling
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_AUTH: "SET_AUTH",
  SET_USERNAME: "SET_USERNAME",
  SET_FILIAL: "SET_FILIAL",
  SET_TRANSPORT_DATA: "SET_TRANSPORT_DATA",
  SET_TRANSPORT_LOADING: "SET_TRANSPORT_LOADING",
  SET_CONTRATOS_DATA: "SET_CONTRATOS_DATA",
  SET_CONTRATOS_LOADING: "SET_CONTRATOS_LOADING",
  SET_FILTER_OPTIONS: "SET_FILTER_OPTIONS",
  SET_FILTERS_LOADING: "SET_FILTERS_LOADING",
  SET_ERROR: "SET_ERROR",
  LOGOUT: "LOGOUT",
  RESET_ERROR: "RESET_ERROR",
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case actionTypes.SET_AUTH:
      return {
        ...state,
        isLoggedIn: action.payload.isLoggedIn,
        token: action.payload.token,
        isLoading: false,
      };

    case actionTypes.SET_USERNAME:
      return { ...state, username: action.payload };

    case actionTypes.SET_FILIAL:
      return { ...state, selectedFilial: action.payload };

    case actionTypes.SET_TRANSPORT_DATA:
      return {
        ...state,
        transportData: action.payload.data,
        transportLastUpdate: action.payload.lastUpdate || new Date(),
      };

    case actionTypes.SET_TRANSPORT_LOADING:
      return { ...state, transportLoading: action.payload };

    case actionTypes.SET_CONTRATOS_DATA:
      return {
        ...state,
        contratosData: action.payload.data,
        contratosLastUpdate: action.payload.lastUpdate || new Date(),
      };

    case actionTypes.SET_CONTRATOS_LOADING:
      return { ...state, contratosLoading: action.payload };

    case actionTypes.SET_FILTER_OPTIONS:
      return {
        ...state,
        filterOptions: { ...state.filterOptions, ...action.payload },
      };

    case actionTypes.SET_FILTERS_LOADING:
      return { ...state, filtersLoading: action.payload };

    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };

    case actionTypes.RESET_ERROR:
      return { ...state, error: null };

    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
        isLoggedIn: false,
      };

    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    setLoading: (loading) =>
      dispatch({ type: actionTypes.SET_LOADING, payload: loading }),

    setAuth: (isLoggedIn, token = null) =>
      dispatch({
        type: actionTypes.SET_AUTH,
        payload: { isLoggedIn, token }
      }),

    setUsername: (username) =>
      dispatch({ type: actionTypes.SET_USERNAME, payload: username }),

    setFilial: (filial) =>
      dispatch({ type: actionTypes.SET_FILIAL, payload: filial }),

    setTransportData: (data, lastUpdate = null) =>
      dispatch({
        type: actionTypes.SET_TRANSPORT_DATA,
        payload: { data, lastUpdate },
      }),

    setTransportLoading: (loading) =>
      dispatch({ type: actionTypes.SET_TRANSPORT_LOADING, payload: loading }),

    setContratosData: (data, lastUpdate = null) =>
      dispatch({
        type: actionTypes.SET_CONTRATOS_DATA,
        payload: { data, lastUpdate },
      }),

    setContratosLoading: (loading) =>
      dispatch({ type: actionTypes.SET_CONTRATOS_LOADING, payload: loading }),

    setFilterOptions: (options) =>
      dispatch({ type: actionTypes.SET_FILTER_OPTIONS, payload: options }),

    setFiltersLoading: (loading) =>
      dispatch({ type: actionTypes.SET_FILTERS_LOADING, payload: loading }),

    setError: (error) =>
      dispatch({ type: actionTypes.SET_ERROR, payload: error }),

    resetError: () =>
      dispatch({ type: actionTypes.RESET_ERROR }),

    logout: async () => {
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER_TOKEN,
          STORAGE_KEYS.USERNAME,
        ]);
        dispatch({ type: actionTypes.LOGOUT });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    },
  };

  // Check login status on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const [token, username] = await AsyncStorage.multiGet([
          STORAGE_KEYS.USER_TOKEN,
          STORAGE_KEYS.USERNAME,
        ]);

        const userToken = token[1];
        const savedUsername = username[1];

        if (userToken) {
          actions.setAuth(true, userToken);
          if (savedUsername) {
            actions.setUsername(savedUsername);
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

  const value = {
    state,
    actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
};

export default AppContext;