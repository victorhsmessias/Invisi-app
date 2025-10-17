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
