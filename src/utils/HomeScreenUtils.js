import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook para gerenciar cache com expiração
 * @param {string} key - Chave do cache
 * @param {number} ttl - Time to live em ms
 */
export const useCache = (key, ttl = 5 * 60 * 1000) => {
  const [cachedData, setCachedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCache = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < ttl) {
          setCachedData(data);
          return data;
        }
      }
    } catch (error) {
      console.log("Cache read error:", error);
    }
    setIsLoading(false);
    return null;
  }, [key, ttl]);

  const setCache = useCallback(
    async (data) => {
      try {
        await AsyncStorage.setItem(
          key,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
        setCachedData(data);
      } catch (error) {
        console.log("Cache write error:", error);
      }
    },
    [key]
  );

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setCachedData(null);
    } catch (error) {
      console.log("Cache clear error:", error);
    }
  }, [key]);

  useEffect(() => {
    getCache();
  }, [getCache]);

  return { cachedData, isLoading, setCache, clearCache, getCache };
};

/**
 * Hook para auto-refresh de dados
 * @param {Function} fetchFunction - Função para buscar dados
 * @param {number} interval - Intervalo em ms
 * @param {boolean} enabled - Se está habilitado
 */
export const useAutoRefresh = (
  fetchFunction,
  interval = 30000,
  enabled = true
) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (enabled && fetchFunction) {
      // Busca inicial
      fetchFunction();

      // Setup interval
      intervalRef.current = setInterval(fetchFunction, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchFunction, interval, enabled]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(fetchFunction, interval);
    }
  }, [fetchFunction, interval]);

  return { stop, start };
};

/**
 * Hook para detectar inatividade do usuário
 * @param {number} timeout - Tempo de inatividade em ms
 * @param {Function} onInactive - Callback quando inativo
 */
export const useInactivity = (timeout = 5 * 60 * 1000, onInactive) => {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (onInactive) onInactive();
    }, timeout);
  }, [timeout, onInactive]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer]);

  return { resetTimer };
};

/**
 * Hook para debounce de valores
 * @param {any} value - Valor para debounce
 * @param {number} delay - Delay em ms
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para verificar conectividade
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState("unknown");

  useEffect(() => {
    // Implementar com NetInfo se disponível
    // import NetInfo from '@react-native-community/netinfo';
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setIsOnline(state.isConnected);
    //   setConnectionType(state.type);
    // });
    // return () => unsubscribe();
  }, []);

  return { isOnline, connectionType };
};

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

/**
 * Formatar número grande
 * @param {number} num - Número para formatar
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

/**
 * Calcular cor baseada em porcentagem
 * @param {number} percentage - Porcentagem (0-100)
 */
export const getStatusColor = (percentage) => {
  if (percentage >= 90) return "#28a745"; // Verde
  if (percentage >= 70) return "#ffc107"; // Amarelo
  if (percentage >= 50) return "#fd7e14"; // Laranja
  return "#dc3545"; // Vermelho
};

/**
 * Fazer fetch com timeout
 * @param {string} url - URL da requisição
 * @param {object} options - Opções do fetch
 * @param {number} timeout - Timeout em ms
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

/**
 * Retry de função com backoff exponencial
 * @param {Function} fn - Função para executar
 * @param {number} maxRetries - Máximo de tentativas
 * @param {number} delay - Delay inicial
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const backoffDelay = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
};

/**
 * Batch de operações assíncronas
 * @param {Array} items - Items para processar
 * @param {Function} fn - Função para aplicar
 * @param {number} batchSize - Tamanho do batch
 */
export const processBatch = async (items, fn, batchSize = 5) => {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }

  return results;
};

/**
 * Limpar cache antigo
 * @param {number} maxAge - Idade máxima em ms
 */
export const cleanOldCache = async (maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith("cache_"));

    for (const key of cacheKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const { timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp > maxAge) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.log("Cache cleanup error:", error);
  }
};

export const API_ENDPOINTS = {
  BASE_URL: "http://192.168.10.52/attmonitor/api",
  BACKUP_URL: "http://45.4.111.173:9090/attmonitor/api",
  LOGIN: "/login.php",
  MONITOR: "/d_monitor.php",
  CONTRACTS: "/monitor_contratos_fila.php",
};

export const REFRESH_INTERVALS = {
  FAST: 10 * 1000, // 10 segundos
  NORMAL: 30 * 1000, // 30 segundos
  SLOW: 60 * 1000, // 1 minuto
  VERY_SLOW: 5 * 60 * 1000, // 5 minutos
};

export const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minuto
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 30 * 60 * 1000, // 30 minutos
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 horas
};

export const getMockData = () => ({
  operacoesHoje: Math.floor(Math.random() * 100),
  emTransito: Math.floor(Math.random() * 50),
  naFila: Math.floor(Math.random() * 30),
  eficiencia: Math.floor(Math.random() * 100),
  contratos: [
    { id: 1, nome: "Contrato A", status: "ativo", valor: 150000 },
    { id: 2, nome: "Contrato B", status: "pendente", valor: 85000 },
    { id: 3, nome: "Contrato C", status: "ativo", valor: 220000 },
  ],
  veiculos: {
    descarga: Math.floor(Math.random() * 20),
    carga: Math.floor(Math.random() * 15),
    manutencao: Math.floor(Math.random() * 5),
  },
});

/**
 * Criar headers padrão para requisições
 * @param {string} token - Token de autenticação
 */
export const createHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(token && { token: token }),
});

/**
 * Processar resposta da API
 * @param {Response} response - Resposta do fetch
 */
export const processApiResponse = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    // Se não for JSON, retornar texto
    return text;
  }
};

/**
 * Verificar se token está expirado (JWT)
 * @param {string} token - Token JWT
 */
export const isTokenExpired = (token) => {
  if (!token || !token.includes(".")) return true;

  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));

    if (!decoded.exp) return false;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// ==========================================
// VALIDAÇÕES
// ==========================================

export const validators = {
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPhone: (phone) => {
    const re = /^\d{10,11}$/;
    return re.test(phone.replace(/\D/g, ""));
  },

  isValidCPF: (cpf) => {
    // Implementar validação de CPF se necessário
    return cpf && cpf.length === 11;
  },

  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date);
  },
};

export default {
  // Hooks
  useCache,
  useAutoRefresh,
  useInactivity,
  useDebounce,
  useNetworkStatus,

  // Utils
  formatNumber,
  getStatusColor,
  fetchWithTimeout,
  retryWithBackoff,
  processBatch,
  cleanOldCache,

  // API Helpers
  createHeaders,
  processApiResponse,
  isTokenExpired,

  // Constants
  CACHE_KEYS,
  API_ENDPOINTS,
  REFRESH_INTERVALS,
  CACHE_TTL,

  // Dev
  getMockData,

  // Validators
  validators,
};
