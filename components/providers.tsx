"use client";

import { ThemeProvider } from "next-themes";
import { ColorThemeProvider } from "./color-theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ColorThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  );
}
