/**
 * Opções de filtros para uso com FilterModal e useFilters
 */

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterGroup {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string) => void;
}

export interface FilterHook {
  selectedServicos: string[];
  selectedOpPadrao: string[];
  toggleServicoFilter: (key: string) => void;
  toggleOpPadraoFilter: (key: string) => void;
}

// Opções de Tipos de Serviço
export const SERVICO_FILTER_OPTIONS: FilterOption[] = [
  { key: "armazenagem", label: "Armazenagem" },
  { key: "transbordo", label: "Transbordo" },
  { key: "pesagem", label: "Pesagem" },
];

// Opções de Tipos de Operação Padrão
export const OP_PADRAO_FILTER_OPTIONS: FilterOption[] = [
  { key: "rodo_ferro", label: "Rodo/Ferro" },
  { key: "ferro_rodo", label: "Ferro/Rodo" },
  { key: "rodo_rodo", label: "Rodo/Rodo" },
  { key: "outros", label: "Outros" },
];

/**
 * Helper para criar filterGroups padrão
 * Usado em múltiplas telas para manter consistência
 *
 * @example
 * const filterHook = useFilters();
 * const filterGroups = createStandardFilterGroups(filterHook);
 *
 * <FilterModal
 *   filterGroups={filterGroups}
 *   // ...
 * />
 */
export const createStandardFilterGroups = ({
  selectedServicos,
  selectedOpPadrao,
  toggleServicoFilter,
  toggleOpPadraoFilter,
}: FilterHook): FilterGroup[] => {
  return [
    {
      title: "Tipos de Serviço",
      options: SERVICO_FILTER_OPTIONS,
      selected: selectedServicos,
      onToggle: toggleServicoFilter,
    },
    {
      title: "Tipos de Operação",
      options: OP_PADRAO_FILTER_OPTIONS,
      selected: selectedOpPadrao,
      onToggle: toggleOpPadraoFilter,
    },
  ];
};

/**
 * Helper para criar filterGroups com apenas serviços
 */
export const createServiceFilterGroups = ({
  selectedServicos,
  toggleServicoFilter,
}: Pick<FilterHook, 'selectedServicos' | 'toggleServicoFilter'>): FilterGroup[] => {
  return [
    {
      title: "Tipos de Serviço",
      options: SERVICO_FILTER_OPTIONS,
      selected: selectedServicos,
      onToggle: toggleServicoFilter,
    },
  ];
};

/**
 * Helper para criar filterGroups com apenas operações
 */
export const createOperationFilterGroups = ({
  selectedOpPadrao,
  toggleOpPadraoFilter,
}: Pick<FilterHook, 'selectedOpPadrao' | 'toggleOpPadraoFilter'>): FilterGroup[] => {
  return [
    {
      title: "Tipos de Operação",
      options: OP_PADRAO_FILTER_OPTIONS,
      selected: selectedOpPadrao,
      onToggle: toggleOpPadraoFilter,
    },
  ];
};
