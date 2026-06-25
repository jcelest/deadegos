export type Season = "orange" | "blue" | "pink" | "green";

export interface SeasonTheme {
  id: Season;
  name: string;
  primary: string;
  primaryGlow: string;
  navy: string;
  logo: string;
  logoAlt: string;
}

export const SEASONS: Record<Season, SeasonTheme> = {
  orange: {
    id: "orange",
    name: "Summer 2026",
    primary: "#FF8800",
    primaryGlow: "#FFAA44",
    navy: "#7A2E00",
    logo: "/logos/logo-orange.png",
    logoAlt: "DeadEgos orange logo",
  },
  blue: {
    id: "blue",
    name: "USA 250 Summer",
    primary: "#0038FF",
    primaryGlow: "#5C8DFF",
    navy: "#001450",
    logo: "/logos/logo-blue.png",
    logoAlt: "DeadEgos USA 250 blue logo",
  },
  pink: {
    id: "pink",
    name: "Pink Season",
    primary: "#FF00AA",
    primaryGlow: "#FF44CC",
    navy: "#4D0033",
    logo: "/logos/logo-pink.png",
    logoAlt: "DeadEgos pink logo",
  },
  green: {
    id: "green",
    name: "Green Season",
    primary: "#00CC44",
    primaryGlow: "#44FF77",
    navy: "#003D1A",
    logo: "/logos/logo-green.png",
    logoAlt: "DeadEgos green logo",
  },
};

export const CURRENT_SEASON: Season = "blue";

export function getCurrentTheme(): SeasonTheme {
  return SEASONS[CURRENT_SEASON];
}
