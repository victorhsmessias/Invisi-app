import { useState, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";
import { handleError } from "../utils/errorHandler";

// Função para acessar propriedades aninhadas
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Função auxiliar para extrair dados com diferentes caminhos
const extractDataFromResponse = (response, paths) => {
  console.log('=== EXTRACT DATA DEBUG ===');
  for (const path of paths) {
    console.log(`Trying path: ${path}`);
    const data = getNestedProperty(response, path);
    console.log(`Path ${path} result:`, data);
    console.log(`Is array:`, Array.isArray(data));
    console.log(`Length:`, data?.length);

    if (Array.isArray(data) && data.length > 0) {
      console.log(`✅ Found array data with path: ${path}`);
      return data;
    }

    // Se não é array mas é um objeto, pode conter dados
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      console.log(`🔍 Found object at path: ${path}`, Object.keys(data));
      // Se o objeto tem propriedades que parecem ser arrays de dados
      const objectKeys = Object.keys(data);
      for (const key of objectKeys) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`✅ Found array in object property: ${path}.${key}`);
          return data[key];
        }
      }
    }
  }
  console.log('❌ No data found in any path');
  return [];
};

// Função para mapear dados do API para o formato esperado
const mapVehicleData = (rawData, screenType) => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map(item => ({
    // Manter dados originais
    ...item,
    // Adicionar campos padronizados
    veiculo: item.veiculo || item.placa || item.codigo || item.id,
    placa: item.placa || item.veiculo,
    status: item.status || item.situacao || "Ativo",
    situacao: item.situacao || item.status || "Ativo"
  }));
};

export const useVehicleData = (screenType) => {
  const { state } = useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!state.isLoggedIn) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      let processedData = [];

      switch (screenType) {
        case "transito":
          response = await apiService.getTransitoData(state.selectedFilial);
          console.log('=== TRANSITO DEBUG ===');
          console.log('Full response:', JSON.stringify(response, null, 2));

          // Tentar extrair dados com múltiplas estruturas possíveis
          const transitoData = extractDataFromResponse(response, [
            'dados.listaTransito.transitoVeiculos',
            'dados.listaTransito',
            'dados.transito',
            'dados.data',
            'dados.result',
            'dados.vehicles',
            'listaTransito.transitoVeiculos',
            'listaTransito',
            'transitoVeiculos',
            'transito',
            'vehicles',
            'data',
            'result',
            'dados',
            'lista'
          ]);
          console.log('Extracted transito data:', transitoData);
          processedData = mapVehicleData(transitoData, screenType);
          console.log('Mapped transito data:', processedData);
          break;

        case "fila_descarga":
          response = await apiService.getFilaDescargaData(state.selectedFilial);
          const filaDescData = extractDataFromResponse(response, [
            'dados.listaFilaDescarga.filaDescargaVeiculos',
            'dados.listaFilaDescarga',
            'dados.filaDescarga',
            'listaFilaDescarga.filaDescargaVeiculos',
            'filaDescargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(filaDescData, screenType);
          break;

        case "fila_carga":
          response = await apiService.getFilaCargaData(state.selectedFilial);
          const filaCargaData = extractDataFromResponse(response, [
            'dados.listaFilaCarga.filaCargaVeiculos',
            'dados.listaFilaCarga',
            'dados.filaCarga',
            'listaFilaCarga.filaCargaVeiculos',
            'filaCargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(filaCargaData, screenType);
          break;

        case "patio_descarga":
          response = await apiService.getPatioDescargaData(state.selectedFilial);
          const patioDescData = extractDataFromResponse(response, [
            'dados.listaPatioDescarga.patioDescargaVeiculos',
            'dados.listaPatioDescarga',
            'dados.patioDescarga',
            'listaPatioDescarga.patioDescargaVeiculos',
            'patioDescargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(patioDescData, screenType);
          break;

        case "patio_carga":
          response = await apiService.getPatioCargaData(state.selectedFilial);
          const patioCargaData = extractDataFromResponse(response, [
            'dados.listaPatioCarga.patioCargaVeiculos',
            'dados.listaPatioCarga',
            'dados.patioCarga',
            'listaPatioCarga.patioCargaVeiculos',
            'patioCargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(patioCargaData, screenType);
          break;

        case "descargas_hoje":
          response = await apiService.getDescargasHojeData(state.selectedFilial);
          const descargasData = extractDataFromResponse(response, [
            'dados.listaDescarga.DescargaVeiculos',
            'dados.listaDescarga',
            'dados.descarga',
            'listaDescarga.DescargaVeiculos',
            'DescargaVeiculos',
            'descargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(descargasData, screenType);
          break;

        case "cargas_hoje":
          response = await apiService.getCargasHojeData(state.selectedFilial);
          const cargasData = extractDataFromResponse(response, [
            'dados.listaCarga.CargaVeiculos',
            'dados.listaCarga',
            'dados.carga',
            'listaCarga.CargaVeiculos',
            'CargaVeiculos',
            'cargaVeiculos',
            'dados',
            'lista'
          ]);
          processedData = mapVehicleData(cargasData, screenType);
          break;

        default:
          throw new Error("Tipo de tela inválido");
      }

      console.log(`[${screenType}] Response:`, response);
      console.log(`[${screenType}] Response Keys:`, Object.keys(response || {}));
      if (response?.dados) {
        console.log(`[${screenType}] Dados Keys:`, Object.keys(response.dados));
        if (response.dados.listaTransito) {
          console.log(`[${screenType}] ListaTransito Keys:`, Object.keys(response.dados.listaTransito));
        }
      }
      console.log(`[${screenType}] Processed Data:`, processedData);
      console.log(`[${screenType}] Processed Data Length:`, processedData.length);

      setData(processedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(`[${screenType}] Error:`, err);
      const errorResult = handleError(err, {
        showAlert: false,
        context: `carregamento de dados de ${screenType}`,
      });
      setError(errorResult.message);
    } finally {
      setLoading(false);
    }
  }, [screenType, state.selectedFilial, state.isLoggedIn]);

  // Auto-fetch when component mounts or filial changes
  useEffect(() => {
    if (state.isLoggedIn) {
      fetchData();
    }
  }, [fetchData, state.isLoggedIn]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    lastUpdate,
    error,
    refresh,
  };
};