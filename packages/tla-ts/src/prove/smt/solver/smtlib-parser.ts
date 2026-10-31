// Ported from Z3 (src/parsers/smt2/smt2parser.cpp), MIT license, see z3-license.txt.
// Parses the SMT-LIB subset that tlapm emits into Z3-style expressions.
import { SmtParseError, SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_IS_INT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_TRUE,
  OP_FALSE,
  OP_UMINUS,
  OP_UNINTERPRETED,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
  isArithSort,
} from "./ast";
import { Rational } from "./rational";
import { shiftVars } from "./var-subst";

type SExpr = string | SExpr[];

interface Binding {
  depth: number;
  sort: number;
  expr: number;
  isBoundVar: boolean;
}

interface SmtProblem {
  assertions: number[];
  // Z3 prints no answer for a script without check-sat.
  hasCheckSat: boolean;
}

// An application that parseTerm is parsing: its name, its list, where its arguments start on the
// result stack, and its next argument.
interface ApplicationFrame {
  name: string;
  list: SExpr[];
  start: number;
  next: number;
}

const BUILTIN_OPS = new Map<string, number>([
  ["and", OP_AND],
  ["or", OP_OR],
  ["not", OP_NOT],
  ["=>", OP_IMPLIES],
  ["xor", OP_XOR],
  ["ite", OP_ITE],
  ["distinct", OP_DISTINCT],
  ["+", OP_ADD],
  ["*", OP_MUL],
  ["/", OP_DIV],
  ["div", OP_IDIV],
  ["mod", OP_MOD],
  ["abs", OP_ABS],
  ["to_real", OP_TO_REAL],
  ["to_int", OP_TO_INT],
  ["is_int", OP_IS_INT],
]);

// arith_decl_plugin's use_coercion: the operators that are Real when any argument is Real.
const COERCING_OPS = new Set([OP_ADD, OP_SUB, OP_UMINUS, OP_MUL, OP_LE, OP_GE, OP_LT, OP_GT]);

const DECIMAL = /^([0-9]+)\.([0-9]+)$/;

const CHAINABLE_OPS = new Map<string, number>([
  ["=", OP_EQ],
  ["<=", OP_LE],
  [">=", OP_GE],
  ["<", OP_LT],
  [">", OP_GT],
]);

const tokenize = (text: string) => {
  const tokens: string[] = [];
  let position = 0;
  while (position < text.length) {
    const char = text[position];
    if (char === ";") {
      const end = text.indexOf("\n", position);
      position = end === -1 ? text.length : end + 1;
    } else if (char === "(" || char === ")") {
      tokens.push(char);
      position++;
    } else if (char === " " || char === "\n" || char === "\t" || char === "\r") {
      position++;
    } else if (char === "|") {
      const end = text.indexOf("|", position + 1);
      if (end === -1) throw new SmtParseError("unterminated quoted symbol");
      tokens.push(text.slice(position + 1, end));
      position = end + 1;
    } else if (char === '"') {
      let end = position + 1;
      while (end < text.length && (text[end] !== '"' || text[end + 1] === '"'))
        end += text[end] === '"' ? 2 : 1;
      tokens.push(text.slice(position, end + 1));
      position = end + 1;
    } else {
      let end = position;
      while (end < text.length && !' \n\t\r();|"'.includes(text[end])) end++;
      tokens.push(text.slice(position, end));
      position = end;
    }
  }
  return tokens;
};

const readSExprs = (tokens: string[]) => {
  const stack: SExpr[][] = [[]];
  for (const token of tokens) {
    if (token === "(") stack.push([]);
    else if (token === ")") {
      const list = stack.pop();
      if (list === undefined || stack.length === 0)
        throw new SmtParseError("unbalanced parentheses");
      stack[stack.length - 1].push(list);
    } else stack[stack.length - 1].push(token);
  }
  if (stack.length !== 1) throw new SmtParseError("unbalanced parentheses");
  return stack[0];
};

const expectList = (sexpr: SExpr | undefined): SExpr[] => {
  if (!Array.isArray(sexpr)) throw new SmtParseError("expected a list");
  return sexpr;
};

const expectSymbol = (sexpr: SExpr | undefined): string => {
  if (typeof sexpr !== "string") throw new SmtParseError("expected a symbol");
  return sexpr;
};

// Parses a script, and hands each assertion to assertExpr as Z3's cmd_context does, before it parses
// the next command. Expressions are created in the order of Z3's parser, and live as long as there.
export const parseSmtlib = (
  text: string,
  manager: AstManager,
  assertExpr: (assertion: number) => void,
): SmtProblem => {
  const sorts = new Map<string, number>([
    ["Bool", SORT_BOOL],
    ["Int", SORT_INT],
    ["Real", SORT_REAL],
  ]);
  const funcs = new Map<string, number>();
  const assertions: number[] = [];
  const scopes: Map<string, Binding>[] = [];
  let depth = 0;

  const parseSort = (sexpr: SExpr) => {
    const sort = sorts.get(expectSymbol(sexpr));
    if (sort === undefined) throw new SmtParseError(`unknown sort ${String(sexpr)}`);
    return sort;
  };

  const lookup = (name: string) => {
    for (let index = scopes.length - 1; index >= 0; index--) {
      const binding = scopes[index].get(name);
      if (binding !== undefined) return binding;
    }
    return undefined;
  };

  // basic_decl_plugin::join: Int and Real join to Real. Other sorts join only with themselves.
  const getJoin = (args: number[]) => {
    const argSorts = args.map((arg) => manager.sorts[arg]);
    if (!argSorts.every(isArithSort)) return argSorts[0];
    return argSorts.includes(SORT_REAL) ? SORT_REAL : SORT_INT;
  };

  // The sort of the arguments of a builtin, as Z3's decl plugins pick its declaration.
  const getDomainSort = (op: number, args: number[]) => {
    if (op === OP_ITE) return getJoin(args.slice(1));
    if (op === OP_EQ || op === OP_DISTINCT) return getJoin(args);
    if (COERCING_OPS.has(op)) return getJoin(args) === SORT_REAL ? SORT_REAL : SORT_INT;
    if (op === OP_ABS || op === OP_TO_REAL || op === OP_TO_INT) return manager.sorts[args[0]];
    if (op === OP_IDIV || op === OP_MOD) return SORT_INT;
    if (op === OP_DIV || op === OP_IS_INT) return SORT_REAL;
    return SORT_BOOL;
  };

  const getRange = (op: number, domainSort: number) =>
    op === OP_TO_REAL || op === OP_DIV
      ? SORT_REAL
      : op === OP_TO_INT || op === OP_IDIV || op === OP_MOD
        ? SORT_INT
        : op === OP_ITE ||
            op === OP_ABS ||
            op === OP_ADD ||
            op === OP_SUB ||
            op === OP_UMINUS ||
            op === OP_MUL
          ? domainSort
          : SORT_BOOL;

  // ast_manager::coerce_to: an Int argument of a Real position becomes to_real, and a Real argument
  // of an Int position to_int.
  const coerce = (arg: number, sort: number) => {
    const argSort = manager.sorts[arg];
    if (argSort === sort || !isArithSort(argSort) || !isArithSort(sort)) return arg;
    return sort === SORT_REAL
      ? manager.mkApp(OP_TO_REAL, [arg], SORT_REAL)
      : manager.mkApp(OP_TO_INT, [arg], SORT_INT);
  };

  // Coerces the arguments of an application to the sorts of its declaration, as Z3 does with its
  // default int_real_coercions, then checks their sorts and number, so the solver only sees
  // well-sorted terms, and that quantifiers occur only under Boolean connectives.
  const mkApp = (decl: number, inputArgs: number[], domainSort?: number) => {
    const op = manager.funcDecls[decl].op;
    const name = manager.funcDecls[decl].name;
    const isUninterpreted = op === OP_UNINTERPRETED;
    const domain = manager.funcDecls[decl].domain;
    const builtinSort = isUninterpreted ? -1 : (domainSort ?? getDomainSort(op, inputArgs));
    const getExpected = (index: number) =>
      isUninterpreted ? domain[index] : op === OP_ITE && index === 0 ? SORT_BOOL : builtinSort;
    const args = inputArgs.map((arg, index) =>
      getExpected(index) === undefined ? arg : coerce(arg, getExpected(index)),
    );
    const isArity = (min: number, max: number) => args.length >= min && args.length <= max;
    const isArityOk = isUninterpreted
      ? args.length === domain.length
      : op === OP_AND || op === OP_OR
        ? true
        : op === OP_ITE
          ? isArity(3, 3)
          : op === OP_EQ || op === OP_DISTINCT
            ? isArity(2, Infinity)
            : op === OP_NOT ||
                op === OP_UMINUS ||
                op === OP_ABS ||
                op === OP_TO_REAL ||
                op === OP_TO_INT ||
                op === OP_IS_INT
              ? isArity(1, 1)
              : op === OP_IMPLIES ||
                  op === OP_XOR ||
                  op === OP_IDIV ||
                  op === OP_MOD ||
                  op === OP_DIV ||
                  op === OP_LE ||
                  op === OP_GE ||
                  op === OP_LT ||
                  op === OP_GT
                ? isArity(2, 2)
                : isArity(1, Infinity);
    const isBuiltinArith = manager.funcDecls[decl].family === FAMILY_ARITH;
    const isWellSorted =
      isArityOk &&
      (!isBuiltinArith || isArithSort(builtinSort)) &&
      args.every((arg, index) => manager.sorts[arg] === getExpected(index));
    if (!isWellSorted) throw new SmtParseError(`ill-sorted application of ${name}`);
    return manager.mkApp(
      decl,
      args,
      isUninterpreted ? manager.funcDecls[decl].range : getRange(op, builtinSort),
    );
  };

  const mkChain = (op: number, args: number[]) => {
    const domainSort = getDomainSort(op, args);
    const pairs: number[] = [];
    for (let index = 0; index + 1 < args.length; index++)
      pairs.push(mkApp(op, [args[index], args[index + 1]], domainSort));
    return pairs.length === 1 ? pairs[0] : mkApp(OP_AND, pairs);
  };

  const expectBool = (expr: number) => {
    if (manager.sorts[expr] !== SORT_BOOL) throw new SmtParseError("expected a formula");
    return expr;
  };

  // push_pattern_frame with ignore_bad_patterns: (t1 ... tn) is a multi-pattern, (f a ...) a pattern
  // of one term, and a pattern that starts with a constant is dropped unparsed.
  const parsePattern = (sexpr: SExpr) => {
    if (!Array.isArray(sexpr) || sexpr.length === 0) return undefined;
    const head = sexpr[0];
    if (Array.isArray(head)) return manager.mkPattern(sexpr.map(parseTerm));
    const decl = head === "true" || head === "false" ? -1 : funcs.get(head);
    if (decl === -1 || (decl !== undefined && manager.funcDecls[decl].domain.length === 0))
      return undefined;
    return manager.mkPattern([parseTerm(sexpr)]);
  };

  // pattern_validator: a pattern has no Boolean operator other than equality, no quantifier, and
  // every variable of its quantifier.
  const isValidPattern = (pattern: number, numDecls: number) => {
    const found = new Set<number>();
    const isValid = (expr: number): boolean => {
      const kind = manager.kinds[expr];
      if (kind === KIND_QUANTIFIER) return false;
      if (kind === KIND_VAR) {
        if (manager.values[expr] < numDecls) found.add(manager.values[expr]);
        return true;
      }
      const funcDecl = manager.funcDecls[manager.decls[expr]];
      if (
        funcDecl.family === FAMILY_BASIC &&
        funcDecl.op !== OP_EQ &&
        funcDecl.op !== OP_TRUE &&
        funcDecl.op !== OP_FALSE
      )
        return false;
      return manager.args[expr].every(isValid);
    };
    return manager.args[pattern].every(isValid) && found.size === numDecls;
  };

  const parseQuantifier = (list: SExpr[], isForall: boolean) => {
    const declarations = expectList(list[1]);
    const scope = new Map<string, Binding>();
    const names = declarations.map((declaration) => expectSymbol(expectList(declaration)[0]));
    const varSorts = declarations.map((declaration, index) => {
      const sort = parseSort(expectList(declaration)[1]);
      scope.set(names[index], { depth: depth + index, sort, expr: -1, isBoundVar: true });
      return sort;
    });
    scopes.push(scope);
    depth += varSorts.length;
    // parse_sorted_vars: the variables are created first, the first declared with the largest index,
    // and the parser's stack holds them until the quantifier is created.
    const boundVars = varSorts.map((sort, index) =>
      manager.mkVar(varSorts.length - 1 - index, sort),
    );
    for (const boundVar of boundVars) manager.incRef(boundVar);
    const bodySExpr = list[2];
    const isAnnotated = Array.isArray(bodySExpr) && bodySExpr[0] === "!";
    const body = expectBool(parseTerm(isAnnotated ? bodySExpr[1] : bodySExpr));
    const patterns: number[] = [];
    let weight = 1;
    let qid = "";
    if (isAnnotated)
      for (let index = 2; index < bodySExpr.length; index += 2) {
        const keyword = bodySExpr[index];
        const value = bodySExpr[index + 1];
        if (keyword === ":pattern") {
          const pattern = parsePattern(value);
          if (pattern !== undefined) {
            manager.incRef(pattern);
            patterns.push(pattern);
          }
        } else if (keyword === ":weight") weight = Number(value);
        else if (keyword === ":qid") qid = expectSymbol(value);
      }
    scopes.pop();
    depth -= varSorts.length;
    // pop_quant_frame: the invalid patterns leave the parser's stack before the quantifier is made,
    // and the valid ones after.
    let numKept = 0;
    for (const pattern of patterns) {
      if (!isValidPattern(pattern, varSorts.length)) continue;
      manager.incRef(pattern);
      manager.decRef(patterns[numKept]);
      patterns[numKept] = pattern;
      numKept++;
    }
    for (const removed of patterns.splice(numKept)) manager.decRef(removed);
    const quantifier = manager.mkQuantifier({
      isForall,
      sorts: varSorts,
      names,
      body,
      patterns,
      weight,
      qid,
    });
    for (const pattern of patterns) manager.decRef(pattern);
    for (const boundVar of boundVars) manager.decRef(boundVar);
    return quantifier;
  };

  const parseLet = (list: SExpr[]) => {
    const scope = new Map<string, Binding>();
    for (const binding of expectList(list[1])) {
      const pair = expectList(binding);
      const expr = parseTerm(pair[1]);
      scope.set(expectSymbol(pair[0]), {
        depth,
        sort: manager.sorts[expr],
        expr,
        isBoundVar: false,
      });
    }
    scopes.push(scope);
    const body = parseTerm(list[2]);
    scopes.pop();
    return body;
  };

  const parseApp = (name: string, args: number[]) => {
    const chainable = CHAINABLE_OPS.get(name);
    if (chainable !== undefined) return mkChain(chainable, args);
    if (name === "-") return mkApp(args.length === 1 ? OP_UMINUS : OP_SUB, args);
    // ast_manager::mk_app: / is left associative, so more arguments nest to the left.
    if (name === "/" && args.length > 2)
      return args
        .slice(1)
        .reduce((dividend, divisor) => mkApp(OP_DIV, [dividend, divisor]), args[0]);
    const op = BUILTIN_OPS.get(name);
    if (op !== undefined) return mkApp(op, args);
    const decl = funcs.get(name);
    if (decl === undefined) throw new SmtParseError(`unknown function ${name}`);
    return mkApp(decl, args);
  };

  // A term without nested applications to parse first: a symbol, a quantifier, a let or an
  // annotation.
  const parseLeaf = (sexpr: SExpr): number => {
    if (typeof sexpr === "string") {
      if (/^[0-9]+$/.test(sexpr)) return manager.mkNumeral(BigInt(sexpr));
      const decimal = DECIMAL.exec(sexpr);
      if (decimal !== null)
        return manager.mkRealNumeral(
          Rational.of(BigInt(decimal[1] + decimal[2]), 10n ** BigInt(decimal[2].length)),
        );
      if (sexpr === "true") return manager.trueExpr;
      if (sexpr === "false") return manager.falseExpr;
      const binding = lookup(sexpr);
      if (binding !== undefined)
        return binding.isBoundVar
          ? manager.mkVar(depth - 1 - binding.depth, binding.sort)
          : shiftVars(manager, binding.expr, 0, depth - binding.depth, 0);
      return parseApp(sexpr, []);
    }
    const head = sexpr[0];
    if (head === "forall" || head === "exists") return parseQuantifier(sexpr, head === "forall");
    if (head === "let") return parseLet(sexpr);
    const named = parseTerm(sexpr[1]);
    // name_expr: cmd_context keeps a named expression as a macro.
    const nameIndex = sexpr.indexOf(":named");
    if (nameIndex !== -1) {
      manager.incRef(named);
      manager.mkMacro(sexpr[nameIndex + 1] as string, named);
    }
    return named;
  };

  // Applications keep their own stack, like Z3's parser, so deeply nested terms do not exhaust the
  // call stack.
  const parseTerm = (sexpr: SExpr): number => {
    const frames: ApplicationFrame[] = [];
    const results: number[] = [];
    const enter = (current: SExpr) => {
      const head = Array.isArray(current) ? current[0] : undefined;
      if (
        !Array.isArray(current) ||
        head === "forall" ||
        head === "exists" ||
        head === "let" ||
        head === "!"
      )
        results.push(parseLeaf(current));
      else frames.push({ name: expectSymbol(head), list: current, start: results.length, next: 1 });
    };
    enter(sexpr);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.next < frame.list.length) {
        enter(frame.list[frame.next++]);
        continue;
      }
      frames.pop();
      results.push(parseApp(frame.name, results.splice(frame.start)));
    }
    return results[0];
  };

  let hasCheckSat = false;
  for (const command of readSExprs(tokenize(text))) {
    const list = expectList(command);
    const name = expectSymbol(list[0]);
    if (name === "declare-sort") {
      if (list[2] !== undefined && list[2] !== "0")
        throw new SmtUnsupportedError("parametric sorts are not supported");
      sorts.set(expectSymbol(list[1]), manager.mkSort(expectSymbol(list[1])));
    } else if (name === "declare-fun" || name === "declare-const") {
      const domain = name === "declare-fun" ? expectList(list[2]).map(parseSort) : [];
      const range = parseSort(name === "declare-fun" ? list[3] : list[2]);
      // builtin_signature_collides and is_transcendental_shadow_decl each apply the builtin of that
      // name to fresh variables, which they then release.
      for (let round = 0; round < 2; round++) {
        const vars = domain.map((sort, index) => manager.mkVar(index, sort));
        for (const domainVar of vars) manager.incRef(domainVar);
        for (const domainVar of vars) manager.decRef(domainVar);
      }
      funcs.set(expectSymbol(list[1]), manager.mkFuncDecl(expectSymbol(list[1]), domain, range));
    } else if (name === "assert") {
      // cmd_context::assert_expr keeps the assertion, and passes it to the solver.
      const assertion = expectBool(parseTerm(list[1]));
      manager.incRef(assertion);
      assertions.push(assertion);
      assertExpr(assertion);
    } else if (name === "check-sat") {
      hasCheckSat = true;
      break;
    } else if (name === "push" || name === "pop" || name === "define-fun" || name === "define-sort")
      throw new SmtUnsupportedError(`the command ${name} is not supported`);
  }
  return { assertions, hasCheckSat };
};
