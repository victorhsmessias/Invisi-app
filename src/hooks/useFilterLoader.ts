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
  const loadingRef = useRef(new Set()); // Controla carregamentos em progresso

  // Usar refs para acessar state atual sem causar re-renders
  const stateRef = useRef(state);
  const actionsRef = useRef(actions);

  // Manter refs atualizadas
  useEffect(() => {
    stateRef.current = state;
    actionsRef.current = actions;
  }, [state, actions]);

  // Helper para obter cache atual de forma segura
  const getCurrentCache = useCallback((filial) => {
    const cache = stateRef.current.filtersCache[filial];
    const expiry = stateRef.current.filtersCacheExpiry[filial];
    return { cache, expiry, isValid: cache && expiry && Date.now() < expiry };
  }, []);

  // Verificar se filtros estão em cache válido
  const hasValidCache = useCallback((filial) => {
    const { isValid } = getCurrentCache(filial);
    return isValid;
  }, [getCurrentCache]);

  // Carregar filtros completos para uma filial
  const loadFiltersForFilial = useCallback(async (filial) => {
    if (!filial) return null;

    // Verificar cache válido usando ref (evita dependência circular)
    const { cache, isValid } = getCurrentCache(filial);

    if (isValid) {
      if (__DEV__) {
        console.log(`[useFilterLoader] Cache válido para filial ${filial}`);
      }

      // Atualizar filterOptions no contexto se necessário
      if (filial === stateRef.current.selectedFilial) {
        actionsRef.current.setFilterOptions(cache);
      }

      return cache;
    }

    // Evitar múltiplas requisições simultâneas
    const loadingKey = `filters_${filial}`;
    if (loadingRef.current.has(loadingKey)) {
      if (__DEV__) {
        console.log(
          `[useFilterLoader] Carregamento já em progresso para ${filial}`
        );
      }
      return null;
    }

    try {
      loadingRef.current.add(loadingKey);
      actionsRef.current.setFiltersLoading(true);

      if (__DEV__) {
        console.log(
          `[useFilterLoader] Carregando filtros para filial ${filial}`
        );
      }

      // Carregar todos os filtros em paralelo
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

      // Processar e estruturar dados
      const filterData = {
        servicos: servicosResponse.dados?.servicos || FALLBACK_SERVICOS,
        opPadrao: opPadraoResponse.dados?.op_padrao || FALLBACK_OP_PADRAO,
        grupos: gruposResponse.dados?.grupos || getFallbackGruposStrings(),
        produtos: produtosResponse.dados?.produtos || getFallbackProdutosStrings(),
      };

      // Salvar no cache usando ref
      actionsRef.current.setFiltersCache(filial, filterData);

      // Atualizar filterOptions se for a filial atual (usando ref)
      if (filial === stateRef.current.selectedFilial) {
        actionsRef.current.setFilterOptions(filterData);
      }

      if (__DEV__) {
        console.log(`[useFilterLoader] Filtros carregados para ${filial}:`, {
          servicos: filterData.servicos.length,
          opPadrao: filterData.opPadrao.length,
          grupos: filterData.grupos.length,
          produtos: filterData.produtos.length,
        });
      }

      return filterData;
    } catch (error) {
      console.error(
        `[useFilterLoader] Erro ao carregar filtros para ${filial}:`,
        error
      );

      // Fallback para dados padrão
      logFallbackUsage('filtros completos', `loadFiltersForFilial - Erro ao carregar filtros para ${filial}`);
      const fallbackData = {
        servicos: FALLBACK_SERVICOS,
        opPadrao: FALLBACK_OP_PADRAO,
        grupos: getFallbackGruposStrings(),
        produtos: getFallbackProdutosStrings(),
      };

      // Salvar fallback no cache usando ref
      actionsRef.current.setFiltersCache(filial, fallbackData);

      if (filial === stateRef.current.selectedFilial) {
        actionsRef.current.setFilterOptions(fallbackData);
      }

      return fallbackData;
    } finally {
      loadingRef.current.delete(loadingKey);
      actionsRef.current.setFiltersLoading(false);
    }
  }, [getCurrentCache]);

  const preloadAllFilters = useCallback(async () => {
    try {
      const filiais = ["LDA", "CHP", "FND", "NMD", "NMG"];

      if (__DEV__) {
        console.log(
          "[useFilterLoader] Iniciando precarregamento inteligente de filtros"
        );
      }

      // Filtrar filiais que precisam de carregamento (usando getCurrentCache)
      const filiaisToLoad = filiais.filter((filial) => {
        const { isValid } = getCurrentCache(filial);
        return !isValid;
      });

      if (filiaisToLoad.length === 0) {
        if (__DEV__) {
          console.log(
            "[useFilterLoader] Todos os filtros já estão em cache válido"
          );
        }
        return;
      }

      // Carregar filtros usando loadFiltersForFilial
      const loadPromises = filiaisToLoad.map((filial) =>
        loadFiltersForFilial(filial)
      );

      const results = await Promise.allSettled(loadPromises);

      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (__DEV__) {
        console.log(
          `[useFilterLoader] Precarregamento completo: ${successful} sucessos, ${failed} falhas`
        );
      }
    } catch (error) {
      console.error(
        "[useFilterLoader] Erro no precarregamento de filtros:",
        error
      );
    }
  }, [getCurrentCache, loadFiltersForFilial]);

  const loadBasicFilters = useCallback(async (filial) => {
    if (!filial) return null;

    // Usar getCurrentCache para verificar cache
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

      if (__DEV__) {
        console.log(
          `[useFilterLoader] Carregando filtros básicos para ${filial}`
        );
      }

      const [servicosResponse, opPadraoResponse] = await Promise.all([
        apiService.getServicosFilter(filial),
        apiService.getOpPadraoFilter(filial),
      ]);

      const basicFilters = {
        servicos: servicosResponse.dados?.servicos || FALLBACK_SERVICOS,
        opPadrao: opPadraoResponse.dados?.op_padrao || FALLBACK_OP_PADRAO,
      };

      // Acessar cache existente via ref
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

      logFallbackUsage('filtros básicos', `loadBasicFilters - Erro ao carregar para ${filial}`);
      return {
        servicos: FALLBACK_SERVICOS,
        opPadrao: FALLBACK_OP_PADRAO,
      };
    } finally {
      loadingRef.current.delete(loadingKey);
    }
  }, [getCurrentCache]);

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

    // Usar hasValidCache que já tem getCurrentCache como dependência
    hasValidCache,

    // Estado reativo
    isLoading: state.filtersLoading,
    filterOptions: state.filterOptions,

    // Ações
    clearCache: actions.clearFiltersCache,
  };
};
