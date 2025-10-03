/**
 * Constantes centralizadas de filtros
 * Define todas as opções de filtros disponíveis no aplicativo
 */

export interface FilterOption {
  key: string;
  label: string;
  value: string;
}

/**
 * Opções de Tipos de Operação Padrão
 * Usadas nos filtros de todas as telas de monitor
 */
export const OP_PADRAO_OPTIONS: FilterOption[] = [
  { key: "rodo_ferro", label: "Rodo/Ferro", value: "rodo_ferro" },
  { key: "ferro_rodo", label: "Ferro/Rodo", value: "ferro_rodo" },
  { key: "rodo_rodo", label: "Rodo/Rodo", value: "rodo_rodo" },
  { key: "outros", label: "Outros", value: "outros" },
];

/**
 * Opções de Tipos de Serviço
 * Usadas nos filtros de todas as telas de monitor
 */
export const SERVICO_OPTIONS: FilterOption[] = [
  { key: "armazenagem", label: "Armazenagem", value: "armazenagem" },
  { key: "transbordo", label: "Transbordo", value: "transbordo" },
  { key: "pesagem", label: "Pesagem", value: "pesagem" },
];

/**
 * Valores padrão para filtros de serviço
 * Armazenagem e Transbordo selecionados por padrão
 */
export const DEFAULT_SERVICO_FILTERS: string[] = ["armazenagem", "transbordo"];

/**
 * Valores padrão para filtros de operação padrão
 * Todos exceto "outros" selecionados por padrão
 */
export const DEFAULT_OP_PADRAO_FILTERS: string[] = [
  "rodo_ferro",
  "ferro_rodo",
  "rodo_rodo",
];

export type ApiFilterFormat = Record<string, 0 | 1>;

/**
 * Helper para converter array de selecionados em objeto de API
 * @example
 * const selected = ["armazenagem", "transbordo"];
 * const apiFormat = convertToApiFormat(selected, SERVICO_OPTIONS);
 * // Retorna: { armazenagem: 1, transbordo: 1, pesagem: 0 }
 */
export const convertToApiFormat = (
  selected: string[],
  options: FilterOption[]
): ApiFilterFormat => {
  const result: ApiFilterFormat = {};
  options.forEach((option) => {
    result[option.key] = selected.includes(option.key) ? 1 : 0;
  });
  return result;
};

/**
 * Helper para verificar se todos os filtros estão selecionados
 */
export const areAllSelected = (
  selected: string[],
  options: FilterOption[]
): boolean => {
  return selected.length === options.length;
};

/**
 * Helper para verificar se nenhum filtro está selecionado
 */
export const areNoneSelected = (selected: string[]): boolean => {
  return selected.length === 0;
};

/**
 * Helper para obter label de uma opção
 */
export const getOptionLabel = (
  key: string,
  options: FilterOption[]
): string => {
  const option = options.find((opt) => opt.key === key);
  return option ? option.label : key;
};
