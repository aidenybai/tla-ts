// Ported from Z3 (src/parsers/smt2/smt2parser.cpp), MIT license, see z3-license.txt.
// Parses the SMT-LIB subset that tlapm emits into Z3-style expressions.
import { SmtParseError, SmtUnsupportedError } from "../errors";
import {
  AstManager,
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
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { shiftVars } from "./rewriter";

type SExpr = string | SExpr[];

interface Binding {
  depth: number;
  sort: number;
  expr: number;
  isBoundVar: boolean;
}

export interface SmtProblem {
  manager: AstManager;
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

export const parseSmtlib = (text: string): SmtProblem => {
  const manager = new AstManager();
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
    if (sort === undefined) throw new SmtUnsupportedError(`unknown sort ${String(sexpr)}`);
    return sort;
  };

  const lookup = (name: string) => {
    for (let index = scopes.length - 1; index >= 0; index--) {
      const binding = scopes[index].get(name);
      if (binding !== undefined) return binding;
    }
    return undefined;
  };

  const mkChain = (op: number, args: number[]) => {
    const pairs: number[] = [];
    for (let index = 0; index + 1 < args.length; index++)
      pairs.push(manager.mkApp(op, [args[index], args[index + 1]], SORT_BOOL));
    return pairs.length === 1 ? pairs[0] : manager.mkApp(OP_AND, pairs, SORT_BOOL);
  };

  const parseQuantifier = (list: SExpr[], isForall: boolean) => {
    const declarations = expectList(list[1]);
    const scope = new Map<string, Binding>();
    const varSorts = declarations.map((declaration, index) => {
      const pair = expectList(declaration);
      const sort = parseSort(pair[1]);
      scope.set(expectSymbol(pair[0]), { depth: depth + index, sort, expr: -1, isBoundVar: true });
      return sort;
    });
    scopes.push(scope);
    depth += varSorts.length;
    let bodySExpr = list[2];
    const patterns: number[][] = [];
    let weight = 1;
    let qid = "";
    if (Array.isArray(bodySExpr) && bodySExpr[0] === "!") {
      const annotated = bodySExpr;
      for (let index = 2; index < annotated.length; index += 2) {
        const keyword = annotated[index];
        const value = annotated[index + 1];
        if (keyword === ":pattern") patterns.push(expectList(value).map(parseTerm));
        else if (keyword === ":weight") weight = Number(value);
        else if (keyword === ":qid") qid = expectSymbol(value);
      }
      bodySExpr = annotated[1];
    }
    const body = parseTerm(bodySExpr);
    scopes.pop();
    depth -= varSorts.length;
    return manager.mkQuantifier({ isForall, sorts: varSorts, body, patterns, weight, qid });
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
      return args.length === 1
        ? manager.mkApp(OP_UMINUS, args, SORT_INT)
        : manager.mkApp(OP_SUB, args, SORT_INT);
    if (name === "+") return manager.mkApp(OP_ADD, args, SORT_INT);
    const op = BUILTIN_OPS.get(name);
    if (op !== undefined) {
      const sort =
        op === OP_ITE
          ? manager.sorts[args[1]]
          : op === OP_MUL || op === OP_IDIV || op === OP_MOD || op === OP_ABS
            ? SORT_INT
            : SORT_BOOL;
      return manager.mkApp(op, args, sort);
    }
    const decl = funcs.get(name);
    if (decl === undefined) throw new SmtUnsupportedError(`unknown function ${name}`);
    return manager.mkApp(decl, args, manager.funcDecls[decl].range);
  };

  const parseTerm = (sexpr: SExpr): number => {
    if (typeof sexpr === "string") {
      if (/^[0-9]+$/.test(sexpr)) return manager.mkNumeral(Number(sexpr));
      if (sexpr === "true") return manager.trueExpr;
      if (sexpr === "false") return manager.falseExpr;
      const binding = lookup(sexpr);
      if (binding !== undefined)
        return binding.isBoundVar
          ? manager.mkVar(depth - 1 - binding.depth, binding.sort)
          : shiftVars(manager, binding.expr, depth - binding.depth);
      return parseApp(sexpr, []);
    }
    const head = sexpr[0];
    if (head === "forall" || head === "exists") return parseQuantifier(sexpr, head === "forall");
    if (head === "let") return parseLet(sexpr);
    if (head === "!") return parseTerm(sexpr[1]);
    return parseApp(expectSymbol(head), sexpr.slice(1).map(parseTerm));
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
      funcs.set(expectSymbol(list[1]), manager.mkFuncDecl(expectSymbol(list[1]), domain, range));
    } else if (name === "assert") assertions.push(parseTerm(list[1]));
    else if (name === "check-sat") {
      hasCheckSat = true;
      break;
    } else if (name === "push" || name === "pop" || name === "define-fun" || name === "define-sort")
      throw new SmtUnsupportedError(`the command ${name} is not supported`);
  }
  return { manager, assertions, hasCheckSat };
};
