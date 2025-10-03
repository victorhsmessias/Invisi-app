import { useRef, useEffect, useCallback } from 'react';
import {
  AUTO_REFRESH_INTERVAL,
  BACKGROUND_REFRESH_INTERVAL,
  USER_IDLE_MEDIUM,
  USER_IDLE_LONG,
} from '../constants/timing';

/**
 * Hook para gerenciar intervalos adaptativos
 * Responsabilidade única: criar, gerenciar e limpar intervalos que se adaptam ao contexto
 */
export const useAdaptiveInterval = (callback, options = {}) => {
  const {
    baseInterval = AUTO_REFRESH_INTERVAL,
    backgroundInterval = BACKGROUND_REFRESH_INTERVAL,
    enabled = true,
    pauseOnBackground = true,
  } = options;

  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  // Manter callback atualizado sem recriar interval
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  /**
   * Calcular intervalo baseado no contexto
   * @param {Object} context - Contexto da aplicação
   * @returns {number} Intervalo em milissegundos
   */
  const calculateInterval = useCallback(
    (context = {}) => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        timeSinceActivity = 0,
      } = context;

      // App em background - usar intervalo maior
      if (isAppInBackground && pauseOnBackground) {
        return backgroundInterval;
      }

      // Usuário inativo - escalar intervalo progressivamente
      if (isUserIdle) {
        if (timeSinceActivity > USER_IDLE_LONG) {
          return baseInterval * 3; // 3x mais lento
        } else if (timeSinceActivity > USER_IDLE_MEDIUM) {
          return baseInterval * 2; // 2x mais lento
        }
      }

      // Contexto normal - usar intervalo base
      return baseInterval;
    },
    [baseInterval, backgroundInterval, pauseOnBackground]
  );

  /**
   * Limpar intervalo atual
   */
  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Iniciar intervalo com contexto específico
   * @param {Object} context - Contexto para calcular intervalo
   */
  const startInterval = useCallback(
    (context = {}) => {
      if (!enabled) return;

      // Limpar intervalo anterior
      clearCurrentInterval();

      const interval = calculateInterval(context);

      if (__DEV__) {
        console.log('[useAdaptiveInterval] Starting interval:', {
          interval,
          context,
        });
      }

      intervalRef.current = setInterval(() => {
        if (callbackRef.current) {
          callbackRef.current();
        }
      }, interval);
    },
    [enabled, calculateInterval, clearCurrentInterval]
  );

  /**
   * Parar intervalo
   */
  const stopInterval = useCallback(() => {
    clearCurrentInterval();
  }, [clearCurrentInterval]);

  /**
   * Reiniciar intervalo com novo contexto
   * @param {Object} context - Novo contexto
   */
  const restartInterval = useCallback(
    (context = {}) => {
      stopInterval();
      startInterval(context);
    },
    [stopInterval, startInterval]
  );

  /**
   * Verificar se intervalo está ativo
   * @returns {boolean}
   */
  const isIntervalActive = useCallback(() => {
    return intervalRef.current !== null;
  }, []);

  /**
   * Executar callback imediatamente e reiniciar intervalo
   * @param {Object} context - Contexto
   */
  const executeAndRestart = useCallback(
    (context = {}) => {
      if (callbackRef.current) {
        callbackRef.current();
      }
      restartInterval(context);
    },
    [restartInterval]
  );

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    // Controle do intervalo
    startInterval,
    stopInterval,
    restartInterval,
    executeAndRestart,

    // Estado
    isActive: isIntervalActive,

    // Utilitários
    calculateInterval,
    currentInterval: intervalRef.current,
  };
};

/**
 * Versão simplificada para casos básicos
 * Auto-inicia o intervalo
 */
export const useSimpleInterval = (callback, interval, enabled = true) => {
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      callbackRef.current?.();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);

  return {
    clear: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
  };
};

export default useAdaptiveInterval;
