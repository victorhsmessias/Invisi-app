import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS } from "../constants";

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.backupURL = API_CONFIG.BACKUP_URL;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { token }),
    };
  }

  async makeRequest(endpoint, body, useBackup = false) {
    const url = `${useBackup ? this.backupURL : this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async requestWithRetry(endpoint, body) {
    let lastError = null;
    const urls = [false, true]; // false = main URL, true = backup URL

    for (let attempt = 0; attempt < API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      for (const useBackup of urls) {
        try {
          const response = await this.makeRequest(endpoint, body, useBackup);
          return await response.json();
        } catch (error) {
          lastError = error;
          if (attempt < API_CONFIG.RETRY_ATTEMPTS - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, API_CONFIG.RETRY_DELAY)
            );
          }
        }
      }
    }

    throw lastError;
  }

  // Método específico para login
  async login(credentials) {
    const urls = [this.baseURL, this.backupURL];
    let lastError = null;

    for (let attempt = 0; attempt < API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      for (const url of urls) {
        try {
          const response = await fetch(`${url}/login.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id_nome: credentials.username.trim().toUpperCase(),
              senha: credentials.password.toUpperCase(),
            }),
          });

          const responseText = await response.text();

          // Verificar se há erro na resposta
          if (
            responseText.toLowerCase().includes("failed") ||
            responseText.toLowerCase().includes("invalid") ||
            responseText.toLowerCase().includes("error")
          ) {
            throw new Error("Credenciais inválidas");
          }

          // Buscar token nos headers ou no body
          let token =
            response.headers.get("token") ||
            response.headers.get("authorization") ||
            response.headers.get("x-auth-token") ||
            response.headers.get("x-access-token");

          if (!token) {
            try {
              const data = JSON.parse(responseText);
              token =
                data.token ||
                data.jwt ||
                data.access_token ||
                data.accessToken ||
                data.authToken;
            } catch (parseError) {
              console.log("Resposta não é JSON");
            }
          }

          // Se não encontrou token mas status é 200, gerar um
          if (!token && response.status === 200) {
            token = "success_" + Date.now();
          }

          if (token) {
            return { token, success: true };
          }
        } catch (error) {
          lastError = error;
          if (attempt < API_CONFIG.RETRY_ATTEMPTS - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, API_CONFIG.RETRY_DELAY)
            );
          }
        }
      }
    }

    throw lastError;
  }

  // Métodos para diferentes operações de monitoramento
  async getMonitorData(tipoOperacao, filtros) {
    console.log(`[ApiService] Calling ${tipoOperacao} with filters:`, filtros);

    const result = await this.requestWithRetry("/monitor.php", {
      AttApi: {
        tipoOperacao,
        ...filtros,
      },
    });

    console.log(`[ApiService] ${tipoOperacao} response:`, result);
    return result;
  }

  async getTransitoData(filial) {
    return this.getMonitorData("monitor_transito", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getFilaDescargaData(filial) {
    return this.getMonitorData("monitor_fila_desc", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getFilaCargaData(filial) {
    return this.getMonitorData("monitor_fila_carga", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getPatioDescargaData(filial) {
    return this.getMonitorData("monitor_patio_desc", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getPatioCargaData(filial) {
    return this.getMonitorData("monitor_patio_carga", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getDescargasHojeData(filial) {
    return this.getMonitorData("monitor_descarga", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getCargasHojeData(filial) {
    return this.getMonitorData("monitor_carga", {
      filtro_filial: filial,
      filtro_servico: {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getContratosData(filtros) {
    return this.getMonitorData("monitor_corte", filtros);
  }

  async getFilterOptions(tipo, filial) {
    return this.getMonitorData(tipo, {
      filtro_filial: filial,
    });
  }
}

export default new ApiService();