"use client";

import { ThemeProvider } from "next-themes";
import { ColorThemeProvider } from "./color-theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ColorThemeProvider>{children}</ColorThemeProvider>
    </ThemeProvider>
  );
}
