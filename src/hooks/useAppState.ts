import { useRef, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { USER_IDLE_THRESHOLD } from "../constants/timing";

interface AppStateChangeContext {
  current: AppStateStatus;
  previous: AppStateStatus;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
  didBecomeActive: boolean;
  didGoToBackground: boolean;
}

interface UseAppStateReturn {
  currentState: AppStateStatus;
  isUserActive: boolean;
  lastActivityTime: number;
  isUserIdle: (thresholdMs?: number) => boolean;
  isAppInBackground: () => boolean;
  getTimeSinceLastActivity: () => number;
  updateActivity: () => void;
  onAppStateChange: (
    callback: (context: AppStateChangeContext) => void
  ) => () => void;
}

export const useAppState = (): UseAppStateReturn => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActivityRef = useRef<number>(Date.now());
  const isUserActiveRef = useRef<boolean>(true);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isUserActiveRef.current = true;
  }, []);

  const isUserIdle = useCallback(
    (thresholdMs: number = USER_IDLE_THRESHOLD): boolean => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      return timeSinceActivity > thresholdMs;
    },
    []
  );

  const isAppInBackground = useCallback((): boolean => {
    return appStateRef.current !== "active";
  }, []);

  const getTimeSinceLastActivity = useCallback((): number => {
    return Date.now() - lastActivityRef.current;
  }, []);

  const onAppStateChange = useCallback(
    (callback: (context: AppStateChangeContext) => void) => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        const previousState = appStateRef.current;
        appStateRef.current = nextAppState;

        if (nextAppState === "active") {
          isUserActiveRef.current = true;
          updateActivity();
        } else {
          isUserActiveRef.current = false;
        }

        callback({
          current: nextAppState,
          previous: previousState,
          isActive: nextAppState === "active",
          isBackground: nextAppState === "background",
          isInactive: nextAppState === "inactive",
          didBecomeActive:
            previousState !== "active" && nextAppState === "active",
          didGoToBackground:
            previousState === "active" && nextAppState === "background",
        });
      };

      const subscription = AppState.addEventListener(
        "change",
        handleAppStateChange
      );

      return () => {
        subscription?.remove();
      };
    },
    [updateActivity]
  );

  useEffect(() => {
    const cleanup = onAppStateChange(() => {});

    return cleanup;
  }, [onAppStateChange]);

  return {
    currentState: appStateRef.current,
    isUserActive: isUserActiveRef.current,
    lastActivityTime: lastActivityRef.current,
    isUserIdle,
    isAppInBackground,
    getTimeSinceLastActivity,
    updateActivity,
    onAppStateChange,
  };
};

export default useAppState;
