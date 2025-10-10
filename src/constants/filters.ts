export interface FilterOption {
  key: string;
  label: string;
  value: string;
}

export const OP_PADRAO_OPTIONS: FilterOption[] = [
  { key: "rodo_ferro", label: "Rodo/Ferro", value: "rodo_ferro" },
  { key: "ferro_rodo", label: "Ferro/Rodo", value: "ferro_rodo" },
  { key: "rodo_rodo", label: "Rodo/Rodo", value: "rodo_rodo" },
  { key: "outros", label: "Outros", value: "outros" },
];

export const SERVICO_OPTIONS: FilterOption[] = [
  { key: "armazenagem", label: "Armazenagem", value: "armazenagem" },
  { key: "transbordo", label: "Transbordo", value: "transbordo" },
  { key: "pesagem", label: "Pesagem", value: "pesagem" },
];

export const DEFAULT_SERVICO_FILTERS: string[] = [
  "armazenagem",
  "transbordo",
  "pesagem",
];

export const DEFAULT_OP_PADRAO_FILTERS: string[] = [
  "rodo_ferro",
  "ferro_rodo",
  "rodo_rodo",
];

export type ApiFilterFormat = Record<string, 0 | 1>;

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

export const areAllSelected = (
  selected: string[],
  options: FilterOption[]
): boolean => {
  return selected.length === options.length;
};

export const areNoneSelected = (selected: string[]): boolean => {
  return selected.length === 0;
};

export const getOptionLabel = (
  key: string,
  options: FilterOption[]
): string => {
  const option = options.find((opt) => opt.key === key);
  return option ? option.label : key;
};
