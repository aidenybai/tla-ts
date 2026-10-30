// Ported from Z3 (src/parsers/smt2/smt2parser.cpp), MIT license, see z3-license.txt.
// Parses the SMT-LIB subset that tlapm emits into Z3-style expressions.
import { SmtParseError, SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
  FAMILY_BASIC,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_ABS,
  OP_ADD,
  OP_AND,
  OP_DISTINCT,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_TRUE,
  OP_FALSE,
  OP_UMINUS,
  OP_UNINTERPRETED,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { shiftVars } from "./var-subst";

type SExpr = string | SExpr[];

interface Binding {
  depth: number;
  sort: number;
  expr: number;
  isBoundVar: boolean;
}

export interface SmtProblem {
  assertions: number[];
  // Z3 prints no answer for a script without check-sat.
  hasCheckSat: boolean;
}

const BUILTIN_OPS = new Map<string, number>([
  ["and", OP_AND],
  ["or", OP_OR],
  ["not", OP_NOT],
  ["=>", OP_IMPLIES],
  ["xor", OP_XOR],
  ["ite", OP_ITE],
  ["distinct", OP_DISTINCT],
  ["*", OP_MUL],
  ["div", OP_IDIV],
  ["mod", OP_MOD],
  ["abs", OP_ABS],
]);

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

  // Checks the sorts and the arity of an application, so the solver only sees well-sorted terms,
  // and that quantifiers occur only under Boolean connectives.
  const mkApp = (decl: number, args: number[], sort: number) => {
    const op = manager.funcDecls[decl].op;
    const name = manager.funcDecls[decl].name;
    const argSorts = args.map((arg) => manager.sorts[arg]);
    const isAll = (expected: number) => argSorts.every((argSort) => argSort === expected);
    const isArity = (min: number, max: number) => args.length >= min && args.length <= max;
    const isWellSorted =
      op === OP_UNINTERPRETED
        ? argSorts.length === manager.funcDecls[decl].domain.length &&
          argSorts.every((argSort, index) => argSort === manager.funcDecls[decl].domain[index])
        : op === OP_AND || op === OP_OR
          ? isAll(SORT_BOOL)
          : op === OP_NOT
            ? isArity(1, 1) && isAll(SORT_BOOL)
            : op === OP_IMPLIES || op === OP_XOR
              ? isArity(2, 2) && isAll(SORT_BOOL)
              : op === OP_ITE
                ? isArity(3, 3) && argSorts[0] === SORT_BOOL && argSorts[1] === argSorts[2]
                : op === OP_EQ || op === OP_DISTINCT
                  ? isArity(2, Infinity) && isAll(argSorts[0])
                  : op === OP_UMINUS || op === OP_ABS
                    ? isArity(1, 1) && isAll(SORT_INT)
                    : op === OP_IDIV ||
                        op === OP_MOD ||
                        op === OP_LE ||
                        op === OP_GE ||
                        op === OP_LT ||
                        op === OP_GT
                      ? isArity(2, 2) && isAll(SORT_INT)
                      : isArity(1, Infinity) && isAll(SORT_INT);
    if (!isWellSorted) throw new SmtParseError(`ill-sorted application of ${name}`);
    return manager.mkApp(decl, args, sort);
  };

  const mkChain = (op: number, args: number[]) => {
    const pairs: number[] = [];
    for (let index = 0; index + 1 < args.length; index++)
      pairs.push(mkApp(op, [args[index], args[index + 1]], SORT_BOOL));
    return pairs.length === 1 ? pairs[0] : mkApp(OP_AND, pairs, SORT_BOOL);
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
    if (name === "-")
      return args.length === 1 ? mkApp(OP_UMINUS, args, SORT_INT) : mkApp(OP_SUB, args, SORT_INT);
    if (name === "+") return mkApp(OP_ADD, args, SORT_INT);
    const op = BUILTIN_OPS.get(name);
    if (op !== undefined) {
      const sort =
        op === OP_ITE
          ? manager.sorts[args[1]]
          : op === OP_MUL || op === OP_IDIV || op === OP_MOD || op === OP_ABS
            ? SORT_INT
            : SORT_BOOL;
      return mkApp(op, args, sort);
    }
    const decl = funcs.get(name);
    if (decl === undefined) throw new SmtParseError(`unknown function ${name}`);
    return mkApp(decl, args, manager.funcDecls[decl].range);
  };

  // A term without nested applications to parse first: a symbol, a quantifier, a let or an
  // annotation.
  const parseLeaf = (sexpr: SExpr): number => {
    if (typeof sexpr === "string") {
      if (/^[0-9]+$/.test(sexpr)) return manager.mkNumeral(BigInt(sexpr));
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
    if (sexpr.includes(":named")) manager.incRef(named);
    return named;
  };

  // Applications keep their own stack, like Z3's parser, so deeply nested terms do not exhaust the
  // call stack. Each frame has an application's name, its list, where its arguments start on the
  // result stack, and its next argument.
  const parseTerm = (sexpr: SExpr): number => {
    const frames: { name: string; list: SExpr[]; start: number; next: number }[] = [];
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
