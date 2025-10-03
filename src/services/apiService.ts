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
  saveAuthData,
} from "../utils/authUtils";
import type {
  LoginCredentials,
  LoginResponse,
  ApiRequestBody,
  MonitorDataResponse,
  ContratosResponse,
  FilterResponse,
  MonitorFilters,
  ContratosFilaParams,
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

  async makeRequest(endpoint: string, body: any, filial: Filial): Promise<Response> {
    if (!filial || !API_CONFIG.FILIAL_URLS[filial]) {
      throw new Error(`Filial '${filial}' não configurada ou inválida`);
    }

    const url = `${API_CONFIG.FILIAL_URLS[filial]}${endpoint}`;

    if (__DEV__) {
      console.log(
        `[ApiService] Using filial-specific URL for ${filial}: ${url}`
      );
    }

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

  async requestWithRetry<T = any>(endpoint: string, body: any, filial: Filial): Promise<T> {
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
      let lastError: Error | null = null;

      const maxUrlAttempts = Math.min(urls.length, 2);

      for (let i = 0; i < maxUrlAttempts; i++) {
        const url = urls[i];

        try {
          if (__DEV__) {
            console.log(`[ApiService] Tentando autenticação em: ${url}`);
          }

          const response = await fetch(`${url}/login.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id_nome: sanitized.username,
              senha: sanitized.password,
            }),
          });

          const responseText = await response.text();

          validateLoginResponse(response, responseText);

          const token = extractToken(response, responseText);

          await saveAuthData(token, sanitized.username);

          rateLimiter.resetAttempts(sanitized.username);

          if (__DEV__) {
            console.log("[ApiService] Autenticação bem-sucedida");
          }

          return {
            token,
            success: true,
            username: sanitized.username,
          };
        } catch (error) {
          lastError = error as Error;

          if (
            error instanceof AuthenticationError &&
            error.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS
          ) {
            if (__DEV__) {
              console.log(
                "[ApiService] Credenciais inválidas, parando tentativas"
              );
            }
            break;
          }

          if (__DEV__) {
            console.warn(
              `[ApiService] Erro ao autenticar em ${url}:`,
              (error as Error).message
            );
          }
        }
      }

      if (
        lastError instanceof AuthenticationError &&
        lastError.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS
      ) {
        throw lastError;
      }

      throw new AuthenticationError(
        "Não foi possível conectar ao servidor. Verifique sua conexão.",
        AUTH_ERROR_CODES.NETWORK_ERROR,
        { attemptedUrls: maxUrlAttempts }
      );
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      throw new AuthenticationError(
        (error as Error).message || "Erro desconhecido durante autenticação",
        AUTH_ERROR_CODES.NETWORK_ERROR,
        { originalError: (error as Error).name }
      );
    }
  }

  async getMonitorData(
    tipoOperacao: string,
    filtros: Partial<MonitorFilters>
  ): Promise<MonitorDataResponse> {
    const requestBody: ApiRequestBody = {
      AttApi: {
        tipoOperacao,
        ...filtros,
      },
    };

    const filial = (filtros.filtro_filial || filtros.filtro_filial) as Filial;
    const result = await this.requestWithRetry<MonitorDataResponse>(
      "/monitor.php",
      requestBody,
      filial
    );

    return result;
  }

  async getTransitoData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_transito", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getFilaDescargaData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_fila_desc", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getFilaCargaData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_fila_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getPatioDescargaData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_patio_desc", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getPatioCargaData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_patio_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getDescargasHojeData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_descarga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getCargasHojeData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null
  ): Promise<MonitorDataResponse> {
    return this.getMonitorData("monitor_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || DEFAULT_API_FILTERS.SERVICO,
      filtro_op_padrao: filtroOpPadrao || DEFAULT_API_FILTERS.OP_PADRAO,
    });
  }

  async getContratosData(
    filial: Filial,
    filtroServico: Record<string, 0 | 1> | null = null,
    filtroOpPadrao: Record<string, 0 | 1> | null = null,
    filtroGrupo: GrupoItem[] | null = null,
    filtroTpProd: ProdutoItem[] | null = null
  ): Promise<ContratosResponse> {
    try {
      let grupos = filtroGrupo;
      let produtos = filtroTpProd;

      if (!grupos || !produtos) {
        console.log("[ApiService] Loading dynamic filters for contratos...");

        const [gruposResponse, produtosResponse] = await Promise.all([
          grupos
            ? Promise.resolve({ dados: { grupos: grupos.map((g) => g.grupo) } })
            : this.getGruposFilter(filial),
          produtos
            ? Promise.resolve({
                dados: { produtos: produtos.map((p) => p.tp_prod) },
              })
            : this.getProdutosFilter(filial),
        ]);

        if (!grupos && gruposResponse.dados?.grupos) {
          grupos = gruposResponse.dados.grupos.map((grupo: string) => ({ grupo }));
        }

        if (!produtos && produtosResponse.dados?.produtos) {
          produtos = produtosResponse.dados.produtos.map((produto: string) => ({
            tp_prod: produto,
          }));
        }
      }

      if (!grupos || grupos.length === 0) {
        logFallbackUsage('grupos', 'getContratosData - grupos ausentes ou vazios');
        grupos = FALLBACK_GRUPOS;
      }

      if (!produtos || produtos.length === 0) {
        logFallbackUsage('produtos', 'getContratosData - produtos ausentes ou vazios');
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

      if (__DEV__) {
        console.log(
          "[ApiService] Making contratos request with dynamic filters:",
          {
            filial,
            grupos: grupos ? grupos.length : "null",
            produtos: produtos ? produtos.length : "null",
            filtroServico,
            filtroOpPadrao,
            gruposArray: grupos,
            produtosArray: produtos,
          }
        );
      }

      return this.requestWithRetry<ContratosResponse>("/monitor_corte.php", requestBody, filial);
    } catch (error) {
      console.error("[ApiService] Error in getContratosData:", error);
      throw error;
    }
  }

  async getFilterOptions(tipo: string, filial: Filial): Promise<FilterResponse> {
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

  async getContratosFilaData(
    filial: Filial,
    fila: string,
    grupo: string,
    produto: string,
    dadosCorte?: ContratosFilaParams['dadosCorte']
  ): Promise<any> {
    try {
      const requestBody: ApiRequestBody = {
        AttApi: {
          tipoOperacao: "monitor_contratos_fila",
          filial: filial,
          fila: fila,
          grupo: grupo,
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
