import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";

/**
 * Hook customizado para gerenciar dados do monitor
 * Centraliza toda lógica de fetch, normalização e cálculo de totais
 *
 * @param {string} tipoOperacao - Tipo de operação do monitor
 * @param {string} filial - Código da filial
 * @param {Object} filters - Filtros opcionais { filtroServico, filtroOpPadrao }
 * @returns {Object} { data, loading, refreshing, totals, error, refresh }
 */
export const useMonitorData = (tipoOperacao, filial, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({ veiculos: 0, peso: 0 });
  const [error, setError] = useState(null);

  // Ref para prevenir múltiplas requisições simultâneas
  const isRequestInProgress = useRef(false);

  /**
   * Mapeamento de tipos de operação para caminhos de dados na resposta
   */
  const DATA_PATH_MAP = {
    monitor_transito: "dados.listaTransito.transitoVeiculos",
    monitor_fila_desc: "dados.listaFilaDescarga.filaDescargaVeiculos",
    monitor_fila_carga: "dados.listaFilaCarga.filaCargaVeiculos",
    monitor_patio_desc: "dados.listaPatioDescarga.patioDescargaVeiculos",
    monitor_patio_carga: "dados.listaPatioCarga.patioCargaVeiculos",
    monitor_descarga: "dados.listaDescarga.DescargaVeiculos",
    monitor_carga: "dados.listaCarga.CargaVeiculos",
  };

  /**
   * Prefixos de campos por tipo de operação
   */
  const FIELD_PREFIXES = {
    monitor_transito: "t_",
    monitor_fila_desc: "fd_",
    monitor_fila_carga: "fc_",
    monitor_patio_desc: "pd_",
    monitor_patio_carga: "pc_",
    monitor_descarga: "d_",
    monitor_carga: "c_",
  };

  /**
   * Extrai dados da resposta da API usando o caminho correto
   */
  const extractDataFromResponse = useCallback(
    (response) => {
      if (!response || !response.dados) {
        if (__DEV__) {
          console.log(
            `[useMonitorData] Response missing 'dados' property:`,
            response
          );
        }
        return [];
      }

      const dataPath = DATA_PATH_MAP[tipoOperacao];
      if (!dataPath) {
        if (__DEV__) {
          console.log(
            `[useMonitorData] Unknown operation type: ${tipoOperacao}`
          );
        }
        return [];
      }

      // Navegar pelo caminho de dados
      const pathParts = dataPath.split(".");
      let extractedData = response;

      for (const part of pathParts) {
        extractedData = extractedData[part];
        if (!extractedData) {
          if (__DEV__) {
            console.log(
              `[useMonitorData] Data not found at path: ${dataPath}`
            );
          }
          return [];
        }
      }

      // Garantir que retornamos um array
      if (!Array.isArray(extractedData)) {
        if (__DEV__) {
          console.log(
            `[useMonitorData] Data is not an array:`,
            extractedData
          );
        }
        return [];
      }

      return extractedData;
    },
    [tipoOperacao]
  );

  /**
   * Normaliza dados removendo prefixos específicos de cada tipo de operação
   */
  const normalizeData = useCallback(
    (rawData) => {
      const prefix = FIELD_PREFIXES[tipoOperacao];
      if (!prefix) return rawData;

      return rawData.map((item) => {
        const normalizedItem = {};

        // Criar versão normalizada sem prefixo
        Object.keys(item).forEach((key) => {
          if (key.startsWith(prefix)) {
            // Remover prefixo
            const normalizedKey = key.substring(prefix.length);
            normalizedItem[normalizedKey] = item[key];
          }
          // Manter chave original também
          normalizedItem[key] = item[key];
        });

        return normalizedItem;
      });
    },
    [tipoOperacao]
  );

  /**
   * Calcula totais de veículos e peso
   */
  const calculateTotals = useCallback((dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { veiculos: 0, peso: 0, grupos: 0 };
    }

    const totalVehicles = dataArray.reduce((sum, item) => {
      // Tentar diferentes campos de veículos
      const veiculosValue =
        item.veiculos ||
        item.t_veiculos ||
        item.fd_veiculos ||
        item.fc_veiculos ||
        item.pd_veiculos ||
        item.pc_veiculos ||
        item.d_veiculos ||
        item.c_veiculos ||
        0;

      return sum + parseInt(veiculosValue || 0);
    }, 0);

    const totalWeight = dataArray.reduce((sum, item) => {
      // Tentar diferentes campos de peso
      const pesoValue =
        item.peso ||
        item.t_peso ||
        item.fd_peso ||
        item.fc_peso ||
        item.pd_peso ||
        item.pc_peso ||
        item.d_peso ||
        item.c_peso ||
        0;

      return sum + parseFloat(pesoValue || 0);
    }, 0);

    const totalGroups = dataArray.length;

    return {
      veiculos: totalVehicles,
      peso: totalWeight,
      grupos: totalGroups,
    };
  }, []);

  /**
   * Faz fetch dos dados do monitor
   */
  const fetchData = useCallback(
    async (isRefreshing = false) => {
      // Prevenir múltiplas requisições simultâneas
      if (isRequestInProgress.current) {
        if (__DEV__) {
          console.log(
            `[useMonitorData] Request already in progress for ${tipoOperacao}, skipping...`
          );
        }
        return;
      }

      try {
        isRequestInProgress.current = true;

        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Buscar token do AsyncStorage
        const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        if (!token) {
          throw new Error("Token de autenticação não encontrado");
        }

        // Preparar body da requisição
        const requestBody = {
          filial: filial,
          filtroServico: filters.filtroServico || "T",
          filtroOpPadrao: filters.filtroOpPadrao || "T",
        };

        if (__DEV__) {
          console.log(`[useMonitorData] Fetching ${tipoOperacao}:`, {
            url: "http://192.168.10.201/attmonitor/api/monitor.php",
            body: requestBody,
          });
        }

        // Fazer requisição
        const response = await fetch(
          "http://192.168.10.201/attmonitor/api/monitor.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              token: token,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonResponse = await response.json();

        if (__DEV__) {
          console.log(
            `[useMonitorData] Response for ${tipoOperacao}:`,
            jsonResponse
          );
        }

        // Extrair dados da resposta
        const extractedData = extractDataFromResponse(jsonResponse);

        // Normalizar dados (remover prefixos)
        const normalizedData = normalizeData(extractedData);

        // Calcular totais
        const calculatedTotals = calculateTotals(normalizedData);

        // Atualizar estados
        setData(normalizedData);
        setTotals(calculatedTotals);
      } catch (err) {
        console.error(`[useMonitorData] Error for ${tipoOperacao}:`, err);
        setError(
          err.message || "Erro ao carregar dados. Tente novamente."
        );
        setData([]);
        setTotals({ veiculos: 0, peso: 0, grupos: 0 });
      } finally {
        setLoading(false);
        setRefreshing(false);
        isRequestInProgress.current = false;
      }
    },
    [
      tipoOperacao,
      filial,
      filters.filtroServico,
      filters.filtroOpPadrao,
      extractDataFromResponse,
      normalizeData,
      calculateTotals,
    ]
  );

  /**
   * Função de refresh manual
   */
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Buscar dados automaticamente ao focar na tela
   */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  return {
    data,
    loading,
    refreshing,
    totals,
    error,
    refresh,
  };
};

export default useMonitorData;
