import { useState, useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";
import { handleError } from "../utils/errorHandler";
import { DEFAULT_FILTERS } from "../constants";

export const useVehicleData = (screenType) => {
  const { state } = useApp();
  const [responseData, setResponseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [filtroServico, setFiltroServico] = useState(DEFAULT_FILTERS.servico);
  const [filtroOpPadrao, setFiltroOpPadrao] = useState(
    DEFAULT_FILTERS.opPadrao
  );

  const isRequestInProgress = useRef(false);

  const extractDataFromResponse = (response, screenType) => {
    if (!response || !response.dados) {
      if (__DEV__) {
        console.log(
          `[${screenType}] Response missing 'dados' property:`,
          response
        );
      }
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
      if (__DEV__) {
        console.log(`[${screenType}] Unknown screen type`);
      }
      return [];
    }

    const pathParts = dataPath.split(".");
    let data = response;

    for (const part of pathParts) {
      data = data[part];
      if (!data) {
        if (__DEV__) {
          console.log(
            `[${screenType}] Data not found at path: ${dataPath}`,
            response
          );
        }
        return [];
      }
    }

    if (!Array.isArray(data)) {
      if (__DEV__) {
        console.log(`[${screenType}] Data is not an array:`, data);
      }
      return [];
    }

    if (__DEV__) {
      console.log(`[${screenType}] Extracted data:`, data);
    }
    return data;
  };

  const fetchData = useCallback(
    async (overrideFilters = null) => {
      if (!state.isLoggedIn) return;

      if (isRequestInProgress.current) {
        if (__DEV__) {
          console.log(
            `[useVehicleData] Request already in progress for ${screenType}, skipping...`
          );
        }
        return;
      }

      const currentFiltroServico =
        overrideFilters?.filtroServico || filtroServico;
      const currentFiltroOpPadrao =
        overrideFilters?.filtroOpPadrao || filtroOpPadrao;

      if (__DEV__) {
        console.log(
          `[useVehicleData] Fetching data for ${screenType} with filters:`,
          {
            filtroServico: currentFiltroServico,
            filtroOpPadrao: currentFiltroOpPadrao,
            isOverride: !!overrideFilters,
          }
        );
      }

      try {
        isRequestInProgress.current = true;
        setLoading(true);
        setError(null);

        let response;

        switch (screenType) {
          case "transito":
            response = await apiService.getTransitoData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "fila_descarga":
            response = await apiService.getFilaDescargaData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "fila_carga":
            response = await apiService.getFilaCargaData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "patio_descarga":
            response = await apiService.getPatioDescargaData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "patio_carga":
            response = await apiService.getPatioCargaData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "descargas_hoje":
            response = await apiService.getDescargasHojeData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "cargas_hoje":
            response = await apiService.getCargasHojeData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          case "contratos":
            response = await apiService.getContratosData(
              state.selectedFilial,
              currentFiltroServico,
              currentFiltroOpPadrao
            );
            break;

          default:
            throw new Error("Tipo de tela inválido");
        }

        if (__DEV__) {
          console.log(`[${screenType}] Full API Response:`, response);
        }

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
        isRequestInProgress.current = false;
      }
    },
    [screenType, state.selectedFilial, state.isLoggedIn]
  );

  useEffect(() => {
    if (state.isLoggedIn) {
      fetchData();
    }
  }, [fetchData, state.isLoggedIn]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const applyFiltersAndRefresh = useCallback(
    async (newFiltroServico, newFiltroOpPadrao) => {
      if (__DEV__) {
        console.log(
          `[useVehicleData] Applying new filters for ${screenType}:`,
          {
            newFiltroServico,
            newFiltroOpPadrao,
          }
        );
      }

      setFiltroServico(newFiltroServico);
      setFiltroOpPadrao(newFiltroOpPadrao);

      await fetchData({
        filtroServico: newFiltroServico,
        filtroOpPadrao: newFiltroOpPadrao,
      });
    },
    [fetchData, screenType]
  );

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
    applyFiltersAndRefresh,
  };
};
