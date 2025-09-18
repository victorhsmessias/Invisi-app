import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../context/AppContext";
import { STORAGE_KEYS } from "../constants";
import apiService from "../services/apiService";

export const useAuth = () => {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    if (!username.trim()) {
      throw new Error("Por favor, insira o nome de usuário");
    }
    if (!password.trim()) {
      throw new Error("Por favor, insira sua senha");
    }

    setLoading(true);
    actions.resetError();

    try {
      const result = await apiService.login({ username, password });

      if (result.success && result.token) {
        // Salvar dados no AsyncStorage
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.USER_TOKEN, result.token],
          [STORAGE_KEYS.USERNAME, username.trim()],
        ]);

        // Atualizar estado global
        actions.setAuth(true, result.token);
        actions.setUsername(username.trim());

        return { success: true };
      } else {
        throw new Error("Falha na autenticação");
      }
    } catch (error) {
      let errorMessage = "Não foi possível fazer login";

      if (error.message.includes("Credenciais")) {
        errorMessage = "Usuário ou senha incorretos";
      } else if (error.message.includes("Network") || error.message.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      } else if (error.message.includes("nome") || error.message.includes("senha")) {
        errorMessage = error.message;
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
      await actions.logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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