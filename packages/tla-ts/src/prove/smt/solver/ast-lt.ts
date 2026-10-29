// Ported from Z3 (src/ast/ast_lt.cpp, src/util/symbol.cpp), MIT license, see z3-license.txt. A
// total order on expressions that does not depend on their ids. The rewriter sorts a disjunction
// only when its arguments are out of this order. Quantifiers keep no variable names here, and fresh
// constants have other names than in Z3, so those comparisons can differ from Z3's.
import {
  FAMILY_MODEL_VALUE,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_NUM,
  type AstManager,
} from "./ast";

// The parts of a func_decl that lt compares: its name, parameters, domain and range.
interface DeclKey {
  name: string;
  parameters: number[];
  domain: number[];
  range: number;
}

// Z3's PARAM_INT, PARAM_AST and PARAM_RATIONAL kinds order the parameters of builtin declarations.
const PARAM_INT = 0;
const PARAM_RATIONAL = 3;

const compareValues = (first: number, second: number) =>
  first === second ? 0 : first < second ? -1 : 1;

// lt on symbols, which compares names by their bytes.
const compareNames = (first: string, second: string) =>
  first === second ? 0 : first < second ? -1 : 1;

const getDeclKey = (manager: AstManager, expr: number): DeclKey => {
  const decl = manager.funcDecls[manager.decls[expr]];
  const args = manager.args[expr];
  const range = manager.sorts[expr];
  if (decl.family === FAMILY_USER)
    return { name: decl.name, parameters: [], domain: decl.domain, range };
  // A numeral's declaration has the parameters (value, is_int), and a model value's (index, sort).
  if (decl.op === OP_NUM)
    return {
      name: "Int",
      parameters: [PARAM_RATIONAL, manager.values[expr], PARAM_INT, 1],
      domain: [],
      range,
    };
  if (decl.family === FAMILY_MODEL_VALUE)
    return { name: decl.name, parameters: [PARAM_INT, manager.values[expr]], domain: [], range };
  const builtin = manager.getBuiltinSignature(decl.op, args);
  return { name: builtin.name, parameters: [], domain: builtin.domain, range };
};

const compareSorts = (manager: AstManager, first: number, second: number) =>
  first === second ? 0 : compareNames(manager.sortNames[first], manager.sortNames[second]);

const compareDecls = (manager: AstManager, first: number, second: number) => {
  const firstKey = getDeclKey(manager, first);
  const secondKey = getDeclKey(manager, second);
  const byName = compareNames(firstKey.name, secondKey.name);
  if (byName !== 0) return byName;
  const byArity = compareValues(firstKey.domain.length, secondKey.domain.length);
  if (byArity !== 0) return byArity;
  const byParameterCount = compareValues(firstKey.parameters.length, secondKey.parameters.length);
  if (byParameterCount !== 0) return byParameterCount;
  for (let index = 0; index < firstKey.parameters.length; index++) {
    const byParameter = compareValues(firstKey.parameters[index], secondKey.parameters[index]);
    if (byParameter !== 0) return byParameter;
  }
  for (let index = 0; index < firstKey.domain.length; index++) {
    const byDomain = compareSorts(manager, firstKey.domain[index], secondKey.domain[index]);
    if (byDomain !== 0) return byDomain;
  }
  return compareSorts(manager, firstKey.range, secondKey.range);
};

const compareAsts = (manager: AstManager, first: number, second: number): number => {
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
      compareValues(firstData.weight, secondData.weight);
    if (byHeader !== 0) return byHeader;
    for (let index = 0; index < firstData.sorts.length; index++) {
      const bySort = compareSorts(manager, firstData.sorts[index], secondData.sorts[index]);
      if (bySort !== 0) return bySort;
    }
    // A pattern is an application of the pattern declaration to its terms.
    for (let index = 0; index < firstData.patterns.length; index++) {
      const firstTerms = firstData.patterns[index];
      const secondTerms = secondData.patterns[index];
      const getDepth = (terms: number[]) =>
        1 + Math.max(...terms.map((term) => manager.depths[term]));
      const byPattern =
        compareValues(firstTerms.length, secondTerms.length) ||
        compareValues(getDepth(firstTerms), getDepth(secondTerms));
      if (byPattern !== 0) return byPattern;
      for (let termIndex = 0; termIndex < firstTerms.length; termIndex++) {
        const byTerm = compareAsts(manager, firstTerms[termIndex], secondTerms[termIndex]);
        if (byTerm !== 0) return byTerm;
      }
    }
    return compareAsts(manager, firstData.body, secondData.body);
  }
  if (manager.kinds[first] !== KIND_APP) return 0;
  const firstArgs = manager.args[first];
  const secondArgs = manager.args[second];
  const byHeader =
    compareValues(firstArgs.length, secondArgs.length) ||
    compareValues(manager.depths[first], manager.depths[second]) ||
    compareDecls(manager, first, second);
  if (byHeader !== 0) return byHeader;
  for (let index = 0; index < firstArgs.length; index++) {
    const byArg = compareAsts(manager, firstArgs[index], secondArgs[index]);
    if (byArg !== 0) return byArg;
  }
  return 0;
};

// lt: whether the first expression comes before the second.
export const isAstLess = (manager: AstManager, first: number, second: number) =>
  compareAsts(manager, first, second) < 0;
