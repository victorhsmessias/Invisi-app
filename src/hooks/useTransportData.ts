import { useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../context/AppContext";
import { API_CONFIG, STORAGE_KEYS } from "../constants";
import apiService from "../services/apiService";
import { processUnifiedDashboardResponse } from "../utils/apiAdapters";
import type { TransportData } from "../types";

interface FetchOptions {
  silent?: boolean;
  source?: "manual" | "background";
}

interface CachedTransportData {
  data: TransportData;
  timestamp: number;
  filial: string;
}

interface UseTransportDataReturn {
  data: TransportData;
  loading: boolean;
  lastUpdate: Date | null;
  refresh: (options?: FetchOptions) => Promise<void>;
  silentRefresh: () => Promise<void>;
  error: string | null;
}

export const useTransportData = (): UseTransportDataReturn => {
  const { state, actions } = useApp();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TRANSPORT_CACHE);
      if (cached) {
        const { data, timestamp, filial }: CachedTransportData =
          JSON.parse(cached);

        if (
          filial === state.selectedFilial &&
          Date.now() - timestamp < API_CONFIG.CACHE_TIME
        ) {
          actionsRef.current.setTransportData(data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
    }
  }, [state.selectedFilial]);

  const fetchTransportData = useCallback(
    async (options: FetchOptions = {}) => {
      if (!state.isLoggedIn) return;

      const { silent = false, source = "manual" } = options;

      try {
        if (!silent) {
          actionsRef.current.setTransportLoading(true);
        }
        actionsRef.current.resetError();

        // NOVA IMPLEMENTAÇÃO: 1 requisição unificada ao invés de 7 paralelas
        const response = await apiService.getAllDashboardData(
          state.selectedFilial
        );

        // Processa a resposta unificada
        const counts = processUnifiedDashboardResponse(response);

        const processedData: TransportData = {
          emTransito: counts.transito,
          filaDescarga: counts.filaDescarga,
          filaCarga: counts.filaCarga,
          patioDescarregando: counts.patioDescarga,
          patioCarregando: counts.patioCarga,
          descargasHoje: counts.descargasHoje,
          cargasHoje: counts.cargasHoje,
        };

        actionsRef.current.setTransportData(processedData);

        await AsyncStorage.setItem(
          STORAGE_KEYS.TRANSPORT_CACHE,
          JSON.stringify({
            data: processedData,
            timestamp: Date.now(),
            filial: state.selectedFilial,
          })
        );
      } catch (error) {
        console.error("Erro ao buscar dados de transporte:", error);

        if (source !== "background") {
          actionsRef.current.setError("Erro ao carregar dados de transporte");
        }

        await loadFromCache();
      } finally {
        if (!silent) {
          actionsRef.current.setTransportLoading(false);
        }
      }
    },
    [state.selectedFilial, state.isLoggedIn, loadFromCache]
  );

  useEffect(() => {
    if (!state.isLoggedIn) return;

    fetchTransportData();

    intervalRef.current = setInterval(() => {
      fetchTransportData({ silent: true, source: "background" });
    }, API_CONFIG.AUTO_REFRESH);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.selectedFilial, state.isLoggedIn]);

  const refresh = useCallback(
    async (options: FetchOptions = {}) => {
      await fetchTransportData(options);
    },
    [fetchTransportData]
  );

  const silentRefresh = useCallback(async () => {
    await fetchTransportData({ silent: true, source: "background" });
  }, [fetchTransportData]);

  return {
    data: state.transportData,
    loading: state.transportLoading,
    lastUpdate: state.transportLastUpdate,
    refresh,
    silentRefresh,
    error: state.error,
  };
};
