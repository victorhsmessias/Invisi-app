import { useCallback, useRef, useEffect } from 'react';
import { AppState } from 'react-native';
import { API_CONFIG } from '../constants';

/**
 * Hook que determina inteligentemente quando fazer refresh silencioso
 * baseado na atividade do usuário e idade dos dados
 */
export const useIntelligentRefresh = (refreshCallback, options = {}) => {
  const {
    lastUpdate = null,
    enabled = true,
    interval = API_CONFIG.AUTO_REFRESH,
    backgroundInterval = API_CONFIG.BACKGROUND_REFRESH,
    staleTime = API_CONFIG.STALE_TIME,
    backgroundStaleTime = API_CONFIG.BACKGROUND_STALE_TIME,
  } = options;

  const intervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const appStateRef = useRef(AppState.currentState);
  const isUserActiveRef = useRef(true);

  // Atualizar atividade do usuário
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isUserActiveRef.current = true;
  }, []);

  // Verificar se dados estão stale
  const isDataStale = useCallback((source = 'manual') => {
    if (!lastUpdate) return true;

    const now = Date.now();
    const updateTime = typeof lastUpdate === 'string'
      ? new Date(lastUpdate).getTime()
      : lastUpdate.getTime();

    const ageMs = now - updateTime;
    const threshold = source === 'background' ? backgroundStaleTime : staleTime;

    return ageMs > threshold;
  }, [lastUpdate, staleTime, backgroundStaleTime]);

  // Determinar tipo de refresh baseado no contexto
  const getRefreshStrategy = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    const isUserIdle = timeSinceActivity > 2 * 60 * 1000; // 2 minutos
    const appInBackground = appStateRef.current !== 'active';

    // Se app em background ou usuário inativo, usar refresh silencioso
    if (appInBackground || isUserIdle) {
      return {
        silent: true,
        source: 'background',
        shouldRefresh: isDataStale('background'),
        interval: backgroundInterval,
      };
    }

    // Se usuário ativo e dados muito antigos, refresh normal
    if (isDataStale('manual')) {
      return {
        silent: false,
        source: 'manual',
        shouldRefresh: true,
        interval: interval,
      };
    }

    // Se dados recentes e usuário ativo, refresh silencioso
    return {
      silent: true,
      source: 'background',
      shouldRefresh: isDataStale('background'),
      interval: backgroundInterval,
    };
  }, [interval, backgroundInterval, isDataStale]);

  // Executar refresh inteligente
  const executeIntelligentRefresh = useCallback(() => {
    if (!enabled || !refreshCallback) return;

    const strategy = getRefreshStrategy();

    if (strategy.shouldRefresh) {
      if (__DEV__) {
        console.log('[useIntelligentRefresh] Executing refresh:', {
          silent: strategy.silent,
          source: strategy.source,
          dataAge: lastUpdate ? Date.now() - new Date(lastUpdate).getTime() : 'never',
        });
      }

      refreshCallback({
        silent: strategy.silent,
        source: strategy.source,
      });
    }
  }, [enabled, refreshCallback, getRefreshStrategy, lastUpdate]);

  // Configurar intervalo adaptativo
  const setupInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!enabled) return;

    const strategy = getRefreshStrategy();

    intervalRef.current = setInterval(() => {
      executeIntelligentRefresh();
    }, strategy.interval);

    if (__DEV__) {
      console.log('[useIntelligentRefresh] Interval configured:', {
        interval: strategy.interval,
        mode: strategy.source,
      });
    }
  }, [enabled, getRefreshStrategy, executeIntelligentRefresh]);

  // Handle mudanças de estado da app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      appStateRef.current = nextAppState;

      if (nextAppState === 'active') {
        // App voltou ao foreground
        isUserActiveRef.current = true;
        updateActivity();

        // Reconfigurar intervalo para modo ativo
        setupInterval();

        // Refresh imediato se dados muito antigos
        if (isDataStale('manual')) {
          setTimeout(() => {
            refreshCallback?.({
              silent: false,
              source: 'foreground',
            });
          }, 500);
        }
      } else {
        // App foi para background
        isUserActiveRef.current = false;
        setupInterval(); // Reconfigurar para modo background
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [setupInterval, updateActivity, isDataStale, refreshCallback]);

  // Configurar intervalo inicial
  useEffect(() => {
    setupInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setupInterval]);

  // Refresh manual (sempre mostra loading)
  const manualRefresh = useCallback(() => {
    updateActivity();
    return refreshCallback?.({
      silent: false,
      source: 'manual',
    });
  }, [refreshCallback, updateActivity]);

  // Refresh silencioso forçado
  const silentRefresh = useCallback(() => {
    return refreshCallback?.({
      silent: true,
      source: 'background',
    });
  }, [refreshCallback]);

  return {
    manualRefresh,
    silentRefresh,
    updateActivity,
    isDataStale: () => isDataStale('manual'),
    isUserActive: isUserActiveRef.current,
    currentInterval: getRefreshStrategy().interval,
  };
};

export default useIntelligentRefresh;