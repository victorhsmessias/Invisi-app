import type { Filial } from "../constants/api";
import { FILIAIS } from "../constants/api";

export const isAdmin = (userRole: string | null | undefined): boolean => {
  return userRole === "Gerencia Adm";
};

export const getAllowedFilials = (
  userRole: string | null | undefined,
  userFilial: Filial | null | undefined
): readonly Filial[] => {
  if (isAdmin(userRole)) {
    return FILIAIS;
  }

  if (userFilial) {
    return [userFilial];
  }
  return [];
};

export const canAccessFilial = (
  filial: Filial,
  userRole: string | null | undefined,
  userFilial: Filial | null | undefined
): boolean => {
  if (isAdmin(userRole)) {
    return true;
  }

  return userFilial === filial;
};

export const shouldShowFilialSelector = (
  userRole: string | null | undefined
): boolean => {
  return isAdmin(userRole);
};

export const getInitialFilial = (
  userRole: string | null | undefined,
  userFilial: Filial | null | undefined,
  currentFilial?: Filial
): Filial => {
  if (isAdmin(userRole)) {
    return currentFilial || FILIAIS[0];
  }
  return userFilial || FILIAIS[0];
};
