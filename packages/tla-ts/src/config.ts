import { TlaConfigError } from "./errors";
import { matchOperator } from "./lexer";

export type ConfigValue =
  | { kind: "Number"; value: number }
  | { kind: "String"; value: string }
  | { kind: "Boolean"; value: boolean }
  | { kind: "ModelValue"; name: string }
  | { kind: "Set"; elements: ConfigValue[] };

export interface ConstantAssignment {
  name: string;
  value: ConfigValue;
  args?: ConfigValue[];
  module?: string;
}

export interface Substitution {
  name: string;
  target: string;
  module?: string;
}

export interface ModelConfig {
  init: string | undefined;
  next: string | undefined;
  specification: string | undefined;
  invariants: string[];
  properties: string[];
  constraints: string[];
  actionConstraints: string[];
  constants: ConstantAssignment[];
  substitutions: Substitution[];
  checkDeadlock: boolean;
  symmetry: string | undefined;
  view: string | undefined;
  alias: string | undefined;
  postconditions: string[];
  possible: string[];
  periodic: string | undefined;
  rlReward: string | undefined;
}

interface ConfigToken {
  kind: "Word" | "Number" | "String" | "Symbol" | "End";
  text: string;
  line: number;
}

const KEYWORDS = new Set([
  "CONSTANT",
  "CONSTANTS",
  "INIT",
  "NEXT",
  "SPECIFICATION",
  "INVARIANT",
  "INVARIANTS",
  "PROPERTY",
  "PROPERTIES",
  "CONSTRAINT",
  "CONSTRAINTS",
  "ACTION_CONSTRAINT",
  "ACTION_CONSTRAINTS",
  "SYMMETRY",
  "VIEW",
  "CHECK_DEADLOCK",
  "ALIAS",
  "POSTCONDITION",
  "POSTCONDITIONS",
  "_POSSIBLE",
  "_PERIODIC",
  "_RL_REWARD",
]);

const SYMBOLS = ["<-", "<<", ">>", "=", "{", "}", ",", "[", "]", "(", ")"];

const SINGLE_KEYWORDS = {
  INIT: "init",
  NEXT: "next",
  SPECIFICATION: "specification",
  VIEW: "view",
  SYMMETRY: "symmetry",
  ALIAS: "alias",
  _PERIODIC: "periodic",
  _RL_REWARD: "rlReward",
} as const;

const LIST_KEYWORDS = {
  INVARIANT: "invariants",
  INVARIANTS: "invariants",
  PROPERTY: "properties",
  PROPERTIES: "properties",
  CONSTRAINT: "constraints",
  CONSTRAINTS: "constraints",
  ACTION_CONSTRAINT: "actionConstraints",
  ACTION_CONSTRAINTS: "actionConstraints",
  POSTCONDITION: "postconditions",
  POSTCONDITIONS: "postconditions",
  _POSSIBLE: "possible",
} as const;

const isSingleKeyword = (text: string): text is keyof typeof SINGLE_KEYWORDS =>
  Object.hasOwn(SINGLE_KEYWORDS, text);

const isListKeyword = (text: string): text is keyof typeof LIST_KEYWORDS =>
  Object.hasOwn(LIST_KEYWORDS, text);

// JavaCC's TokenMgrError.addEscapes, which TLC's lexical errors use.
const escapeLexeme = (text: string) =>
  [...text]
    .map((character) => {
      const escaped = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r" }[
        character
      ];
      if (escaped) return escaped;
      if (character === '"' || character === "'" || character === "\\") return `\\${character}`;
      const code = character.codePointAt(0) ?? 0;
      return code < 0x20 || code > 0x7e ? `\\u${code.toString(16).padStart(4, "0")}` : character;
    })
    .join("");

// TLC reads a configuration with SANY's lexer, which reports a character it cannot read as a
// JavaCC lexical error.
const createLexicalError = (line: number, column: number, found: string | undefined, after = "") =>
  new TlaConfigError(
    `TLC found an error in the configuration file:\nLexical error at line ${line}, column ${column}.  Encountered: ${found === undefined ? "<EOF> " : `"${escapeLexeme(found)}" (${found.codePointAt(0)}), `}after : "${escapeLexeme(after)}"`,
  );

const createConfigFileError = (line: number, detail: string) =>
  new TlaConfigError(`TLC found an error in the configuration file at line ${line}\n${detail}`);

const tokenizeConfig = (source: string) => {
  // TLC appends a newline so that a trailing \* comment ends.
  const text = `${source}\n`;
  const tokens: ConfigToken[] = [];
  const cursor = { index: 0, line: 1, lineStart: 0 };
  // Moves past text, keeping the line and where it starts.
  const skip = (length: number) => {
    const skipped = text.slice(cursor.index, cursor.index + length);
    const lastBreak = skipped.lastIndexOf("\n");
    if (lastBreak !== -1) {
      cursor.line += skipped.split("\n").length - 1;
      cursor.lineStart = cursor.index + lastBreak + 1;
    }
    cursor.index += length;
  };
  const getEndOfInputError = (after: string) =>
    createLexicalError(cursor.line + 1, 0, undefined, after);
  while (cursor.index < text.length) {
    const rest = text.slice(cursor.index);
    const whitespace = /^\s+/.exec(rest)?.[0];
    if (whitespace) {
      skip(whitespace.length);
      continue;
    }
    if (rest.startsWith("\\*")) {
      cursor.index += rest.indexOf("\n");
      continue;
    }
    if (rest.startsWith("(*")) {
      const end = rest.indexOf("*)");
      if (end === -1) {
        cursor.line += rest.split("\n").length - 2;
        throw getEndOfInputError("");
      }
      skip(end + 2);
      continue;
    }
    const number = /^\d+(?![A-Za-z_])/.exec(rest)?.[0];
    if (number) {
      tokens.push({ kind: "Number", text: number, line: cursor.line });
      cursor.index += number.length;
      continue;
    }
    const word = /^[A-Za-z0-9_!]+/.exec(rest)?.[0];
    if (word) {
      tokens.push({ kind: "Word", text: word, line: cursor.line });
      cursor.index += word.length;
      continue;
    }
    if (rest.startsWith('"')) {
      const string = /^"((?:[^"\\\n]|\\.)*)"/.exec(rest);
      if (!string) {
        const lineEnd = rest.indexOf("\n");
        if (lineEnd === rest.length - 1) throw getEndOfInputError(rest);
        throw createLexicalError(
          cursor.line,
          cursor.index + lineEnd - cursor.lineStart + 1,
          "\n",
          rest.slice(0, lineEnd),
        );
      }
      tokens.push({ kind: "String", text: string[1], line: cursor.line });
      cursor.index += string[0].length;
      continue;
    }
    const symbol = SYMBOLS.find((candidate) => rest.startsWith(candidate));
    if (symbol) {
      tokens.push({ kind: "Symbol", text: symbol, line: cursor.line });
      cursor.index += symbol.length;
      continue;
    }
    const operator = matchOperator(text, cursor.index);
    if (!operator) {
      throw createLexicalError(cursor.line, cursor.index - cursor.lineStart + 1, rest[0]);
    }
    tokens.push({ kind: "Word", text: operator.text, line: cursor.line });
    cursor.index += operator.length;
  }
  tokens.push({ kind: "End", text: "", line: cursor.line - 1 });
  return tokens;
};

// TLC's ModelConfig.parse, which takes any token for a name and stops a list at the next keyword.
export const parseConfig = (source: string): ModelConfig => {
  const tokens = tokenizeConfig(source);
  const cursor = { index: 0 };
  const config: ModelConfig = {
    init: undefined,
    next: undefined,
    specification: undefined,
    invariants: [],
    properties: [],
    constraints: [],
    actionConstraints: [],
    constants: [],
    substitutions: [],
    checkDeadlock: true,
    symmetry: undefined,
    view: undefined,
    alias: undefined,
    postconditions: [],
    possible: [],
    periodic: undefined,
    rlReward: undefined,
  };
  const deadlock = { isSet: false };
  const advance = () => tokens[Math.min(cursor.index++, tokens.length - 1)];
  const isKeyword = (token: ConfigToken) => token.kind === "Word" && KEYWORDS.has(token.text);

  const parseValue = (first: ConfigToken): ConfigValue => {
    if (first.kind === "Number") return { kind: "Number", value: Number(first.text) };
    if (first.kind === "String") return { kind: "String", value: first.text };
    if (first.text === "TRUE" || first.text === "FALSE") {
      return { kind: "Boolean", value: first.text === "TRUE" };
    }
    if (first.text === "{") {
      const elements: ConfigValue[] = [];
      let token = advance();
      if (token.text !== "}") {
        for (;;) {
          elements.push(parseValue(token));
          token = advance();
          if (token.text !== ",") break;
          token = advance();
        }
      }
      if (token.text !== "}")
        throw createConfigFileError(token.line, "It was expecting }, but did not find it.");
      return { kind: "Set", elements };
    }
    if (first.kind !== "End") return { kind: "ModelValue", name: first.text };
    throw createConfigFileError(first.line, "It was expecting a value, but did not find it.");
  };

  const parseModuleScope = (operator: string) => {
    const name = advance();
    if (name.kind === "End") {
      throw createConfigFileError(name.line, `Expected an identifier after ${operator}[.`);
    }
    const close = advance();
    if (close.text !== "]") {
      throw createConfigFileError(close.line, "It was expecting ], but did not find it.");
    }
    return name.text;
  };

  // Returns the token after the constants, which starts the next section.
  const parseConstants = (line: number) => {
    for (;;) {
      const first = advance();
      if (first.kind === "End" || isKeyword(first)) return first;
      const name = { text: first.text };
      let token = advance();
      while (token.text === "!") {
        name.text = `${name.text}!${advance().text}`;
        token = advance();
      }
      if (token.text === "<-") {
        token = advance();
        if (token.text === "[") {
          const module = parseModuleScope("<-");
          const target = advance();
          if (target.kind === "End") {
            throw createConfigFileError(target.line, "Expected an identifier after <-[mod].");
          }
          config.substitutions.push({ name: name.text, target: target.text, module });
          continue;
        }
        if (token.kind === "End") {
          throw createConfigFileError(token.line, "Expected an identifier after <-.");
        }
        config.substitutions.push({ name: name.text, target: token.text });
        continue;
      }
      const args: ConfigValue[] = [];
      if (token.text === "(") {
        for (;;) {
          args.push(parseValue(advance()));
          token = advance();
          if (token.text !== ",") break;
        }
        if (token.text !== ")") throw createConfigFileError(line, "");
        token = advance();
      }
      if (token.text !== "=") {
        throw createConfigFileError(token.line, "It was expecting = or <-, but did not find it.");
      }
      token = advance();
      const module = token.text === "[" ? parseModuleScope("=") : undefined;
      const value = parseValue(module === undefined ? token : advance());
      config.constants.push({
        name: name.text,
        value,
        ...(args.length > 0 && { args }),
        ...(module && { module }),
      });
    }
  };

  let token = advance();
  while (token.kind !== "End") {
    const keyword = token.text;
    const line = token.line;
    if (isSingleKeyword(keyword)) {
      const name = advance();
      if (name.kind === "End") {
        throw createConfigFileError(
          line,
          `The keyword ${keyword} was not followed by an identifier.`,
        );
      }
      const key = SINGLE_KEYWORDS[keyword];
      if (config[key] !== undefined) {
        throw createConfigFileError(line, `The keyword ${keyword} appeared twice.`);
      }
      config[key] = name.text;
      token = advance();
    } else if (isListKeyword(keyword)) {
      const names = config[LIST_KEYWORDS[keyword]];
      token = advance();
      while (token.kind !== "End" && !isKeyword(token)) {
        names.push(token.text);
        token = advance();
      }
    } else if (keyword === "CONSTANT" || keyword === "CONSTANTS") {
      token = parseConstants(line);
    } else if (keyword === "CHECK_DEADLOCK") {
      const value = advance();
      if (value.kind === "End") {
        throw createConfigFileError(
          line,
          "The keyword CHECK_DEADLOCK was not followed by an identifier.",
        );
      }
      if (value.text !== "TRUE" && value.text !== "FALSE") {
        throw createConfigFileError(
          value.line,
          "It was expecting TRUE or FALSE, but did not find it.",
        );
      }
      if (deadlock.isSet) {
        throw createConfigFileError(line, "The keyword CHECK_DEADLOCK appeared twice.");
      }
      deadlock.isSet = true;
      config.checkDeadlock = value.text === "TRUE";
      token = advance();
    } else {
      throw createConfigFileError(line, "It was expecting a keyword, but did not find it.");
    }
  }
  if (
    config.specification !== undefined &&
    (config.init !== undefined || config.next !== undefined)
  ) {
    throw new TlaConfigError(
      "The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.",
    );
  }
  return config;
};
