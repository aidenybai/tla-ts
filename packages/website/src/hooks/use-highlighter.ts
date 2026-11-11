import { use, useEffect } from "react";
import {
  getSharedHighlighter,
  registerCustomLanguage,
  RegisteredCustomLanguages,
  type DiffsHighlighter,
} from "@pierre/diffs";
import { TLA_GRAMMAR } from "@/lib/tla-grammar";
import type { Theme } from "./use-resolved-theme";

// Realize uses the `highlights` lexers, which render custom languages as plain text. Shiki runs the
// TLA+ grammar.
export const HIGHLIGHTER = "shiki-js";

export const CODE_THEMES = { light: "github-light", dark: "github-dark-default" } as const;

export const getCodeTheme = (theme: Theme): (typeof CODE_THEMES)[Theme] => CODE_THEMES[theme];

const cache: { promise: Promise<DiffsHighlighter> | null } = { promise: null };

// Shiki has no TLA+ grammar, so `.tla` files use the site's own. A hot reload runs this module
// again, and `@pierre/diffs` logs an error when a language registers twice.
if (!RegisteredCustomLanguages.has(TLA_GRAMMAR.name))
  registerCustomLanguage(TLA_GRAMMAR.name, async () => ({ default: [TLA_GRAMMAR] }), ["tla"]);

const loadHighlighter = (): Promise<DiffsHighlighter> => {
  cache.promise ??= getSharedHighlighter({
    themes: [CODE_THEMES.light, CODE_THEMES.dark],
    langs: ["tsx", "ts", "jsx", "js", "json", TLA_GRAMMAR.name],
    preferredHighlighter: HIGHLIGHTER,
  });
  return cache.promise;
};

export const useHighlighter = (): DiffsHighlighter => use(loadHighlighter());

export const useHighlighterWarmup = (): void => {
  useEffect(() => {
    void loadHighlighter();
  }, []);
};
