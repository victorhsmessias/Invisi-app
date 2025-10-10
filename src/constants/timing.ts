export const CACHE_TIME = 2 * 60 * 1000;
export const FALLBACK_CACHE_TIME = 1 * 60 * 1000;
export const FILTERS_CACHE_TIME = 5 * 60 * 1000;
export const STALE_TIME = 5 * 60 * 1000;
export const BACKGROUND_STALE_TIME = 10 * 60 * 1000;

export const AUTO_REFRESH_INTERVAL = 30 * 1000;
export const BACKGROUND_REFRESH_INTERVAL = 45 * 1000;
export const CONTRATOS_REFRESH_INTERVAL = 45 * 1000;
export const MONITOR_CORTE_REFRESH_INTERVAL = 30 * 1000;

export const SHORT_DELAY = 1500;
export const MEDIUM_DELAY = 2000;
export const LONG_DELAY = 3000;
export const RETRY_DELAY = 1000;

export const REQUEST_TIMEOUT = 10000;
export const LOGIN_TIMEOUT = 10000;
export const AUTO_HIDE_DURATION = 3000;
export const AUTO_HIDE_SHORT = 2000;

export const USER_IDLE_THRESHOLD = 2 * 60 * 1000;
export const USER_IDLE_MEDIUM = 5 * 60 * 1000;
export const USER_IDLE_LONG = 10 * 60 * 1000;

export const CHECK_INTERVAL = 60 * 1000;
export const RATE_LIMITER_CLEANUP_INTERVAL = 5 * 60 * 1000;
export const STABILITY_CHECK_TIMEOUT = 15 * 1000;

export const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
export const RATE_LIMIT_LOCKOUT = 30 * 60 * 1000;

export const QUICK_RETURN_THRESHOLD = 30 * 1000;
export const SHORT_NAVIGATION_THRESHOLD = 2 * 60 * 1000;
export const QUICK_RETURN_STALE_TIME = 5 * 60 * 1000;
export const SHORT_NAVIGATION_STALE_TIME = 10 * 60 * 1000;

export const ANIMATION_DURATION = 1000;
export const ANIMATION_SHORT = 300;
export const ANIMATION_LONG = 1500;

export const secondsToMs = (seconds: number): number => seconds * 1000;
export const minutesToMs = (minutes: number): number => minutes * 60 * 1000;
export const hoursToMs = (hours: number): number => hours * 60 * 60 * 1000;
export const msToSeconds = (ms: number): number => Math.floor(ms / 1000);
export const msToMinutes = (ms: number): number => Math.floor(ms / (60 * 1000));

export default {
  CACHE_TIME,
  FALLBACK_CACHE_TIME,
  FILTERS_CACHE_TIME,
  STALE_TIME,
  BACKGROUND_STALE_TIME,
  AUTO_REFRESH_INTERVAL,
  BACKGROUND_REFRESH_INTERVAL,
  CONTRATOS_REFRESH_INTERVAL,
  MONITOR_CORTE_REFRESH_INTERVAL,
  SHORT_DELAY,
  MEDIUM_DELAY,
  LONG_DELAY,
  RETRY_DELAY,
  REQUEST_TIMEOUT,
  LOGIN_TIMEOUT,
  AUTO_HIDE_DURATION,
  AUTO_HIDE_SHORT,
  USER_IDLE_THRESHOLD,
  USER_IDLE_MEDIUM,
  USER_IDLE_LONG,
  CHECK_INTERVAL,
  RATE_LIMITER_CLEANUP_INTERVAL,
  STABILITY_CHECK_TIMEOUT,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_LOCKOUT,
  QUICK_RETURN_THRESHOLD,
  SHORT_NAVIGATION_THRESHOLD,
  QUICK_RETURN_STALE_TIME,
  SHORT_NAVIGATION_STALE_TIME,
  ANIMATION_DURATION,
  ANIMATION_SHORT,
  ANIMATION_LONG,
  secondsToMs,
  minutesToMs,
  hoursToMs,
  msToSeconds,
  msToMinutes,
};
