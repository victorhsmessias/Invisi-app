import { Alert } from "react-native";
import type { ErrorType, ErrorInfo } from '../types';

export const ErrorTypes: Record<ErrorType, ErrorType> = {
  NETWORK: "NETWORK",
  AUTHENTICATION: "AUTHENTICATION",
  VALIDATION: "VALIDATION",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
};

export const getErrorType = (error: Error | any): ErrorType => {
  if (!error) return ErrorTypes.UNKNOWN;

  const message = error.message?.toLowerCase() || "";

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  ) {
    return ErrorTypes.NETWORK;
  }

  if (
    message.includes("credenciais") ||
    message.includes("authentication") ||
    message.includes("unauthorized") ||
    message.includes("token")
  ) {
    return ErrorTypes.AUTHENTICATION;
  }

  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return ErrorTypes.VALIDATION;
  }

  if (
    message.includes("server") ||
    message.includes("500") ||
    message.includes("503") ||
    message.includes("502")
  ) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
};

export const getErrorMessage = (error: Error | any): string => {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ErrorTypes.NETWORK:
      return "Erro de conexão. Verifique sua internet e tente novamente.";

    case ErrorTypes.AUTHENTICATION:
      return "Erro de autenticação. Verifique suas credenciais.";

    case ErrorTypes.VALIDATION:
      return error.message || "Dados inválidos. Verifique as informações inseridas.";

    case ErrorTypes.SERVER:
      return "Erro no servidor. Tente novamente em alguns instantes.";

    default:
      return error.message || "Ocorreu um erro inesperado. Tente novamente.";
  }
};

export interface HandleErrorOptions {
  showAlert?: boolean;
  title?: string;
  onRetry?: (() => void) | null;
  context?: string;
}

export const handleError = (error: Error | any, options: HandleErrorOptions = {}): ErrorInfo => {
  const {
    showAlert = true,
    title = "Erro",
    onRetry = null,
    context = "operação"
  } = options;

  const message = getErrorMessage(error);

  console.error(`Erro na ${context}:`, error);

  if (showAlert) {
    const buttons: any[] = [{ text: "OK", style: "default" }];

    if (onRetry) {
      buttons.unshift({
        text: "Tentar novamente",
        onPress: onRetry,
        style: "default"
      });
    }

    Alert.alert(title, message, buttons);
  }

  return {
    type: getErrorType(error),
    message,
    originalError: error
  };
};

export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: HandleErrorOptions = {}
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | ErrorInfo> => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      return handleError(error, options);
    }
  };
};

export default {
  ErrorTypes,
  getErrorType,
  getErrorMessage,
  handleError,
  withErrorHandler
};
