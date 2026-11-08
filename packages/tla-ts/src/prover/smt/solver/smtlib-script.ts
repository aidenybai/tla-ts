// Ported from Z3 (src/cmd_context/cmd_context.cpp, src/cmd_context/basic_cmds.cpp), MIT license,
// see z3-license.txt.
import {
  isStackOverflow,
  SmtCanceledError,
  SmtParseError,
  SmtUnsupportedError,
} from "../../../errors";
import type { DecideOptions } from "../../verdict";
import { AstManager, OP_DIV, OP_IDIV, OP_MOD, OP_MUL, SORT_BOOL, SORT_INT, SORT_REAL } from "./ast";
import { ctxSimplify } from "./ctx-simplify";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { simplifyGoal } from "./quant-tactics";
import { Rewriter, type RewriterOptions } from "./rewriter";
import { ResourceLimit } from "./rlimit";
import { DEFAULT_PRINT_OPTIONS, type PrintOptions, printExpr } from "./smt2-printer";
import {
  createCommandReader,
  createSmtlibReader,
  DECLARATIONS,
  isSymbol,
  type SExpr,
  type SmtList,
  type SmtlibReader,
} from "./smtlib-parser";
import { getVerdict, solveAssertions } from "./solver";

const SILENT_COMMANDS = new Set([
  ...DECLARATIONS,
  "assert",
  "push",
  "pop",
  "reset",
  "reset-assertions",
  "set-logic",
  "set-option",
  "set-info",
  "minimize",
  "maximize",
  "assert-soft",
]);

type PrintOptionOf<Value> = {
  [Key in keyof PrintOptions]: PrintOptions[Key] extends Value ? Key : never;
}[keyof PrintOptions];

const NUMERIC_PRINT_OPTIONS = new Map<string, PrintOptionOf<number>>([
  [":pp.max_indent", "maxIndent"],
  [":pp.max_num_lines", "maxNumLines"],
  [":pp.max_width", "maxWidth"],
  [":pp.max_ribbon", "maxRibbon"],
  [":pp.max_depth", "maxDepth"],
  [":pp.min_alias_size", "minAliasSize"],
  [":pp.decimal_precision", "decimalPrecision"],
]);

const BOOLEAN_PRINT_OPTIONS = new Map<string, PrintOptionOf<boolean>>([
  [":pp.flat_assoc", "isFlatAssoc"],
  [":pp.single_line", "isSingleLine"],
  [":pp.bounded", "isBounded"],
  [":pp.decimal", "isDecimal"],
  [":pp.bv_literals", "isBvLiterals"],
  [":pp.bv_neg", "isBvNeg"],
]);

const SIMPLIFY_PARAMETERS = new Set([
  ":elim_and",
  ":pull_cheap_ite",
  ":blast_distinct",
  ":som",
  ":sort_sums",
  ":arith_lhs",
  ":gcd_rounding",
  ":hi_div0",
  ":mul2concat",
  ":split_concat_eq",
]);

const getRewriterOptions = (manager: AstManager, items: SExpr[]): RewriterOptions => {
  const parameters = new Map<string, boolean>();
  for (let index = 0; index < items.length; index += 2) {
    const keyword = items[index];
    const name = keyword.kind === "keyword" ? keyword.text.toLowerCase().replaceAll("-", "_") : "";
    if (!SIMPLIFY_PARAMETERS.has(name) || !isSymbol(items[index + 1]))
      throw new SmtUnsupportedError(`the parameter ${name} of the simplifier`);
    parameters.set(name, isSymbol(items[index + 1], "true"));
  }
  const getParameter = (name: string) => parameters.get(name) ?? false;
  return {
    isEliminatingAnd: getParameter(":elim_and"),
    isRewritingPatterns: false,
    isPullingCheapIte: getParameter(":pull_cheap_ite"),
    isKeepingDistinct: !getParameter(":blast_distinct"),
    arith: {
      isSom: getParameter(":som"),
      isSortSums: getParameter(":sort_sums"),
      isArithIneqLhs: getParameter(":arith_lhs"),
      isGcdRounding: getParameter(":gcd_rounding"),
    },
    bv: {
      isHiDiv0: parameters.get(":hi_div0") ?? manager.isHiDiv0,
      isMul2concat: getParameter(":mul2concat"),
      isSplitConcatEq: getParameter(":split_concat_eq"),
    },
  };
};

const NAMED_TACTICS = new Map<string, (manager: AstManager, goal: Goal) => void>([
  ["simplify", (manager, goal) => simplifyGoal(manager, goal, getRewriterOptions(manager, []))],
  ["propagate-values", propagateValues],
  ["ctx-simplify", ctxSimplify],
  ["skip", () => {}],
]);

const runTactic = (manager: AstManager, tactic: SExpr, goal: Goal): void => {
  if (isSymbol(tactic)) {
    const named = NAMED_TACTICS.get(tactic.text);
    if (named === undefined) throw new SmtUnsupportedError(`the tactic ${tactic.text}`);
    named(manager, goal);
    return;
  }
  const head = tactic.kind === "list" ? tactic.items[0] : undefined;
  if (tactic.kind === "list" && (isSymbol(head, "then") || isSymbol(head, "and-then"))) {
    for (const inner of tactic.items.slice(1)) {
      if (goal.isInconsistent || goal.forms.size === 0) return;
      runTactic(manager, inner, goal);
    }
    return;
  }
  if (tactic.kind === "list" && isSymbol(head, "!") && isSymbol(tactic.items[1], "simplify")) {
    simplifyGoal(manager, goal, getRewriterOptions(manager, tactic.items.slice(2)));
    return;
  }
  throw new SmtUnsupportedError("the tactic expression");
};

const getScopeCount = (list: SmtList, command: string) => {
  const argument = list.items[1];
  if (argument === undefined) return 1;
  if (argument.kind !== "numeral")
    throw new SmtParseError(`invalid ${command} command, integer expected`, argument);
  if (argument.text.startsWith("-"))
    throw new SmtParseError(`invalid ${command} command, value is negative.`, list.end);
  return Number(argument.text);
};

// opt::context warns that it does not support quantifiers, and optsmt need not find a bound of
// nonlinear arithmetic, so the port does not answer either.
const isBeyondOptimization = (manager: AstManager, formulas: number[]) => {
  const seen = new Set<number>();
  const stack = [...formulas];
  for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.hasQuantifierFlags[expr]) return true;
    const args = manager.getArgs(expr);
    const op = manager.getOp(expr);
    if (op === OP_MUL && args.filter((arg) => !manager.isNumeral(arg)).length > 1) return true;
    if ((op === OP_DIV || op === OP_IDIV || op === OP_MOD) && !manager.isNumeral(args[1]))
      return true;
    stack.push(...args);
  }
  return false;
};

interface Scope {
  assertions: number;
  objectives: number;
}

interface ScriptState {
  manager: AstManager;
  reader: SmtlibReader;
  assertions: number[];
  objectives: number[];
  scopes: Scope[];
}

export const runSmtlibScript = (
  text: string,
  options: DecideOptions,
  print: (line: string) => void,
) => {
  const commands = createCommandReader(text);
  const settings = {
    isPrintingSuccess: false,
    isMbqi: true,
    isHiDiv0: true,
    rlimit: 0,
    printOptions: { ...DEFAULT_PRINT_OPTIONS },
    parserOptions: { isIgnoringBadPatterns: true },
  };
  const createState = (): ScriptState => {
    const manager = new AstManager(
      new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
    );
    manager.isHiDiv0 = settings.isHiDiv0;
    return {
      manager,
      reader: createSmtlibReader(manager, undefined, settings.parserOptions),
      assertions: [],
      objectives: [],
      scopes: [],
    };
  };
  const script = { state: createState() };
  const display = (expr: number) =>
    print(
      printExpr(
        script.state.manager,
        { options: settings.printOptions, isUsed: script.state.reader.isUsed },
        expr,
      ),
    );
  const report = (error: SmtParseError) =>
    print(`(error "line ${error.line} column ${error.column}: ${error.message}")`);
  const checkSat = (extra: number[]) => {
    const state = script.state;
    state.manager.limit.restart(Date.now() + options.timeLimitMs);
    // opt::context::optimize answers as the search of the hard constraints does: once they are
    // satisfiable, optsmt and maxsmt only improve the model.
    if (
      state.objectives.length > 0 &&
      isBeyondOptimization(state.manager, [...state.assertions, ...state.objectives])
    )
      throw new SmtUnsupportedError("optimization beyond linear arithmetic");
    state.manager.limit.push(settings.rlimit);
    try {
      print(
        getVerdict(
          solveAssertions(state.manager, [...state.assertions, ...extra], settings.isMbqi).result,
        ),
      );
    } catch (error) {
      if (!(error instanceof SmtCanceledError || isStackOverflow(error))) throw error;
      print("unknown");
    } finally {
      state.manager.limit.pop();
    }
  };
  const parseFormulas = (items: SmtList["items"]) =>
    items.map((literal) => script.state.reader.parseFormula(literal));
  const addObjective = (list: SmtList) => {
    const state = script.state;
    const term = state.reader.parseTerm(list.items[1] ?? list.end);
    const sort = state.manager.sorts[term];
    if (sort !== SORT_INT && sort !== SORT_REAL && !state.manager.isBvSort(sort))
      throw new SmtParseError("Objective must be bit-vector, integer or real", list.end);
    state.objectives.push(term);
  };
  const runCommand: Record<string, (list: SmtList) => void> = {
    assert: (list) =>
      script.state.assertions.push(script.state.reader.parseFormula(list.items[1] ?? list.end)),
    "check-sat": (list) => checkSat(parseFormulas(list.items.slice(1))),
    "check-sat-using": (list) => {
      if (!isSymbol(list.items[1], "smt") || list.items.length !== 2)
        throw new SmtUnsupportedError("the command check-sat-using");
      checkSat([]);
    },
    "check-sat-assuming": (list) => {
      const literals = list.items[1];
      if (literals?.kind !== "list")
        throw new SmtParseError(
          "invalid check-sat-assuming command, '(' expected",
          literals ?? list.end,
        );
      checkSat(parseFormulas(literals.items));
    },
    minimize: addObjective,
    maximize: addObjective,
    "assert-soft": (list) => {
      const state = script.state;
      const formula = state.reader.parseTerm(list.items[1] ?? list.end);
      if (state.manager.sorts[formula] !== SORT_BOOL)
        throw new SmtParseError("Invalid type for expression. Expected Boolean type.", list.end);
      state.objectives.push(formula);
    },
    push: (list) => {
      const state = script.state;
      for (let index = getScopeCount(list, "push"); index > 0; index--) {
        state.scopes.push({
          assertions: state.assertions.length,
          objectives: state.objectives.length,
        });
        state.reader.push();
      }
    },
    pop: (list) => {
      const state = script.state;
      const count = getScopeCount(list, "pop");
      if (count > state.scopes.length)
        throw new SmtParseError(
          "invalid pop command, argument is greater than the current stack depth",
          list.end,
        );
      for (let index = 0; index < count; index++) {
        const scope = state.scopes.pop();
        state.assertions.length = scope?.assertions ?? 0;
        state.objectives.length = scope?.objectives ?? 0;
        state.reader.pop();
      }
    },
    reset: () => {
      script.state = createState();
      settings.isPrintingSuccess = false;
    },
    "reset-assertions": () => {
      const state = script.state;
      state.assertions = [];
      state.objectives = [];
      state.scopes = state.scopes.map(() => ({ assertions: 0, objectives: 0 }));
    },
    simplify: (list) => {
      const manager = script.state.manager;
      if (list.items.length < 2)
        throw new SmtParseError("invalid simplify command, argument expected", list.end);
      const term = script.state.reader.parseTerm(list.items[1]);
      manager.incRef(term);
      const rewriter = new Rewriter(manager, getRewriterOptions(manager, list.items.slice(2)));
      const simplified = rewriter.rewrite(term);
      rewriter.cleanup();
      display(simplified);
      rewriter.release();
      manager.decRef(simplified);
      manager.decRef(term);
    },
    apply: (list) => {
      const state = script.state;
      if (list.items.length !== 2) throw new SmtUnsupportedError("the parameters of apply");
      const goal = new Goal(state.manager);
      for (const assertion of state.assertions) goal.assert(assertion);
      runTactic(state.manager, list.items[1], goal);
      const environment = { options: settings.printOptions, isUsed: state.reader.isUsed };
      print(
        [
          "(goals",
          "(goal",
          ...goal.forms.items.map((form) => `  ${printExpr(state.manager, environment, form, 2)}`),
          `  :precision precise :depth ${goal.depth})`,
          ")",
        ].join("\n"),
      );
    },
    display: (list) => display(script.state.reader.parseTerm(list.items[1] ?? list.end)),
    echo: (list) => {
      const message = list.items[1];
      if (message?.kind !== "string")
        throw new SmtParseError("invalid echo command, string expected", message ?? list.end);
      print(message.text);
    },
    "set-option": (list) => {
      const option = list.items[1];
      const optionName =
        option?.kind === "keyword" ? option.text.toLowerCase().replaceAll("-", "_") : "";
      const value = list.items[2];
      const isTrue = isSymbol(value, "true");
      if (optionName === ":print_success") settings.isPrintingSuccess = isTrue;
      if (optionName === ":smt.mbqi") settings.isMbqi = isTrue;
      if (optionName === ":rlimit" && value?.kind === "numeral")
        settings.rlimit = Number(value.text);
      if (optionName === ":rewriter.hi_div0") {
        settings.isHiDiv0 = isTrue;
        script.state.manager.isHiDiv0 = isTrue;
      }
      if (optionName === ":parser.ignore_bad_patterns")
        settings.parserOptions.isIgnoringBadPatterns = isTrue;
      const numericOption = NUMERIC_PRINT_OPTIONS.get(optionName);
      if (numericOption !== undefined && value?.kind === "numeral")
        settings.printOptions[numericOption] = Number(value.text);
      const booleanOption = BOOLEAN_PRINT_OPTIONS.get(optionName);
      if (booleanOption !== undefined) settings.printOptions[booleanOption] = isTrue;
      if (
        optionName.startsWith(":pp.") &&
        numericOption === undefined &&
        booleanOption === undefined
      )
        throw new SmtUnsupportedError(`the option ${optionName}`);
    },
    "set-logic": (list) => {
      const logic = list.items[1];
      if (!isSymbol(logic))
        throw new SmtParseError("invalid logic name, symbol expected", logic ?? list.end);
      script.state.reader = createSmtlibReader(
        script.state.manager,
        logic.text,
        settings.parserOptions,
      );
    },
    "set-info": () => {},
  };
  const run = (list: SmtList) => {
    const head = list.items[0];
    if (!isSymbol(head))
      throw new SmtParseError("invalid command, symbol expected", head ?? list.end);
    const command = DECLARATIONS.has(head.text)
      ? (declaration: SmtList) => script.state.reader.declareCommand(declaration)
      : runCommand[head.text];
    if (command === undefined) throw new SmtUnsupportedError(`the command ${head.text}`);
    command(list);
    if (settings.isPrintingSuccess && SILENT_COMMANDS.has(head.text)) print("success");
  };
  for (;;) {
    try {
      const list = commands.read();
      if (list === undefined || isSymbol(list.items[0], "exit")) return;
      run(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      commands.skip(report);
    }
  }
};
