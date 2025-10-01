import { useCallback } from 'react';
import { STALE_TIME, BACKGROUND_STALE_TIME } from '../constants/timing';

/**
 * Hook para determinar estratégia de refresh baseado em contexto
 * Responsabilidade única: lógica de decisão sobre quando/como fazer refresh
 */
export const useRefreshStrategy = (options = {}) => {
  const {
    staleTime = STALE_TIME,
    backgroundStaleTime = BACKGROUND_STALE_TIME,
  } = options;

  /**
   * Verificar se dados estão stale (desatualizados)
   * @param {Date|string|number} lastUpdate - Timestamp da última atualização
   * @param {string} source - Contexto ('manual', 'background')
   * @returns {boolean}
   */
  const isDataStale = useCallback(
    (lastUpdate, source = 'manual') => {
      if (!lastUpdate) return true;

      const now = Date.now();
      let updateTime;

      // Normalizar diferentes formatos de timestamp
      if (typeof lastUpdate === 'string') {
        updateTime = new Date(lastUpdate).getTime();
      } else if (lastUpdate instanceof Date) {
        updateTime = lastUpdate.getTime();
      } else if (typeof lastUpdate === 'number') {
        updateTime = lastUpdate;
      } else {
        return true; // Se formato desconhecido, considerar stale
      }

      const ageMs = now - updateTime;
      const threshold = source === 'background' ? backgroundStaleTime : staleTime;

      return ageMs > threshold;
    },
    [staleTime, backgroundStaleTime]
  );

  /**
   * Obter idade dos dados em milissegundos
   * @param {Date|string|number} lastUpdate
   * @returns {number|null}
   */
  const getDataAge = useCallback((lastUpdate) => {
    if (!lastUpdate) return null;

    const now = Date.now();
    let updateTime;

    if (typeof lastUpdate === 'string') {
      updateTime = new Date(lastUpdate).getTime();
    } else if (lastUpdate instanceof Date) {
      updateTime = lastUpdate.getTime();
    } else if (typeof lastUpdate === 'number') {
      updateTime = lastUpdate;
    } else {
      return null;
    }

    return now - updateTime;
  }, []);

  /**
   * Determinar estratégia de refresh baseado em múltiplos fatores
   * @param {Object} context - Contexto da decisão
   * @returns {Object} Estratégia de refresh
   */
  const getRefreshStrategy = useCallback(
    (context = {}) => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        lastUpdate = null,
        forceRefresh = false,
      } = context;

      // Refresh forçado - sempre executa com loading visível
      if (forceRefresh) {
        return {
          shouldRefresh: true,
          silent: false,
          source: 'manual',
          reason: 'force_refresh',
        };
      }

      // App em background - apenas se dados muito antigos
      if (isAppInBackground) {
        const shouldRefresh = isDataStale(lastUpdate, 'background');
        return {
          shouldRefresh,
          silent: true,
          source: 'background',
          reason: shouldRefresh ? 'background_stale' : 'background_fresh',
        };
      }

      // Usuário inativo - apenas se dados muito antigos
      if (isUserIdle) {
        const shouldRefresh = isDataStale(lastUpdate, 'background');
        return {
          shouldRefresh,
          silent: true,
          source: 'background',
          reason: shouldRefresh ? 'idle_stale' : 'idle_fresh',
        };
      }

      // Usuário ativo e dados muito antigos - refresh normal (com loading)
      if (isDataStale(lastUpdate, 'manual')) {
        return {
          shouldRefresh: true,
          silent: false,
          source: 'manual',
          reason: 'active_stale',
        };
      }

      // Usuário ativo mas dados ainda frescos - refresh silencioso
      if (isDataStale(lastUpdate, 'background')) {
        return {
          shouldRefresh: true,
          silent: true,
          source: 'background',
          reason: 'active_slightly_stale',
        };
      }

      // Dados muito frescos - não precisa refresh
      return {
        shouldRefresh: false,
        silent: true,
        source: 'skip',
        reason: 'data_fresh',
      };
    },
    [isDataStale]
  );

  /**
   * Estratégia otimista: sempre fazer refresh, mas decidir se mostra loading
   * Útil para manter dados sempre atualizados
   */
  const getOptimisticStrategy = useCallback(
    (context = {}) => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        lastUpdate = null,
      } = context;

      // Sempre faz refresh, apenas decide se é silencioso
      const silent = isAppInBackground || isUserIdle || !isDataStale(lastUpdate, 'manual');

      return {
        shouldRefresh: true,
        silent,
        source: silent ? 'background' : 'manual',
        reason: 'optimistic',
      };
    },
    [isDataStale]
  );

  /**
   * Estratégia conservadora: apenas refresh quando absolutamente necessário
   * Útil para economizar recursos/bateria
   */
  const getConservativeStrategy = useCallback(
    (context = {}) => {
      const { lastUpdate = null, forceRefresh = false } = context;

      if (forceRefresh) {
        return {
          shouldRefresh: true,
          silent: false,
          source: 'manual',
          reason: 'force_refresh',
        };
      }

      // Apenas refresh se dados muito antigos
      const shouldRefresh = isDataStale(lastUpdate, 'background');

      return {
        shouldRefresh,
        silent: true,
        source: 'background',
        reason: shouldRefresh ? 'conservative_stale' : 'conservative_fresh',
      };
    },
    [isDataStale]
  );

  /**
   * Verificar se deve fazer refresh ao voltar do background
   */
  const shouldRefreshOnForeground = useCallback(
    (lastUpdate) => {
      return isDataStale(lastUpdate, 'manual');
    },
    [isDataStale]
  );

  return {
    // Funções de verificação
    isDataStale,
    getDataAge,
    shouldRefreshOnForeground,

    // Estratégias
    getRefreshStrategy, // Estratégia balanceada (padrão)
    getOptimisticStrategy, // Sempre atualiza
    getConservativeStrategy, // Apenas quando necessário

    // Configurações
    staleTime,
    backgroundStaleTime,
  };
};

export default useRefreshStrategy;
