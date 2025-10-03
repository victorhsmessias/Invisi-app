import { useCallback, useRef, useEffect } from 'react';
import { API_CONFIG } from '../constants';
import useAppState from './useAppState';
import useRefreshStrategy from './useRefreshStrategy';
import useAdaptiveInterval from './useAdaptiveInterval';

/**
 * Hook refatorado que determina inteligentemente quando fazer refresh
 * Agora composto de hooks menores e mais testáveis
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

  const timeoutRef = useRef(null);

  // Usar hooks especializados
  const appState = useAppState();
  const strategy = useRefreshStrategy({ staleTime, backgroundStaleTime });

  // Delegar updateActivity para appState
  const updateActivity = appState.updateActivity;

  // Executar refresh inteligente
  const executeIntelligentRefresh = useCallback(() => {
    if (!enabled || !refreshCallback) return;

    // Obter estratégia baseada no contexto atual
    const refreshStrategy = strategy.getRefreshStrategy({
      isAppInBackground: appState.isAppInBackground(),
      isUserIdle: appState.isUserIdle(),
      lastUpdate,
    });

    if (refreshStrategy.shouldRefresh) {
      if (__DEV__) {
        console.log('[useIntelligentRefresh] Executing refresh:', {
          silent: refreshStrategy.silent,
          source: refreshStrategy.source,
          reason: refreshStrategy.reason,
          dataAge: strategy.getDataAge(lastUpdate),
        });
      }

      refreshCallback({
        silent: refreshStrategy.silent,
        source: refreshStrategy.source,
      });
    }
  }, [enabled, refreshCallback, strategy, appState, lastUpdate]);

  // Usar intervalo adaptativo
  const adaptiveInterval = useAdaptiveInterval(executeIntelligentRefresh, {
    baseInterval: interval,
    backgroundInterval,
    enabled,
    pauseOnBackground: false, // Não pausar, apenas ajustar intervalo
  });

  // Gerenciar mudanças de estado da app
  useEffect(() => {
    const cleanup = appState.onAppStateChange((stateChange) => {
      const { isActive, didBecomeActive, isBackground } = stateChange;

      if (didBecomeActive) {
        // App voltou ao foreground
        updateActivity();

        // Reiniciar intervalo com contexto ativo
        adaptiveInterval.restartInterval({
          isAppInBackground: false,
          isUserIdle: false,
        });

        // Refresh imediato se dados muito antigos
        if (strategy.shouldRefreshOnForeground(lastUpdate)) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            refreshCallback?.({
              silent: false,
              source: 'foreground',
            });
            timeoutRef.current = null;
          }, 500);
        }
      } else if (isBackground) {
        // App foi para background - ajustar intervalo
        adaptiveInterval.restartInterval({
          isAppInBackground: true,
          isUserIdle: appState.isUserIdle(),
        });
      }
    });

    return () => {
      cleanup();

      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [appState, strategy, refreshCallback, lastUpdate, updateActivity, adaptiveInterval]);

  // Iniciar intervalo adaptativo
  useEffect(() => {
    if (enabled) {
      adaptiveInterval.startInterval({
        isAppInBackground: appState.isAppInBackground(),
        isUserIdle: appState.isUserIdle(),
        timeSinceActivity: appState.getTimeSinceLastActivity(),
      });
    } else {
      adaptiveInterval.stopInterval();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, adaptiveInterval, appState]);

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

  // Verificar se dados estão stale
  const isDataStale = useCallback(() => {
    return strategy.isDataStale(lastUpdate, 'manual');
  }, [strategy, lastUpdate]);

  return {
    // Funções principais
    manualRefresh,
    silentRefresh,
    updateActivity,

    // Estado e verificações
    isDataStale,
    isUserActive: appState.isUserActive,
    currentInterval: adaptiveInterval.calculateInterval({
      isAppInBackground: appState.isAppInBackground(),
      isUserIdle: appState.isUserIdle(),
      timeSinceActivity: appState.getTimeSinceLastActivity(),
    }),
  };
};

export default useIntelligentRefresh;