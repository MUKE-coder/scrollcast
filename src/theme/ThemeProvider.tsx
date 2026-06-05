/**
 * Theme context. Wrap a composition with `<ThemeProvider name={theme}>` to make
 * the entire subtree consume tokens via `useTheme()`. The default value is the
 * Vercel theme so a forgotten provider still produces a renderable frame.
 */

import React, { createContext, useContext } from "react";
import { apple } from "./apple";
import { vercel } from "./vercel";
import type { Theme, ThemeName } from "./types";

const THEMES: Record<ThemeName, Theme> = { apple, vercel };

const ThemeContext = createContext<Theme>(vercel);

export const ThemeProvider: React.FC<{
  name: ThemeName;
  children: React.ReactNode;
}> = ({ name, children }) => {
  return (
    <ThemeContext.Provider value={THEMES[name]}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => useContext(ThemeContext);

export const getTheme = (name: ThemeName): Theme => THEMES[name];
