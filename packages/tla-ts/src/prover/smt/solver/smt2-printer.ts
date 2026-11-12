// Ported from Z3 (src/ast/format.cpp, src/ast/pp.cpp, src/ast/ast_smt2_pp.cpp,
// src/ast/shared_occs.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_BV,
  FAMILY_CHAR,
  FAMILY_FPA,
  FAMILY_PB,
  FAMILY_SEQ,
  OP_SEQ_CONCAT,
  OP_SEQ_EMPTY,
  OP_ARRAY_EXT,
  OP_FPA_NUM,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_CONST_ARRAY,
  OP_DT_IS,
  OP_DT_UPDATE_FIELD,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_MUL,
  OP_NUM,
  OP_OR,
  OP_LABEL,
  OP_LABEL_LIT,
  OP_PATTERN,
  OP_XOR,
  SORT_INT,
  type SmtSymbol,
} from "./ast";
import { isAssociativeBvOp } from "./bv-decl-plugin";
import { getFpNumeral } from "./fpa-decl-plugin";
import { biasExp, isDenormal, isInf, isNan, isZero, mkMinExp, type Mpf } from "./mpf";
import { formatZstring } from "./seq-decl-plugin";

interface TextFormat {
  kind: "text";
  text: string;
}

interface IndentFormat {
  kind: "indent";
  amount: number;
  child: Format;
}

interface ComposeFormat {
  kind: "compose";
  children: Format[];
}

interface ChoiceFormat {
  kind: "choice";
  flat: Format;
  broken: Format;
}

interface LineBreakFormat {
  kind: "line-break";
}

export type Format = TextFormat | IndentFormat | ComposeFormat | ChoiceFormat | LineBreakFormat;

export interface PrintOptions {
  maxIndent: number;
  maxNumLines: number;
  maxWidth: number;
  maxRibbon: number;
  maxDepth: number;
  minAliasSize: number;
  isFlatAssoc: boolean;
  isSingleLine: boolean;
  isBounded: boolean;
  isDecimal: boolean;
  decimalPrecision: number;
  isBvLiterals: boolean;
  isBvNeg: boolean;
  isFpRealLiterals: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  maxIndent: Infinity,
  maxNumLines: Infinity,
  maxWidth: 80,
  maxRibbon: 80,
  maxDepth: 5,
  minAliasSize: 10,
  isFlatAssoc: true,
  isSingleLine: false,
  isBounded: false,
  isDecimal: false,
  decimalPrecision: 10,
  isBvLiterals: true,
  isBvNeg: false,
  isFpRealLiterals: false,
};

export interface PrintEnvironment {
  options: PrintOptions;
  isUsed: (name: string) => boolean;
  // Another declaration of the same name takes the same arguments, so the name needs its sort.
  isClashing: (decl: number) => boolean;
}

export const LINE_BREAK: LineBreakFormat = { kind: "line-break" };
const SMALL_INDENT = 2;
const MAX_INDENT = 16;
const ASSOCIATIVE_OPS = new Set([OP_AND, OP_OR, OP_XOR, OP_ADD, OP_MUL, OP_SEQ_CONCAT]);

export const mkText = (text: string): TextFormat => ({ kind: "text", text });
export const mkIndent = (amount: number, child: Format): IndentFormat => ({
  kind: "indent",
  amount,
  child,
});
export const mkCompose = (...children: Format[]): ComposeFormat => ({ kind: "compose", children });

const getFlat = (format: Format): Format => {
  if (format.kind === "line-break") return mkText(" ");
  if (format.kind === "choice") return format.flat;
  if (format.kind === "indent") return mkIndent(format.amount, getFlat(format.child));
  if (format.kind === "compose") return mkCompose(...format.children.map(getFlat));
  return format;
};

export const mkGroup = (format: Format): ChoiceFormat => ({
  kind: "choice",
  flat: getFlat(format),
  broken: format,
});

const mkSeq = (elements: Format[]) =>
  mkCompose(...elements.flatMap((element) => [LINE_BREAK, element]));

export const mkSeq1 = (elements: Format[], header: string, open = "(", close = ")") => {
  if (elements.length === 0) return mkCompose(mkText(open), mkText(header), mkText(close));
  return mkGroup(
    mkCompose(
      mkText(open),
      mkText(header),
      mkIndent(
        open.length + header.length + 1,
        mkCompose(mkText(" "), elements[0], mkSeq(elements.slice(1)), mkText(close)),
      ),
    ),
  );
};

const mkSeq3 = (elements: Format[], header: string, inline: number) => {
  const open = mkText("(");
  if (elements.length === 0) return mkCompose(open, mkText(header), mkText(")"));
  return mkGroup(
    mkCompose(
      open,
      mkText(header),
      mkGroup(
        mkIndent(
          header.length + 2,
          mkCompose(mkText(" "), elements[0], mkSeq(elements.slice(1, inline))),
        ),
      ),
      mkIndent(SMALL_INDENT, mkSeq(elements.slice(inline))),
      mkText(")"),
    ),
  );
};

export const mkSeq5 = (elements: Format[]) => {
  if (elements.length === 0) return mkCompose(mkText("("), mkText(")"));
  return mkGroup(
    mkCompose(
      mkIndent(1, mkCompose(mkText("("), elements[0])),
      mkIndent(1, mkCompose(mkSeq(elements.slice(1)), mkText(")"))),
    ),
  );
};

const getSpaceUptoLineBreak = (format: Format): { space: number; isBroken: boolean } => {
  if (format.kind === "text") return { space: format.text.length, isBroken: false };
  if (format.kind === "line-break") return { space: 0, isBroken: true };
  if (format.kind === "choice") return getSpaceUptoLineBreak(format.flat);
  if (format.kind === "indent") return getSpaceUptoLineBreak(format.child);
  const total = { space: 0, isBroken: false };
  for (const child of format.children) {
    const part = getSpaceUptoLineBreak(child);
    total.space += part.space;
    if (part.isBroken) return { space: total.space, isBroken: true };
  }
  return total;
};

export const renderFormat = (root: Format, options: PrintOptions) => {
  const output: string[] = [];
  const state = { position: 0, line: 0 };
  const todo: { format: Format; indent: number }[] = [{ format: root, indent: 0 }];
  for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
    if (state.line >= options.maxNumLines) break;
    const format = item.format;
    const indent = item.indent;
    if (format.kind === "text") {
      if (options.isBounded && state.position > options.maxWidth) continue;
      if (options.isBounded && state.position + format.text.length > options.maxWidth) {
        output.push("...");
        continue;
      }
      state.position += format.text.length;
      output.push(format.text);
    } else if (format.kind === "indent")
      todo.push({
        format: format.child,
        indent: Math.min(indent + format.amount, options.maxIndent),
      });
    else if (format.kind === "compose")
      for (let index = format.children.length - 1; index >= 0; index--)
        todo.push({ format: format.children[index], indent });
    else if (format.kind === "choice") {
      const spaceLeft = Math.min(options.maxWidth, options.maxRibbon) - state.position;
      const isFitting = spaceLeft > 0 && getSpaceUptoLineBreak(format.flat).space <= spaceLeft;
      todo.push({ format: isFitting ? format.flat : format.broken, indent });
    } else if (options.isSingleLine) todo.push({ format: mkText(" "), indent });
    else {
      state.position = indent;
      state.line++;
      output.push(state.line < options.maxNumLines ? `\n${" ".repeat(indent)}` : "...\n");
    }
  }
  return output.join("");
};

const SIMPLE_SYMBOL = /^[0-9a-zA-Z~!@$%^&*_\-+=<>.?/]*$/;

const isQuotedSymbol = (name: string) => {
  if (/^[0-9]/.test(name)) return true;
  if (name.length >= 2 && name.startsWith("|") && name.endsWith("|"))
    return /(^|[^\\])(\\\\)*(\||\\(?![\\|]))/.test(name.slice(1, -1));
  return !SIMPLE_SYMBOL.test(name);
};

export const getQuotedName = (symbol: SmtSymbol) =>
  typeof symbol === "number"
    ? `k!${symbol}`
    : isQuotedSymbol(symbol)
      ? `|${symbol.replace(/[|\\]/g, "\\$&")}|`
      : symbol;

export const formatSort = (manager: AstManager, sort: number): Format =>
  manager.isBvSort(sort)
    ? mkSeq1([mkText(String(manager.getBvSize(sort)))], "_ BitVec")
    : manager.isFpSort(sort)
      ? mkSeq1(
          [
            mkText("FloatingPoint"),
            mkText(String(manager.getEbits(sort))),
            mkText(String(manager.getSbits(sort))),
          ],
          "_",
        )
      : manager.getSortParameters(sort).length > 0
        ? mkSeq1(
            manager.getSortParameters(sort).map((parameter) => formatSort(manager, parameter)),
            getQuotedName(manager.sortNames[sort]),
          )
        : mkText(getQuotedName(manager.sortNames[sort]));

const getSortText = (manager: AstManager, sort: number): string =>
  manager.isBvSort(sort)
    ? `(_ BitVec ${manager.getBvSize(sort)})`
    : manager.isFpSort(sort)
      ? `(_ FloatingPoint ${manager.getEbits(sort)} ${manager.getSbits(sort)})`
      : manager.getSortParameters(sort).length > 0
        ? `(${getQuotedName(manager.sortNames[sort])} ${manager
            .getSortParameters(sort)
            .map((parameter) => getSortText(manager, parameter))
            .join(" ")})`
        : getQuotedName(manager.sortNames[sort]);

const formatBvNumeral = (manager: AstManager, options: PrintOptions, expr: number) => {
  const width = manager.getBvSize(manager.sorts[expr]);
  const value = manager.getBvNumeralValue(expr);
  const isNegative = options.isBvNeg && value >= 1n << BigInt(width - 1);
  const magnitude = isNegative ? (1n << BigInt(width)) - value : value;
  const literal = getBvLiteral(options, magnitude, width);
  return isNegative ? mkSeq1([mkText(literal)], "bvneg") : mkText(literal);
};

const getBvLiteral = (options: PrintOptions, value: bigint, width: number) =>
  !options.isBvLiterals
    ? `(_ bv${value} ${width})`
    : width % 4 === 0
      ? `#x${value.toString(16).padStart(width / 4, "0")}`
      : `#b${value.toString(2).padStart(width, "0")}`;

const formatFpNumeral = (options: PrintOptions, value: Mpf) => {
  const special = isNan(value)
    ? "NaN"
    : isInf(value)
      ? value.sign
        ? "-oo"
        : "+oo"
      : isZero(value)
        ? value.sign
          ? "-zero"
          : "+zero"
        : undefined;
  if (special !== undefined) return mkText(`(_ ${special} ${value.ebits} ${value.sbits})`);
  if (options.isFpRealLiterals) {
    const isSubnormal = isDenormal(value);
    const denominator = 1n << BigInt(value.sbits - 1);
    const numerator = value.significand + (isSubnormal ? 0n : denominator);
    const decimal =
      numerator % denominator === 0n
        ? `${numerator / denominator}.0`
        : getDecimal(numerator, denominator, value.sbits);
    const exponent = isSubnormal ? mkMinExp(value.ebits) : value.exponent;
    return mkText(
      `((_ to_fp ${value.ebits} ${value.sbits}) RTZ ${value.sign ? "-" : ""}${decimal} ${exponent})`,
    );
  }
  const sign = value.sign ? 1n : 0n;
  return mkText(
    `(fp ${options.isBvLiterals ? `#b${sign}` : `(_ bv${sign} 1)`} ${getBvLiteral(
      options,
      BigInt(biasExp(value.ebits, value.exponent)),
      value.ebits,
    )} ${getBvLiteral(options, value.significand, value.sbits - 1)})`,
  );
};

const getDeclName = (manager: AstManager, decl: number) => {
  const funcDecl = manager.funcDecls[decl];
  const name = getQuotedName(funcDecl.name);
  if (funcDecl.family === FAMILY_PB)
    return `(_ ${name} ${manager.getPbParameters(decl).join(" ")})`;
  if (funcDecl.op === OP_CONST_ARRAY || funcDecl.op === OP_SEQ_EMPTY)
    return `(as ${name} ${getSortText(manager, funcDecl.range)})`;
  if (
    funcDecl.op === OP_ARRAY_MAP ||
    funcDecl.op === OP_AS_ARRAY ||
    funcDecl.op === OP_DT_IS ||
    funcDecl.op === OP_DT_UPDATE_FIELD
  )
    return `(_ ${name} ${getQuotedName(manager.funcDecls[funcDecl.parameters[0]].name)})`;
  return (funcDecl.family === FAMILY_BV ||
    (funcDecl.family === FAMILY_FPA && funcDecl.op !== OP_FPA_NUM) ||
    funcDecl.op === OP_ARRAY_EXT ||
    funcDecl.family === FAMILY_CHAR ||
    funcDecl.family === FAMILY_SEQ) &&
    funcDecl.parameters.length > 0
    ? `(_ ${name} ${funcDecl.parameters.join(" ")})`
    : name;
};

const getDecimal = (numerator: bigint, denominator: bigint, precision: number) => {
  const digits: string[] = [];
  const state = { remainder: numerator % denominator };
  for (let index = 0; index < precision && state.remainder !== 0n; index++) {
    digits.push(String((state.remainder * 10n) / denominator));
    state.remainder = (state.remainder * 10n) % denominator;
  }
  return `${numerator / denominator}.${digits.join("")}${state.remainder === 0n ? "" : "?"}`;
};

const formatNumeral = (manager: AstManager, options: PrintOptions, expr: number) => {
  const value = manager.getRationalValue(expr);
  const magnitude = value.num < 0n ? -value.num : value.num;
  const unsigned =
    manager.sorts[expr] === SORT_INT
      ? mkText(String(magnitude))
      : value.isInt()
        ? mkText(`${magnitude}.0`)
        : options.isDecimal
          ? mkText(getDecimal(magnitude, value.den, options.decimalPrecision))
          : mkSeq1([mkText(`${magnitude}.0`), mkText(`${value.den}.0`)], "/");
  return value.num < 0n ? mkSeq1([unsigned], "-") : unsigned;
};

const formatAlgebraicNumeral = (manager: AstManager, options: PrintOptions, expr: number) => {
  const am = manager.am;
  const value = manager.getAlgebraicValue(expr);
  if (!options.isDecimal) return mkText(am.displayRootSmt2(value));
  const magnitude = am.copy(value);
  const isNegative = am.isNeg(value);
  if (isNegative) am.neg(magnitude);
  const text = mkText(am.displayDecimal(magnitude, options.decimalPrecision));
  return isNegative ? mkSeq1([text], "-") : text;
};

interface PrintFrame {
  expr: number;
  index: number;
  start: number;
  isUsingAlias: boolean;
}

interface PrintInfo {
  level: number;
  weight: number;
  depth: number;
}

interface AliasScope {
  aliasStart: number;
  nextAliasIndex: number;
  root: number;
}

interface Alias {
  format: Format;
  level: number;
  name: string;
}

const getSharedTerms = (manager: AstManager, root: number) => {
  const visited = new Set<number>();
  const shared = new Set<number>();
  const stack = [root];
  for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
    const kind = manager.kinds[expr];
    if (kind === KIND_VAR || (kind === KIND_APP && manager.getNumArgs(expr) === 0)) continue;
    if (visited.has(expr)) {
      shared.add(expr);
      continue;
    }
    visited.add(expr);
    if (kind === KIND_QUANTIFIER) stack.push(manager.getQuantifier(expr).body);
    else
      for (let index = manager.getNumArgs(expr) - 1; index >= 0; index--)
        stack.push(manager.getArg(expr, index));
  }
  return shared;
};

const formatLabels = (isPositive: boolean, names: string[], format: Format) =>
  names.length === 0
    ? format
    : mkSeq1(
        [
          format,
          ...names.map((name) =>
            mkCompose(mkText(isPositive ? ":lblpos " : ":lblneg "), mkText(getQuotedName(name))),
          ),
        ],
        "!",
      );

const createPrinter = (manager: AstManager, environment: PrintEnvironment) => {
  const options = environment.options;
  const varNames: string[] = [];
  const varNameSet = new Set<string>();

  const getNextName = (prefix: string, counter: { index: number }) => {
    for (;;) {
      const name = `${prefix}!${counter.index}`;
      counter.index++;
      if (!environment.isUsed(name) && !varNameSet.has(name)) return name;
    }
  };

  const formatDeclName = (decl: number) =>
    environment.isClashing(decl)
      ? mkSeq1(
          [mkText(getDeclName(manager, decl)), formatSort(manager, manager.funcDecls[decl].range)],
          "as",
        )
      : mkText(getDeclName(manager, decl));

  const formatConst = (expr: number) => {
    if (manager.getOp(expr) === OP_NUM) return formatNumeral(manager, options, expr);
    if (manager.isAlgebraicNumeral(expr)) return formatAlgebraicNumeral(manager, options, expr);
    if (manager.isBvNumeral(expr)) return formatBvNumeral(manager, options, expr);
    const chars = manager.getString(expr);
    if (chars !== undefined) return mkText(formatZstring(chars));
    const fpValue = getFpNumeral(manager, expr);
    if (fpValue !== undefined) return formatFpNumeral(options, fpValue);
    return manager.getOp(expr) === OP_LABEL_LIT
      ? formatLabels(true, manager.getLabelNames(manager.decls[expr]), mkText("true"))
      : formatDeclName(manager.decls[expr]);
  };

  const formatExpr = (root: number) => {
    const shared = getSharedTerms(manager, root);
    const aliasStack: Map<number, number>[] = [new Map()];
    const aliases: Alias[] = [];
    const scopes: AliasScope[] = [];
    const state = { root };
    const aliasCounter = { index: 1 };
    const frames: PrintFrame[] = [];
    const formats: Format[] = [];
    const infos: PrintInfo[] = [];
    const getAliasMap = () => aliasStack[scopes.length];

    const push = (format: Format, info: PrintInfo) => {
      formats.push(format);
      infos.push(info);
    };

    const pushAliased = (expr: number) => {
      const index = getAliasMap().get(expr);
      if (index === undefined) return false;
      push(mkText(aliases[index].name), { level: aliases[index].level + 1, weight: 1, depth: 1 });
      return true;
    };

    const pushVar = (expr: number) => {
      const index = manager.values[expr];
      push(
        mkText(index < varNames.length ? varNames[varNames.length - index - 1] : `(:var ${index})`),
        { level: 0, weight: 1, depth: 1 },
      );
    };

    const pushFrame = (expr: number, isUsingAlias: boolean) =>
      frames.push({ expr, index: 0, start: formats.length, isUsingAlias });

    const storeResult = (frame: PrintFrame, format: Format, info: PrintInfo) => {
      formats.length = frame.start;
      infos.length = frame.start;
      frames.pop();
      const isAliased =
        frame.isUsingAlias &&
        state.root !== frame.expr &&
        (info.depth >= options.maxDepth ||
          ((info.weight >= options.minAliasSize || manager.kinds[frame.expr] === KIND_QUANTIFIER) &&
            shared.has(frame.expr)));
      if (!isAliased) {
        push(format, info);
        return;
      }
      const name = getNextName("a", aliasCounter);
      getAliasMap().set(frame.expr, aliases.length);
      aliases.push({ format, level: info.level, name });
      push(mkText(name), { level: info.level + 1, weight: 1, depth: 1 });
    };

    const formatLet = (body: Format) => {
      const start = scopes.length === 0 ? 0 : scopes[scopes.length - 1].aliasStart;
      const levels: Format[][] = [];
      for (const alias of aliases.slice(start)) {
        while (levels.length <= alias.level) levels.push([]);
        levels[alias.level].push(mkSeq1([alias.format], alias.name));
      }
      const lets = levels.filter((declarations) => declarations.length > 0);
      return {
        format:
          lets.length === 0
            ? body
            : mkCompose(
                ...lets.flatMap((declarations, index) => [
                  ...(index > 0 ? [LINE_BREAK] : []),
                  mkText("(let "),
                  mkIndent(5, mkSeq5(declarations)),
                ]),
                mkIndent(SMALL_INDENT, mkCompose(LINE_BREAK, body)),
                ...lets.map(() => mkText(")")),
              ),
        numLets: aliases.length - start,
      };
    };

    const processArgs = (frame: PrintFrame) => {
      const numArgs = manager.getNumArgs(frame.expr);
      while (frame.index < numArgs) {
        const arg = manager.getArg(frame.expr, frame.index);
        frame.index++;
        if (pushAliased(arg)) continue;
        const kind = manager.kinds[arg];
        if (kind === KIND_VAR) pushVar(arg);
        else if (kind === KIND_APP && manager.getNumArgs(arg) === 0)
          push(formatConst(arg), { level: 0, weight: 1, depth: 1 });
        else {
          pushFrame(arg, frame.isUsingAlias);
          return false;
        }
      }
      return true;
    };

    const isFlatAssoc = (frame: PrintFrame) => {
      const op = manager.getOp(frame.expr);
      if (!options.isFlatAssoc || (!ASSOCIATIVE_OPS.has(op) && !isAssociativeBvOp(op)))
        return false;
      if (frames.length < 2 || shared.has(frame.expr)) return false;
      const parent = frames[frames.length - 2].expr;
      return (
        manager.kinds[parent] === KIND_APP && manager.decls[parent] === manager.decls[frame.expr]
      );
    };

    const processApp = (frame: PrintFrame) => {
      if (frame.index === 0 && pushAliased(frame.expr)) {
        frames.pop();
        return;
      }
      if (!processArgs(frame)) return;
      if (manager.getNumArgs(frame.expr) === 0) {
        push(formatConst(frame.expr), { level: 0, weight: 1, depth: 1 });
        frames.pop();
        return;
      }
      if (isFlatAssoc(frame)) {
        frames.pop();
        return;
      }
      const args = formats.slice(frame.start);
      const decl = manager.decls[frame.expr];
      const name = formatDeclName(decl);
      const declName = getDeclName(manager, decl);
      const nameLength =
        !environment.isClashing(decl) && declName.startsWith("(") ? Infinity : declName.length;
      const op = manager.getOp(frame.expr);
      const format =
        op === OP_LABEL
          ? formatLabels(manager.isLabelPositive(decl), manager.getLabelNames(decl), args[0])
          : op === OP_PATTERN
            ? mkSeq5(args)
            : mkGroup(
                mkCompose(
                  mkIndent(1, mkCompose(mkText("("), name)),
                  nameLength > MAX_INDENT
                    ? mkIndent(SMALL_INDENT, mkCompose(mkSeq(args), mkText(")")))
                    : mkIndent(
                        nameLength + 2,
                        mkCompose(mkText(" "), args[0], mkSeq(args.slice(1)), mkText(")")),
                      ),
                ),
              );
      const info = { level: 0, weight: 1, depth: 1 };
      for (const argInfo of infos.slice(frame.start)) {
        info.level = Math.max(info.level, argInfo.level);
        info.weight += argInfo.weight;
        info.depth = Math.max(info.depth, argInfo.depth);
      }
      info.depth++;
      storeResult(frame, format, info);
    };

    const processQuantifier = (frame: PrintFrame) => {
      const data = manager.getQuantifier(frame.expr);
      if (frame.index === 0) {
        scopes.push({
          aliasStart: aliases.length,
          nextAliasIndex: aliasCounter.index,
          root: state.root,
        });
        while (aliasStack.length <= scopes.length) aliasStack.push(new Map());
        aliasCounter.index = 1;
        state.root = data.body;
        for (const symbol of data.names) {
          const quoted = getQuotedName(symbol);
          const name =
            typeof symbol === "number"
              ? getNextName("x", { index: 1 })
              : environment.isUsed(quoted) || varNameSet.has(quoted)
                ? getNextName(quoted, { index: 1 })
                : quoted;
          varNames.push(name);
          varNameSet.add(name);
        }
      }
      const children = [...data.patterns, ...data.noPatterns];
      if (frame.index < children.length + 1) {
        const index = frame.index;
        frame.index++;
        if (index < children.length) pushFrame(children[index], false);
        else pushFrame(data.body, frame.isUsingAlias);
        return;
      }
      const letted = formatLet(formats[formats.length - 1]);
      const attributes = [
        ...formats
          .slice(frame.start, frame.start + data.patterns.length)
          .map((pattern) => mkCompose(mkText(":pattern "), mkIndent(9, pattern))),
        ...formats
          .slice(frame.start + data.patterns.length, frame.start + children.length)
          .map((noPattern) => mkCompose(mkText(":no-pattern "), mkIndent(12, noPattern))),
        ...(data.weight === 1 ? [] : [mkCompose(mkText(":weight "), mkText(String(data.weight)))]),
        ...(data.skid === undefined
          ? []
          : [mkCompose(mkText(":skolemid "), mkText(getQuotedName(data.skid)))]),
        ...(data.qid === "" ? [] : [mkCompose(mkText(":qid "), mkText(getQuotedName(data.qid)))]),
      ];
      const body =
        attributes.length === 0 ? letted.format : mkSeq1([letted.format, ...attributes], "!");
      const format = mkSeq3(
        [
          mkSeq5(
            data.sorts.map((sort, index) =>
              mkSeq1(
                [formatSort(manager, sort)],
                varNames[varNames.length - data.sorts.length + index],
              ),
            ),
          ),
          body,
        ],
        ["forall", "exists", "lambda"][data.kind],
        1,
      );
      const bodyInfo = infos[infos.length - 1];
      const info = {
        level: 0,
        weight: bodyInfo.weight + data.sorts.length * 2 + letted.numLets * 8,
        depth: bodyInfo.depth + 1,
      };
      for (let index = 0; index < data.sorts.length; index++)
        varNameSet.delete(varNames.pop() ?? "");
      aliasStack[scopes.length].clear();
      const scope = scopes.pop();
      if (scope !== undefined) {
        state.root = scope.root;
        aliasCounter.index = scope.nextAliasIndex;
        aliases.length = scope.aliasStart;
      }
      storeResult(frame, format, info);
    };

    pushFrame(root, true);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const kind = manager.kinds[frame.expr];
      if (kind === KIND_QUANTIFIER) processQuantifier(frame);
      else if (kind === KIND_APP) processApp(frame);
      else {
        pushVar(frame.expr);
        frames.pop();
      }
    }
    return formatLet(formats[formats.length - 1]).format;
  };

  // The free variables are named prefix!0, prefix!1 and so on, the first for the variable 0.
  return (root: number, numVars = 0, prefix = "x") => {
    const counter = { index: 0 };
    const names = Array.from({ length: numVars }, () => {
      const name = getQuotedName(getNextName(prefix, counter));
      varNameSet.add(name);
      return name;
    });
    varNames.push(...names.toReversed());
    const format = formatExpr(root);
    varNames.length = 0;
    varNameSet.clear();
    return { format, names };
  };
};

export const formatExpr = (
  manager: AstManager,
  environment: PrintEnvironment,
  expr: number,
  numVars?: number,
  prefix?: string,
) => createPrinter(manager, environment)(expr, numVars, prefix);

export const printExpr = (
  manager: AstManager,
  environment: PrintEnvironment,
  expr: number,
  indent = 0,
) =>
  renderFormat(
    mkIndent(indent, formatExpr(manager, environment, expr).format),
    environment.options,
  );
