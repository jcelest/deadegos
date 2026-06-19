import { getCurrentTheme } from "@/lib/theme";

export default function ThemeVariables() {
  const theme = getCurrentTheme();

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {
  --color-de-primary: ${theme.primary};
  --color-de-primary-glow: ${theme.primaryGlow};
  --color-de-accent-dark: ${theme.navy};
  --color-de-primary-rgb: ${hexToRgb(theme.primary)};
  --color-de-accent-dark-rgb: ${hexToRgb(theme.navy)};
}`,
      }}
    />
  );
}

function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
