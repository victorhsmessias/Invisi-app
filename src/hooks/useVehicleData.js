import { useState, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";
import { handleError } from "../utils/errorHandler";

export const useVehicleData = (screenType) => {
  const { state } = useApp();
  const [responseData, setResponseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [filtroServico, setFiltroServico] = useState({
    armazenagem: 1,
    transbordo: 1,
    pesagem: 0,
  });
  const [filtroOpPadrao, setFiltroOpPadrao] = useState({
    rodo_ferro: 1,
    ferro_rodo: 1,
    rodo_rodo: 1,
    outros: 0,
  });

  const extractDataFromResponse = (response, screenType) => {
    // Verificar se a resposta tem a estrutura esperada
    if (!response || !response.dados) {
      console.log(
        `[${screenType}] Response missing 'dados' property:`,
        response
      );
      return [];
    }

    const dataMap = {
      transito: "dados.listaTransito.transitoVeiculos",
      fila_descarga: "dados.listaFilaDescarga.filaDescargaVeiculos",
      fila_carga: "dados.listaFilaCarga.filaCargaVeiculos",
      patio_descarga: "dados.listaPatioDescarga.patioDescargaVeiculos",
      patio_carga: "dados.listaPatioCarga.patioCargaVeiculos",
      descargas_hoje: "dados.listaDescarga.DescargaVeiculos",
      cargas_hoje: "dados.listaCarga.CargaVeiculos",
      contratos: "dados.CortesFila",
    };

    const dataPath = dataMap[screenType];
    if (!dataPath) {
      console.log(`[${screenType}] Unknown screen type`);
      return [];
    }

    const pathParts = dataPath.split(".");
    let data = response;

    for (const part of pathParts) {
      data = data[part];
      if (!data) {
        console.log(
          `[${screenType}] Data not found at path: ${dataPath}`,
          response
        );
        return [];
      }
    }

    // Garantir que retornamos um array
    if (!Array.isArray(data)) {
      console.log(`[${screenType}] Data is not an array:`, data);
      return [];
    }

    console.log(`[${screenType}] Extracted data:`, data);
    return data;
  };

  const fetchData = useCallback(async () => {
    if (!state.isLoggedIn) return;

    console.log(
      `[useVehicleData] Fetching data for ${screenType} with filters:`,
      {
        filtroServico,
        filtroOpPadrao,
      }
    );

    try {
      setLoading(true);
      setError(null);

      let response;

      switch (screenType) {
        case "transito":
          response = await apiService.getTransitoData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "fila_descarga":
          response = await apiService.getFilaDescargaData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "fila_carga":
          response = await apiService.getFilaCargaData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "patio_descarga":
          response = await apiService.getPatioDescargaData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "patio_carga":
          response = await apiService.getPatioCargaData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "descargas_hoje":
          response = await apiService.getDescargasHojeData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "cargas_hoje":
          response = await apiService.getCargasHojeData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        case "contratos":
          response = await apiService.getContratosData(
            state.selectedFilial,
            filtroServico,
            filtroOpPadrao
          );
          break;

        default:
          throw new Error("Tipo de tela inválido");
      }

      console.log(`[${screenType}] Full API Response:`, response);

      // Extrair dados da estrutura aninhada
      const extractedData = extractDataFromResponse(response, screenType);

      setResponseData(extractedData);
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
  }, [
    screenType,
    state.selectedFilial,
    state.isLoggedIn,
    filtroServico,
    filtroOpPadrao,
  ]);

  useEffect(() => {
    if (state.isLoggedIn) {
      fetchData();
    }
  }, [fetchData, state.isLoggedIn]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data: responseData,
    loading,
    lastUpdate,
    error,
    refresh,
    filtroServico,
    setFiltroServico,
    filtroOpPadrao,
    setFiltroOpPadrao,
  };
};
