import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useFilterLoader } from "./useFilterLoader";

export const useGlobalFilters = () => {
  const { state } = useApp();
  const { loadFiltersForFilial, hasValidCache, isLoading } = useFilterLoader();

  // Ref para controlar se já inicializou os filtros
  const hasInitialized = useRef(false);
  const lastFilialRef = useRef(state.selectedFilial);
  const userHasModifiedFilters = useRef(false);

  const [selectedFilters, setSelectedFilters] = useState({
    servicos: [],
    opPadrao: [],
    grupos: [],
    produtos: [],
  });

  // Garantir que filtros estão carregados quando necessário
  useEffect(() => {
    if (state.isLoggedIn && state.selectedFilial) {
      const currentFilial = state.selectedFilial;

      // Se mudou de filial, resetar inicialização e flag de modificação
      if (lastFilialRef.current !== currentFilial) {
        hasInitialized.current = false;
        userHasModifiedFilters.current = false;
        lastFilialRef.current = currentFilial;
        if (__DEV__) {
          console.log(`[useGlobalFilters] Filial mudou para ${currentFilial}, resetando flags`);
        }
      }

      // Só carregar se não tem cache válido
      if (!hasValidCache(currentFilial)) {
        if (__DEV__) {
          console.log(`[useGlobalFilters] Carregando filtros para filial ${currentFilial}`);
        }
        loadFiltersForFilial(currentFilial);
      }
    }
  }, [state.isLoggedIn, state.selectedFilial]); // Removidas dependências que mudam constantemente

  // Inicializar filtros selecionados quando filterOptions mudam
  useEffect(() => {
    const { grupos, produtos, opPadrao, servicos } = state.filterOptions;

    // Só inicializar se temos dados válidos E ainda não inicializou E usuário não modificou filtros
    if (grupos.length > 0 && produtos.length > 0 && !hasInitialized.current && !userHasModifiedFilters.current) {
      if (__DEV__) {
        console.log("[useGlobalFilters] ====== INICIALIZANDO FILTROS ======");
        console.log("[useGlobalFilters] Opções carregadas:", {
          servicos: servicos.length,
          opPadrao: opPadrao.length,
          grupos: grupos.length,
          produtos: produtos.length,
        });
        console.log("[useGlobalFilters] Estado atual dos selectedFilters:", selectedFilters);
      }

      setSelectedFilters({
        servicos: ["armazenagem", "transbordo"], // Padrão fixo
        opPadrao: [...opPadrao], // Todos disponíveis
        grupos: [...grupos], // Todos disponíveis
        produtos: [...produtos], // Todos disponíveis
      });

      hasInitialized.current = true;

      if (__DEV__) {
        console.log("[useGlobalFilters] Filtros inicializados com sucesso");
      }
    }
  }, [state.filterOptions.grupos.length, state.filterOptions.produtos.length]); // Dependências específicas

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
          action: isCurrentlySelected ? 'REMOVE' : 'ADD'
        });
      }

      // Marcar que usuário modificou os filtros
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
      console.log('[useGlobalFilters] ====== RESETANDO FILTROS ======');
      console.log('[useGlobalFilters] Estado antes do reset:', selectedFilters);
    }

    userHasModifiedFilters.current = true;
    setSelectedFilters({
      servicos: [],
      opPadrao: [],
      grupos: [],
      produtos: [],
    });

    if (__DEV__) {
      console.log('[useGlobalFilters] Filtros resetados para vazio');
    }
  }, []);

  // Converter filtros selecionados para formato da API
  const getApiFilters = useCallback(() => {
    // Se não há filtros selecionados, usar padrão que funciona
    const hasAnyFilters = selectedFilters.servicos.length > 0 ||
                         selectedFilters.opPadrao.length > 0 ||
                         selectedFilters.grupos.length > 0 ||
                         selectedFilters.produtos.length > 0;

    if (!hasAnyFilters) {
      // Usar todos os filtros disponíveis como padrão
      const { grupos, produtos, opPadrao, servicos } = state.filterOptions;

      const filtroServico = {
        armazenagem: servicos.includes('armazenagem') ? 1 : 0,
        transbordo: servicos.includes('transbordo') ? 1 : 0,
        pesagem: servicos.includes('pesagem') ? 1 : 0,
      };

      const filtroOpPadrao = {
        rodo_ferro: opPadrao.includes('rodo_ferro') ? 1 : 0,
        ferro_rodo: opPadrao.includes('ferro_rodo') ? 1 : 0,
        rodo_rodo: opPadrao.includes('rodo_rodo') ? 1 : 0,
        outros: opPadrao.includes('outros') ? 1 : 0,
      };

      const filtroGrupo = grupos.length > 0 ? grupos.map(grupo => ({ grupo })) : null;
      const filtroTpProd = produtos.length > 0 ? produtos.map(produto => ({ tp_prod: produto })) : null;

      if (__DEV__) {
        console.log('[useGlobalFilters] ====== USANDO FILTROS PADRÃO (todos) ======');
        console.log('[useGlobalFilters] Filtros padrão aplicados:', {
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

    // Usar filtros selecionados pelo usuário
    const filtroServico = {
      armazenagem: selectedFilters.servicos.includes('armazenagem') ? 1 : 0,
      transbordo: selectedFilters.servicos.includes('transbordo') ? 1 : 0,
      pesagem: selectedFilters.servicos.includes('pesagem') ? 1 : 0,
    };

    const filtroOpPadrao = {
      rodo_ferro: selectedFilters.opPadrao.includes('rodo_ferro') ? 1 : 0,
      ferro_rodo: selectedFilters.opPadrao.includes('ferro_rodo') ? 1 : 0,
      rodo_rodo: selectedFilters.opPadrao.includes('rodo_rodo') ? 1 : 0,
      outros: selectedFilters.opPadrao.includes('outros') ? 1 : 0,
    };

    const filtroGrupo = selectedFilters.grupos.length > 0
      ? selectedFilters.grupos.map(grupo => ({ grupo }))
      : null;

    const filtroTpProd = selectedFilters.produtos.length > 0
      ? selectedFilters.produtos.map(produto => ({ tp_prod: produto }))
      : null;

    if (__DEV__) {
      console.log('[useGlobalFilters] Estado selectedFilters:', selectedFilters);
      console.log('[useGlobalFilters] Filtros convertidos para API:', {
        filtroServico,
        filtroOpPadrao,
        grupos: filtroGrupo ? filtroGrupo.length : 0,
        produtos: filtroTpProd ? filtroTpProd.length : 0,
      });
      console.log('[useGlobalFilters] Serviços ativos:', Object.keys(filtroServico).filter(key => filtroServico[key] === 1));
      console.log('[useGlobalFilters] OpPadrão ativos:', Object.keys(filtroOpPadrao).filter(key => filtroOpPadrao[key] === 1));
    }

    return {
      filtroServico,
      filtroOpPadrao,
      filtroGrupo,
      filtroTpProd,
    };
  }, [selectedFilters, state.filterOptions]);

  return {
    // Filtros selecionados
    selectedFilters,

    // Ações para manipular filtros
    toggleFilter,
    removeFilter,
    applyFilters,
    resetFilters,
    getApiFilters,

    // Estados de carregamento
    isLoading,
    filterOptions: state.filterOptions,

    // Utilitários
    hasValidCache: () => hasValidCache(state.selectedFilial),
    forceReload: () => loadFiltersForFilial(state.selectedFilial),
  };
};
