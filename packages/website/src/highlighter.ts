import {
  getSharedHighlighter,
  registerCustomLanguage,
  registerCustomTheme,
  RegisteredCustomLanguages,
} from "@pierre/diffs";
import { codeToTokens } from "@pierre/highlights";
import type { Source, Token } from "./site-data";
import { TLA_GRAMMAR } from "./tla-grammar";

type Language = "shellscript" | "typescript" | "tlaplus";

interface Palette {
  foreground: string;
  keyword: string;
  string: string;
  number: string;
  comment: string;
}

const LIGHT: Palette = {
  foreground: "#21201c",
  keyword: "#6f42c1",
  string: "#22863a",
  number: "#005cc5",
  comment: "#6a737d",
};
const DARK: Palette = {
  foreground: "#eeeeec",
  keyword: "#b392f0",
  string: "#85e89d",
  number: "#79b8ff",
  comment: "#8b949e",
};
const LIGHT_NAME = "tla-ts-light";
const DARK_NAME = "tla-ts-dark";

const getHighlightsTheme = (name: string, appearance: "light" | "dark", palette: Palette) => ({
  name,
  appearance,
  style: {
    "editor.foreground": palette.foreground,
    syntax: {
      keyword: { color: palette.keyword },
      function: { color: palette.keyword },
      string: { color: palette.string },
      number: { color: palette.number },
      comment: { color: palette.comment },
    },
  },
});

const getShikiTheme = (name: string, type: "light" | "dark", palette: Palette) => ({
  name,
  type,
  colors: { "editor.foreground": palette.foreground },
  tokenColors: [
    {
      scope: [
        "keyword.control",
        "keyword.other",
        "keyword.operator.quantifier",
        "keyword.operator.word",
        "storage",
      ],
      settings: { foreground: palette.keyword },
    },
    { scope: ["string"], settings: { foreground: palette.string } },
    { scope: ["constant.numeric"], settings: { foreground: palette.number } },
    {
      scope: ["comment", "punctuation.separator.tlaplus", "punctuation.definition.module.tlaplus"],
      settings: { foreground: palette.comment },
    },
  ],
});

const HIGHLIGHTS_THEMES = {
  light: getHighlightsTheme(LIGHT_NAME, "light", LIGHT),
  dark: getHighlightsTheme(DARK_NAME, "dark", DARK),
};

const getToken = (content: string, style: Record<string, string>, prefix: string): Token => ({
  content,
  style: {
    "--token-light": style[`${prefix}light`],
    "--token-dark": style[`${prefix}dark`],
  },
});

export const createHighlighter = async () => {
  if (!RegisteredCustomLanguages.has(TLA_GRAMMAR.name)) {
    registerCustomLanguage(TLA_GRAMMAR.name, async () => ({ default: [TLA_GRAMMAR] }), ["tla"]);
    registerCustomTheme(LIGHT_NAME, async () => getShikiTheme(LIGHT_NAME, "light", LIGHT));
    registerCustomTheme(DARK_NAME, async () => getShikiTheme(DARK_NAME, "dark", DARK));
  }
  const shiki = await getSharedHighlighter({
    themes: [LIGHT_NAME, DARK_NAME],
    langs: [TLA_GRAMMAR.name],
    preferredHighlighter: "shiki-js",
  });
  return (code: string, language: Language): Source => ({
    code,
    lines:
      language === "tlaplus"
        ? shiki
            .codeToTokens(code, {
              lang: language,
              themes: { light: LIGHT_NAME, dark: DARK_NAME },
              defaultColor: false,
            })
            .tokens.map((line) =>
              line.map((token) => getToken(token.content, token.htmlStyle ?? {}, "--shiki-")),
            )
        : codeToTokens(code, {
            lang: language,
            themes: HIGHLIGHTS_THEMES,
            defaultColor: false,
          }).tokens.map((line) =>
            line.map((token) => getToken(token.content, token.htmlStyle ?? {}, "--hls-")),
          ),
  });
};
