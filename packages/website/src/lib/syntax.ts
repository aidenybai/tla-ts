type Language = "typescript" | "tla";

const TOKEN_KINDS = [
  "comment",
  "string",
  "number",
  "keyword",
  "definition",
  "type",
  "name",
] as const;

export type TokenKind = (typeof TOKEN_KINDS)[number];

export interface Token {
  kind: TokenKind;
  start: number;
  end: number;
}

const PATTERNS: Record<Language, RegExp> = {
  typescript:
    /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<string>"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<number>\b\d+(?:\.\d+)?\b)|(?<keyword>\b(?:as|break|case|const|continue|default|else|export|false|for|from|function|if|import|in|interface|let|new|null|of|readonly|return|switch|throw|true|type|typeof|undefined|void|while)\b)|(?<definition>(?<=\b(?:const|let|function|type|interface)\s+)[A-Za-z_$][\w$]*)|(?<type>\b[A-Z][\w$]*)|(?<name>\b[A-Za-z_$][\w$]*)/g,
  tla: /(?<comment>\\\*[^\n]*|\(\*[\s\S]*?\*\)|-{4,}|={4,})|(?<string>"(?:[^"\\\n]|\\.)*")|(?<number>\b\d+\b|\b(?:TRUE|FALSE)\b)|(?<keyword>\b(?:ACTION_CONSTRAINTS?|ASSUME|BOOLEAN|CASE|CHECK_DEADLOCK|CHOOSE|CONSTANTS?|CONSTRAINTS?|DOMAIN|ELSE|ENABLED|EXCEPT|EXTENDS|IF|IN|INVARIANTS?|LAMBDA|LET|MODULE|OTHER|POSTCONDITIONS?|PROPERTIES|RECURSIVE|SPECIFICATION|SUBSET|SYMMETRY|THEN|UNCHANGED|UNION|VARIABLES?|VIEW)\b|\\(?:A|E|in|notin|cup|cap|subseteq|div|X|o)\b|\b(?:WF|SF)_)|(?<definition>^[A-Za-z_]\w*(?=(?:\([^)\n]*\))? ==))|(?<name>\b[A-Za-z_]\w*)/gm,
};

export const getTokens = (text: string, language: Language): Token[] =>
  [...text.matchAll(PATTERNS[language])].map((match) => ({
    kind: TOKEN_KINDS.find((kind) => match.groups?.[kind] !== undefined) ?? "name",
    start: match.index,
    end: match.index + match[0].length,
  }));
