import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  NO_TOKEN_RECEIVED: "NO_TOKEN_RECEIVED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT: "INVALID_INPUT",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export class AuthenticationError extends Error {
  code: AuthErrorCode;
  details: Record<string, any>;
  timestamp: string;

  constructor(
    message: string,
    code: AuthErrorCode,
    details: Record<string, any> = {}
  ) {
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

class LoginRateLimiter {
  private attempts: Map<string, number[]>;
  private maxAttempts: number;
  private windowMs: number;
  private lockoutMs: number;

  constructor() {
    this.attempts = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000;
    this.lockoutMs = 30 * 60 * 1000;
  }

  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const key = identifier.toLowerCase();

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const userAttempts = this.attempts.get(key)!;
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    this.attempts.set(key, recentAttempts);

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

setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

interface SanitizedCredentials {
  username: string;
  password: string;
}

export const validateAndSanitizeCredentials = (
  username: string,
  password: string
): SanitizedCredentials => {
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

  const sanitizedUsername = username.trim().substring(0, 50).toUpperCase();
  const sanitizedPassword = password.trim().substring(0, 100).toUpperCase();

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

export const validateLoginResponse = (
  response: Response,
  responseText: string
): boolean => {
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

  if (!responseText || responseText.trim().length === 0) {
    throw new AuthenticationError(
      "Resposta vazia do servidor",
      AUTH_ERROR_CODES.INVALID_RESPONSE
    );
  }

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

export const extractToken = (
  response: Response,
  responseText: string
): string => {
  const headerToken =
    response.headers.get("authorization")?.replace("Bearer ", "") ||
    response.headers.get("x-auth-token") ||
    response.headers.get("token") ||
    response.headers.get("x-access-token");

  if (headerToken && validateToken(headerToken)) {
    return headerToken;
  }

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
  }

  throw new AuthenticationError(
    "Token de autenticação não recebido do servidor",
    AUTH_ERROR_CODES.NO_TOKEN_RECEIVED,
    { hasResponseText: !!responseText }
  );
};

export const validateToken = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  if (token.length < 10) {
    return false;
  }

  if (token.trim().length === 0) {
    return false;
  }

  if (token.startsWith("success_")) {
    return false;
  }

  return true;
};

export const saveAuthData = async (
  token: string,
  username: string
): Promise<boolean> => {
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

export const isTokenValid = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    return validateToken(token);
  } catch (error) {
    return false;
  }
};
