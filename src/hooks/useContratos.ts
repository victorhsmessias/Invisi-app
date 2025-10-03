import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "../context/AppContext";
import { STORAGE_KEYS, OP_PADRAO_LABELS } from "../constants";
import apiService from "../services/apiService";

export const useContratos = () => {
  const { state, actions } = useApp();
  const [filters, setFilters] = useState({
    selectedOpPadrao: [],
    selectedServicos: ["armazenagem", "transbordo"],
    selectedGrupos: [],
    selectedProdutos: [],
  });

  const fetchFilterOptions = useCallback(async () => {
    if (!state.isLoggedIn) return;

    try {
      actions.setFiltersLoading(true);

      const [gruposData, opPadraoData, produtosData] = await Promise.all([
        apiService.getFilterOptions("fgrupo", state.selectedFilial),
        apiService.getFilterOptions("fop_padrao", state.selectedFilial),
        apiService.getFilterOptions("fproduto", state.selectedFilial),
      ]);

      const grupos = gruposData.dados?.grupos || [];
      const opPadrao = opPadraoData.dados?.op_padrao || [];
      const produtos = produtosData.dados?.produtos || [];

      const processedOptions = {
        grupos: grupos.map((grupo) => ({ key: grupo, label: grupo })),
        opPadrao: opPadrao.map((op) => ({
          key: op,
          label: OP_PADRAO_LABELS[op] || op,
        })),
        produtos: produtos.map((produto) => ({ key: produto, label: produto })),
      };

      actions.setFilterOptions(processedOptions);

      // Set all op_padrao as selected by default
      setFilters((prev) => ({
        ...prev,
        selectedOpPadrao: opPadrao,
      }));
    } catch (error) {
      console.error("Erro ao buscar opções de filtro:", error);
      actions.setError("Erro ao carregar filtros");
    } finally {
      actions.setFiltersLoading(false);
    }
  }, [state.selectedFilial, state.isLoggedIn]);

  const fetchContratosData = useCallback(async () => {
    if (!state.isLoggedIn) return;

    try {
      actions.setContratosLoading(true);
      actions.resetError();

      // Prepare filters
      const filtroOpPadrao = {};
      state.filterOptions.opPadrao.forEach((op) => {
        filtroOpPadrao[op.key] = filters.selectedOpPadrao.includes(op.key) ? 1 : 0;
      });

      const filtroServico = {
        armazenagem: filters.selectedServicos.includes("armazenagem") ? 1 : 0,
        transbordo: filters.selectedServicos.includes("transbordo") ? 1 : 0,
        pesagem: filters.selectedServicos.includes("pesagem") ? 1 : 0,
      };

      const filtroGrupo = filters.selectedGrupos.map((grupo) => ({ grupo }));
      const filtroTpProd = filters.selectedProdutos.map((produto) => ({
        tp_prod: produto,
      }));

      const requestFilters = {
        filtro_filial: state.selectedFilial,
        filtro_servico: filtroServico,
        filtro_op_padrao: filtroOpPadrao,
        filtro_grupo: filtroGrupo,
        filtro_tp_prod: filtroTpProd,
      };

      const data = await apiService.getContratosData(requestFilters);

      if (data.mensagemRetorno?.codigo === "ERRO") {
        actions.setContratosData([], new Date());
        actions.setError(
          data.mensagemRetorno.mensagem || "Erro ao carregar dados"
        );
      } else if (data.dados?.CortesFila) {
        const contratosData = data.dados.CortesFila;
        actions.setContratosData(contratosData, new Date());

        // Save to cache
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONTRATOS_CACHE,
          JSON.stringify({
            data: contratosData,
            timestamp: Date.now(),
            filial: state.selectedFilial,
            filters,
          })
        );
      } else {
        actions.setContratosData([], new Date());
        actions.setError("Nenhum dado disponível");
      }
    } catch (error) {
      console.error("Erro ao buscar dados de contratos:", error);
      actions.setError("Erro ao carregar dados");

      // Try to load from cache
      await loadFromCache();
    } finally {
      actions.setContratosLoading(false);
    }
  }, [
    state.selectedFilial,
    state.isLoggedIn,
    state.filterOptions.opPadrao,
    filters,
  ]);

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CONTRATOS_CACHE);
      if (cached) {
        const { data, filial } = JSON.parse(cached);
        if (filial === state.selectedFilial) {
          actions.setContratosData(data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cache de contratos:", error);
    }
  };

  // Filter management functions
  const toggleFilter = useCallback((filterType, value) => {
    setFilters((prev) => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
  }, []);

  const toggleOpPadraoFilter = useCallback(
    (value) => toggleFilter("selectedOpPadrao", value),
    [toggleFilter]
  );

  const toggleServicoFilter = useCallback(
    (value) => toggleFilter("selectedServicos", value),
    [toggleFilter]
  );

  const toggleGrupoFilter = useCallback(
    (value) => toggleFilter("selectedGrupos", value),
    [toggleFilter]
  );

  const toggleProdutoFilter = useCallback(
    (value) => toggleFilter("selectedProdutos", value),
    [toggleFilter]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      selectedOpPadrao: state.filterOptions.opPadrao.map((op) => op.key),
      selectedServicos: ["armazenagem", "transbordo"],
      selectedGrupos: [],
      selectedProdutos: [],
    });
  }, [state.filterOptions.opPadrao]);

  // Load filter options when component mounts or filial changes
  useEffect(() => {
    if (state.isLoggedIn) {
      fetchFilterOptions();
    }
  }, [fetchFilterOptions]);

  const refresh = useCallback(async () => {
    await fetchContratosData();
  }, [fetchContratosData]);

  return {
    data: state.contratosData,
    loading: state.contratosLoading,
    lastUpdate: state.contratosLastUpdate,
    filterOptions: state.filterOptions,
    filtersLoading: state.filtersLoading,
    filters,
    toggleOpPadraoFilter,
    toggleServicoFilter,
    toggleGrupoFilter,
    toggleProdutoFilter,
    resetFilters,
    fetchContratosData,
    refresh,
    error: state.error,
  };
};