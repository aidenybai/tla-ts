// Ported from Z3 (src/ast/ast_lt.cpp, src/util/symbol.cpp), MIT license, see z3-license.txt.
import {
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_CHAR,
  FAMILY_DATATYPE,
  FAMILY_FPA,
  FAMILY_LABEL,
  FAMILY_MODEL_VALUE,
  FAMILY_SEQ,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ALGEBRAIC_NUM,
  OP_BV_NUM,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_RECOGNISER,
  OP_SEQ_SKOLEM,
  OP_FPA_NUM,
  OP_LABEL,
  OP_ITE,
  OP_NUM,
  OP_PATTERN,
  SORT_INT,
  type AstManager,
  type SmtSymbol,
} from "./ast";
import { getAccessorConstructor } from "./datatype-decl-plugin";
import { Rational } from "./rational";

interface DeclKey {
  name: SmtSymbol;
  parameters: (number | Rational | SmtSymbol)[];
  domain: number[];
  range: number;
}

// Z3's parameter kinds order the parameters of builtin declarations.
const PARAM_INT = 0;
const PARAM_AST = 1;
const PARAM_SYMBOL = 2;
const PARAM_ZSTRING = 3;
const PARAM_RATIONAL = 3;
const PARAM_EXTERNAL = 6;

const compareValues = (first: number, second: number) =>
  first === second ? 0 : first < second ? -1 : 1;

const compareParameters = (
  first: number | Rational | SmtSymbol,
  second: number | Rational | SmtSymbol,
) =>
  first instanceof Rational && second instanceof Rational
    ? first.compare(second)
    : typeof first === "number" && typeof second === "number"
      ? compareValues(first, second)
      : typeof first === "string" && typeof second === "string"
        ? compareNames(first, second)
        : 0;

// lt on symbols: numerical symbols come first, by number, and other names compare by their bytes.
const compareNames = (first: SmtSymbol, second: SmtSymbol) => {
  if (first === second) return 0;
  if (typeof first === "number")
    return typeof second === "number" ? compareValues(first, second) : -1;
  if (typeof second === "number") return 1;
  return first < second ? -1 : 1;
};

const getSeqParameters = (manager: AstManager, expr: number) => {
  const decl = manager.funcDecls[manager.decls[expr]];
  const chars = manager.getString(expr);
  if (chars !== undefined) return [PARAM_ZSTRING, String.fromCodePoint(...chars)];
  const numbers = decl.parameters.flatMap((parameter) => [PARAM_INT, parameter]);
  return decl.op === OP_SEQ_SKOLEM ? [PARAM_SYMBOL, decl.name, ...numbers] : numbers;
};

const getDatatypeParameters = (manager: AstManager, decl: number) => {
  const funcDecl = manager.funcDecls[decl];
  const name = funcDecl.name;
  if (funcDecl.op === OP_DT_CONSTRUCTOR) return [PARAM_SYMBOL, name];
  if (funcDecl.op === OP_DT_ACCESSOR)
    return [
      PARAM_SYMBOL,
      name,
      PARAM_SYMBOL,
      manager.funcDecls[getAccessorConstructor(manager, decl)].name,
    ];
  const target = manager.funcDecls[funcDecl.parameters[0]].name;
  return funcDecl.op === OP_DT_RECOGNISER
    ? [PARAM_AST, target, PARAM_SYMBOL, name]
    : [PARAM_AST, target];
};

const getDeclKey = (manager: AstManager, expr: number): DeclKey => {
  const decl = manager.funcDecls[manager.decls[expr]];
  const range = manager.sorts[expr];
  if (decl.family === FAMILY_USER)
    return { name: decl.name, parameters: [], domain: decl.domain, range };
  // A numeral's declaration has the parameters (value, is_int), and a model value's (index, sort).
  if (decl.op === OP_NUM) {
    const isInt = range === SORT_INT;
    return {
      name: isInt ? "Int" : "Real",
      parameters: [PARAM_RATIONAL, manager.getRationalValue(expr), PARAM_INT, isInt ? 1 : 0],
      domain: [],
      range,
    };
  }
  if (decl.family === FAMILY_MODEL_VALUE)
    return { name: decl.name, parameters: [PARAM_INT, manager.values[expr]], domain: [], range };
  if (decl.op === OP_ALGEBRAIC_NUM)
    return {
      name: decl.name,
      parameters: [PARAM_EXTERNAL, manager.getAlgebraicId(expr)],
      domain: [],
      range,
    };
  if (decl.op === OP_BV_NUM)
    return {
      name: decl.name,
      parameters: [
        PARAM_RATIONAL,
        Rational.of(manager.getBvNumeralValue(expr)),
        PARAM_INT,
        manager.getBvSize(range),
      ],
      domain: [],
      range,
    };
  if (decl.family === FAMILY_ARRAY)
    return { name: decl.name, parameters: [], domain: decl.domain, range };
  if (decl.family === FAMILY_DATATYPE)
    return {
      name: decl.name,
      parameters: getDatatypeParameters(manager, manager.decls[expr]),
      domain: decl.domain,
      range,
    };
  if (decl.family === FAMILY_BV || decl.family === FAMILY_FPA)
    return {
      name: decl.name,
      parameters: decl.parameters.flatMap((parameter) => [
        decl.op === OP_FPA_NUM ? PARAM_EXTERNAL : PARAM_INT,
        parameter,
      ]),
      domain: decl.domain,
      range,
    };
  if (decl.family === FAMILY_SEQ || decl.family === FAMILY_CHAR)
    return {
      name: decl.name,
      parameters: getSeqParameters(manager, expr),
      domain: decl.domain,
      range,
    };
  if (decl.family === FAMILY_LABEL) {
    const names = manager
      .getLabelNames(manager.decls[expr])
      .flatMap((name) => [PARAM_SYMBOL, name]);
    return {
      name: decl.name,
      parameters:
        decl.op === OP_LABEL
          ? [PARAM_INT, manager.isLabelPositive(manager.decls[expr]) ? 1 : 0, ...names]
          : names,
      domain: decl.domain,
      range,
    };
  }
  const builtin = manager.getBuiltinSignature(decl.op, manager.getArgs(expr));
  return { name: builtin.name, parameters: [], domain: builtin.domain, range };
};

const compareSorts = (manager: AstManager, first: number, second: number): number => {
  if (first === second) return 0;
  const byName =
    compareNames(manager.sortNames[first], manager.sortNames[second]) ||
    compareValues(manager.getBvSize(first), manager.getBvSize(second)) ||
    compareValues(manager.getSbits(first), manager.getSbits(second));
  if (byName !== 0) return byName;
  const firstParameters = manager.getSortParameters(first);
  const secondParameters = manager.getSortParameters(second);
  const byCount = compareValues(firstParameters.length, secondParameters.length);
  if (byCount !== 0) return byCount;
  for (let index = 0; index < firstParameters.length; index++) {
    const byParameter = compareSorts(manager, firstParameters[index], secondParameters[index]);
    if (byParameter !== 0) return byParameter;
  }
  return 0;
};

// Whether two applications of the same declaration have the same key: a user declaration's is its
// own, and a builtin's other than a numeral, model value or pattern follows from the sort of the
// argument that getBuiltinSignature reads and the range.
const isSameDeclKey = (manager: AstManager, first: number, second: number) => {
  const decl = manager.funcDecls[manager.decls[first]];
  if (decl.family === FAMILY_USER) return true;
  if (
    decl.op === OP_NUM ||
    decl.op === OP_BV_NUM ||
    decl.op === OP_PATTERN ||
    decl.family === FAMILY_MODEL_VALUE
  )
    return false;
  if (
    decl.family === FAMILY_BV ||
    decl.family === FAMILY_ARRAY ||
    decl.family === FAMILY_DATATYPE ||
    decl.family === FAMILY_FPA ||
    decl.family === FAMILY_SEQ ||
    decl.family === FAMILY_CHAR
  )
    return true;
  const index = decl.op === OP_ITE ? 1 : 0;
  return (
    manager.sorts[first] === manager.sorts[second] &&
    manager.sorts[manager.getArg(first, index)] === manager.sorts[manager.getArg(second, index)]
  );
};

const compareDecls = (manager: AstManager, first: number, second: number) => {
  if (manager.decls[first] === manager.decls[second] && isSameDeclKey(manager, first, second))
    return 0;
  const firstKey = getDeclKey(manager, first);
  const secondKey = getDeclKey(manager, second);
  const byName = compareNames(firstKey.name, secondKey.name);
  if (byName !== 0) return byName;
  const byArity = compareValues(firstKey.domain.length, secondKey.domain.length);
  if (byArity !== 0) return byArity;
  const byParameterCount = compareValues(firstKey.parameters.length, secondKey.parameters.length);
  if (byParameterCount !== 0) return byParameterCount;
  for (let index = 0; index < firstKey.parameters.length; index++) {
    const byParameter = compareParameters(firstKey.parameters[index], secondKey.parameters[index]);
    if (byParameter !== 0) return byParameter;
  }
  for (let index = 0; index < firstKey.domain.length; index++) {
    const byDomain = compareSorts(manager, firstKey.domain[index], secondKey.domain[index]);
    if (byDomain !== 0) return byDomain;
  }
  return compareSorts(manager, firstKey.range, secondKey.range);
};

export const compareAsts = (manager: AstManager, first: number, second: number): number => {
  if (first === second) return 0;
  const byKind = compareValues(manager.kinds[first], manager.kinds[second]);
  if (byKind !== 0) return byKind;
  if (manager.kinds[first] === KIND_VAR) {
    const byIndex = compareValues(manager.values[first], manager.values[second]);
    return byIndex !== 0
      ? byIndex
      : compareSorts(manager, manager.sorts[first], manager.sorts[second]);
  }
  if (manager.kinds[first] === KIND_QUANTIFIER) {
    const firstData = manager.getQuantifier(first);
    const secondData = manager.getQuantifier(second);
    const byHeader =
      compareValues(firstData.isForall ? 0 : 1, secondData.isForall ? 0 : 1) ||
      compareValues(firstData.sorts.length, secondData.sorts.length) ||
      compareValues(firstData.patterns.length, secondData.patterns.length) ||
      compareValues(firstData.noPatterns.length, secondData.noPatterns.length) ||
      compareValues(firstData.weight, secondData.weight);
    if (byHeader !== 0) return byHeader;
    for (let index = 0; index < firstData.sorts.length; index++) {
      const byDecl =
        compareNames(firstData.names[index], secondData.names[index]) ||
        compareSorts(manager, firstData.sorts[index], secondData.sorts[index]);
      if (byDecl !== 0) return byDecl;
    }
    const children = [...firstData.patterns, ...firstData.noPatterns];
    const otherChildren = [...secondData.patterns, ...secondData.noPatterns];
    for (let index = 0; index < children.length; index++) {
      const byPattern = compareAsts(manager, children[index], otherChildren[index]);
      if (byPattern !== 0) return byPattern;
    }
    return compareAsts(manager, firstData.body, secondData.body);
  }
  if (manager.kinds[first] !== KIND_APP) return 0;
  const byHeader =
    compareValues(manager.getNumArgs(first), manager.getNumArgs(second)) ||
    compareValues(manager.depths[first], manager.depths[second]) ||
    compareDecls(manager, first, second);
  if (byHeader !== 0) return byHeader;
  for (let index = 0; index < manager.getNumArgs(first); index++) {
    const byArg = compareAsts(manager, manager.getArg(first, index), manager.getArg(second, index));
    if (byArg !== 0) return byArg;
  }
  return 0;
};

export const isAstLess = (manager: AstManager, first: number, second: number) =>
  compareAsts(manager, first, second) < 0;
