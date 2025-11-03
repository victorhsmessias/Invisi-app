import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS, DEFAULT_API_FILTERS } from "../constants";
import type { Filial } from "../constants/api";
import {
  FALLBACK_GRUPOS,
  FALLBACK_PRODUTOS,
  logFallbackUsage,
} from "../constants/fallbacks";
import type { GrupoItem, ProdutoItem } from "../constants/fallbacks";
import {
  AuthenticationError,
  AUTH_ERROR_CODES,
  rateLimiter,
  validateAndSanitizeCredentials,
  validateLoginResponse,
  extractToken,
} from "../utils/authUtils";
import type {
  LoginCredentials,
  LoginResponse,
  ApiRequestBody,
  ContratosResponse,
  FilterResponse,
  ContratosFilaParams,
  MonitorDataResponse,
  MonitorFilters,
} from "../types/api";

class ApiService {
  getFilialURL(filial: Filial): string {
    return API_CONFIG.FILIAL_URLS[filial];
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { token }),
    };
  }

  async makeRequest(
    endpoint: string,
    body: any,
    filial: Filial
  ): Promise<Response> {
    if (!filial || !API_CONFIG.FILIAL_URLS[filial]) {
      throw new Error(`Filial '${filial}' não configurada ou inválida`);
    }

    const url = `${API_CONFIG.FILIAL_URLS[filial]}${endpoint}`;
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

  async requestWithRetry<T = any>(
    endpoint: string,
    body: any,
    filial: Filial
  ): Promise<T> {
    if (!filial) {
      throw new Error("Filial é obrigatória para fazer requisições");
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await this.makeRequest(endpoint, body, filial);
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < API_CONFIG.RETRY_ATTEMPTS - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, API_CONFIG.RETRY_DELAY)
          );
        }
      }
    }

    throw lastError;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const sanitized = validateAndSanitizeCredentials(
        credentials.username,
        credentials.password
      );

      await rateLimiter.checkRateLimit(sanitized.username);

      const urls = Object.values(API_CONFIG.FILIAL_URLS);
      const filialKeys = Object.keys(API_CONFIG.FILIAL_URLS);

      const abortControllers = urls.map(() => new AbortController());
      const results: Array<
        | { status: "fulfilled"; value: any; index: number }
        | { status: "rejected"; reason: any; index: number }
        | null
      > = Array(urls.length).fill(null);
      let completedCount = 0;
      let firstSuccessTime: number | null = null;
      const racePromise = new Promise((resolve, reject) => {
        const loginAttempts = urls.map((url, index) =>
          fetch(`${url}/login.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id_nome: sanitized.username,
              senha: sanitized.password,
            }),
            signal: abortControllers[index].signal,
          })
            .then(async (response) => {
              const responseText = await response.text();
              validateLoginResponse(response, responseText);
              const token = extractToken(response, responseText);

              let id_grupo_usuario: string | undefined;
              let lotacao: string | undefined;

              try {
                const responseData = JSON.parse(responseText);
                id_grupo_usuario = responseData.id_grupo_usuario;
                lotacao = responseData.lotacao;
              } catch (parseError) {
                console.warn(
                  "[ApiService] Não foi possível extrair dados adicionais do login"
                );
              }

              console.log(
                `[ApiService] Login bem-sucedido na filial ${filialKeys[index]} (${url})`
              );

              return {
                token,
                id_grupo_usuario,
                lotacao,
                url,
                filial: filialKeys[index],
                index,
              };
            })
            .then((data) => {
              results[index] = { status: "fulfilled", value: data, index };
              completedCount++;

              if (firstSuccessTime === null) {
                firstSuccessTime = Date.now();
                setTimeout(() => {
                  for (let i = 0; i < results.length; i++) {
                    if (results[i]?.status === "fulfilled") {
                      const successData = (results[i] as any).value;
                      console.log(
                        `[ApiService] Usando filial ${
                          filialKeys[i]
                        } (prioridade ${i + 1})`
                      );

                      abortControllers.forEach((controller, idx) => {
                        if (idx !== i) {
                          controller.abort();
                        }
                      });

                      resolve(successData);
                      return;
                    }
                  }
                }, 100);
              }
            })
            .catch((error) => {
              results[index] = { status: "rejected", reason: error, index };
              completedCount++;

              if (error.name !== "AbortError") {
                console.log(
                  `[ApiService] Falha na URL ${filialKeys[index]} (${url}):`,
                  error instanceof AuthenticationError
                    ? error.code
                    : error.message
                );
              }

              if (completedCount === urls.length && firstSuccessTime === null) {
                reject(results);
              }
            })
        );
      });

      let loginData: {
        token: string;
        id_grupo_usuario: string | undefined;
        lotacao: string | undefined;
      };
      try {
        loginData = (await racePromise) as any;
      } catch (failedResults) {
        const errors = (failedResults as any[])
          .filter((result) => result?.status === "rejected")
          .map((result) => result.reason);

        const hasInvalidCredentials = errors.some(
          (error) =>
            error instanceof AuthenticationError &&
            error.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS
        );

        if (hasInvalidCredentials) {
          throw new AuthenticationError(
            "Usuário ou senha incorretos",
            AUTH_ERROR_CODES.INVALID_CREDENTIALS
          );
        }

        throw (
          errors[0] ||
          new AuthenticationError(
            "Não foi possível conectar aos servidores",
            AUTH_ERROR_CODES.NETWORK_ERROR
          )
        );
      }

      const { token, id_grupo_usuario, lotacao } = loginData;

      rateLimiter.resetAttempts(sanitized.username);

      return {
        token,
        success: true,
        username: sanitized.username,
        id_grupo_usuario,
        lotacao,
      };
    } catch (error) {
      throw error;
    }
  }

  async getContratosData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>,
    grupos?: GrupoItem[],
    produtos?: ProdutoItem[]
  ): Promise<ContratosResponse> {
    try {
      const [gruposResponse, produtosResponse] = await Promise.all([
        grupos
          ? Promise.resolve({
              dados: { grupos: grupos.map((g) => g.grupo) },
            })
          : this.getGruposFilter(filial),
        produtos
          ? Promise.resolve({
              dados: { produtos: produtos.map((p) => p.tp_prod) },
            })
          : this.getProdutosFilter(filial),
      ]);

      if (!grupos && gruposResponse.dados?.grupos) {
        grupos = gruposResponse.dados.grupos.map((grupo: string) => ({
          grupo,
        }));
      }

      if (!produtos && produtosResponse.dados?.produtos) {
        produtos = produtosResponse.dados.produtos.map((produto: string) => ({
          tp_prod: produto,
        }));
      }

      if (!grupos || grupos.length === 0) {
        logFallbackUsage(
          "grupos",
          "getContratosData - grupos ausentes ou vazios"
        );
        grupos = FALLBACK_GRUPOS;
      }

      if (!produtos || produtos.length === 0) {
        logFallbackUsage(
          "produtos",
          "getContratosData - produtos ausentes ou vazios"
        );
        produtos = FALLBACK_PRODUTOS;
      }

      const requestBody: ApiRequestBody = {
        AttApi: {
          tipoOperacao: "monitor_corte",
          filtro_filial: filial,
          filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
          filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
          filtro_grupo: grupos,
          filtro_tp_prod: produtos,
        },
      };

      return this.requestWithRetry<ContratosResponse>(
        "/monitor_corte.php",
        requestBody,
        filial
      );
    } catch (error) {
      console.error("[ApiService] Error in getContratosData:", error);
      throw error;
    }
  }

  async getMonitorData(
    tipoOperacao: string,
    filtros: Partial<MonitorFilters>
  ): Promise<MonitorDataResponse> {
    try {
      const filial = filtros.filtro_filial;
      if (!filial) {
        throw new Error("Filial é obrigatória para getMonitorData");
      }

      const requestBody: ApiRequestBody = {
        AttApi: {
          tipoOperacao,
          filtro_filial: filial,
          filtro_servico: filtros.filtro_servico || DEFAULT_API_FILTERS.SERVICO,
          filtro_op_padrao:
            filtros.filtro_op_padrao || DEFAULT_API_FILTERS.OP_PADRAO,
        },
      };

      return this.requestWithRetry<MonitorDataResponse>(
        "/monitor.php",
        requestBody,
        filial
      );
    } catch (error) {
      console.error("[ApiService] Error in getMonitorData:", error);
      throw error;
    }
  }

  async getFilterOptions(
    tipo: string,
    filial: Filial
  ): Promise<FilterResponse> {
    return this.getMonitorData(tipo, {
      filtro_filial: filial,
    }) as Promise<FilterResponse>;
  }

  async getServicosFilter(filial: Filial): Promise<FilterResponse> {
    return this.getMonitorData("fservico", {
      filtro_filial: filial,
    }) as Promise<FilterResponse>;
  }

  async getOpPadraoFilter(filial: Filial): Promise<FilterResponse> {
    return this.getMonitorData("fop_padrao", {
      filtro_filial: filial,
    }) as Promise<FilterResponse>;
  }

  async getGruposFilter(filial: Filial): Promise<FilterResponse> {
    return this.getMonitorData("fgrupo", {
      filtro_filial: filial,
    }) as Promise<FilterResponse>;
  }

  async getProdutosFilter(filial: Filial): Promise<FilterResponse> {
    return this.getMonitorData("fproduto", {
      filtro_filial: filial,
    }) as Promise<FilterResponse>;
  }

  async getAllDashboardData(filial: Filial): Promise<any> {
    try {
      const requestBody: ApiRequestBody = {
        AttApi: {
          tipoOperacao: "monitor",
          filtro_filial: filial,
          filtro_servico: DEFAULT_API_FILTERS.SERVICO,
          filtro_op_padrao: DEFAULT_API_FILTERS.OP_PADRAO,
        },
      };

      return this.requestWithRetry("/monitor.php", requestBody, filial);
    } catch (error) {
      console.error("[ApiService] Error in getAllDashboardData:", error);
      throw error;
    }
  }

  async getTransitoData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_transito", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getFilaDescargaData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_fila_desc", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getFilaDescargaVeiculosLista(
    filial: Filial,
    fila: string
  ): Promise<any> {
    try {
      const requestBody = {
        AttApi: {
          tipoOperacao: "monitor_lista_fila_desc",
          filial: filial,
          fila: fila,
        },
      };

      return this.requestWithRetry("/monitor.php", requestBody, filial);
    } catch (error) {
      console.error("[ApiService] Error in getFilaDescargaVeiculosLista:", error);
      throw error;
    }
  }

  async getFilaCargaData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_fila_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getPatioDescargaLocalData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_patio_desc_local", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getPatioCargaData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_patio_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getDescargasHojeData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_descarga", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getCargasHojeData(
    filial: Filial,
    filtroServico?: Record<string, 0 | 1>,
    filtroOpPadrao?: Record<string, 0 | 1>
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico,
      filtro_op_padrao: filtroOpPadrao,
    });
  }

  async getContratosFilaData(
    filial: Filial,
    fila: string,
    grupo: string,
    produto: string,
    dadosCorte?: ContratosFilaParams["dadosCorte"]
  ): Promise<any> {
    try {
      const requestBody: ApiRequestBody = {
        AttApi: {
          tipoOperacao: "monitor_contratos_fila",
          filial,
          fila,
          grupo,
          prod: produto,
          ...(dadosCorte && {
            peso_origem: dadosCorte.peso_origem || 0,
            peso_descarga: dadosCorte.peso_descarga || 0,
            peso_carga: dadosCorte.peso_carga || 0,
            peso_meia_carga: dadosCorte.peso_meia_carga || 0,
            peso_destino: dadosCorte.peso_destino || 0,
            dif_peso_descarga_origem: dadosCorte.dif_peso_descarga_origem || 0,
            pdif_peso_descarga_origem:
              dadosCorte.pdif_peso_descarga_origem || 0,
            dif_peso_carga_descarga: dadosCorte.dif_peso_carga_descarga || 0,
            pdif_peso_carga_descarga: dadosCorte.pdif_peso_carga_descarga || 0,
            dif_peso_destino_carga: dadosCorte.dif_peso_destino_carga || 0,
            pdif_peso_destino_carga: dadosCorte.pdif_peso_destino_carga || 0,
            veiculos_descarga: dadosCorte.veiculos_descarga || "0",
            veiculos_descarga_med: dadosCorte.veiculos_descarga_med || 0,
            veiculos_carga: dadosCorte.veiculos_carga || "0",
            veiculos_carga_med: dadosCorte.veiculos_carga_med || 0,
            veiculos_meia_carga: dadosCorte.veiculos_meia_carga || 0,
          }),
        },
      };

      console.log("[ApiService] Making contratos fila request:", {
        filial,
        fila,
        grupo,
        produto,
      });

      return this.requestWithRetry(
        "/monitor_contratos_fila.php",
        requestBody,
        filial
      );
    } catch (error) {
      console.error("[ApiService] Error in getContratosFilaData:", error);
      throw error;
    }
  }
}

export default new ApiService();
