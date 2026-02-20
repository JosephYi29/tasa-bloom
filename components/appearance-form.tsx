"use client";

import { useTheme } from "next-themes";
import { useColorTheme } from "./color-theme-provider";

import { Monitor, Moon, Sun, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const colorThemes = [
  { name: "Slate", value: "default", color: "bg-slate-900 dark:bg-slate-100" },
  { name: "Rose", value: "rose", color: "bg-rose-600 dark:bg-rose-600" },
  { name: "Blue", value: "blue", color: "bg-blue-600 dark:bg-blue-500" },
  { name: "Green", value: "green", color: "bg-green-600 dark:bg-green-700" },
  { name: "Orange", value: "orange", color: "bg-orange-500 dark:bg-orange-600" },
  { name: "Purple", value: "purple", color: "bg-purple-600 dark:bg-purple-600" },
];

const baseThemes = [
  { name: "Slate", value: "slate", color: "bg-slate-100 dark:bg-slate-950" },
  { name: "Zinc", value: "zinc", color: "bg-zinc-100 dark:bg-zinc-950" },
  { name: "Stone", value: "stone", color: "bg-stone-100 dark:bg-stone-950" },
  { name: "Navy", value: "navy", color: "bg-slate-200 dark:bg-slate-900" },
  { name: "Midnight", value: "midnight", color: "bg-indigo-100 dark:bg-indigo-950" },
  { name: "Amber", value: "amber", color: "bg-amber-100 dark:bg-amber-950" },
  { name: "Mocha", value: "mocha", color: "bg-[#e5d5c5] dark:bg-[#1a0f0d]" },
  { name: "Crimson", value: "crimson", color: "bg-rose-100 dark:bg-rose-950" },
  { name: "Forest", value: "forest", color: "bg-green-100 dark:bg-green-950" },
];

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, baseTheme, setBaseTheme } = useColorTheme();

  return (
    <div className="space-y-8 max-w-lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium leading-6">Theme Mode</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select your preferred light or dark mode.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent transition-all",
              theme === "light" ? "border-primary border-2 bg-accent/50" : "border-muted"
            )}
          >
            <Sun className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent transition-all",
              theme === "dark" ? "border-primary border-2 bg-accent/50" : "border-muted"
            )}
          >
            <Moon className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent transition-all",
              theme === "system" ? "border-primary border-2 bg-accent/50" : "border-muted"
            )}
          >
            <Monitor className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">System</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium leading-6">Background Color</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the foundational color palette for the app.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {baseThemes.map((b) => (
            <button
              key={b.value}
              onClick={() => setBaseTheme(b.value as Parameters<typeof setBaseTheme>[0])}
              className={cn(
                "group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                baseTheme === b.value ? "border-primary bg-accent/50" : "border-transparent"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex flex-col items-center justify-center border border-border/50", b.color)}>
                  {baseTheme === b.value && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
              </div>
              <span className="text-xs font-medium">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium leading-6">Accent Color</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize buttons and interactive elements.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {colorThemes.map((c) => (
            <button
              key={c.value}
              onClick={() => setColorTheme(c.value as Parameters<typeof setColorTheme>[0])}
              className={cn(
                "group flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:bg-accent",
                colorTheme === c.value ? "border-primary bg-accent/50" : "border-transparent"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full flex flex-col items-center justify-center", c.color)}>
                  {colorTheme === c.value && (
                    <CheckCircle2 className="w-5 h-5 text-white dark:text-gray-900" />
                  )}
              </div>
              <span className="text-xs font-medium">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
