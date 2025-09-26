import { useState, useCallback, useRef } from "react";

/**
 * Hook para gerenciar carregamento inteligente
 * Diferencia carregamento inicial, refresh manual e refresh automático
 */
export const useSmartLoading = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  // Para carregamento inicial (primeira vez)
  const startInitialLoading = useCallback(() => {
    if (!hasLoadedOnce.current) {
      setIsInitialLoading(true);
      setError(null);
    }
  }, []);

  // Para refresh manual (pull-to-refresh)
  const startManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);
  }, []);

  // Para carregamento em background (auto-refresh, filtros, etc.)
  const startBackgroundLoading = useCallback(() => {
    if (hasLoadedOnce.current) {
      setIsBackgroundLoading(true);
      setError(null);
    } else {
      // Se nunca carregou, usar carregamento inicial
      setIsInitialLoading(true);
      setError(null);
    }
  }, []);

  // Finalizar qualquer tipo de carregamento
  const finishLoading = useCallback((errorMessage = null, loadingType = null) => {
    // Só resetar o tipo específico de loading se fornecido
    if (loadingType === 'initial' || !loadingType) {
      setIsInitialLoading(false);
    }
    if (loadingType === 'background' || !loadingType) {
      setIsBackgroundLoading(false);
    }
    if (loadingType === 'refresh' || !loadingType) {
      setIsRefreshing(false);
    }

    setError(errorMessage);
    hasLoadedOnce.current = true;
  }, []);

  // Resetar estado (para logout, mudança de filial, etc.)
  const resetLoading = useCallback(() => {
    setIsInitialLoading(false);
    setIsBackgroundLoading(false);
    setIsRefreshing(false);
    setError(null);
    hasLoadedOnce.current = false;
  }, []);

  return {
    // Estados
    isInitialLoading,      // Mostra spinner fullscreen na primeira carga
    isBackgroundLoading,   // Mostra indicador discreto no header
    isRefreshing,          // Para RefreshControl
    error,
    hasLoadedOnce: hasLoadedOnce.current,

    // Métodos
    startInitialLoading,
    startManualRefresh,
    startBackgroundLoading,
    finishLoading,
    resetLoading,

    // Estados combinados para facilitar uso
    isAnyLoading: isInitialLoading || isBackgroundLoading || isRefreshing,
    showFullscreenLoader: isInitialLoading,
    showBackgroundIndicator: isBackgroundLoading,
  };
};

export default useSmartLoading;