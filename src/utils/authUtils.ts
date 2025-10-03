import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";

/**
 * Códigos de erro de autenticação
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  NO_TOKEN_RECEIVED: "NO_TOKEN_RECEIVED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT: "INVALID_INPUT",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

/**
 * Classe de erro customizada para autenticação
 */
export class AuthenticationError extends Error {
  code: AuthErrorCode;
  details: Record<string, any>;
  timestamp: string;

  constructor(message: string, code: AuthErrorCode, details: Record<string, any> = {}) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Rate limiter para tentativas de login
 */
class LoginRateLimiter {
  private attempts: Map<string, number[]>;
  private maxAttempts: number;
  private windowMs: number;
  private lockoutMs: number;

  constructor() {
    this.attempts = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000; // 15 minutos
    this.lockoutMs = 30 * 60 * 1000; // 30 minutos de bloqueio
  }

  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = identifier.toLowerCase();

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const userAttempts = this.attempts.get(key)!;

    // Remover tentativas antigas
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    this.attempts.set(key, recentAttempts);

    // Verificar se está em lockout
    if (recentAttempts.length > 0) {
      const lastAttempt = Math.max(...recentAttempts);
      if (
        recentAttempts.length >= this.maxAttempts &&
        now - lastAttempt < this.lockoutMs
      ) {
        const remainingTime = Math.ceil(
          (this.lockoutMs - (now - lastAttempt)) / 1000 / 60
        );
        throw new AuthenticationError(
          `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
          AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          { remainingMinutes: remainingTime }
        );
      }
    }

    // Registrar nova tentativa
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return {
      allowed: true,
      remaining: this.maxAttempts - recentAttempts.length,
    };
  }

  resetAttempts(identifier: string): void {
    const key = identifier.toLowerCase();
    this.attempts.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }
  }
}

export const rateLimiter = new LoginRateLimiter();

// Cleanup periódico do rate limiter
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000); // A cada 5 minutos

interface SanitizedCredentials {
  username: string;
  password: string;
}

/**
 * Valida e sanitiza credenciais de entrada
 */
export const validateAndSanitizeCredentials = (
  username: string,
  password: string
): SanitizedCredentials => {
  // Validar comprimento
  if (!username || username.trim().length === 0) {
    throw new AuthenticationError(
      "Nome de usuário não pode estar vazio",
      AUTH_ERROR_CODES.INVALID_INPUT
    );
  }

  if (!password || password.trim().length === 0) {
    throw new AuthenticationError(
      "Senha não pode estar vazia",
      AUTH_ERROR_CODES.INVALID_INPUT
    );
  }

  if (username.trim().length < 3) {
    throw new AuthenticationError(
      "Nome de usuário muito curto (mínimo 3 caracteres)",
      AUTH_ERROR_CODES.INVALID_INPUT
    );
  }

  if (password.trim().length < 4) {
    throw new AuthenticationError(
      "Senha muito curta (mínimo 4 caracteres)",
      AUTH_ERROR_CODES.INVALID_INPUT
    );
  }

  // Remover espaços e limitar tamanho
  const sanitizedUsername = username.trim().substring(0, 50).toUpperCase();
  const sanitizedPassword = password.trim().substring(0, 100).toUpperCase();

  // Validar caracteres especiais perigosos
  const dangerousPattern = /[<>;"'`\\]/;
  if (dangerousPattern.test(sanitizedUsername)) {
    throw new AuthenticationError(
      "Nome de usuário contém caracteres inválidos",
      AUTH_ERROR_CODES.INVALID_INPUT
    );
  }

  return {
    username: sanitizedUsername,
    password: sanitizedPassword,
  };
};

/**
 * Valida resposta da API de login
 */
export const validateLoginResponse = (response: Response, responseText: string): boolean => {
  // Verificar status HTTP
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError(
        "Credenciais inválidas",
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        { status: response.status }
      );
    }

    if (response.status >= 500) {
      throw new AuthenticationError(
        "Erro no servidor. Tente novamente mais tarde.",
        AUTH_ERROR_CODES.SERVER_ERROR,
        { status: response.status }
      );
    }

    throw new AuthenticationError(
      "Erro na autenticação",
      AUTH_ERROR_CODES.NETWORK_ERROR,
      { status: response.status }
    );
  }

  // Validar conteúdo da resposta
  if (!responseText || responseText.trim().length === 0) {
    throw new AuthenticationError(
      "Resposta vazia do servidor",
      AUTH_ERROR_CODES.INVALID_RESPONSE
    );
  }

  // Verificar mensagens de erro conhecidas
  const lowerText = responseText.toLowerCase();
  const errorPatterns = [
    "failed",
    "invalid",
    "error",
    "denied",
    "unauthorized",
    "forbidden",
    "incorrect",
  ];

  if (errorPatterns.some((pattern) => lowerText.includes(pattern))) {
    throw new AuthenticationError(
      "Credenciais inválidas",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
  }

  return true;
};

/**
 * Extrai token da resposta de forma segura
 */
export const extractToken = (response: Response, responseText: string): string => {
  // Tentar extrair dos headers primeiro (mais seguro)
  const headerToken =
    response.headers.get("authorization")?.replace("Bearer ", "") ||
    response.headers.get("x-auth-token") ||
    response.headers.get("token") ||
    response.headers.get("x-access-token");

  if (headerToken && validateToken(headerToken)) {
    return headerToken;
  }

  // Tentar parse do JSON
  try {
    const data = JSON.parse(responseText);

    const bodyToken =
      data.token ||
      data.jwt ||
      data.access_token ||
      data.accessToken ||
      data.authToken ||
      data.auth_token;

    if (bodyToken && validateToken(bodyToken)) {
      return bodyToken;
    }
  } catch (parseError) {
    if (__DEV__) {
      console.warn("[authUtils] Falha ao parsear resposta JSON:", parseError);
    }
  }

  // Se chegou aqui sem token válido, lançar erro
  throw new AuthenticationError(
    "Token de autenticação não recebido do servidor",
    AUTH_ERROR_CODES.NO_TOKEN_RECEIVED,
    { hasResponseText: !!responseText }
  );
};

/**
 * Valida formato e conteúdo do token
 */
export const validateToken = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Token não pode ser muito curto
  if (token.length < 10) {
    return false;
  }

  // Token não pode ser apenas espaços
  if (token.trim().length === 0) {
    return false;
  }

  // Não aceitar tokens gerados artificialmente
  if (token.startsWith("success_")) {
    return false;
  }

  return true;
};

/**
 * Salva credenciais de forma segura
 */
export const saveAuthData = async (token: string, username: string): Promise<boolean> => {
  try {
    if (!validateToken(token)) {
      throw new AuthenticationError(
        "Token inválido para salvamento",
        AUTH_ERROR_CODES.INVALID_RESPONSE
      );
    }

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USER_TOKEN, token],
      [STORAGE_KEYS.USERNAME, username],
    ]);

    return true;
  } catch (error) {
    console.error("[authUtils] Erro ao salvar dados de autenticação:", error);
    throw error;
  }
};

/**
 * Remove credenciais salvas
 */
export const clearAuthData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USERNAME,
    ]);
    return true;
  } catch (error) {
    console.error("[authUtils] Erro ao limpar dados de autenticação:", error);
    throw error;
  }
};

/**
 * Verifica se o token ainda é válido (básico)
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    return validateToken(token);
  } catch (error) {
    return false;
  }
};
