import { useRef, useEffect, useCallback } from "react";
import {
  AUTO_REFRESH_INTERVAL,
  BACKGROUND_REFRESH_INTERVAL,
  USER_IDLE_MEDIUM,
  USER_IDLE_LONG,
} from "../constants/timing";

interface AdaptiveIntervalOptions {
  baseInterval?: number;
  backgroundInterval?: number;
  enabled?: boolean;
  pauseOnBackground?: boolean;
}

interface IntervalContext {
  isAppInBackground?: boolean;
  isUserIdle?: boolean;
  timeSinceActivity?: number;
}

interface UseAdaptiveIntervalReturn {
  startInterval: (context?: IntervalContext) => void;
  stopInterval: () => void;
  restartInterval: (context?: IntervalContext) => void;
  executeAndRestart: (context?: IntervalContext) => void;
  isActive: () => boolean;
  calculateInterval: (context?: IntervalContext) => number;
  currentInterval: NodeJS.Timeout | null;
}

export const useAdaptiveInterval = (
  callback: () => void,
  options: AdaptiveIntervalOptions = {}
): UseAdaptiveIntervalReturn => {
  const {
    baseInterval = AUTO_REFRESH_INTERVAL,
    backgroundInterval = BACKGROUND_REFRESH_INTERVAL,
    enabled = true,
    pauseOnBackground = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const calculateInterval = useCallback(
    (context: IntervalContext = {}): number => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        timeSinceActivity = 0,
      } = context;

      if (isAppInBackground && pauseOnBackground) {
        return backgroundInterval;
      }

      if (isUserIdle) {
        if (timeSinceActivity > USER_IDLE_LONG) {
          return baseInterval * 3;
        } else if (timeSinceActivity > USER_IDLE_MEDIUM) {
          return baseInterval * 2;
        }
      }

      return baseInterval;
    },
    [baseInterval, backgroundInterval, pauseOnBackground]
  );

  const clearCurrentInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(
    (context: IntervalContext = {}) => {
      if (!enabled) return;

      clearCurrentInterval();

      const interval = calculateInterval(context);

      if (__DEV__) {
        console.log("[useAdaptiveInterval] Starting interval:", {
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

  const stopInterval = useCallback(() => {
    clearCurrentInterval();
  }, [clearCurrentInterval]);

  const restartInterval = useCallback(
    (context: IntervalContext = {}) => {
      stopInterval();
      startInterval(context);
    },
    [stopInterval, startInterval]
  );

  const isIntervalActive = useCallback((): boolean => {
    return intervalRef.current !== null;
  }, []);

  const executeAndRestart = useCallback(
    (context: IntervalContext = {}) => {
      if (callbackRef.current) {
        callbackRef.current();
      }
      restartInterval(context);
    },
    [restartInterval]
  );

  useEffect(() => {
    return () => {
      clearCurrentInterval();
    };
  }, [clearCurrentInterval]);

  return {
    startInterval,
    stopInterval,
    restartInterval,
    executeAndRestart,
    isActive: isIntervalActive,
    calculateInterval,
    currentInterval: intervalRef.current,
  };
};

interface UseSimpleIntervalReturn {
  clear: () => void;
}

export const useSimpleInterval = (
  callback: () => void,
  interval: number,
  enabled: boolean = true
): UseSimpleIntervalReturn => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
