export const BADGE_COLORS = {
  transito: "#00376e",
  filaDescarga: "#00376e",
  filaCarga: "#00376e",
  patioDescarga: "#00376e",
  patioCarga: "#00376e",
  descargasHoje: "#00376e",
  cargasHoje: "#00376e",
  orange: "#00376e",
  red: "#00376e",
  blue: "#00376e",
  purple: "#00376e",
  teal: "#00376e",
  green: "#00376e",
} as const;

export type ScreenType = keyof typeof BADGE_COLORS;

export const getBadgeColor = (screenType: string): string => {
  return BADGE_COLORS[screenType as ScreenType] || BADGE_COLORS.blue;
};
