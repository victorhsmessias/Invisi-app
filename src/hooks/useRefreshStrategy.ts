import { useCallback } from "react";
import { STALE_TIME, BACKGROUND_STALE_TIME } from "../constants/timing";

interface UseRefreshStrategyOptions {
  staleTime?: number;
  backgroundStaleTime?: number;
}

interface RefreshContext {
  isAppInBackground?: boolean;
  isUserIdle?: boolean;
  lastUpdate?: Date | string | number | null;
  forceRefresh?: boolean;
}

export const useRefreshStrategy = (options: UseRefreshStrategyOptions = {}) => {
  const {
    staleTime = STALE_TIME,
    backgroundStaleTime = BACKGROUND_STALE_TIME,
  } = options;

  const isDataStale = useCallback(
    (lastUpdate: Date | string | number | null | undefined, source = "manual") => {
      if (!lastUpdate) return true;

      const now = Date.now();
      let updateTime;

      if (typeof lastUpdate === "string") {
        updateTime = new Date(lastUpdate).getTime();
      } else if (lastUpdate instanceof Date) {
        updateTime = lastUpdate.getTime();
      } else if (typeof lastUpdate === "number") {
        updateTime = lastUpdate;
      } else {
        return true;
      }

      const ageMs = now - updateTime;
      const threshold =
        source === "background" ? backgroundStaleTime : staleTime;

      return ageMs > threshold;
    },
    [staleTime, backgroundStaleTime]
  );

  const getDataAge = useCallback((lastUpdate: Date | string | number | null | undefined) => {
    if (!lastUpdate) return null;

    const now = Date.now();
    let updateTime;

    if (typeof lastUpdate === "string") {
      updateTime = new Date(lastUpdate).getTime();
    } else if (lastUpdate instanceof Date) {
      updateTime = lastUpdate.getTime();
    } else if (typeof lastUpdate === "number") {
      updateTime = lastUpdate;
    } else {
      return null;
    }

    return now - updateTime;
  }, []);

  const getRefreshStrategy = useCallback(
    (context: RefreshContext = {}) => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        lastUpdate = null,
        forceRefresh = false,
      } = context;

      if (forceRefresh) {
        return {
          shouldRefresh: true,
          silent: false,
          source: "manual",
          reason: "force_refresh",
        };
      }

      if (isAppInBackground) {
        const shouldRefresh = isDataStale(lastUpdate, "background");
        return {
          shouldRefresh,
          silent: true,
          source: "background",
          reason: shouldRefresh ? "background_stale" : "background_fresh",
        };
      }

      if (isUserIdle) {
        const shouldRefresh = isDataStale(lastUpdate, "background");
        return {
          shouldRefresh,
          silent: true,
          source: "background",
          reason: shouldRefresh ? "idle_stale" : "idle_fresh",
        };
      }

      if (isDataStale(lastUpdate, "manual")) {
        return {
          shouldRefresh: true,
          silent: false,
          source: "manual",
          reason: "active_stale",
        };
      }

      if (isDataStale(lastUpdate, "background")) {
        return {
          shouldRefresh: true,
          silent: true,
          source: "background",
          reason: "active_slightly_stale",
        };
      }

      return {
        shouldRefresh: false,
        silent: true,
        source: "skip",
        reason: "data_fresh",
      };
    },
    [isDataStale]
  );

  const getOptimisticStrategy = useCallback(
    (context: RefreshContext = {}) => {
      const {
        isAppInBackground = false,
        isUserIdle = false,
        lastUpdate = null,
      } = context;

      const silent =
        isAppInBackground || isUserIdle || !isDataStale(lastUpdate, "manual");

      return {
        shouldRefresh: true,
        silent,
        source: silent ? "background" : "manual",
        reason: "optimistic",
      };
    },
    [isDataStale]
  );

  const getConservativeStrategy = useCallback(
    (context: RefreshContext = {}) => {
      const { lastUpdate = null, forceRefresh = false } = context;

      if (forceRefresh) {
        return {
          shouldRefresh: true,
          silent: false,
          source: "manual",
          reason: "force_refresh",
        };
      }

      const shouldRefresh = isDataStale(lastUpdate, "background");

      return {
        shouldRefresh,
        silent: true,
        source: "background",
        reason: shouldRefresh ? "conservative_stale" : "conservative_fresh",
      };
    },
    [isDataStale]
  );

  const shouldRefreshOnForeground = useCallback(
    (lastUpdate: Date | string | number | null | undefined) => {
      return isDataStale(lastUpdate, "manual");
    },
    [isDataStale]
  );

  return {
    isDataStale,
    getDataAge,
    shouldRefreshOnForeground,

    getRefreshStrategy,
    getOptimisticStrategy,
    getConservativeStrategy,

    staleTime,
    backgroundStaleTime,
  };
};

export default useRefreshStrategy;
