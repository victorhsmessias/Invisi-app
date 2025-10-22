export const BADGE_COLORS = {
  transito: "#007bff",
  filaDescarga: "#dc3545",
  filaCarga: "#fd7e14",
  patioDescarga: "#6f42c1",
  patioCarga: "#20c997",
  descargasHoje: "#fd7e14",
  cargasHoje: "#20c997",
  orange: "#fd7e14",
  red: "#dc3545",
  blue: "#007bff",
  purple: "#6f42c1",
  teal: "#20c997",
  green: "#28a745",
} as const;

export type ScreenType = keyof typeof BADGE_COLORS;

export const getBadgeColor = (screenType: string): string => {
  return BADGE_COLORS[screenType as ScreenType] || BADGE_COLORS.blue;
};
