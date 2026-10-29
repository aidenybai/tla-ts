// tlapm's method pragmas: the (*{ by (prover:"zenon"; timeout:@) }*) after a definition, which
// E_parser.read_new_method reads, and which makes the definition a Bpragma.

export type PragmaValue =
  | { kind: "Default" }
  | { kind: "String"; value: string }
  | { kind: "Float"; value: number };

export interface PragmaSetting {
  hint: string;
  value: PragmaValue;
}

interface Position {
  line: number;
  column: number;
}

type Token =
  | { kind: "Ident"; text: string }
  | { kind: "String"; text: string }
  | { kind: "Number"; text: string }
  | { kind: "Punct"; text: string };

const PUNCTUATION = ["(", ")", ";", ":", "@", ","];

const isBlank = (character: string | undefined) =>
  character === " " || character === "\r" || character === "\t";

// The tokens of the pragma that starts at position, after blanks and line ends.
const tokenizePragma = (lines: string[], start: Position) => {
  const position = { ...start };
  const skipBlanks = () => {
    while (position.line < lines.length) {
      const line = lines[position.line];
      while (isBlank(line[position.column])) position.column++;
      if (position.column < line.length) return;
      position.line++;
      position.column = 0;
    }
  };
  skipBlanks();
  if (!(lines[position.line] ?? "").startsWith("(*{", position.column)) return undefined;
  position.column += 3;
  const tokens: Token[] = [];
  for (skipBlanks(); position.line < lines.length; skipBlanks()) {
    const rest = lines[position.line].slice(position.column);
    if (rest.startsWith("}*)")) return tokens;
    const match =
      /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest) ??
      /^\d+(\.\d+)?/.exec(rest) ??
      /^"(\\.|[^"\\])*"/.exec(rest);
    if (match) {
      const text = match[0];
      tokens.push(
        text.startsWith('"')
          ? { kind: "String", text: JSON.parse(text) }
          : /^\d/.test(text)
            ? { kind: "Number", text }
            : { kind: "Ident", text },
      );
      position.column += text.length;
      continue;
    }
    if (!PUNCTUATION.includes(rest[0])) return undefined;
    tokens.push({ kind: "Punct", text: rest[0] });
    position.column++;
  }
  return undefined;
};

const getValue = (token: Token | undefined): PragmaValue | undefined => {
  if (token?.kind === "String") return { kind: "String", value: token.text };
  if (token?.kind === "Number") return { kind: "Float", value: Number.parseFloat(token.text) };
  return token?.kind === "Punct" && token.text === "@" ? { kind: "Default" } : undefined;
};

// read_new_method: by (hint: value; ...), repeated, where a value is a string, a number, or @ for
// the argument the definition is applied to.
export const readNewMethod = (lines: string[], start: Position) => {
  const tokens = tokenizePragma(lines, start);
  if (!tokens) return undefined;
  let index = 0;
  const isPunct = (text: string) => tokens[index]?.kind === "Punct" && tokens[index].text === text;
  const groups: PragmaSetting[][] = [];
  while (index < tokens.length) {
    const keyword = tokens[index++];
    if (keyword.kind !== "Ident" || (keyword.text !== "by" && keyword.text !== "set")) {
      return undefined;
    }
    if (!isPunct("(")) return undefined;
    index++;
    const settings: PragmaSetting[] = [];
    for (;;) {
      const hint = tokens[index++];
      if (hint?.kind !== "Ident" || !isPunct(":")) return undefined;
      index++;
      const value = getValue(tokens[index++]);
      if (!value) return undefined;
      settings.push({ hint: hint.text, value });
      if (isPunct(")")) break;
      if (!isPunct(";")) return undefined;
      index++;
    }
    index++;
    groups.push(settings);
  }
  return groups;
};
