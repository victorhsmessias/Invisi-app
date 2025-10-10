import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import apiService from "../services/apiService";
import type { Filial } from "../constants/api";

export const useMonitorData = (tipoOperacao, filial, filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totals, setTotals] = useState({ veiculos: 0, peso: 0 });
  const [error, setError] = useState(null);
  const isRequestInProgress = useRef(false);
  const DATA_PATH_MAP = {
    monitor_transito: "dados.listaTransito.transitoVeiculos",
    monitor_fila_desc: "dados.listaFilaDescarga.filaDescargaVeiculos",
    monitor_fila_carga: "dados.listaFilaCarga.filaCargaVeiculos",
    monitor_patio_desc: "dados.listaPatioDescarga.patioDescargaVeiculos",
    monitor_patio_carga: "dados.listaPatioCarga.patioCargaVeiculos",
    monitor_descarga: "dados.listaDescarga.DescargaVeiculos",
    monitor_carga: "dados.listaCarga.CargaVeiculos",
  };

  const FIELD_PREFIXES = {
    monitor_transito: "t_",
    monitor_fila_desc: "fd_",
    monitor_fila_carga: "fc_",
    monitor_patio_desc: "pd_",
    monitor_patio_carga: "pc_",
    monitor_descarga: "d_",
    monitor_carga: "c_",
  };

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

      const pathParts = dataPath.split(".");
      let extractedData = response;

      for (const part of pathParts) {
        extractedData = extractedData[part];
        if (!extractedData) {
          if (__DEV__) {
            console.log(`[useMonitorData] Data not found at path: ${dataPath}`);
          }
          return [];
        }
      }

      if (!Array.isArray(extractedData)) {
        if (__DEV__) {
          console.log(`[useMonitorData] Data is not an array:`, extractedData);
        }
        return [];
      }

      return extractedData;
    },
    [tipoOperacao]
  );

  const normalizeData = useCallback(
    (rawData) => {
      const prefix = FIELD_PREFIXES[tipoOperacao];
      if (!prefix) return rawData;

      return rawData.map((item) => {
        const normalizedItem = {};

        Object.keys(item).forEach((key) => {
          if (key.startsWith(prefix)) {
            const normalizedKey = key.substring(prefix.length);
            normalizedItem[normalizedKey] = item[key];
          }
          normalizedItem[key] = item[key];
        });

        return normalizedItem;
      });
    },
    [tipoOperacao]
  );

  const calculateTotals = useCallback((dataArray) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { veiculos: 0, peso: 0, grupos: 0 };
    }

    const totalVehicles = dataArray.reduce((sum, item) => {
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

  const fetchData = useCallback(
    async (isRefreshing = false) => {
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

        if (__DEV__) {
          console.log(`[useMonitorData] Fetching ${tipoOperacao} for filial ${filial}`);
        }

        let jsonResponse;

        switch (tipoOperacao) {
          case "monitor_transito":
            jsonResponse = await apiService.getTransitoData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_fila_desc":
            jsonResponse = await apiService.getFilaDescargaData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_fila_carga":
            jsonResponse = await apiService.getFilaCargaData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_patio_desc":
            jsonResponse = await apiService.getPatioDescargaData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_patio_carga":
            jsonResponse = await apiService.getPatioCargaData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_descarga":
            jsonResponse = await apiService.getDescargasHojeData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          case "monitor_carga":
            jsonResponse = await apiService.getCargasHojeData(
              filial as Filial,
              filters.filtroServico,
              filters.filtroOpPadrao
            );
            break;
          default:
            throw new Error(`Tipo de operação desconhecido: ${tipoOperacao}`);
        }

        if (__DEV__) {
          console.log(
            `[useMonitorData] Response for ${tipoOperacao}:`,
            jsonResponse
          );
        }

        const extractedData = extractDataFromResponse(jsonResponse);

        const normalizedData = normalizeData(extractedData);

        const calculatedTotals = calculateTotals(normalizedData);

        setData(normalizedData);
        setTotals(calculatedTotals);
      } catch (err) {
        console.error(`[useMonitorData] Error for ${tipoOperacao}:`, err);
        setError(err.message || "Erro ao carregar dados. Tente novamente.");
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

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

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
