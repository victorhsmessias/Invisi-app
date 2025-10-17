import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useFilterLoader } from "./useFilterLoader";

export const useGlobalFilters = () => {
  const { state } = useApp();
  const { loadFiltersForFilial, hasValidCache, isLoading } = useFilterLoader();

  const hasInitialized = useRef(false);
  const lastFilialRef = useRef(state.selectedFilial);
  const userHasModifiedFilters = useRef(false);

  const [selectedFilters, setSelectedFilters] = useState({
    servicos: [],
    opPadrao: [],
    grupos: [],
    produtos: [],
  });

  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      const currentFilial = state.selectedFilial;

      if (lastFilialRef.current !== currentFilial) {
        hasInitialized.current = false;
        userHasModifiedFilters.current = false;
        lastFilialRef.current = currentFilial;
      }

      if (!hasValidCache(currentFilial)) {
        loadFiltersForFilial(currentFilial);
      }
    }
  }, [state.isLoggedIn, state.selectedFilial]);

  useEffect(() => {
    const { grupos, produtos, opPadrao, servicos } = state.filterOptions;

    if (
      grupos.length > 0 &&
      produtos.length > 0 &&
      !hasInitialized.current &&
      !userHasModifiedFilters.current
    ) {
      setSelectedFilters({
        servicos: [...servicos],
        opPadrao: [...opPadrao],
        grupos: [...grupos],
        produtos: [...produtos],
      });

      hasInitialized.current = true;
    }
  }, [state.filterOptions.grupos.length, state.filterOptions.produtos.length]);

  const toggleFilter = useCallback((filterType, value) => {
    setSelectedFilters((prev) => {
      const currentArray = prev[filterType];
      const isCurrentlySelected = currentArray.includes(value);
      const newArray = isCurrentlySelected
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      userHasModifiedFilters.current = true;

      return {
        ...prev,
        [filterType]: newArray,
      };
    });
  }, []);

  const removeFilter = useCallback((type, value) => {
    userHasModifiedFilters.current = true;
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }));
  }, []);

  const applyFilters = useCallback((filters) => {
    userHasModifiedFilters.current = true;
    setSelectedFilters((prev) => ({
      ...prev,
      ...filters,
    }));
  }, []);

  const resetFilters = useCallback(() => {

    userHasModifiedFilters.current = true;
    setSelectedFilters({
      servicos: [],
      opPadrao: [],
      grupos: [],
      produtos: [],
    });
  }, []);

  const getApiFilters = useCallback(() => {
    const hasAnyFilters =
      selectedFilters.servicos.length > 0 ||
      selectedFilters.opPadrao.length > 0 ||
      selectedFilters.grupos.length > 0 ||
      selectedFilters.produtos.length > 0;

    if (!hasAnyFilters) {
      const { grupos, produtos, opPadrao, servicos } = state.filterOptions;

      const filtroServico = {
        armazenagem: servicos.includes("armazenagem") ? 1 : 0,
        transbordo: servicos.includes("transbordo") ? 1 : 0,
        pesagem: servicos.includes("pesagem") ? 1 : 0,
      };

      const filtroOpPadrao = {
        rodo_ferro: opPadrao.includes("rodo_ferro") ? 1 : 0,
        ferro_rodo: opPadrao.includes("ferro_rodo") ? 1 : 0,
        rodo_rodo: opPadrao.includes("rodo_rodo") ? 1 : 0,
        outros: opPadrao.includes("outros") ? 1 : 0,
      };

      const filtroGrupo =
        grupos.length > 0 ? grupos.map((grupo) => ({ grupo })) : null;
      const filtroTpProd =
        produtos.length > 0
          ? produtos.map((produto) => ({ tp_prod: produto }))
          : null;

      return {
        filtroServico,
        filtroOpPadrao,
        filtroGrupo,
        filtroTpProd,
      };
    }

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

    const filtroGrupo =
      selectedFilters.grupos.length > 0
        ? selectedFilters.grupos.map((grupo) => ({ grupo }))
        : null;

    const filtroTpProd =
      selectedFilters.produtos.length > 0
        ? selectedFilters.produtos.map((produto) => ({ tp_prod: produto }))
        : null;

    return {
      filtroServico,
      filtroOpPadrao,
      filtroGrupo,
      filtroTpProd,
    };
  }, [selectedFilters, state.filterOptions]);

  return {
    selectedFilters,

    toggleFilter,
    removeFilter,
    applyFilters,
    resetFilters,
    getApiFilters,

    isLoading,
    filterOptions: state.filterOptions,

    hasValidCache: () => hasValidCache(state.selectedFilial),
    forceReload: () => loadFiltersForFilial(state.selectedFilial),
  };
};
