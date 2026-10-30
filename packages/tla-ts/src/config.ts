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
  kind: "Word" | "Number" | "String" | "Symbol" | "End" | "Error";
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

const SYMBOLS = ["<-", "<<", ">>", "=", "{", "}", ",", "[", "]", "(", ")", "!"];

// JavaCC's TokenMgrError.addEscapes, which TLC's lexical errors use.
const ESCAPES = new Map([
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\f", "\\f"],
  ["\r", "\\r"],
]);

const escapeLexeme = (text: string) =>
  text.replace(/[\b\t\n\f\r"'\\]/g, (character) => ESCAPES.get(character) ?? `\\${character}`);

// TLC reads a configuration file with the TLA+ lexer. A lexical error ends the tokens; TLC reports
// it only when it reads that far.
const tokenizeConfig = (source: string) => {
  const tokens: ConfigToken[] = [];
  const cursor = { index: 0, line: 1, lineStart: 0 };
  const addLexicalError = (index: number, after: string) => {
    const character = source[index];
    const column = index - cursor.lineStart + 1;
    const encountered =
      character === undefined
        ? "<EOF> "
        : `"${escapeLexeme(character)}" (${character.charCodeAt(0)}), `;
    tokens.push({
      kind: "Error",
      text: `Lexical error at line ${cursor.line}, column ${column}.  Encountered: ${encountered}after : "${escapeLexeme(after)}"`,
      line: cursor.line,
    });
  };
  const skip = (text: string) => {
    const lines = text.split("\n");
    if (lines.length > 1) {
      cursor.line += lines.length - 1;
      cursor.lineStart = cursor.index + text.length - lines[lines.length - 1].length;
    }
    cursor.index += text.length;
  };
  while (cursor.index < source.length) {
    const rest = source.slice(cursor.index);
    const whitespace = /^\s+/.exec(rest)?.[0];
    if (whitespace) {
      skip(whitespace);
      continue;
    }
    if (rest.startsWith("\\*")) {
      const lineEnd = rest.indexOf("\n");
      skip(lineEnd === -1 ? rest : rest.slice(0, lineEnd));
      continue;
    }
    if (rest.startsWith("(*")) {
      const end = rest.indexOf("*)");
      if (end === -1) {
        skip(rest);
        addLexicalError(cursor.index, "");
        return tokens;
      }
      skip(rest.slice(0, end + 2));
      continue;
    }
    const line = cursor.line;
    const number = /^\d+(?![A-Za-z_])/.exec(rest)?.[0];
    if (number) {
      tokens.push({ kind: "Number", text: number, line });
      skip(number);
      continue;
    }
    const word = /^[A-Za-z0-9_]+/.exec(rest)?.[0];
    if (word) {
      tokens.push({ kind: "Word", text: word, line });
      skip(word);
      continue;
    }
    if (rest.startsWith('"')) {
      const string = /^"((?:[^"\\\n]|\\[^\n])*)("?)/.exec(rest);
      const text = string?.[0] ?? '"';
      if (string?.[2] !== '"') {
        skip(text);
        addLexicalError(cursor.index, text);
        return tokens;
      }
      tokens.push({ kind: "String", text: string[1], line });
      skip(text);
      continue;
    }
    const symbol = SYMBOLS.find((candidate) => rest.startsWith(candidate));
    if (symbol) {
      tokens.push({ kind: "Symbol", text: symbol, line });
      skip(symbol);
      continue;
    }
    const operator = matchOperator(source, cursor.index);
    if (!operator) {
      addLexicalError(cursor.index, "");
      return tokens;
    }
    tokens.push({ kind: "Word", text: operator.text, line });
    skip(source.slice(cursor.index, cursor.index + operator.length));
  }
  tokens.push({ kind: "End", text: "", line: cursor.line });
  return tokens;
};

// TLC's messages for a configuration file it can't read, from ModelConfig.parse.
const createSyntaxError = (line: number, problem: string) =>
  new TlaConfigError(`TLC found an error in the configuration file at line ${line}\n${problem}`);

const SINGLE_KEYWORDS = new Map<
  string,
  "init" | "next" | "specification" | "view" | "symmetry" | "alias" | "periodic" | "rlReward"
>([
  ["INIT", "init"],
  ["NEXT", "next"],
  ["SPECIFICATION", "specification"],
  ["VIEW", "view"],
  ["SYMMETRY", "symmetry"],
  ["ALIAS", "alias"],
  ["_PERIODIC", "periodic"],
  ["_RL_REWARD", "rlReward"],
]);

const LIST_KEYWORDS = new Map<
  string,
  "invariants" | "properties" | "constraints" | "actionConstraints" | "postconditions" | "possible"
>([
  ["INVARIANT", "invariants"],
  ["INVARIANTS", "invariants"],
  ["PROPERTY", "properties"],
  ["PROPERTIES", "properties"],
  ["CONSTRAINT", "constraints"],
  ["CONSTRAINTS", "constraints"],
  ["ACTION_CONSTRAINT", "actionConstraints"],
  ["ACTION_CONSTRAINTS", "actionConstraints"],
  ["POSTCONDITION", "postconditions"],
  ["POSTCONDITIONS", "postconditions"],
  ["_POSSIBLE", "possible"],
]);

// A port of TLC's ModelConfig.parse, which takes any token where it expects a name or a value.
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
  const advance = () => {
    const token = tokens[Math.min(cursor.index++, tokens.length - 1)];
    if (token.kind === "Error") {
      throw new TlaConfigError(`TLC found an error in the configuration file:\n${token.text}`);
    }
    return token;
  };

  const parseValue = (token: ConfigToken): ConfigValue => {
    if (token.kind === "Number") return { kind: "Number", value: Number(token.text) };
    if (token.kind === "String") return { kind: "String", value: token.text };
    if (token.text === "TRUE" || token.text === "FALSE")
      return { kind: "Boolean", value: token.text === "TRUE" };
    if (token.text === "{") {
      const elements: ConfigValue[] = [];
      const current = { token: advance() };
      if (current.token.text !== "}") {
        while (true) {
          elements.push(parseValue(current.token));
          current.token = advance();
          if (current.token.text !== ",") break;
          current.token = advance();
        }
      }
      if (current.token.text !== "}") {
        throw createSyntaxError(current.token.line, "It was expecting }, but did not find it.");
      }
      return { kind: "Set", elements };
    }
    if (token.kind !== "End") return { kind: "ModelValue", name: token.text };
    throw createSyntaxError(token.line, "It was expecting a value, but did not find it.");
  };

  // A module name in brackets after = or <-, which applies the assignment in that module.
  const parseModuleScope = (operator: string) => {
    const name = advance();
    if (name.kind === "End") {
      throw createSyntaxError(name.line, `Expected an identifier after ${operator}[.`);
    }
    const close = advance();
    if (close.text !== "]") {
      throw createSyntaxError(close.line, "It was expecting ], but did not find it.");
    }
    return name.text;
  };

  // TLC reports a malformed argument list at the line of the CONSTANT keyword.
  const parseConstants = (keywordLine: number) => {
    while (true) {
      const first = advance();
      if (first.kind === "End" || KEYWORDS.has(first.text)) return first;
      const current = { token: advance(), name: first.text };
      while (current.token.text === "!") {
        current.name = `${current.name}!${advance().text}`;
        current.token = advance();
      }
      const name = current.name;
      if (current.token.text === "<-") {
        current.token = advance();
        if (current.token.text === "[") {
          const module = parseModuleScope("<-");
          const target = advance();
          if (target.kind === "End") {
            throw createSyntaxError(target.line, "Expected an identifier after <-[mod].");
          }
          config.substitutions.push({ name, target: target.text, module });
          continue;
        }
        if (current.token.kind === "End") {
          throw createSyntaxError(current.token.line, "Expected an identifier after <-.");
        }
        config.substitutions.push({ name, target: current.token.text });
        continue;
      }
      const args: ConfigValue[] = [];
      const hasArgs = current.token.text === "(";
      if (hasArgs) {
        while (true) {
          args.push(parseValue(advance()));
          current.token = advance();
          if (current.token.text !== ",") break;
        }
        if (current.token.text !== ")") {
          throw createSyntaxError(keywordLine, "");
        }
        current.token = advance();
      }
      if (current.token.text !== "=") {
        throw createSyntaxError(
          current.token.line,
          "It was expecting = or <-, but did not find it.",
        );
      }
      current.token = advance();
      const module = current.token.text === "[" ? parseModuleScope("=") : undefined;
      const value = parseValue(module === undefined ? current.token : advance());
      config.constants.push({
        name,
        value,
        ...(hasArgs && { args }),
        ...(module !== undefined && { module }),
      });
    }
  };

  const parseNames = (names: string[]) => {
    while (true) {
      const token = advance();
      if (token.kind === "End" || KEYWORDS.has(token.text)) return token;
      names.push(token.text);
    }
  };

  const current = { token: advance() };
  while (current.token.kind !== "End") {
    const keyword = current.token.text;
    const line = current.token.line;
    const singleKey = SINGLE_KEYWORDS.get(keyword);
    const listKey = LIST_KEYWORDS.get(keyword);
    const advanceToArgument = () => {
      const argument = advance();
      if (argument.kind === "End") {
        throw createSyntaxError(line, `The keyword ${keyword} was not followed by an identifier.`);
      }
      return argument;
    };
    if (singleKey !== undefined) {
      const name = advanceToArgument();
      if (config[singleKey] !== undefined) {
        throw createSyntaxError(line, `The keyword ${keyword} appeared twice.`);
      }
      config[singleKey] = name.text;
      current.token = advance();
    } else if (listKey !== undefined) {
      current.token = parseNames(config[listKey]);
    } else if (keyword === "CONSTANT" || keyword === "CONSTANTS") {
      current.token = parseConstants(line);
    } else if (keyword === "CHECK_DEADLOCK") {
      const value = advanceToArgument();
      if (value.text !== "TRUE" && value.text !== "FALSE") {
        throw createSyntaxError(value.line, "It was expecting TRUE or FALSE, but did not find it.");
      }
      if (deadlock.isSet) throw createSyntaxError(line, `The keyword ${keyword} appeared twice.`);
      deadlock.isSet = true;
      config.checkDeadlock = value.text === "TRUE";
      current.token = advance();
    } else {
      throw createSyntaxError(line, "It was expecting a keyword, but did not find it.");
    }
  }
  return config;
};
