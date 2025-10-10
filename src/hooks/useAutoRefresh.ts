import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { API_CONFIG } from "../constants";
import {
  USER_IDLE_MEDIUM,
  USER_IDLE_LONG,
  CHECK_INTERVAL,
} from "../constants/timing";

export const useAutoRefresh = (refreshCallback, options = {}) => {
  const {
    interval = API_CONFIG.AUTO_REFRESH,
    enabled = true,
    pauseOnBackground = true,
    adaptiveInterval = true,
  } = options;

  const intervalRef = useRef(null);
  const adaptiveCheckIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);

  const getAdaptiveInterval = useCallback(() => {
    if (!adaptiveInterval) return interval;

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;

    if (timeSinceLastActivity > USER_IDLE_LONG) {
      return interval * 3;
    } else if (timeSinceLastActivity > USER_IDLE_MEDIUM) {
      return interval * 2;
    }
    return interval;
  }, [interval, adaptiveInterval]);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (!enabled || !isActiveRef.current) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const currentInterval = getAdaptiveInterval();

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && refreshCallback) {
        refreshCallback({ silent: true, source: "background" });
      }
    }, currentInterval);
  }, [enabled, refreshCallback, getAdaptiveInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    if (enabled && isActiveRef.current) {
      startAutoRefresh();
    }
  }, [stopAutoRefresh, startAutoRefresh, enabled]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (pauseOnBackground) {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          isActiveRef.current = true;
          updateActivity();
          startAutoRefresh();

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          if (refreshCallback) {
            timeoutRef.current = setTimeout(() => {
              refreshCallback({ silent: true, source: "background" });
              timeoutRef.current = null;
            }, 500);
          }
        } else if (nextAppState.match(/inactive|background/)) {
          isActiveRef.current = false;
          stopAutoRefresh();
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    pauseOnBackground,
    refreshCallback,
    startAutoRefresh,
    stopAutoRefresh,
    updateActivity,
  ]);

  useEffect(() => {
    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [enabled, startAutoRefresh, stopAutoRefresh]);

  useEffect(() => {
    if (adaptiveInterval) {
      adaptiveCheckIntervalRef.current = setInterval(() => {
        if (isActiveRef.current) {
          resetAutoRefresh();
        }
      }, CHECK_INTERVAL);

      return () => {
        if (adaptiveCheckIntervalRef.current) {
          clearInterval(adaptiveCheckIntervalRef.current);
          adaptiveCheckIntervalRef.current = null;
        }
      };
    }
  }, [adaptiveInterval, resetAutoRefresh]);

  return {
    startAutoRefresh,
    stopAutoRefresh,
    resetAutoRefresh,
    updateActivity,
    isActive: isActiveRef.current,
    currentInterval: getAdaptiveInterval(),
  };
};

export default useAutoRefresh;
