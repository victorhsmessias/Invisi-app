import { useState } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";
import {
  AuthenticationError,
  AUTH_ERROR_CODES,
  clearAuthData,
} from "../utils/authUtils";

export const useAuth = () => {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    actions.resetError();

    try {
      // apiService.login já faz toda validação, sanitização e rate limiting
      const result = await apiService.login({ username, password });

      if (result.success && result.token) {
        // Atualizar estado global (dados já foram salvos pelo authUtils)
        actions.setAuth(true, result.token);
        actions.setUsername(result.username || username.trim().toUpperCase());

        if (__DEV__) {
          console.log("[useAuth] Login bem-sucedido para:", result.username);
        }

        return { success: true };
      } else {
        throw new AuthenticationError(
          "Falha na autenticação",
          AUTH_ERROR_CODES.INVALID_RESPONSE
        );
      }
    } catch (error) {
      // Tratar erros baseado no tipo
      let errorMessage = "Não foi possível fazer login";

      if (error instanceof AuthenticationError) {
        // Mensagens específicas baseadas no código de erro
        switch (error.code) {
          case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
            errorMessage = "Usuário ou senha incorretos";
            break;
          case AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED:
            errorMessage = error.message; // Já contém tempo restante
            break;
          case AUTH_ERROR_CODES.INVALID_INPUT:
            errorMessage = error.message; // Mensagem específica de validação
            break;
          case AUTH_ERROR_CODES.NETWORK_ERROR:
            errorMessage = "Erro de conexão. Verifique sua internet.";
            break;
          case AUTH_ERROR_CODES.SERVER_ERROR:
            errorMessage = "Servidor temporariamente indisponível. Tente novamente.";
            break;
          case AUTH_ERROR_CODES.NO_TOKEN_RECEIVED:
            errorMessage = "Erro na resposta do servidor. Contate o suporte.";
            break;
          default:
            errorMessage = error.message || "Erro desconhecido ao fazer login";
        }

        if (__DEV__) {
          console.error("[useAuth] Erro de autenticação:", {
            code: error.code,
            message: error.message,
            details: error.details,
          });
        }
      } else {
        // Erro inesperado
        errorMessage = error.message || "Erro inesperado ao fazer login";
        console.error("[useAuth] Erro inesperado:", error);
      }

      actions.setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Limpar dados de autenticação usando authUtils
      await clearAuthData();

      // Limpar estado global
      await actions.logout();

      if (__DEV__) {
        console.log("[useAuth] Logout realizado com sucesso");
      }
    } catch (error) {
      console.error("[useAuth] Erro ao fazer logout:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoggedIn: state.isLoggedIn,
    username: state.username,
    loading,
    login,
    logout,
    error: state.error,
  };
};