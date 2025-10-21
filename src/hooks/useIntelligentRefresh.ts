import { useCallback, useRef, useEffect } from "react";
import { API_CONFIG } from "../constants";
import useAppState from "./useAppState";
import useRefreshStrategy from "./useRefreshStrategy";
import useAdaptiveInterval from "./useAdaptiveInterval";

interface RefreshOptions {
  silent?: boolean;
  source?: string;
}

interface UseIntelligentRefreshOptions {
  lastUpdate?: Date | null;
  enabled?: boolean;
  interval?: number;
  backgroundInterval?: number;
  staleTime?: number;
  backgroundStaleTime?: number;
}

export const useIntelligentRefresh = (
  refreshCallback: (options?: RefreshOptions) => void,
  options: UseIntelligentRefreshOptions = {}
) => {
  const {
    lastUpdate = null,
    enabled = true,
    interval = API_CONFIG.AUTO_REFRESH,
    backgroundInterval = API_CONFIG.BACKGROUND_REFRESH,
    staleTime = API_CONFIG.STALE_TIME,
    backgroundStaleTime = API_CONFIG.BACKGROUND_STALE_TIME,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const appState = useAppState();
  const strategy = useRefreshStrategy({ staleTime, backgroundStaleTime });

  const updateActivity = appState.updateActivity;

  const executeIntelligentRefresh = useCallback(() => {
    if (!enabled || !refreshCallback) return;

    const refreshStrategy = strategy.getRefreshStrategy({
      isAppInBackground: appState.isAppInBackground(),
      isUserIdle: appState.isUserIdle(),
      lastUpdate,
    });

    if (refreshStrategy.shouldRefresh) {
      refreshCallback({
        silent: refreshStrategy.silent,
        source: refreshStrategy.source,
      });
    }
  }, [enabled, refreshCallback, strategy, appState, lastUpdate]);

  const adaptiveInterval = useAdaptiveInterval(executeIntelligentRefresh, {
    baseInterval: interval,
    backgroundInterval,
    enabled,
    pauseOnBackground: false,
  });

  useEffect(() => {
    const cleanup = appState.onAppStateChange((stateChange) => {
      const { isActive, didBecomeActive, isBackground } = stateChange;

      if (didBecomeActive) {
        updateActivity();

        adaptiveInterval.restartInterval({
          isAppInBackground: false,
          isUserIdle: false,
        });

        if (strategy.shouldRefreshOnForeground(lastUpdate)) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            refreshCallback?.({
              silent: false,
              source: "foreground",
            });
            timeoutRef.current = null;
          }, 500);
        }
      } else if (isBackground) {
        adaptiveInterval.restartInterval({
          isAppInBackground: true,
          isUserIdle: appState.isUserIdle(),
        });
      }
    });

    return () => {
      cleanup();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    appState,
    strategy,
    refreshCallback,
    lastUpdate,
    updateActivity,
    adaptiveInterval,
  ]);

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

  const manualRefresh = useCallback(() => {
    updateActivity();
    return refreshCallback?.({
      silent: false,
      source: "manual",
    });
  }, [refreshCallback, updateActivity]);

  const silentRefresh = useCallback(() => {
    return refreshCallback?.({
      silent: true,
      source: "background",
    });
  }, [refreshCallback]);

  const isDataStale = useCallback(() => {
    return strategy.isDataStale(lastUpdate, "manual");
  }, [strategy, lastUpdate]);

  return {
    manualRefresh,
    silentRefresh,
    updateActivity,

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
