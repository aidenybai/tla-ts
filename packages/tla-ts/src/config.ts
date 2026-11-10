import { TlaConfigError } from "./errors";
import { matchOperator, matchUnicodeToken } from "./lexer";
import { formatLexicalError } from "./sany/lexer";
import type { TlcVersion } from "./tlc/version";

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

const SHARED_KEYWORDS = [
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
];

const KEYWORDS = new Set([
  ...SHARED_KEYWORDS,
  "ALIAS",
  "POSTCONDITION",
  "POSTCONDITIONS",
  "_POSSIBLE",
  "_PERIODIC",
  "_RL_REWARD",
]);

const TYPE_KEYWORDS = ["TYPE", "TYPE_CONSTRAINT"];
const KEYWORDS_174 = new Set([...SHARED_KEYWORDS, ...TYPE_KEYWORDS]);

const SYMBOLS = ["<-", "<<", ">>", "=", "{", "}", ",", "[", "]", "(", ")", "!"];

const tokenizeConfig = (source: string) => {
  const tokens: ConfigToken[] = [];
  let position = 0;
  let lineNumber = 1;
  let lineStart = 0;
  const addLexicalError = (index: number, after: string) => {
    tokens.push({
      kind: "Error",
      text: formatLexicalError(lineNumber, index - lineStart + 1, source[index], after),
      line: lineNumber,
    });
  };
  const addEndOfInputError = (after: string) => {
    tokens.push({
      kind: "Error",
      text: formatLexicalError(lineNumber + 1, 0, undefined, after),
      line: lineNumber,
    });
  };
  const skip = (text: string) => {
    const lines = text.split("\n");
    if (lines.length > 1) {
      lineNumber += lines.length - 1;
      lineStart = position + text.length - lines[lines.length - 1].length;
    }
    position += text.length;
  };
  while (position < source.length) {
    const rest = source.slice(position);
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
        addEndOfInputError("");
        return tokens;
      }
      skip(rest.slice(0, end + 2));
      continue;
    }
    const line = lineNumber;
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
        if (position === source.length) addEndOfInputError(`${text}\n`);
        else addLexicalError(position, text);
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
    const operator = matchUnicodeToken(source, position) ?? matchOperator(source, position);
    if (!operator) {
      addLexicalError(position, "");
      return tokens;
    }
    tokens.push({ kind: "Word", text: operator.text, line });
    skip(source.slice(position, position + operator.length));
  }
  tokens.push({ kind: "End", text: "", line: lineNumber });
  return tokens;
};

const createSyntaxError = (line: number, problem: string) =>
  new TlaConfigError(`TLC found an error in the configuration file at line ${line}\n${problem}`);

const createDuplicateKeywordError = (line: number, keyword: string) =>
  createSyntaxError(line, `The keyword ${keyword} appeared twice.`);

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

export const parseConfig = (source: string, version: TlcVersion = "master"): ModelConfig => {
  const keywords = version === "1.7.4" ? KEYWORDS_174 : KEYWORDS;
  const tokens = tokenizeConfig(source);
  let tokenIndex = 0;
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
  let isDeadlockSet = false;
  const typeKeywords = new Set<string>();
  const advance = () => {
    const token = tokens[Math.min(tokenIndex++, tokens.length - 1)];
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
      let current = advance();
      if (current.text !== "}") {
        while (true) {
          elements.push(parseValue(current));
          current = advance();
          if (current.text !== ",") break;
          current = advance();
        }
      }
      if (current.text !== "}") {
        throw createSyntaxError(current.line, "It was expecting }, but did not find it.");
      }
      return { kind: "Set", elements };
    }
    if (token.kind !== "End") return { kind: "ModelValue", name: token.text };
    throw createSyntaxError(token.line, "It was expecting a value, but did not find it.");
  };

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

  const parseConstants = (keywordLine: number) => {
    while (true) {
      const first = advance();
      if (first.kind === "End" || keywords.has(first.text)) return first;
      let token = advance();
      let name = first.text;
      while (token.text === "!") {
        name = `${name}!${advance().text}`;
        token = advance();
      }
      if (token.text === "<-") {
        token = advance();
        if (token.text === "[") {
          const module = parseModuleScope("<-");
          const target = advance();
          if (target.kind === "End") {
            throw createSyntaxError(target.line, "Expected an identifier after <-[mod].");
          }
          config.substitutions.push({ name, target: target.text, module });
          continue;
        }
        if (token.kind === "End") {
          throw createSyntaxError(token.line, "Expected an identifier after <-.");
        }
        config.substitutions.push({ name, target: token.text });
        continue;
      }
      const args: ConfigValue[] = [];
      const hasArgs = token.text === "(";
      if (hasArgs) {
        while (true) {
          args.push(parseValue(advance()));
          token = advance();
          if (token.text !== ",") break;
        }
        if (token.text !== ")") {
          throw createSyntaxError(keywordLine, "");
        }
        token = advance();
      }
      if (token.text !== "=") {
        throw createSyntaxError(token.line, "It was expecting = or <-, but did not find it.");
      }
      token = advance();
      const module = token.text === "[" ? parseModuleScope("=") : undefined;
      const value = parseValue(module === undefined ? token : advance());
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
      if (token.kind === "End" || keywords.has(token.text)) return token;
      names.push(token.text);
    }
  };

  let current = advance();
  while (current.kind !== "End") {
    const keyword = current.text;
    const line = current.line;
    const singleKey = keywords.has(keyword) ? SINGLE_KEYWORDS.get(keyword) : undefined;
    const listKey = keywords.has(keyword) ? LIST_KEYWORDS.get(keyword) : undefined;
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
        throw createDuplicateKeywordError(line, keyword);
      }
      config[singleKey] = name.text;
      current = advance();
      continue;
    }
    if (listKey !== undefined) {
      current = parseNames(config[listKey]);
      continue;
    }
    if (keyword === "CONSTANT" || keyword === "CONSTANTS") {
      current = parseConstants(line);
      continue;
    }
    if (keyword === "CHECK_DEADLOCK") {
      const value = advanceToArgument();
      if (value.text !== "TRUE" && value.text !== "FALSE") {
        throw createSyntaxError(value.line, "It was expecting TRUE or FALSE, but did not find it.");
      }
      if (isDeadlockSet) throw createDuplicateKeywordError(line, keyword);
      isDeadlockSet = true;
      config.checkDeadlock = value.text === "TRUE";
      current = advance();
      continue;
    }
    if (!keywords.has(keyword) || !TYPE_KEYWORDS.includes(keyword)) {
      throw createSyntaxError(line, "It was expecting a keyword, but did not find it.");
    }
    advanceToArgument();
    if (typeKeywords.has(keyword)) throw createDuplicateKeywordError(line, keyword);
    typeKeywords.add(keyword);
    current = advance();
  }
  return config;
};
