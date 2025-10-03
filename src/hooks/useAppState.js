import { useRef, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { USER_IDLE_THRESHOLD } from '../constants/timing';

/**
 * Hook para gerenciar estado da aplicação e atividade do usuário
 * Responsabilidade única: tracking de estado do app e atividade
 */
export const useAppState = () => {
  const appStateRef = useRef(AppState.currentState);
  const lastActivityRef = useRef(Date.now());
  const isUserActiveRef = useRef(true);

  /**
   * Atualizar timestamp da última atividade do usuário
   */
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isUserActiveRef.current = true;
  }, []);

  /**
   * Verificar se usuário está inativo (sem interação há muito tempo)
   * @param {number} thresholdMs - Tempo em ms para considerar inativo
   * @returns {boolean}
   */
  const isUserIdle = useCallback((thresholdMs = USER_IDLE_THRESHOLD) => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    return timeSinceActivity > thresholdMs;
  }, []);

  /**
   * Verificar se app está em background
   * @returns {boolean}
   */
  const isAppInBackground = useCallback(() => {
    return appStateRef.current !== 'active';
  }, []);

  /**
   * Obter tempo desde última atividade em milissegundos
   * @returns {number}
   */
  const getTimeSinceLastActivity = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  /**
   * Listener para mudanças de estado do app
   * @param {function} callback - Função chamada quando estado muda
   * @returns {function} Função de cleanup
   */
  const onAppStateChange = useCallback((callback) => {
    const handleAppStateChange = (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Atualizar flags baseado no estado
      if (nextAppState === 'active') {
        isUserActiveRef.current = true;
        updateActivity();
      } else {
        isUserActiveRef.current = false;
      }

      // Chamar callback com contexto
      callback({
        current: nextAppState,
        previous: previousState,
        isActive: nextAppState === 'active',
        isBackground: nextAppState === 'background',
        isInactive: nextAppState === 'inactive',
        didBecomeActive: previousState !== 'active' && nextAppState === 'active',
        didGoToBackground: previousState === 'active' && nextAppState === 'background',
      });
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Retornar função de cleanup
    return () => {
      subscription?.remove();
    };
  }, [updateActivity]);

  // Setup listener padrão para manter refs atualizadas
  useEffect(() => {
    const cleanup = onAppStateChange(() => {
      // Listener silencioso apenas para manter refs atualizadas
    });

    return cleanup;
  }, [onAppStateChange]);

  return {
    // Estado atual
    currentState: appStateRef.current,
    isUserActive: isUserActiveRef.current,
    lastActivityTime: lastActivityRef.current,

    // Funções de verificação
    isUserIdle,
    isAppInBackground,
    getTimeSinceLastActivity,

    // Ações
    updateActivity,
    onAppStateChange,
  };
};

export default useAppState;
