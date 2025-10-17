import { useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";
import {
  FALLBACK_SERVICOS,
  FALLBACK_OP_PADRAO,
  FALLBACK_GRUPOS,
  FALLBACK_PRODUTOS,
  getFallbackGruposStrings,
  getFallbackProdutosStrings,
  logFallbackUsage,
} from "../constants/fallbacks";
import { MEDIUM_DELAY } from "../constants/timing";

export const useFilterLoader = () => {
  const { state, actions } = useApp();
  const loadingRef = useRef(new Set());

  const stateRef = useRef(state);
  const actionsRef = useRef(actions);

  useEffect(() => {
    stateRef.current = state;
    actionsRef.current = actions;
  }, [state, actions]);

  const getCurrentCache = useCallback((filial) => {
    const cache = stateRef.current.filtersCache[filial];
    const expiry = stateRef.current.filtersCacheExpiry[filial];
    return { cache, expiry, isValid: cache && expiry && Date.now() < expiry };
  }, []);

  const hasValidCache = useCallback(
    (filial) => {
      const { isValid } = getCurrentCache(filial);
      return isValid;
    },
    [getCurrentCache]
  );

  const loadFiltersForFilial = useCallback(
    async (filial) => {
      if (!filial) return null;

      const { cache, isValid } = getCurrentCache(filial);

      if (isValid) {

        if (filial === stateRef.current.selectedFilial) {
          actionsRef.current.setFilterOptions(cache);
        }

        return cache;
      }

      const loadingKey = `filters_${filial}`;
      if (loadingRef.current.has(loadingKey)) {
        return null;
      }

      try {
        loadingRef.current.add(loadingKey);
        actionsRef.current.setFiltersLoading(true);

        const [
          servicosResponse,
          opPadraoResponse,
          gruposResponse,
          produtosResponse,
        ] = await Promise.all([
          apiService.getServicosFilter(filial),
          apiService.getOpPadraoFilter(filial),
          apiService.getGruposFilter(filial),
          apiService.getProdutosFilter(filial),
        ]);

        const filterData = {
          servicos: servicosResponse.dados?.servicos || FALLBACK_SERVICOS,
          opPadrao: opPadraoResponse.dados?.op_padrao || FALLBACK_OP_PADRAO,
          grupos: gruposResponse.dados?.grupos || getFallbackGruposStrings(),
          produtos:
            produtosResponse.dados?.produtos || getFallbackProdutosStrings(),
        };

        actionsRef.current.setFiltersCache(filial, filterData);

        if (filial === stateRef.current.selectedFilial) {
          actionsRef.current.setFilterOptions(filterData);
        }

        return filterData;
      } catch (error) {
        console.error(
          `[useFilterLoader] Erro ao carregar filtros para ${filial}:`,
          error
        );

        logFallbackUsage(
          "filtros completos",
          `loadFiltersForFilial - Erro ao carregar filtros para ${filial}`
        );
        const fallbackData = {
          servicos: FALLBACK_SERVICOS,
          opPadrao: FALLBACK_OP_PADRAO,
          grupos: getFallbackGruposStrings(),
          produtos: getFallbackProdutosStrings(),
        };

        actionsRef.current.setFiltersCache(filial, fallbackData);

        if (filial === stateRef.current.selectedFilial) {
          actionsRef.current.setFilterOptions(fallbackData);
        }

        return fallbackData;
      } finally {
        loadingRef.current.delete(loadingKey);
        actionsRef.current.setFiltersLoading(false);
      }
    },
    [getCurrentCache]
  );

  const preloadAllFilters = useCallback(async () => {
    try {
      const filiais = ["LDA", "CHP", "FND", "NMD", "NMG"];

      const filiaisToLoad = filiais.filter((filial) => {
        const { isValid } = getCurrentCache(filial);
        return !isValid;
      });

      if (filiaisToLoad.length === 0) {
        return;
      }

      const loadPromises = filiaisToLoad.map((filial) =>
        loadFiltersForFilial(filial)
      );

      const results = await Promise.allSettled(loadPromises);

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
      const failed = results.filter((r) => r.status === "rejected").length;
    } catch (error) {
      console.error(
        "[useFilterLoader] Erro no precarregamento de filtros:",
        error
      );
    }
  }, [getCurrentCache, loadFiltersForFilial]);

  const loadBasicFilters = useCallback(
    async (filial) => {
      if (!filial) return null;

      const { cache, isValid } = getCurrentCache(filial);

      if (isValid && cache) {
        return {
          servicos: cache.servicos,
          opPadrao: cache.opPadrao,
        };
      }

      const loadingKey = `basic_filters_${filial}`;
      if (loadingRef.current.has(loadingKey)) {
        return null;
      }

      try {
        loadingRef.current.add(loadingKey);

        const [servicosResponse, opPadraoResponse] = await Promise.all([
          apiService.getServicosFilter(filial),
          apiService.getOpPadraoFilter(filial),
        ]);

        const basicFilters = {
          servicos: servicosResponse.dados?.servicos || FALLBACK_SERVICOS,
          opPadrao: opPadraoResponse.dados?.op_padrao || FALLBACK_OP_PADRAO,
        };

        const existingCache = stateRef.current.filtersCache[filial] || {};
        const updatedCache = {
          ...existingCache,
          ...basicFilters,
          grupos: existingCache.grupos || [],
          produtos: existingCache.produtos || [],
        };

        actionsRef.current.setFiltersCache(filial, updatedCache);

        return basicFilters;
      } catch (error) {
        console.error(
          `[useFilterLoader] Erro ao carregar filtros básicos para ${filial}:`,
          error
        );

        logFallbackUsage(
          "filtros básicos",
          `loadBasicFilters - Erro ao carregar para ${filial}`
        );
        return {
          servicos: FALLBACK_SERVICOS,
          opPadrao: FALLBACK_OP_PADRAO,
        };
      } finally {
        loadingRef.current.delete(loadingKey);
      }
    },
    [getCurrentCache]
  );

  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      loadFiltersForFilial(state.selectedFilial);

      const timer = setTimeout(() => {
        preloadAllFilters();
      }, MEDIUM_DELAY);

      return () => clearTimeout(timer);
    }
  }, [state.isLoggedIn]);

  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      loadFiltersForFilial(state.selectedFilial);
    }
  }, [state.selectedFilial]);

  return {
    loadFiltersForFilial,
    preloadAllFilters,
    loadBasicFilters,

    hasValidCache,

    isLoading: state.filtersLoading,
    filterOptions: state.filterOptions,
    clearCache: actions.clearFiltersCache,
  };
};
