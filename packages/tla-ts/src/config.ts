import { getUnexpectedException, TlaConfigError } from "./errors";
import { EXIT_STATUS, setExitCode } from "./exit-codes";
import { createSanyLexer, getKind } from "./sany/lexer";
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
  rawConstants: string[];
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
  kind: "Word" | "Number" | "String" | "End" | "Error";
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

const tokenizeConfig = (source: string) => {
  // TLC appends a line break, so a \* comment can end the file.
  const readToken = createSanyLexer(`${source}\n`, "SPEC");
  const tokens: ConfigToken[] = [];
  let token = readToken();
  while ("kind" in token && token.kind !== getKind("EOF")) {
    const kind =
      token.kind === getKind("NUMBER_LITERAL")
        ? "Number"
        : token.kind === getKind("STRING_LITERAL")
          ? "String"
          : "Word";
    tokens.push({ kind, text: token.image, line: token.beginLine });
    token = readToken();
  }
  tokens.push(
    "kind" in token
      ? { kind: "End", text: "", line: token.beginLine }
      : { kind: "Error", text: token.message, line: token.endLine },
  );
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
    rawConstants: [],
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

  const parseLeaf = (token: ConfigToken): ConfigValue => {
    if (token.kind === "Number" && token.text.startsWith("\\")) {
      throw setExitCode(
        new TlaConfigError(
          `${getUnexpectedException("java.lang.NumberFormatException")}For input string: "${token.text}"`,
        ),
        EXIT_STATUS.error,
      );
    }
    if (token.kind === "Number") return { kind: "Number", value: Number(token.text) };
    if (token.kind === "String" && token.text.includes("\\")) {
      throw new TlaConfigError(
        `TLC found an error in the configuration file:\nescape sequences are not supported in strings at line ${token.line}`,
      );
    }
    if (token.kind === "String") return { kind: "String", value: token.text.slice(1, -1) };
    if (token.text === "TRUE" || token.text === "FALSE")
      return { kind: "Boolean", value: token.text === "TRUE" };
    if (token.kind !== "End") return { kind: "ModelValue", name: token.text };
    throw createSyntaxError(token.line, "It was expecting a value, but did not find it.");
  };

  const parseValue = (first: ConfigToken): ConfigValue => {
    const sets: ConfigValue[][] = [];
    let token = first;
    while (true) {
      if (token.text === "{") {
        const element = advance();
        if (element.text !== "}") {
          sets.push([]);
          token = element;
          continue;
        }
      }
      let value: ConfigValue =
        token.text === "{" ? { kind: "Set", elements: [] } : parseLeaf(token);
      while (true) {
        const elements = sets.at(-1);
        if (elements === undefined) return value;
        elements.push(value);
        const separator = advance();
        if (separator.text === ",") {
          token = advance();
          break;
        }
        if (separator.text !== "}") {
          throw createSyntaxError(separator.line, "It was expecting }, but did not find it.");
        }
        sets.pop();
        value = { kind: "Set", elements };
      }
    }
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

  const parseConstant = (first: ConfigToken, keywordLine: number) => {
    let name = first.text;
    let token = advance();
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
        return;
      }
      if (token.kind === "End") {
        throw createSyntaxError(token.line, "Expected an identifier after <-.");
      }
      config.substitutions.push({ name, target: token.text });
      return;
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
  };

  const parseConstants = (keywordLine: number) => {
    while (true) {
      const first = advance();
      if (first.kind === "End" || keywords.has(first.text)) return first;
      const start = tokenIndex - 1;
      parseConstant(first, keywordLine);
      config.rawConstants.push(
        tokens
          .slice(start, tokenIndex)
          .map((token) => token.text)
          .join(" "),
      );
    }
  };

  const parseNames = (names: string[]) => {
    while (true) {
      const token = advance();
      if (token.kind === "End" || keywords.has(token.text)) return token;
      names.push(token.text);
    }
  };

  let keywordToken = advance();
  while (keywordToken.kind !== "End") {
    const keyword = keywordToken.text;
    const line = keywordToken.line;
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
      keywordToken = advance();
      continue;
    }
    if (listKey !== undefined) {
      keywordToken = parseNames(config[listKey]);
      continue;
    }
    if (keyword === "CONSTANT" || keyword === "CONSTANTS") {
      keywordToken = parseConstants(line);
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
      keywordToken = advance();
      continue;
    }
    if (!keywords.has(keyword) || !TYPE_KEYWORDS.includes(keyword)) {
      throw createSyntaxError(line, "It was expecting a keyword, but did not find it.");
    }
    advanceToArgument();
    if (typeKeywords.has(keyword)) throw createDuplicateKeywordError(line, keyword);
    typeKeywords.add(keyword);
    keywordToken = advance();
  }
  return config;
};
