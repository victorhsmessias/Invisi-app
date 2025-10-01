import { useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../context/AppContext";
import { API_CONFIG, STORAGE_KEYS } from "../constants";
import apiService from "../services/apiService";
import { processVehicleCount } from "../utils/apiAdapters";

export const useTransportData = () => {
  const { state, actions } = useApp();
  const intervalRef = useRef(null);

  const fetchTransportData = useCallback(async (options = {}) => {
    if (!state.isLoggedIn) return;

    const { silent = false, source = 'manual' } = options;

    try {
      // Só mostrar loading se não for update silencioso
      if (!silent) {
        actions.setTransportLoading(true);
      }
      actions.resetError();

      // Fetch all data in parallel
      const [
        transitoData,
        filaDescargaData,
        filaCargaData,
        patioDescargaData,
        patioCargaData,
        descargasHojeData,
        cargasHojeData,
      ] = await Promise.all([
        apiService.getTransitoData(state.selectedFilial),
        apiService.getFilaDescargaData(state.selectedFilial),
        apiService.getFilaCargaData(state.selectedFilial),
        apiService.getPatioDescargaData(state.selectedFilial),
        apiService.getPatioCargaData(state.selectedFilial),
        apiService.getDescargasHojeData(state.selectedFilial),
        apiService.getCargasHojeData(state.selectedFilial),
      ]);

      // Process data usando adaptadores
      const processedData = {
        emTransito: processVehicleCount(transitoData, 'transito'),
        filaDescarga: processVehicleCount(filaDescargaData, 'filaDescarga'),
        filaCarga: processVehicleCount(filaCargaData, 'filaCarga'),
        patioDescarregando: processVehicleCount(patioDescargaData, 'patioDescarga'),
        patioCarregando: processVehicleCount(patioCargaData, 'patioCarga'),
        descargasHoje: processVehicleCount(descargasHojeData, 'descargasHoje'),
        cargasHoje: processVehicleCount(cargasHojeData, 'cargasHoje'),
      };

      // Update state
      actions.setTransportData(processedData);

      // Save to cache
      await AsyncStorage.setItem(
        STORAGE_KEYS.TRANSPORT_CACHE,
        JSON.stringify({
          data: processedData,
          timestamp: Date.now(),
          filial: state.selectedFilial,
        })
      );

      if (__DEV__ && source === 'background') {
        console.log('[useTransportData] Background update completed silently');
      }
    } catch (error) {
      console.error("Erro ao buscar dados de transporte:", error);

      // Só mostrar erro se não for update em background
      if (source !== 'background') {
        actions.setError("Erro ao carregar dados de transporte");
      }

      // Try to load from cache
      await loadFromCache();
    } finally {
      // Só resetar loading se não for update silencioso
      if (!silent) {
        actions.setTransportLoading(false);
      }
    }
  }, [state.selectedFilial, state.isLoggedIn]);

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TRANSPORT_CACHE);
      if (cached) {
        const { data, timestamp, filial } = JSON.parse(cached);

        // Check if cache is for the same filial and not too old
        if (
          filial === state.selectedFilial &&
          Date.now() - timestamp < API_CONFIG.CACHE_TIME
        ) {
          actions.setTransportData(data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cache:", error);
    }
  };

  // Função removida - agora usa apiAdapters.processVehicleCount

  // Auto-refresh effect
  useEffect(() => {
    if (state.isLoggedIn) {
      fetchTransportData();

      // Set up auto-refresh - usar modo silencioso para updates automáticos
      intervalRef.current = setInterval(() => {
        fetchTransportData({ silent: true, source: 'background' });
      }, API_CONFIG.AUTO_REFRESH);
    }

    return () => {
      // Limpar interval ao desmontar ou quando isLoggedIn mudar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchTransportData, state.isLoggedIn]);

  // Refresh when filial changes
  useEffect(() => {
    if (state.isLoggedIn) {
      // Limpar interval anterior antes de fazer novo fetch
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      fetchTransportData();

      // Recriar interval após mudança de filial
      intervalRef.current = setInterval(() => {
        fetchTransportData({ silent: true, source: 'background' });
      }, API_CONFIG.AUTO_REFRESH);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.selectedFilial, fetchTransportData, state.isLoggedIn]);

  const refresh = useCallback(async (options = {}) => {
    await fetchTransportData(options);
  }, [fetchTransportData]);

  const silentRefresh = useCallback(async () => {
    await fetchTransportData({ silent: true, source: 'background' });
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