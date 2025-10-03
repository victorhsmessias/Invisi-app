/**
 * Constantes de timing centralizadas
 * Todos os valores de tempo em milissegundos
 */

// ============================================
// CACHE E VALIDADE DE DADOS
// ============================================

/**
 * Tempo de cache padrão para dados gerais
 */
export const CACHE_TIME = 2 * 60 * 1000; // 2 minutos

/**
 * Tempo de cache para fallbacks (menor que dados reais)
 */
export const FALLBACK_CACHE_TIME = 1 * 60 * 1000; // 1 minuto

/**
 * Tempo de cache para filtros
 */
export const FILTERS_CACHE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Tempo para dados ficarem "stale" em modo ativo
 */
export const STALE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Tempo para dados ficarem "stale" em background
 */
export const BACKGROUND_STALE_TIME = 10 * 60 * 1000; // 10 minutos

// ============================================
// INTERVALOS DE REFRESH
// ============================================

/**
 * Intervalo de auto-refresh padrão
 */
export const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 segundos

/**
 * Intervalo de refresh em background
 */
export const BACKGROUND_REFRESH_INTERVAL = 45 * 1000; // 45 segundos

/**
 * Intervalo de refresh para tela de detalhes de contratos
 */
export const CONTRATOS_REFRESH_INTERVAL = 45 * 1000; // 45 segundos

/**
 * Intervalo de refresh para monitor de corte
 */
export const MONITOR_CORTE_REFRESH_INTERVAL = 30 * 1000; // 30 segundos

// ============================================
// DELAYS E DEBOUNCE
// ============================================

/**
 * Delay curto para indicadores de loading
 */
export const SHORT_DELAY = 1500; // 1.5 segundos

/**
 * Delay médio para precarregamento
 */
export const MEDIUM_DELAY = 2000; // 2 segundos

/**
 * Delay longo para operações pesadas
 */
export const LONG_DELAY = 3000; // 3 segundos

/**
 * Delay para retry de requisições
 */
export const RETRY_DELAY = 1000; // 1 segundo

// ============================================
// TIMEOUTS
// ============================================

/**
 * Timeout padrão para requisições HTTP
 */
export const REQUEST_TIMEOUT = 10000; // 10 segundos

/**
 * Timeout para login
 */
export const LOGIN_TIMEOUT = 10000; // 10 segundos

/**
 * Timeout para auto-hide de componentes
 */
export const AUTO_HIDE_DURATION = 3000; // 3 segundos

/**
 * Timeout customizado para auto-hide curto
 */
export const AUTO_HIDE_SHORT = 2000; // 2 segundos

// ============================================
// INATIVIDADE DO USUÁRIO
// ============================================

/**
 * Tempo para considerar usuário inativo
 */
export const USER_IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutos

/**
 * Tempo para considerar usuário muito inativo (5 minutos)
 */
export const USER_IDLE_MEDIUM = 5 * 60 * 1000; // 5 minutos

/**
 * Tempo para considerar usuário completamente inativo (10 minutos)
 */
export const USER_IDLE_LONG = 10 * 60 * 1000; // 10 minutos

// ============================================
// VERIFICAÇÕES E MONITORAMENTO
// ============================================

/**
 * Intervalo para verificações periódicas
 */
export const CHECK_INTERVAL = 60 * 1000; // 1 minuto

/**
 * Intervalo para limpeza de rate limiter
 */
export const RATE_LIMITER_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutos

/**
 * Tempo de timeout para verificação de estabilidade
 */
export const STABILITY_CHECK_TIMEOUT = 15 * 1000; // 15 segundos

// ============================================
// RATE LIMITING E AUTENTICAÇÃO
// ============================================

/**
 * Janela de tempo para rate limiting
 */
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos

/**
 * Tempo de lockout após exceder rate limit
 */
export const RATE_LIMIT_LOCKOUT = 30 * 60 * 1000; // 30 minutos

// ============================================
// NAVEGAÇÃO E RETORNO
// ============================================

/**
 * Tempo para considerar retorno rápido à tela
 */
export const QUICK_RETURN_THRESHOLD = 30 * 1000; // 30 segundos

/**
 * Tempo para considerar navegação curta
 */
export const SHORT_NAVIGATION_THRESHOLD = 2 * 60 * 1000; // 2 minutos

/**
 * Tempo para considerar dados frescos após retorno rápido
 */
export const QUICK_RETURN_STALE_TIME = 5 * 60 * 1000; // 5 minutos

/**
 * Tempo para considerar dados frescos após navegação curta
 */
export const SHORT_NAVIGATION_STALE_TIME = 10 * 60 * 1000; // 10 minutos

// ============================================
// ANIMAÇÕES
// ============================================

/**
 * Duração padrão de animações
 */
export const ANIMATION_DURATION = 1000; // 1 segundo

/**
 * Duração de animação curta
 */
export const ANIMATION_SHORT = 300; // 300ms

/**
 * Duração de animação longa
 */
export const ANIMATION_LONG = 1500; // 1.5 segundos

// ============================================
// HELPERS DE CONVERSÃO
// ============================================

/**
 * Converter segundos para milissegundos
 */
export const secondsToMs = (seconds: number): number => seconds * 1000;

/**
 * Converter minutos para milissegundos
 */
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;

/**
 * Converter horas para milissegundos
 */
export const hoursToMs = (hours: number): number => hours * 60 * 60 * 1000;

/**
 * Converter milissegundos para segundos
 */
export const msToSeconds = (ms: number): number => Math.floor(ms / 1000);

/**
 * Converter milissegundos para minutos
 */
export const msToMinutes = (ms: number): number => Math.floor(ms / (60 * 1000));

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  // Cache
  CACHE_TIME,
  FALLBACK_CACHE_TIME,
  FILTERS_CACHE_TIME,
  STALE_TIME,
  BACKGROUND_STALE_TIME,

  // Refresh
  AUTO_REFRESH_INTERVAL,
  BACKGROUND_REFRESH_INTERVAL,
  CONTRATOS_REFRESH_INTERVAL,
  MONITOR_CORTE_REFRESH_INTERVAL,

  // Delays
  SHORT_DELAY,
  MEDIUM_DELAY,
  LONG_DELAY,
  RETRY_DELAY,

  // Timeouts
  REQUEST_TIMEOUT,
  LOGIN_TIMEOUT,
  AUTO_HIDE_DURATION,
  AUTO_HIDE_SHORT,

  // Inatividade
  USER_IDLE_THRESHOLD,
  USER_IDLE_MEDIUM,
  USER_IDLE_LONG,

  // Verificações
  CHECK_INTERVAL,
  RATE_LIMITER_CLEANUP_INTERVAL,
  STABILITY_CHECK_TIMEOUT,

  // Rate Limiting
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_LOCKOUT,

  // Navegação
  QUICK_RETURN_THRESHOLD,
  SHORT_NAVIGATION_THRESHOLD,
  QUICK_RETURN_STALE_TIME,
  SHORT_NAVIGATION_STALE_TIME,

  // Animações
  ANIMATION_DURATION,
  ANIMATION_SHORT,
  ANIMATION_LONG,

  // Helpers
  secondsToMs,
  minutesToMs,
  hoursToMs,
  msToSeconds,
  msToMinutes,
};
