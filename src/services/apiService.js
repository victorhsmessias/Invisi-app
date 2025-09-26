import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS } from "../constants";

class ApiService {
  constructor() {
    // URLs agora são específicas por filial
  }

  // Obter URL específica para a filial
  getFilialURL(filial) {
    return API_CONFIG.FILIAL_URLS[filial];
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { token }),
    };
  }

  async makeRequest(endpoint, body, filial) {
    if (!filial || !API_CONFIG.FILIAL_URLS[filial]) {
      throw new Error(`Filial '${filial}' não configurada ou inválida`);
    }

    const url = `${API_CONFIG.FILIAL_URLS[filial]}${endpoint}`;

    if (__DEV__) {
      console.log(`[ApiService] Using filial-specific URL for ${filial}: ${url}`);
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

  async requestWithRetry(endpoint, body, filial) {
    if (!filial) {
      throw new Error("Filial é obrigatória para fazer requisições");
    }

    let lastError = null;

    for (let attempt = 0; attempt < API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await this.makeRequest(endpoint, body, filial);
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

    throw lastError;
  }
  async login(credentials) {
    const urls = Object.values(API_CONFIG.FILIAL_URLS);
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

          if (
            responseText.toLowerCase().includes("failed") ||
            responseText.toLowerCase().includes("invalid") ||
            responseText.toLowerCase().includes("error")
          ) {
            throw new Error("Credenciais inválidas");
          }

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
            } catch (parseError) {}
          }

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

  async getMonitorData(tipoOperacao, filtros) {
    const requestBody = {
      AttApi: {
        tipoOperacao,
        ...filtros,
      },
    };

    // Extrair filial dos filtros para usar URL específica
    const filial = filtros.filtro_filial || filtros.filial;
    const result = await this.requestWithRetry("/monitor.php", requestBody, filial);

    return result;
  }

  async getTransitoData(filial, filtroServico = null, filtroOpPadrao = null) {
    return this.getMonitorData("monitor_transito", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getFilaDescargaData(
    filial,
    filtroServico = null,
    filtroOpPadrao = null
  ) {
    return this.getMonitorData("monitor_fila_desc", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getFilaCargaData(filial, filtroServico = null, filtroOpPadrao = null) {
    return this.getMonitorData("monitor_fila_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getPatioDescargaData(
    filial,
    filtroServico = null,
    filtroOpPadrao = null
  ) {
    return this.getMonitorData("monitor_patio_desc", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getPatioCargaData(filial, filtroServico = null, filtroOpPadrao = null) {
    return this.getMonitorData("monitor_patio_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getDescargasHojeData(
    filial,
    filtroServico = null,
    filtroOpPadrao = null
  ) {
    return this.getMonitorData("monitor_descarga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getCargasHojeData(filial, filtroServico = null, filtroOpPadrao = null) {
    return this.getMonitorData("monitor_carga", {
      filtro_filial: filial,
      filtro_servico: filtroServico || {
        armazenagem: 1,
        transbordo: 1,
        pesagem: 0,
      },
      filtro_op_padrao: filtroOpPadrao || {
        rodo_ferro: 1,
        ferro_rodo: 1,
        rodo_rodo: 1,
        outros: 0,
      },
    });
  }

  async getContratosData(
    filial,
    filtroServico = null,
    filtroOpPadrao = null,
    filtroGrupo = null,
    filtroTpProd = null
  ) {
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
          grupos = gruposResponse.dados.grupos.map((grupo) => ({ grupo }));
        }

        if (!produtos && produtosResponse.dados?.produtos) {
          produtos = produtosResponse.dados.produtos.map((produto) => ({
            tp_prod: produto,
          }));
        }
      }

      if (!grupos || grupos.length === 0) {
        console.log("[ApiService] Using fallback grupos for contratos");
        grupos = [
          { grupo: "ADM-MGA" },
          { grupo: "ATT" },
          { grupo: "CARGILL" },
          { grupo: "BTG PACTUAL S/A" },
        ];
      }

      if (!produtos || produtos.length === 0) {
        console.log("[ApiService] Using fallback produtos for contratos");
        produtos = [
          { tp_prod: "SOJA GRAOS" },
          { tp_prod: "MILHO GRAOS" },
          { tp_prod: "FARELO DE SOJA" },
        ];
      }

      const requestBody = {
        AttApi: {
          tipoOperacao: "monitor_corte",
          filtro_filial: filial,
          filtro_servico: filtroServico || {
            armazenagem: 1,
            transbordo: 1,
            pesagem: 0,
          },
          filtro_op_padrao: filtroOpPadrao || {
            rodo_ferro: 1,
            ferro_rodo: 1,
            rodo_rodo: 1,
            outros: 0,
          },
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

      return this.requestWithRetry("/monitor_corte.php", requestBody, filial);
    } catch (error) {
      console.error("[ApiService] Error in getContratosData:", error);
      throw error;
    }
  }

  async getFilterOptions(tipo, filial) {
    return this.getMonitorData(tipo, {
      filtro_filial: filial,
    });
  }

  async getServicosFilter(filial) {
    return this.getMonitorData("fservico", {
      filtro_filial: filial,
    });
  }

  async getOpPadraoFilter(filial) {
    return this.getMonitorData("fop_padrao", {
      filtro_filial: filial,
    });
  }

  async getGruposFilter(filial) {
    return this.getMonitorData("fgrupo", {
      filtro_filial: filial,
    });
  }

  async getProdutosFilter(filial) {
    return this.getMonitorData("fproduto", {
      filtro_filial: filial,
    });
  }

  async getContratosFilaData(filial, fila, grupo, produto, dadosCorte) {
    try {
      const requestBody = {
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

      return this.requestWithRetry("/monitor_contratos_fila.php", requestBody, filial);
    } catch (error) {
      console.error("[ApiService] Error in getContratosFilaData:", error);
      throw error;
    }
  }
}

export default new ApiService();
