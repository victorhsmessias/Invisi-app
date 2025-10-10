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
        if (__DEV__) {
          console.log(
            `[useGlobalFilters] Filial mudou para ${currentFilial}, resetando flags`
          );
        }
      }

      if (!hasValidCache(currentFilial)) {
        if (__DEV__) {
          console.log(
            `[useGlobalFilters] Carregando filtros para filial ${currentFilial}`
          );
        }
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
      if (__DEV__) {
        console.log("[useGlobalFilters] ====== INICIALIZANDO FILTROS ======");
        console.log("[useGlobalFilters] Opções carregadas:", {
          servicos: servicos.length,
          opPadrao: opPadrao.length,
          grupos: grupos.length,
          produtos: produtos.length,
        });
        console.log(
          "[useGlobalFilters] Estado atual dos selectedFilters:",
          selectedFilters
        );
      }

      setSelectedFilters({
        servicos: [...servicos],
        opPadrao: [...opPadrao],
        grupos: [...grupos],
        produtos: [...produtos],
      });

      hasInitialized.current = true;

      if (__DEV__) {
        console.log("[useGlobalFilters] Filtros inicializados com sucesso");
      }
    }
  }, [state.filterOptions.grupos.length, state.filterOptions.produtos.length]);

  const toggleFilter = useCallback((filterType, value) => {
    setSelectedFilters((prev) => {
      const currentArray = prev[filterType];
      const isCurrentlySelected = currentArray.includes(value);
      const newArray = isCurrentlySelected
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];

      if (__DEV__) {
        console.log(`[useGlobalFilters] Toggle ${filterType}.${value}:`, {
          before: currentArray,
          after: newArray,
          action: isCurrentlySelected ? "REMOVE" : "ADD",
        });
      }

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
    if (__DEV__) {
      console.log("[useGlobalFilters] ====== RESETANDO FILTROS ======");
      console.log("[useGlobalFilters] Estado antes do reset:", selectedFilters);
    }

    userHasModifiedFilters.current = true;
    setSelectedFilters({
      servicos: [],
      opPadrao: [],
      grupos: [],
      produtos: [],
    });

    if (__DEV__) {
      console.log("[useGlobalFilters] Filtros resetados para vazio");
    }
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

      if (__DEV__) {
        console.log(
          "[useGlobalFilters] ====== USANDO FILTROS PADRÃO (todos) ======"
        );
        console.log("[useGlobalFilters] Filtros padrão aplicados:", {
          filtroServico,
          filtroOpPadrao,
          grupos: filtroGrupo ? filtroGrupo.length : 0,
          produtos: filtroTpProd ? filtroTpProd.length : 0,
        });
      }

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

    if (__DEV__) {
      console.log(
        "[useGlobalFilters] Estado selectedFilters:",
        selectedFilters
      );
      console.log("[useGlobalFilters] Filtros convertidos para API:", {
        filtroServico,
        filtroOpPadrao,
        grupos: filtroGrupo ? filtroGrupo.length : 0,
        produtos: filtroTpProd ? filtroTpProd.length : 0,
      });
      console.log(
        "[useGlobalFilters] Serviços ativos:",
        Object.keys(filtroServico).filter((key) => filtroServico[key] === 1)
      );
      console.log(
        "[useGlobalFilters] OpPadrão ativos:",
        Object.keys(filtroOpPadrao).filter((key) => filtroOpPadrao[key] === 1)
      );
    }

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
