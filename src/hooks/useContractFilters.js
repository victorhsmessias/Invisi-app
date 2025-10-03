import { useState, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";

export const useContractFilters = () => {
  const { state } = useApp();
  const [filterOptions, setFilterOptions] = useState({
    servicos: [],
    opPadrao: [],
    grupos: [],
    produtos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedFilters, setSelectedFilters] = useState({
    servicos: ["armazenagem", "transbordo"],
    opPadrao: [],
    grupos: [],
    produtos: [],
  });

  const loadFilterOptions = useCallback(async () => {
    if (!state.isLoggedIn || !state.selectedFilial) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        servicosResponse,
        opPadraoResponse,
        gruposResponse,
        produtosResponse,
      ] = await Promise.all([
        apiService.getServicosFilter(state.selectedFilial),
        apiService.getOpPadraoFilter(state.selectedFilial),
        apiService.getGruposFilter(state.selectedFilial),
        apiService.getProdutosFilter(state.selectedFilial),
      ]);

      const newFilterOptions = {
        servicos: servicosResponse.dados?.servicos || [],
        opPadrao: opPadraoResponse.dados?.op_padrao || [],
        grupos: gruposResponse.dados?.grupos || [],
        produtos: produtosResponse.dados?.produtos || [],
      };

      setFilterOptions(newFilterOptions);

      setSelectedFilters((prev) => ({
        ...prev,
        opPadrao: newFilterOptions.opPadrao,
        grupos: newFilterOptions.grupos,
        produtos: newFilterOptions.produtos,
      }));
    } catch (err) {
      console.error("[useContractFilters] Error loading filter options:", err);
      setError("Erro ao carregar opções de filtro");

      setFilterOptions({
        servicos: ["armazenagem", "transbordo", "pesagem"],
        opPadrao: ["rodo_ferro", "ferro_rodo", "rodo_rodo", "outros"],
        grupos: ["ADM-MGA", "ATT", "CARGILL", "BTG PACTUAL S/A"],
        produtos: ["SOJA GRAOS", "MILHO GRAOS", "FARELO DE SOJA"],
      });

      setSelectedFilters({
        servicos: ["armazenagem", "transbordo"],
        opPadrao: ["rodo_ferro", "ferro_rodo", "rodo_rodo"],
        grupos: ["ADM-MGA", "ATT", "CARGILL", "BTG PACTUAL S/A"],
        produtos: ["SOJA GRAOS", "MILHO GRAOS", "FARELO DE SOJA"],
      });
    } finally {
      setLoading(false);
    }
  }, [state.isLoggedIn, state.selectedFilial]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const toggleFilter = useCallback((filterType, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedFilters({
      servicos: ["armazenagem", "transbordo"],
      opPadrao: filterOptions.opPadrao,
      grupos: filterOptions.grupos,
      produtos: filterOptions.produtos,
    });
  }, [filterOptions]);

  const getApiFilters = useCallback(() => {
    const filtroServico = {
      armazenagem: selectedFilters.servicos.includes("armazenagem") ? 1 : 0,
      transbordo: selectedFilters.servicos.includes("transbordo") ? 1 : 0,
      pesagem: selectedFilters.servicos.includes("pesagem") ? 1 : 0,
    };

    const filtroOpPadrao = {
      rodo_ferro: selectedFilters.opPadrao.includes("rodo_ferro") ? 1 : 0,
      ferro_rodo: selectedFilters.opPadrao.includes("ferro_rodo") ? 1 : 0,
      rodo_rodo: selectedFilters.opPadrao.includes("rodo_rodo") ? 1 : 0,
      outros: selectedFilters.opPadrao.includes("outros") ? 1 : 0,
    };

    const filtroGrupo = selectedFilters.grupos.map((grupo) => ({ grupo }));
    const filtroTpProd = selectedFilters.produtos.map((produto) => ({
      tp_prod: produto,
    }));

    return {
      filtroServico,
      filtroOpPadrao,
      filtroGrupo,
      filtroTpProd,
    };
  }, [selectedFilters]);

  return {
    filterOptions,
    selectedFilters,
    loading,
    error,
    toggleFilter,
    resetFilters,
    loadFilterOptions,
    getApiFilters,
  };
};
