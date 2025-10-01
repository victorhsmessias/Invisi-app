import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { API_CONFIG } from "../constants";
import { USER_IDLE_MEDIUM, USER_IDLE_LONG, CHECK_INTERVAL } from "../constants/timing";

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

  // Calcular intervalo adaptativo baseado na atividade do usuário
  const getAdaptiveInterval = useCallback(() => {
    if (!adaptiveInterval) return interval;

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;

    // Se usuário inativo por mais de 10 min, refresh mais lento
    if (timeSinceLastActivity > USER_IDLE_LONG) {
      return interval * 3; // 3x mais lento
    }
    // Se usuário inativo por mais de 5 min, refresh um pouco mais lento
    else if (timeSinceLastActivity > USER_IDLE_MEDIUM) {
      return interval * 2; // 2x mais lento
    }
    // Usuário ativo, usar intervalo normal
    return interval;
  }, [interval, adaptiveInterval]);

  // Atualizar atividade do usuário
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Iniciar auto-refresh
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

  // Parar auto-refresh
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

  // Resetar auto-refresh (útil quando muda intervalo adaptativo)
  const resetAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    if (enabled && isActiveRef.current) {
      startAutoRefresh();
    }
  }, [stopAutoRefresh, startAutoRefresh, enabled]);

  // Handle mudanças de estado da app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (pauseOnBackground) {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App voltou ao foreground
          isActiveRef.current = true;
          updateActivity();
          startAutoRefresh();

          // Limpar timeout anterior se existir
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Fazer refresh imediato quando voltar - mas silencioso
          if (refreshCallback) {
            timeoutRef.current = setTimeout(() => {
              refreshCallback({ silent: true, source: "background" });
              timeoutRef.current = null;
            }, 500);
          }
        } else if (nextAppState.match(/inactive|background/)) {
          // App foi para background
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

      // Limpar timeout ao desmontar
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

  // Inicializar auto-refresh
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

  // Resetar quando intervalo adaptativo deve mudar
  useEffect(() => {
    if (adaptiveInterval) {
      // Verificar periodicamente se deve ajustar o intervalo
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
    updateActivity, // Chamar isso em interações do usuário
    isActive: isActiveRef.current,
    currentInterval: getAdaptiveInterval(),
  };
};

export default useAutoRefresh;
