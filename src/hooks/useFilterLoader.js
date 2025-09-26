import { useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import apiService from "../services/apiService";

export const useFilterLoader = () => {
  const { state, actions } = useApp();
  const loadingRef = useRef(new Set()); // Controla carregamentos em progresso

  // Verificar se filtros estão em cache válido
  const hasValidCache = useCallback((filial) => {
    const cachedData = state.filtersCache[filial];
    const cacheExpiry = state.filtersCacheExpiry[filial];
    return cachedData && cacheExpiry && Date.now() < cacheExpiry;
  }, []); // Remover dependências do cache para evitar loop

  // Carregar filtros completos para uma filial
  const loadFiltersForFilial = useCallback(async (filial) => {
    if (!filial) return null;

    // Verificar cache válido primeiro (acessar diretamente do state atual)
    const currentCache = state.filtersCache[filial];
    const currentExpiry = state.filtersCacheExpiry[filial];
    const isCacheValid = currentCache && currentExpiry && Date.now() < currentExpiry;

    if (isCacheValid) {
      if (__DEV__) {
        console.log(`[useFilterLoader] Cache válido para filial ${filial}`);
      }

      // Atualizar filterOptions no contexto se necessário
      if (filial === state.selectedFilial) {
        actions.setFilterOptions(currentCache);
      }

      return currentCache;
    }

    // Evitar múltiplas requisições simultâneas
    const loadingKey = `filters_${filial}`;
    if (loadingRef.current.has(loadingKey)) {
      if (__DEV__) {
        console.log(`[useFilterLoader] Carregamento já em progresso para ${filial}`);
      }
      return null;
    }

    try {
      loadingRef.current.add(loadingKey);
      actions.setFiltersLoading(true);

      if (__DEV__) {
        console.log(`[useFilterLoader] Carregando filtros para filial ${filial}`);
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
        servicos: servicosResponse.dados?.servicos || ['armazenagem', 'transbordo', 'pesagem'],
        opPadrao: opPadraoResponse.dados?.op_padrao || ['rodo_ferro', 'ferro_rodo', 'rodo_rodo', 'outros'],
        grupos: gruposResponse.dados?.grupos || ['ADM-MGA', 'ATT', 'CARGILL', 'BTG PACTUAL S/A'],
        produtos: produtosResponse.dados?.produtos || ['SOJA GRAOS', 'MILHO GRAOS', 'FARELO DE SOJA'],
      };

      // Salvar no cache
      actions.setFiltersCache(filial, filterData);

      // Atualizar filterOptions se for a filial atual
      if (filial === state.selectedFilial) {
        actions.setFilterOptions(filterData);
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
      console.error(`[useFilterLoader] Erro ao carregar filtros para ${filial}:`, error);

      // Fallback para dados padrão
      const fallbackData = {
        servicos: ['armazenagem', 'transbordo', 'pesagem'],
        opPadrao: ['rodo_ferro', 'ferro_rodo', 'rodo_rodo', 'outros'],
        grupos: ['ADM-MGA', 'ATT', 'CARGILL', 'BTG PACTUAL S/A'],
        produtos: ['SOJA GRAOS', 'MILHO GRAOS', 'FARELO DE SOJA'],
      };

      // Salvar fallback no cache com tempo menor
      const tempExpiry = Date.now() + 1 * 60 * 1000; // 1 minuto para fallback
      actions.setFiltersCache(filial, fallbackData);

      if (filial === state.selectedFilial) {
        actions.setFilterOptions(fallbackData);
      }

      return fallbackData;

    } finally {
      loadingRef.current.delete(loadingKey);
      actions.setFiltersLoading(false);
    }
  }, []); // Remover todas as dependências para evitar recriação

  // Precarregar filtros para ambas filiais
  const preloadAllFilters = useCallback(async () => {
    try {
      const filiais = ['LDA', 'CHP', 'FND', 'NMD', 'NMG'];

      if (__DEV__) {
        console.log('[useFilterLoader] Iniciando precarregamento inteligente de filtros');
      }

      // Carregar em paralelo apenas filiais sem cache válido
      const loadPromises = filiais
        .filter(filial => {
          const currentCache = state.filtersCache[filial];
          const currentExpiry = state.filtersCacheExpiry[filial];
          return !(currentCache && currentExpiry && Date.now() < currentExpiry);
        })
        .map(filial => loadFiltersForFilial(filial));

      if (loadPromises.length === 0) {
        if (__DEV__) {
          console.log('[useFilterLoader] Todos os filtros já estão em cache válido');
        }
        return;
      }

      const results = await Promise.allSettled(loadPromises);

      // Log do resultado
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (__DEV__) {
        console.log(`[useFilterLoader] Precarregamento completo: ${successful} sucessos, ${failed} falhas`);
      }

    } catch (error) {
      console.error('[useFilterLoader] Erro no precarregamento de filtros:', error);
    }
  }, []); // Remover dependências para evitar recriação

  // Carregar filtros básicos (apenas servicos e opPadrao) para telas de veículos
  const loadBasicFilters = useCallback(async (filial) => {
    if (!filial) return null;

    // Verificar se já tem os filtros básicos em cache
    const currentCache = state.filtersCache[filial];
    const currentExpiry = state.filtersCacheExpiry[filial];
    const isCacheValid = currentCache && currentExpiry && Date.now() < currentExpiry;

    if (isCacheValid) {
      return {
        servicos: currentCache.servicos,
        opPadrao: currentCache.opPadrao,
      };
    }

    const loadingKey = `basic_filters_${filial}`;
    if (loadingRef.current.has(loadingKey)) {
      return null;
    }

    try {
      loadingRef.current.add(loadingKey);

      if (__DEV__) {
        console.log(`[useFilterLoader] Carregando filtros básicos para ${filial}`);
      }

      const [servicosResponse, opPadraoResponse] = await Promise.all([
        apiService.getServicosFilter(filial),
        apiService.getOpPadraoFilter(filial),
      ]);

      const basicFilters = {
        servicos: servicosResponse.dados?.servicos || ['armazenagem', 'transbordo', 'pesagem'],
        opPadrao: opPadraoResponse.dados?.op_padrao || ['rodo_ferro', 'ferro_rodo', 'rodo_rodo', 'outros'],
      };

      // Atualizar cache parcialmente (manter grupos e produtos se existirem)
      const existingCache = state.filtersCache[filial] || {};
      const updatedCache = {
        ...existingCache,
        ...basicFilters,
        grupos: existingCache.grupos || [],
        produtos: existingCache.produtos || [],
      };

      actions.setFiltersCache(filial, updatedCache);

      return basicFilters;

    } catch (error) {
      console.error(`[useFilterLoader] Erro ao carregar filtros básicos para ${filial}:`, error);

      return {
        servicos: ['armazenagem', 'transbordo', 'pesagem'],
        opPadrao: ['rodo_ferro', 'ferro_rodo', 'rodo_rodo', 'outros'],
      };

    } finally {
      loadingRef.current.delete(loadingKey);
    }
  }, []); // Remover dependências para evitar recriação

  // Auto-carregar filtros quando usuário faz login
  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      // Carregar filtros da filial atual imediatamente
      loadFiltersForFilial(state.selectedFilial);

      // Precarregar outras filiais em background após um delay
      const timer = setTimeout(() => {
        preloadAllFilters();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.isLoggedIn]); // Apenas isLoggedIn para evitar loop

  // Carregar filtros quando filial muda
  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      loadFiltersForFilial(state.selectedFilial);
    }
  }, [state.selectedFilial]); // Apenas selectedFilial

  return {
    // Carregamento completo
    loadFiltersForFilial,
    preloadAllFilters,

    // Carregamento básico
    loadBasicFilters,

    // Utilitários
    hasValidCache: (filial) => {
      const currentCache = state.filtersCache[filial];
      const currentExpiry = state.filtersCacheExpiry[filial];
      return currentCache && currentExpiry && Date.now() < currentExpiry;
    },
    isLoading: state.filtersLoading,
    clearCache: actions.clearFiltersCache,

    // Dados
    filterOptions: state.filterOptions,
  };
};