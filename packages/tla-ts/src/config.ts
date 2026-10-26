import { TlaConfigError, TlaUnsupportedError } from "./errors";
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
}

export interface Substitution {
  name: string;
  target: string;
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
  postconditions: string[];
  possible: string[];
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
]);

const SYMBOLS = ["<-", "<<", ">>", "=", "{", "}", ",", "[", "]", "(", ")"];

const tokenizeConfig = (source: string): ConfigToken[] => {
  const tokens: ConfigToken[] = [];
  const cursor = { index: 0, line: 1 };
  while (cursor.index < source.length) {
    const rest = source.slice(cursor.index);
    const whitespace = /^\s+/.exec(rest)?.[0];
    if (whitespace) {
      cursor.line += whitespace.split("\n").length - 1;
      cursor.index += whitespace.length;
      continue;
    }
    if (rest.startsWith("\\*")) {
      const lineEnd = rest.indexOf("\n");
      cursor.index += lineEnd === -1 ? rest.length : lineEnd;
      continue;
    }
    if (rest.startsWith("(*")) {
      const end = rest.indexOf("*)");
      if (end === -1) throw new TlaConfigError(`Unterminated comment at line ${cursor.line}`);
      cursor.line += rest.slice(0, end).split("\n").length - 1;
      cursor.index += end + 2;
      continue;
    }
    const number = /^-?\d+(?![A-Za-z_])/.exec(rest)?.[0];
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
    const string = /^"((?:[^"\\]|\\.)*)"/.exec(rest);
    if (string) {
      tokens.push({ kind: "String", text: JSON.parse(`"${string[1]}"`), line: cursor.line });
      cursor.index += string[0].length;
      continue;
    }
    const symbol = SYMBOLS.find((candidate) => rest.startsWith(candidate));
    if (symbol) {
      tokens.push({ kind: "Symbol", text: symbol, line: cursor.line });
      cursor.index += symbol.length;
      continue;
    }
    const operator = matchOperator(source, cursor.index);
    if (!operator)
      throw new TlaConfigError(
        `Unexpected character ${JSON.stringify(rest[0])} at line ${cursor.line}`,
      );
    tokens.push({ kind: "Word", text: operator.text, line: cursor.line });
    cursor.index += operator.length;
  }
  tokens.push({ kind: "End", text: "", line: cursor.line });
  return tokens;
};

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
    postconditions: [],
    possible: [],
  };

  const peek = () => tokens[cursor.index];
  const advance = () => tokens[cursor.index++];
  const isKeyword = (token: ConfigToken) => token.kind === "Word" && KEYWORDS.has(token.text);
  const expect = (text: string) => {
    const token = advance();
    if (token.text !== text) {
      throw new TlaConfigError(
        `Expected ${JSON.stringify(text)} but found ${JSON.stringify(token.text)} at line ${token.line}`,
      );
    }
  };
  const expectName = () => {
    const token = advance();
    if (token.kind !== "Word" || isKeyword(token)) {
      throw new TlaConfigError(
        `Expected a name but found ${JSON.stringify(token.text)} at line ${token.line}`,
      );
    }
    return token.text;
  };
  const parseNames = () => {
    const names: string[] = [];
    while (peek().kind === "Word" && !isKeyword(peek())) names.push(advance().text);
    return names;
  };
  const setSingle = (
    key: "init" | "next" | "specification" | "symmetry" | "view",
    keyword: string,
  ) => {
    if (config[key] !== undefined) throw new TlaConfigError(`The keyword ${keyword} appears twice`);
    config[key] = expectName();
  };

  const parseValue = (): ConfigValue => {
    const token = advance();
    if (token.kind === "Number") return { kind: "Number", value: Number(token.text) };
    if (token.kind === "String") return { kind: "String", value: token.text };
    if (token.text === "TRUE" || token.text === "FALSE")
      return { kind: "Boolean", value: token.text === "TRUE" };
    if (token.text === "{") {
      const elements: ConfigValue[] = [];
      while (peek().text !== "}") {
        elements.push(parseValue());
        if (peek().text !== "}") expect(",");
      }
      advance();
      return { kind: "Set", elements };
    }
    if (token.kind === "Word" && !isKeyword(token)) return { kind: "ModelValue", name: token.text };
    throw new TlaConfigError(
      `Expected a value but found ${JSON.stringify(token.text)} at line ${token.line}`,
    );
  };

  const parseConstants = () => {
    while (peek().kind === "Word" && !isKeyword(peek())) {
      const name = advance().text;
      if (peek().text === "(")
        throw new TlaUnsupportedError(`Assigning operator constant ${name} is not supported`);
      if (peek().text === "<-") {
        advance();
        if (peek().text === "[")
          throw new TlaUnsupportedError("Module-scoped substitutions are not supported");
        config.substitutions.push({ name, target: expectName() });
        continue;
      }
      expect("=");
      if (peek().text === "[")
        throw new TlaUnsupportedError("Module-scoped constant values are not supported");
      config.constants.push({ name, value: parseValue() });
    }
  };

  while (peek().kind !== "End") {
    const token = advance();
    switch (token.text) {
      case "CONSTANT":
      case "CONSTANTS":
        parseConstants();
        break;
      case "INIT":
        setSingle("init", token.text);
        break;
      case "NEXT":
        setSingle("next", token.text);
        break;
      case "SPECIFICATION":
        setSingle("specification", token.text);
        break;
      case "SYMMETRY":
        setSingle("symmetry", token.text);
        break;
      case "VIEW":
        setSingle("view", token.text);
        break;
      case "INVARIANT":
      case "INVARIANTS":
        config.invariants.push(...parseNames());
        break;
      case "PROPERTY":
      case "PROPERTIES":
        config.properties.push(...parseNames());
        break;
      case "CONSTRAINT":
      case "CONSTRAINTS":
        config.constraints.push(...parseNames());
        break;
      case "ACTION_CONSTRAINT":
      case "ACTION_CONSTRAINTS":
        config.actionConstraints.push(...parseNames());
        break;
      case "ALIAS":
        expectName();
        break;
      case "POSTCONDITION":
      case "POSTCONDITIONS":
        config.postconditions.push(...parseNames());
        break;
      case "_POSSIBLE":
        config.possible.push(...parseNames());
        break;
      case "CHECK_DEADLOCK": {
        const value = advance().text;
        if (value !== "TRUE" && value !== "FALSE") {
          throw new TlaConfigError(
            `CHECK_DEADLOCK expects TRUE or FALSE but found ${JSON.stringify(value)}`,
          );
        }
        config.checkDeadlock = value === "TRUE";
        break;
      }
      default:
        throw new TlaConfigError(`Unexpected ${JSON.stringify(token.text)} at line ${token.line}`);
    }
  }
  if (
    config.specification !== undefined &&
    (config.init !== undefined || config.next !== undefined)
  ) {
    throw new TlaConfigError("SPECIFICATION cannot be combined with INIT or NEXT");
  }
  return config;
};
