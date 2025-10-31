import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import apiService from "../services/apiService";
import type { Filial } from "../constants/api";

type TipoOperacao =
  | "monitor_transito"
  | "monitor_fila_desc"
  | "monitor_fila_carga"
  | "monitor_patio_desc_local"
  | "monitor_patio_carga"
  | "monitor_descarga"
  | "monitor_carga";

interface MonitorFilters {
  filtro_servico?: Record<string, 0 | 1>;
  filtro_op_padrao?: Record<string, 0 | 1>;
}

interface Totals {
  veiculos: number;
  peso: number;
  grupos?: number;
}

export const useMonitorData = (
  tipoOperacao: TipoOperacao,
  filial: Filial,
  filters: MonitorFilters = {}
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totals, setTotals] = useState<Totals>({ veiculos: 0, peso: 0 });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isRequestInProgress = useRef(false);
  const DATA_PATH_MAP = {
    monitor_transito: "dados.listaTransito.transitoVeiculos",
    monitor_fila_desc: "dados.listaFilaDescarga.filaDescargaVeiculos",
    monitor_fila_carga: "dados.listaFilaCarga.filaCargaVeiculos",
    monitor_patio_desc_local: "dados.listaPatioDescarga.patioDescargaVeiculos",
    monitor_patio_carga: "dados.listaPatioCarga.patioCargaVeiculos",
    monitor_descarga: "dados.listaDescarga.DescargaVeiculos",
    monitor_carga: "dados.listaCarga.CargaVeiculos",
  };

  const FIELD_PREFIXES = {
    monitor_transito: "t_",
    monitor_fila_desc: "fd_",
    monitor_fila_carga: "fc_",
    monitor_patio_desc_local: "pd_",
    monitor_patio_carga: "pc_",
    monitor_descarga: "d_",
    monitor_carga: "c_",
  };

  const extractDataFromResponse = useCallback(
    (response: any): any[] => {
      if (!response || !response.dados) {
        return [];
      }

      const dataPath = DATA_PATH_MAP[tipoOperacao];
      if (!dataPath) {
        return [];
      }

      const pathParts = dataPath.split(".");
      let extractedData = response;

      for (const part of pathParts) {
        extractedData = extractedData[part];
        if (!extractedData) {
          return [];
        }
      }

      if (!Array.isArray(extractedData)) {
        return [];
      }

      return extractedData;
    },
    [tipoOperacao]
  );

  const normalizeData = useCallback(
    (rawData: any[]): any[] => {
      const prefix = FIELD_PREFIXES[tipoOperacao];
      if (!prefix) return rawData;

      const prefixLength = prefix.length;

      return rawData.map((item) => {
        const normalizedItem: Record<string, any> = { ...item };

        for (const key in item) {
          if (key.startsWith(prefix)) {
            const normalizedKey = key.substring(prefixLength);
            normalizedItem[normalizedKey] = item[key];
          }
        }

        if (item.lfd_data) normalizedItem.data = item.lfd_data;
        if (item.lfd_hora) normalizedItem.hora = item.lfd_hora;
        if (item.lfc_data) normalizedItem.data = item.lfc_data;
        if (item.lfc_hora) normalizedItem.hora = item.lfc_hora;

        return normalizedItem;
      });
    },
    [tipoOperacao]
  );

  const calculateTotals = useCallback((dataArray: any[]): Totals => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { veiculos: 0, peso: 0, grupos: 0 };
    }

    const result = dataArray.reduce(
      (acc, item) => {
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

        acc.veiculos += parseInt(veiculosValue || 0);
        acc.peso += parseFloat(pesoValue || 0);
        return acc;
      },
      { veiculos: 0, peso: 0 }
    );

    return {
      veiculos: result.veiculos,
      peso: result.peso,
      grupos: dataArray.length,
    };
  }, []);

  const fetchData = useCallback(
    async (isRefreshing = false): Promise<void> => {
      if (isRequestInProgress.current) {
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

        let jsonResponse;

        switch (tipoOperacao) {
          case "monitor_transito":
            jsonResponse = await apiService.getTransitoData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_fila_desc":
            jsonResponse = await apiService.getFilaDescargaData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_fila_carga":
            jsonResponse = await apiService.getFilaCargaData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_patio_desc_local":
            jsonResponse = await apiService.getPatioDescargaLocalData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_patio_carga":
            jsonResponse = await apiService.getPatioCargaData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_descarga":
            jsonResponse = await apiService.getDescargasHojeData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          case "monitor_carga":
            jsonResponse = await apiService.getCargasHojeData(
              filial as Filial,
              filters.filtro_servico,
              filters.filtro_op_padrao
            );
            break;
          default:
            throw new Error(`Tipo de operação desconhecido: ${tipoOperacao}`);
        }

        const extractedData = extractDataFromResponse(jsonResponse);

        const normalizedData = normalizeData(extractedData);

        const calculatedTotals = calculateTotals(normalizedData);

        setData(normalizedData);
        setTotals(calculatedTotals);
        setLastUpdate(new Date());
      } catch (err: any) {
        console.error(`[useMonitorData] Error for ${tipoOperacao}:`, err);
        setError(err?.message || "Erro ao carregar dados. Tente novamente.");
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
      filters.filtro_servico,
      filters.filtro_op_padrao,
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
    lastUpdate,
  };
};

export default useMonitorData;
