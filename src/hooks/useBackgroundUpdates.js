import { useState, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar atualizações em background sem interferir na UX
 */
export const useBackgroundUpdates = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const updateTimeoutRef = useRef(null);

  // Iniciar update em background
  const startBackgroundUpdate = useCallback(() => {
    setIsUpdating(true);
    setUpdateCount(prev => prev + 1);

    // Limpar timeout anterior se existir
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  }, []);

  // Finalizar update em background
  const finishBackgroundUpdate = useCallback(() => {
    setLastUpdateTime(new Date());

    // Mostrar indicador por um tempo mínimo para feedback visual
    updateTimeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
    }, 1500);
  }, []);

  // Cancelar update em andamento
  const cancelBackgroundUpdate = useCallback(() => {
    setIsUpdating(false);
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  // Verificar se deve mostrar indicador discreto
  const shouldShowIndicator = useCallback(() => {
    return isUpdating && updateCount > 1; // Só mostrar após primeira atualização
  }, [isUpdating, updateCount]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  }, []);

  return {
    isUpdating,
    lastUpdateTime,
    updateCount,
    startBackgroundUpdate,
    finishBackgroundUpdate,
    cancelBackgroundUpdate,
    shouldShowIndicator,
    cleanup,
  };
};

export default useBackgroundUpdates;