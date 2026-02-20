"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ColorTheme = "default" | "rose" | "blue" | "green" | "orange" | "purple";
type BaseTheme = "slate" | "stone" | "zinc" | "navy" | "midnight" | "amber" | "mocha" | "crimson" | "forest";

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  baseTheme: BaseTheme;
  setBaseTheme: (theme: BaseTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("default");
  const [baseTheme, setBaseThemeState] = useState<BaseTheme>("slate");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem("tasa-color-theme") as ColorTheme;
    const savedBase = localStorage.getItem("tasa-base-theme") as BaseTheme;
    
    if (savedColor) setColorThemeState(savedColor);
    if (savedBase) setBaseThemeState(savedBase);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    // Remove existing accent classes
    root.classList.remove(
      "theme-rose",
      "theme-blue",
      "theme-green",
      "theme-orange",
      "theme-purple"
    );

    // Remove existing base classes
    root.classList.remove(
      "theme-base-slate",
      "theme-base-stone",
      "theme-base-zinc",
      "theme-base-navy",
      "theme-base-midnight",
      "theme-base-amber",
      "theme-base-mocha",
      "theme-base-crimson",
      "theme-base-forest"
    );

    // Add new accent class if not default
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`);
    }

    // Add new base class
    root.classList.add(`theme-base-${baseTheme}`);

    localStorage.setItem("tasa-color-theme", colorTheme);
    localStorage.setItem("tasa-base-theme", baseTheme);
  }, [colorTheme, baseTheme, mounted]);

  // Prevent flash of incorrect theme colors by not rendering children until mounted
  // or render them with default and let the effect catch up (standard next-themes behavior)
  
  return (
    <ColorThemeContext.Provider value={{ 
      colorTheme, 
      setColorTheme: setColorThemeState,
      baseTheme,
      setBaseTheme: setBaseThemeState
    }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}
