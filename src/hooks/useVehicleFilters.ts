import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useFilterLoader } from "./useFilterLoader";
import { DEFAULT_FILTERS } from "../constants";

export const useVehicleFilters = () => {
  const { state } = useApp();
  const { loadBasicFilters, hasValidCache } = useFilterLoader();

  const [filtroServico, setFiltroServico] = useState(DEFAULT_FILTERS.servico);
  const [filtroOpPadrao, setFiltroOpPadrao] = useState(
    DEFAULT_FILTERS.opPadrao
  );

  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      if (!hasValidCache(state.selectedFilial)) {
        if (__DEV__) {
          console.log(
            `[useVehicleFilters] Carregando filtros básicos para ${state.selectedFilial}`
          );
        }

        loadBasicFilters(state.selectedFilial)
          .then((basicFilters) => {
            if (basicFilters && __DEV__) {
              console.log("[useVehicleFilters] Filtros básicos carregados:", {
                servicos: basicFilters.servicos.length,
                opPadrao: basicFilters.opPadrao.length,
              });
            }
          })
          .catch((error) => {
            if (__DEV__) {
              console.error(
                "[useVehicleFilters] Erro ao carregar filtros básicos:",
                error
              );
            }
          });
      }
    }
  }, [state.isLoggedIn, state.selectedFilial, hasValidCache, loadBasicFilters]);

  useEffect(() => {
    setFiltroServico(DEFAULT_FILTERS.servico);
    setFiltroOpPadrao(DEFAULT_FILTERS.opPadrao);
  }, [state.selectedFilial]);

  const updateFiltroServico = useCallback((novoFiltro) => {
    setFiltroServico(novoFiltro);
    if (__DEV__) {
      console.log("[useVehicleFilters] Filtro serviço atualizado:", novoFiltro);
    }
  }, []);

  const updateFiltroOpPadrao = useCallback((novoFiltro) => {
    setFiltroOpPadrao(novoFiltro);
    if (__DEV__) {
      console.log(
        "[useVehicleFilters] Filtro op_padrão atualizado:",
        novoFiltro
      );
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFiltroServico(DEFAULT_FILTERS.servico);
    setFiltroOpPadrao(DEFAULT_FILTERS.opPadrao);
    if (__DEV__) {
      console.log("[useVehicleFilters] Filtros resetados para padrão");
    }
  }, []);

  const hasActiveFilters = useCallback(() => {
    const servicoAtivo =
      JSON.stringify(filtroServico) !== JSON.stringify(DEFAULT_FILTERS.servico);
    const opPadraoAtivo =
      JSON.stringify(filtroOpPadrao) !==
      JSON.stringify(DEFAULT_FILTERS.opPadrao);
    return servicoAtivo || opPadraoAtivo;
  }, [filtroServico, filtroOpPadrao]);

  return {
    filtroServico,
    filtroOpPadrao,
    setFiltroServico: updateFiltroServico,
    setFiltroOpPadrao: updateFiltroOpPadrao,
    resetFilters,
    hasActiveFilters,
    servicosOptions: state.filterOptions.servicos || [
      "armazenagem",
      "transbordo",
      "pesagem",
    ],
    opPadraoOptions: state.filterOptions.opPadrao || [
      "rodo_ferro",
      "ferro_rodo",
      "rodo_rodo",
      "outros",
    ],
    isLoading: state.filtersLoading,
    hasValidCache: () => hasValidCache(state.selectedFilial),
  };
};
