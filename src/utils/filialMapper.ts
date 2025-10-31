import type { Filial } from "../constants/api";

const LOTACAO_MAP: Record<string, Filial> = {
  "filial londrina": "LDA",
  "filial chapadao": "CHP",
  "filial fernandopolis": "FND",
  "filial nova maringa": "NMG",
  "filial novo mundo": "NMD",
};

const normalizeLotacao = (lotacao: string): string => {
  return lotacao
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const mapLotacaoToFilial = (
  lotacao: string | null | undefined
): Filial | null => {
  if (!lotacao || typeof lotacao !== "string") {
    return null;
  }

  const normalized = normalizeLotacao(lotacao);
  return LOTACAO_MAP[normalized] || null;
};

export const isValidLotacao = (lotacao: string | null | undefined): boolean => {
  return mapLotacaoToFilial(lotacao) !== null;
};

export const getValidLotacoes = (): string[] => {
  return Object.keys(LOTACAO_MAP);
};
