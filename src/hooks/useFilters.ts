import { useState, useCallback, useMemo } from "react";
import type { ApiFilterObject } from "../types";

interface UseFiltersOptions {
  defaultServicos?: string[];
  defaultOpPadrao?: string[];
}

interface FilterReturn {
  filtro_servico: ApiFilterObject;
  filtro_op_padrao: ApiFilterObject;
}

interface UseFiltersReturn {
  selectedServicos: string[];
  selectedOpPadrao: string[];
  ALL_SERVICOS: string[];
  ALL_OP_PADRAO: string[];
  toggleServicoFilter: (key: string) => void;
  toggleOpPadraoFilter: (key: string) => void;
  selectAllServicos: () => void;
  deselectAllServicos: () => void;
  selectAllOpPadrao: () => void;
  deselectAllOpPadrao: () => void;
  isServicoSelected: (key: string) => boolean;
  isOpPadraoSelected: (key: string) => boolean;
  setServicos: (servicos: string[]) => void;
  setOpPadrao: (opPadrao: string[]) => void;
  getFilters: () => FilterReturn;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

const DEFAULT_SERVICOS = ["armazenagem", "transbordo"];
const DEFAULT_OP_PADRAO = ["rodo_ferro", "ferro_rodo", "rodo_rodo"];

export const useFilters = (options: UseFiltersOptions = {}): UseFiltersReturn => {
  const [selectedServicos, setSelectedServicos] = useState<string[]>(
    options.defaultServicos || DEFAULT_SERVICOS
  );
  const [selectedOpPadrao, setSelectedOpPadrao] = useState<string[]>(
    options.defaultOpPadrao || DEFAULT_OP_PADRAO
  );

  const ALL_SERVICOS = useMemo(
    () => ["armazenagem", "transbordo", "pesagem"],
    []
  );

  const ALL_OP_PADRAO = useMemo(
    () => ["rodo_ferro", "ferro_rodo", "rodo_rodo", "outros"],
    []
  );

  const toggleServicoFilter = useCallback((key: string) => {
    setSelectedServicos((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      } else {
        return [...prev, key];
      }
    });
  }, []);

  const toggleOpPadraoFilter = useCallback((key: string) => {
    setSelectedOpPadrao((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      } else {
        return [...prev, key];
      }
    });
  }, []);

  const selectAllServicos = useCallback(() => {
    setSelectedServicos(ALL_SERVICOS);
  }, [ALL_SERVICOS]);

  const deselectAllServicos = useCallback(() => {
    setSelectedServicos([]);
  }, []);

  const selectAllOpPadrao = useCallback(() => {
    setSelectedOpPadrao(ALL_OP_PADRAO);
  }, [ALL_OP_PADRAO]);

  const deselectAllOpPadrao = useCallback(() => {
    setSelectedOpPadrao([]);
  }, []);

  const getFilters = useCallback((): FilterReturn => {
    const filtro_servico = ALL_SERVICOS.reduce((acc, servico) => {
      acc[servico] = selectedServicos.includes(servico) ? 1 : 0;
      return acc;
    }, {} as ApiFilterObject);

    const filtro_op_padrao = ALL_OP_PADRAO.reduce((acc, op) => {
      acc[op] = selectedOpPadrao.includes(op) ? 1 : 0;
      return acc;
    }, {} as ApiFilterObject);

    return {
      filtro_servico,
      filtro_op_padrao,
    };
  }, [selectedServicos, selectedOpPadrao, ALL_SERVICOS, ALL_OP_PADRAO]);

  const hasActiveFilters = useMemo(() => {
    const servicosChanged =
      selectedServicos.length !== DEFAULT_SERVICOS.length ||
      !selectedServicos.every((s) => DEFAULT_SERVICOS.includes(s));

    const opPadraoChanged =
      selectedOpPadrao.length !== DEFAULT_OP_PADRAO.length ||
      !selectedOpPadrao.every((op) => DEFAULT_OP_PADRAO.includes(op));

    return servicosChanged || opPadraoChanged;
  }, [selectedServicos, selectedOpPadrao]);

  const activeFiltersCount = useMemo(() => {
    return selectedServicos.length + selectedOpPadrao.length;
  }, [selectedServicos, selectedOpPadrao]);

  const resetFilters = useCallback(() => {
    setSelectedServicos(DEFAULT_SERVICOS);
    setSelectedOpPadrao(DEFAULT_OP_PADRAO);
  }, []);

  const isServicoSelected = useCallback(
    (key: string): boolean => {
      return selectedServicos.includes(key);
    },
    [selectedServicos]
  );

  const isOpPadraoSelected = useCallback(
    (key: string): boolean => {
      return selectedOpPadrao.includes(key);
    },
    [selectedOpPadrao]
  );

  const setServicos = useCallback((servicos: string[]) => {
    if (Array.isArray(servicos)) {
      setSelectedServicos(servicos);
    }
  }, []);

  const setOpPadrao = useCallback((opPadrao: string[]) => {
    if (Array.isArray(opPadrao)) {
      setSelectedOpPadrao(opPadrao);
    }
  }, []);

  return {
    selectedServicos,
    selectedOpPadrao,
    ALL_SERVICOS,
    ALL_OP_PADRAO,
    toggleServicoFilter,
    toggleOpPadraoFilter,
    selectAllServicos,
    deselectAllServicos,
    selectAllOpPadrao,
    deselectAllOpPadrao,
    isServicoSelected,
    isOpPadraoSelected,
    setServicos,
    setOpPadrao,
    getFilters,
    resetFilters,
    hasActiveFilters,
    activeFiltersCount,
  };
};

export default useFilters;
