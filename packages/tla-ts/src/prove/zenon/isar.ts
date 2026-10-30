// Ported from Zenon's lltoisar.ml and the -oisar path of main.ml, as shipped in tlapm. Copyright
// 2008 INRIA, see LICENSE.
//
// Prints a proof as the Isar text that Zenon writes with -oisar, which tlapm checks with Isabelle.
// Zenon numbers each formula the first time it prints or names it: z_H<n> names a hypothesis and
// ?z_h<n> abbreviates a formula that an earlier (is "...") pattern bound.

import { TlaZenonError } from "../../errors";
import { FALSE, GOAL_NAME, TRUE, type BinderExpr, type Expr, type Expressions } from "./expr";
import type { Relations } from "./eqrel";
import { printCaseLemma, printRecordLemma } from "./isar-case";
import { getLimitFailure, type Limits } from "./limits";
import { optimise, type Lemma, type LlProof } from "./llproof";
import { isMetaName, translateProof, type MlProof } from "./mltoll";
import type { Phrase } from "./parse";
import { postprocessTla } from "./tla/llproof";

const INFIXES: Record<string, string> = {
  "=": "=",
  "TLA.cup": " \\\\cup ",
  "TLA.cap": " \\\\cap ",
  "TLA.setminus": " \\\\ ",
  "TLA.in": " \\\\in ",
  "TLA.subseteq": " \\\\subseteq ",
  "arith.natrange": "..",
  "arith.add": " + ",
  "arith.sub": " - ",
  "arith.mul": " * ",
  "arith.le": " <= ",
  "arith.lt": " < ",
  "TLA.concat": " \\\\circ ",
  "TLA.oneArg": " :> ",
  "TLA.extend": " @@ ",
};

const CONSTANTS: Record<string, string> = {
  "TLA.emptyset": "{}",
  "arith.N": "Nat",
  "arith.Z": "Int",
  "arith.R": "isReal",
  "arith.Infinity": "isInfinity",
};

const PREFIXES: Record<string, string> = {
  "arith.div": "isa'slash",
  "arith.euclidiv": "isa'div",
  "arith.mod": "isa'pc",
  "arith.minus": " -.",
  "arith.intrange": "isa'dotdot",
  "TLA.box": "isa'box",
};

// Zenon drops the namespace of the symbols it doesn't rename.
const stripNamespace = (symbol: string) =>
  symbol.length > 4 && symbol.startsWith("TLA.")
    ? symbol.slice(4)
    : symbol.length > 6 && symbol.startsWith("arith.")
      ? symbol.slice(6)
      : symbol;

// Zenon's Misc.base26.
const toBase26 = (number: number): string =>
  number < 26
    ? String.fromCharCode(97 + number)
    : `${toBase26(Math.floor(number / 26))}${String.fromCharCode(97 + (number % 26))}`;

const getPairs = <Item>(items: Item[]): [Item, Item][] =>
  Array.from({ length: Math.floor(items.length / 2) }, (_, position) => [
    items[2 * position],
    items[2 * position + 1],
  ]);

// The numeral that Zenon prints for 0 and its successors, up to 15.
const getNumeral = (expression: Expr, limit: number): number | undefined => {
  if (limit < 0) return undefined;
  if (expression.kind === "var" && expression.symbol === "0") return 0;
  if (
    expression.kind === "app" &&
    expression.symbol === "TLA.fapply" &&
    expression.args.length === 2 &&
    expression.args[0].kind === "var" &&
    expression.args[0].symbol === "TLA.Succ"
  ) {
    const previous = getNumeral(expression.args[1], limit - 1);
    return previous === undefined ? undefined : previous + 1;
  }
  return undefined;
};

const getSingle = (proof: LlProof) => {
  if (proof.subproofs.length !== 1) throw new TlaZenonError("Zenon: expected one subproof");
  return proof.subproofs[0];
};

const getLastBranchIsOther = (branches: Expr[][]) => {
  const last = branches[branches.length - 1];
  if (last === undefined || (last.length !== 1 && last.length !== 2))
    throw new TlaZenonError("Zenon: a CASE rule with a malformed last branch");
  return last.length === 2;
};

// Zenon's iinc: the indentation stops growing at 15.
const increment = (indent: number) => (indent >= 15 ? indent : indent + 1);

// What the search knew when it found a proof: the .znn file's phrases, the proofs that it reused
// and the properties of relations that the hypotheses stated. The printer stops at the search's
// limits.
export interface IsarContext {
  exprs: Expressions;
  phrases: Phrase[];
  sharedProofs: ReadonlySet<MlProof>;
  relations: Relations;
  limits: Limits;
}

// The Isar text that Zenon prints with -oisar for a proof that the search found, or undefined when
// the limits stop the printer first.
export const printIsar = (proof: MlProof, context: IsarContext): string | undefined => {
  const exprs = context.exprs;
  const numbers = new Map<Expr, number>();
  // Zenon's Index.get_number.
  const getNumber = (expression: Expr) => {
    const existing = numbers.get(expression);
    if (existing !== undefined) return existing;
    numbers.set(expression, numbers.size);
    return numbers.size - 1;
  };
  const lemmas = optimise(
    exprs,
    postprocessTla(
      exprs,
      translateProof(
        { exprs, getNumber, sharedProofs: context.sharedProofs, relations: context.relations },
        context.phrases,
        proof,
      ),
    ),
  );

  const output: string[] = [];
  const write = (text: string) => output.push(text);
  const line = (indent: number, text: string) => output.push(" ".repeat(indent), text);
  const hname = (expression: Expr) => `z_H${toBase26(getNumber(expression))}`;
  const vname = (expression: Expr) => `?z_h${toBase26(getNumber(expression))}`;
  const equal = (left: Expr, right: Expr) => exprs.eapp("=", [left, right]);
  const toLambda = (binder: Expr) => {
    if (binder.kind !== "all" && binder.kind !== "ex")
      throw new TlaZenonError("Zenon: expected a quantifier");
    return exprs.elam(binder.args[0], binder.symbol, binder.args[1]);
  };

  // The formulas that (is "...") patterns bound, as a persistent set: a version is the length of
  // the log, and a version only reads the log's prefix, which later additions from it don't change.
  const dictLog: number[] = [];
  const dictPositions = new Map<number, number>();
  const isBound = (dict: number, number: number) => {
    const position = dictPositions.get(number);
    return position !== undefined && position < dict && dictLog[position] === number;
  };
  const bind = (dict: number, number: number) => {
    dictLog.length = dict;
    dictPositions.set(number, dict);
    dictLog.push(number);
    return dict + 1;
  };

  // Zenon's p_expr: the bound variables are those that a pattern can't abbreviate.
  const printExpr = (env: string[], dict: number, expression: Expr): string => {
    const number = getNumber(expression);
    if (isBound(dict, number) && !expression.freeVars.some((name) => env.includes(name)))
      return `?z_h${toBase26(number)}`;
    const print = (operand: Expr) => printExpr(env, dict, operand);
    const printList = (operands: Expr[]) => operands.map(print).join(", ");
    const printBinder = (opening: string, binder: BinderExpr, separator: string) =>
      `(${opening}${binder.args[0].symbol}${separator}${printExpr([binder.args[0].symbol, ...env], dict, binder.args[1])})`;
    switch (expression.kind) {
      case "var":
        return isMetaName(expression.symbol)
          ? "(CHOOSE x : TRUE)"
          : (CONSTANTS[expression.symbol] ?? stripNamespace(expression.symbol));
      case "app": {
        const args = expression.args;
        switch (expression.symbol) {
          case "$string": {
            const text = args[0];
            if (args.length !== 1 || text.kind !== "var" || text.symbol.length < 2)
              throw new TlaZenonError("Zenon: a malformed string");
            return `''${text.symbol.slice(1, -1)}''`;
          }
          case "TLA.set":
            return `{${printList(args)}}`;
          case "TLA.tuple":
            return `<<${printList(args)}>>`;
          case "TLA.record":
            return `(${getPairs(args)
              .map((pair) => `${print(pair[0])} :> (${print(pair[1])})`)
              .join(" @@ ")})`;
          case "TLA.recordset":
            return `[${getPairs(args)
              .map((pair) => `${print(pair[0])} : (${print(pair[1])})`)
              .join(", ")}]`;
          case "TLA.CASE":
            return `(CASE ${printCaseArms(env, dict, args)})`;
        }
        if (expression.symbol === "TLA.fapply" && args.length === 2) {
          const numeral =
            args[0].kind === "var" && args[0].symbol === "TLA.Succ"
              ? getNumeral(args[1], 14)
              : undefined;
          if (numeral !== undefined) return String(numeral + 1);
          return `(${print(args[0])}[${print(args[1])}])`;
        }
        const infix = INFIXES[expression.symbol];
        if (infix !== undefined && args.length === 2)
          return `(${print(args[0])}${infix}${print(args[1])})`;
        if (args.length === 0) return expression.symbol;
        return `${PREFIXES[expression.symbol] ?? stripNamespace(expression.symbol)}(${printList(args)})`;
      }
      case "not": {
        const operand = expression.args[0];
        return operand.kind === "app" && operand.symbol === "=" && operand.args.length === 2
          ? `(${print(operand.args[0])}~=${print(operand.args[1])})`
          : `(~${print(operand)})`;
      }
      case "and":
        return `(${print(expression.args[0])}&${print(expression.args[1])})`;
      case "or":
        return `(${print(expression.args[0])}|${print(expression.args[1])})`;
      case "imply":
        return `(${print(expression.args[0])}=>${print(expression.args[1])})`;
      case "equiv":
        return `(${print(expression.args[0])}<=>${print(expression.args[1])})`;
      case "true":
        return "TRUE";
      case "false":
        return "FALSE";
      case "all":
        return printBinder("\\\\A ", expression, ":");
      case "ex":
        return printBinder("\\\\E ", expression, ":");
      case "lam":
        return printBinder("\\<lambda>", expression, ". ");
      case "tau":
        return printBinder("CHOOSE ", expression, ":");
      case "meta":
        throw new TlaZenonError("Zenon: a metavariable in the Isar output");
    }
  };

  const printCaseArms = (env: string[], dict: number, arms: Expr[]): string => {
    const print = (operand: Expr) => printExpr(env, dict, operand);
    if (arms.length === 0) throw new TlaZenonError("Zenon: a CASE without arms");
    if (arms.length === 1) return `OTHER -> ${print(arms[0])}`;
    const head = `${print(arms[0])} -> ${print(arms[1])}`;
    return arms.length === 2 ? head : `${head} [] ${printCaseArms(env, dict, arms.slice(2))}`;
  };

  const expr = (dict: number, expression: Expr) => printExpr([], dict, expression);

  // Zenon's p_apply: the instance of a lambda, through the lambda's abbreviation if it has one.
  const printApply = (dict: number, lambda: Expr, argument: Expr) => {
    const number = getNumber(lambda);
    return isBound(dict, number)
      ? `?z_h${toBase26(number)}(${expr(dict, argument)})`
      : expr(dict, exprs.apply(lambda, argument));
  };

  // Zenon's mk_pat: a pattern variable for a formula that has none yet.
  const makePattern = (dict: number, expression: Expr): [string, number] => {
    if (expression.kind === "var" && !isMetaName(expression.symbol)) return ["_", dict];
    const number = getNumber(expression);
    return isBound(dict, number) ? ["_", dict] : [vname(expression), bind(dict, number)];
  };

  // Zenon's p_is: binds the formula's parts to pattern variables.
  const printIs = (dict: number, formula: Expr): number => {
    const binary = (prefix: string, left: Expr, operator: string, right: Expr, suffix: string) => {
      const first = makePattern(dict, left);
      const second = makePattern(first[1], right);
      write(
        first[0] === "_" && second[0] === "_"
          ? "\n"
          : ` (is "${prefix}${first[0]}${operator}${second[0]}${suffix}")\n`,
      );
      return second[1];
    };
    const unary = (prefix: string, operand: Expr, suffix: string) => {
      const pattern = makePattern(dict, operand);
      write(pattern[0] === "_" ? "\n" : ` (is "${prefix}${pattern[0]}${suffix}")\n`);
      return pattern[1];
    };
    const operand = formula.kind === "not" ? formula.args[0] : undefined;
    switch (formula.kind) {
      case "and":
        return binary("", formula.args[0], "&", formula.args[1], "");
      case "or":
        return binary("", formula.args[0], "|", formula.args[1], "");
      case "imply":
        return binary("", formula.args[0], "=>", formula.args[1], "");
      case "equiv":
        return binary("", formula.args[0], "<=>", formula.args[1], "");
      case "all":
        return unary("\\\\A x : ", toLambda(formula), "(x)");
      case "ex":
        return unary("\\\\E x : ", toLambda(formula), "(x)");
    }
    if (formula.kind === "app" && formula.symbol === "=" && formula.args.length === 2)
      return binary("", formula.args[0], "=", formula.args[1], "");
    if (operand === undefined) return unary("", formula, "");
    switch (operand.kind) {
      case "and":
        return binary("~(", operand.args[0], "&", operand.args[1], ")");
      case "or":
        return binary("~(", operand.args[0], "|", operand.args[1], ")");
      case "imply":
        return binary("~(", operand.args[0], "=>", operand.args[1], ")");
      case "equiv":
        return binary("~(", operand.args[0], "<=>", operand.args[1], ")");
      case "all":
        return unary("~(\\\\A x : ", toLambda(operand), "(x))");
      case "ex":
        return unary("~(\\\\E x : ", toLambda(operand), "(x))");
      case "not":
        return unary("~~", operand.args[0], "");
    }
    if (operand.kind === "app" && operand.symbol === "=" && operand.args.length === 2)
      return binary("", operand.args[0], "~=", operand.args[1], "");
    return unary("~", operand, "");
  };

  const printLet = (dict: number, indent: number, expression: Expr) => {
    const pattern = makePattern(dict, expression);
    if (pattern[0] !== "_") line(indent, `let ${pattern[0]} = "${expr(dict, expression)}"\n`);
    return pattern[1];
  };

  const printSequent = (indent: number, dict: number, formulas: Expr[]) =>
    formulas.reduce((current, formula) => {
      line(indent, `assume ${hname(formula)}:"${expr(current, formula)}"`);
      return printIs(current, formula);
    }, dict);

  // Zenon's p_sub: each branch assumes its formulas and proves FALSE.
  const printBranches = (
    indent: number,
    dict: number,
    branches: Expr[][],
    subproofs: LlProof[],
  ) => {
    if (branches.length !== subproofs.length)
      throw new TlaZenonError("Zenon: a rule whose branches don't match its subproofs");
    branches.forEach((branch, position) => {
      printTree(
        increment(indent),
        printSequent(increment(indent), dict, branch),
        subproofs[position],
      );
      line(indent, position === branches.length - 1 ? "qed\n" : "next\n");
    });
  };

  // A have for each formula of the branch that the subproof uses, then the subproof.
  const printHaves = (
    indent: number,
    dict: number,
    formulas: Expr[],
    subproof: LlProof,
    getJustification: (dict: number, position: number) => string,
  ) => {
    const final = formulas.reduce((current, formula, position) => {
      if (!subproof.conclusions.includes(formula)) return current;
      line(indent, `have ${hname(formula)}: "${expr(current, formula)}"`);
      const next = printIs(current, formula);
      line(indent, getJustification(next, position));
      return next;
    }, dict);
    printTree(indent, final, subproof);
  };

  const printAlpha = (
    indent: number,
    dict: number,
    lemma: string,
    conclusion: Expr,
    formulas: Expr[],
    proof: LlProof,
  ) => {
    const subproof = getSingle(proof);
    const conclusionName = hname(conclusion);
    printHaves(
      indent,
      dict,
      formulas,
      subproof,
      (_, position) => `by (rule zenon_${lemma}_${position} [OF ${conclusionName}])\n`,
    );
  };

  const printBeta = (
    indent: number,
    dict: number,
    lemma: string,
    conclusion: Expr,
    branches: Expr[][],
    proof: LlProof,
  ) => {
    const conclusionName = hname(conclusion);
    line(indent, "show FALSE\n");
    line(indent, `proof (rule zenon_${lemma} [OF ${conclusionName}])\n`);
    printBranches(indent, dict, branches, proof.subproofs);
  };

  // Zenon's p_gamma and p_delta: the instance of a quantified formula.
  const printInstance = (
    indent: number,
    dict: number,
    lemma: string,
    isNegated: boolean,
    quantified: Expr,
    term: Expr,
    conclusion: Expr,
    proof: LlProof,
    isGamma: boolean,
  ) => {
    const subproof = getSingle(proof);
    const lambda = toLambda(quantified);
    const instance = exprs.apply(lambda, term);
    const body = isNegated ? exprs.enot(instance) : instance;
    line(indent, `have ${hname(body)}: "${isNegated ? "~" : ""}${printApply(dict, lambda, term)}"`);
    const next = printIs(dict, body);
    const conclusionName = hname(conclusion);
    const terms = isGamma
      ? `"${expr(next, lambda)}" "${expr(next, term)}"`
      : `"${expr(next, lambda)}"`;
    line(indent, `by (rule zenon_${lemma}_0 [of ${terms}, OF ${conclusionName}])\n`);
    printTree(indent, next, subproof);
  };

  // Zenon's p_sub_equal: proves an argument equal to the other, unless the subproof needn't.
  const printSubEqual = (
    indent: number,
    dict: number,
    left: Expr,
    right: Expr,
    subproof: LlProof,
  ) => {
    const equality = equal(left, right);
    if (left === right || subproof.conclusions.includes(equality)) return dict;
    const negation = exprs.enot(equality);
    line(indent, `have ${hname(equality)}: "${expr(dict, equality)}"`);
    const next = printIs(dict, equality);
    const reversed = equal(right, left);
    if (subproof.conclusions.includes(reversed)) {
      line(indent, `by (rule sym [OF ${hname(reversed)}])\n`);
      return next;
    }
    line(indent, `proof (rule zenon_nnpp [of "${expr(next, equality)}"])\n`);
    printTree(increment(indent), printSequent(increment(indent), next, [negation]), subproof);
    line(indent, "qed\n");
    return next;
  };

  // Zenon's p_subst: rewrites the arguments that differ one at a time.
  const printSubstitution = (
    indent: number,
    dict: number,
    make: (args: Expr[]) => Expr,
    lefts: Expr[],
    rights: Expr[],
    done: Expr[],
    previous: Expr,
  ): void => {
    if (lefts.length !== rights.length)
      throw new TlaZenonError("Zenon: arguments of different lengths");
    if (lefts.length === 0) {
      line(increment(indent), `thus "${expr(dict, previous)}" .\n`);
      line(indent, "qed\n");
      return;
    }
    const left = lefts[0];
    const right = rights[0];
    if (left === right) {
      printSubstitution(
        indent,
        dict,
        make,
        lefts.slice(1),
        rights.slice(1),
        [...done, right],
        previous,
      );
      return;
    }
    const variable = exprs.newVar();
    const context = exprs.elam(variable, "", make([...done, variable, ...lefts.slice(1)]));
    const instance = exprs.apply(context, right);
    line(increment(indent), `have ${hname(instance)}: "${expr(dict, instance)}"`);
    const next = printIs(dict, instance);
    const previousName = hname(previous);
    const equalityName = hname(equal(left, right));
    line(
      increment(indent),
      `by (rule subst [where P="${expr(next, context)}", OF ${equalityName}], fact ${previousName})\n`,
    );
    printSubstitution(
      indent,
      next,
      make,
      lefts.slice(1),
      rights.slice(1),
      [...done, right],
      instance,
    );
  };

  const printArgs = (dict: number, args: Expr[]) =>
    args.map((arg) => `"${expr(dict, arg)}"`).join(" ");
  const printNames = (formulas: Expr[]) => formulas.map(hname).join(" ");

  const printTree = (indent: number, dict: number, proof: LlProof): void => {
    if (getLimitFailure(context.limits) !== undefined) return;
    const rule = proof.rule;
    switch (rule.kind) {
      case "connect": {
        const left = rule.left;
        const right = rule.right;
        switch (rule.connective) {
          case "and":
            return printAlpha(indent, dict, "and", exprs.eand(left, right), [left, right], proof);
          case "or":
            return printBeta(indent, dict, "or", exprs.eor(left, right), [[left], [right]], proof);
          case "imply":
            return printBeta(
              indent,
              dict,
              "imply",
              exprs.eimply(left, right),
              [[exprs.enot(left)], [right]],
              proof,
            );
          case "equiv":
            return printBeta(
              indent,
              dict,
              "equiv",
              exprs.eequiv(left, right),
              [
                [exprs.enot(left), exprs.enot(right)],
                [left, right],
              ],
              proof,
            );
        }
        return;
      }
      case "notconnect": {
        const left = rule.left;
        const right = rule.right;
        switch (rule.connective) {
          case "and":
            return printBeta(
              indent,
              dict,
              "notand",
              exprs.enot(exprs.eand(left, right)),
              [[exprs.enot(left)], [exprs.enot(right)]],
              proof,
            );
          case "or":
            return printAlpha(
              indent,
              dict,
              "notor",
              exprs.enot(exprs.eor(left, right)),
              [exprs.enot(left), exprs.enot(right)],
              proof,
            );
          case "imply":
            return printAlpha(
              indent,
              dict,
              "notimply",
              exprs.enot(exprs.eimply(left, right)),
              [left, exprs.enot(right)],
              proof,
            );
          case "equiv":
            return printBeta(
              indent,
              dict,
              "notequiv",
              exprs.enot(exprs.eequiv(left, right)),
              [
                [exprs.enot(left), right],
                [left, exprs.enot(right)],
              ],
              proof,
            );
        }
        return;
      }
      case "extension":
        return printExtension(indent, dict, proof, rule);
      case "notnot":
        return printAlpha(
          indent,
          dict,
          "notnot",
          exprs.enot(exprs.enot(rule.formula)),
          [rule.formula],
          proof,
        );
      case "ex":
        return printInstance(
          indent,
          dict,
          "ex_choose",
          false,
          rule.quantified,
          rule.term,
          rule.quantified,
          proof,
          false,
        );
      case "notall":
        return printInstance(
          indent,
          dict,
          "notall_choose",
          true,
          rule.quantified,
          rule.term,
          exprs.enot(rule.quantified),
          proof,
          false,
        );
      case "all":
        return printInstance(
          indent,
          dict,
          "all",
          false,
          rule.quantified,
          rule.term,
          rule.quantified,
          proof,
          true,
        );
      case "notex":
        return printInstance(
          indent,
          dict,
          "notex",
          true,
          rule.quantified,
          rule.term,
          exprs.enot(rule.quantified),
          proof,
          true,
        );
      case "lemma": {
        const variables = rule.args.flatMap((arg) => {
          if (arg.kind === "var") return [arg.symbol];
          if (arg.kind === "tau") return [];
          throw new TlaZenonError("Zenon: a lemma argument that is neither a variable nor a tau");
        });
        line(indent, "show FALSE\n");
        line(indent, `by (rule ${rule.name} [`);
        if (variables.length > 0)
          write(`where ${variables.map((variable) => `?${variable}=${variable}`).join(" and ")}, `);
        write(`OF ${printNames(proof.conclusions)}])\n`);
        return;
      }
      case "cut":
        line(indent, "show FALSE\n");
        line(indent, `proof (rule zenon_em [of "${expr(dict, rule.formula)}"])\n`);
        return printBranches(
          indent,
          dict,
          [[rule.formula], [exprs.enot(rule.formula)]],
          proof.subproofs,
        );
      case "axiom": {
        const positiveName = hname(rule.formula);
        const negativeName = hname(exprs.enot(rule.formula));
        line(indent, "show FALSE\n");
        line(indent, `by (rule notE [OF ${negativeName} ${positiveName}])\n`);
        return;
      }
      case "definition": {
        const conclusionName = hname(rule.folded);
        const hypothesisName = hname(rule.unfolded);
        line(
          indent,
          `have ${hypothesisName}_${conclusionName}: "${expr(dict, rule.unfolded)} == ${expr(dict, rule.folded)}"`,
        );
        const hypothesisPattern = makePattern(dict, rule.unfolded);
        const conclusionPattern = makePattern(hypothesisPattern[1], rule.folded);
        write(` (is "${hypothesisPattern[0]} == ${conclusionPattern[0]}")\n`);
        line(indent, `by (unfold ${rule.name})\n`);
        line(indent, `have ${hypothesisName}: "${expr(conclusionPattern[1], rule.unfolded)}"`);
        const next = printIs(conclusionPattern[1], rule.unfolded);
        line(indent, `by (unfold ${hypothesisName}_${conclusionName}, fact ${conclusionName})\n`);
        return printTree(indent, next, getSingle(proof));
      }
      case "notequal": {
        const left = rule.left;
        const right = rule.right;
        if (left.kind !== "app" || right.kind !== "app" || left.symbol !== right.symbol)
          throw new TlaZenonError("Zenon: notequal on different applications");
        const negation = exprs.enot(equal(left, right));
        line(indent, "show FALSE\n");
        line(indent, `proof (rule zenon_noteq [of "${expr(dict, right)}"])\n`);
        const next = printArgumentEqualities(indent, dict, left.args, right.args, proof.subproofs);
        return printSubstitution(
          indent,
          next,
          (args) => exprs.enot(equal(exprs.eapp(left.symbol, args), right)),
          left.args,
          right.args,
          [],
          negation,
        );
      }
      case "pnotp": {
        const positive = rule.positive;
        const negative = rule.negative;
        const negated = negative.kind === "not" ? negative.args[0] : undefined;
        if (
          positive.kind !== "app" ||
          negated?.kind !== "app" ||
          positive.symbol !== negated.symbol
        )
          throw new TlaZenonError("Zenon: pnotp on different applications");
        line(indent, "show FALSE\n");
        line(indent, `proof (rule notE [OF ${hname(negative)}])\n`);
        const next = printArgumentEqualities(
          indent,
          dict,
          positive.args,
          negated.args,
          proof.subproofs,
        );
        return printSubstitution(
          indent,
          next,
          (args) => exprs.eapp(positive.symbol, args),
          positive.args,
          negated.args,
          [],
          positive,
        );
      }
      case "noteq": {
        const name = hname(exprs.enot(equal(rule.term, rule.term)));
        line(indent, "show FALSE\n");
        line(indent, `by (rule zenon_noteq [OF ${name}])\n`);
        return;
      }
      case "eqsym": {
        const equalityName = hname(equal(rule.left, rule.right));
        const negationName = hname(exprs.enot(equal(rule.right, rule.left)));
        line(indent, "show FALSE\n");
        line(indent, `by (rule zenon_eqsym [OF ${equalityName} ${negationName}])\n`);
        return;
      }
      case "nottrue":
        line(indent, "show FALSE\n");
        line(indent, `by (rule zenon_nottrue [OF ${hname(exprs.enot(TRUE))}])\n`);
        return;
      case "false":
        line(indent, "show FALSE\n");
        line(indent, `by (rule ${hname(FALSE)})\n`);
        return;
      case "congruencelr":
      case "congruencerl": {
        const subproof = getSingle(proof);
        const equality =
          rule.kind === "congruencelr"
            ? equal(rule.left, rule.right)
            : equal(rule.right, rule.left);
        const hypothesis = exprs.apply(rule.context, rule.left);
        const conclusion = exprs.apply(rule.context, rule.right);
        line(indent, `have ${hname(conclusion)}: "${expr(dict, conclusion)}"`);
        const next = printIs(dict, conclusion);
        const hypothesisName = hname(hypothesis);
        const equalityName = hname(equality);
        const lemma = rule.kind === "congruencelr" ? "subst" : "ssubst";
        line(
          indent,
          `by (rule ${lemma} [where P="${expr(next, rule.context)}", OF ${equalityName} ${hypothesisName}])\n`,
        );
        return printTree(indent, next, subproof);
      }
    }
  };

  const printArgumentEqualities = (
    indent: number,
    dict: number,
    lefts: Expr[],
    rights: Expr[],
    subproofs: LlProof[],
  ) => {
    if (lefts.length !== rights.length || lefts.length !== subproofs.length)
      throw new TlaZenonError("Zenon: list_fold_left3");
    return lefts.reduce(
      (current, left, position) =>
        printSubEqual(increment(indent), current, left, rights[position], subproofs[position]),
      dict,
    );
  };

  // A hypothesis of a product or record set's rules, and its negation, each in its own branch.
  const printNegatedHaves = (
    indent: number,
    dict: number,
    branches: Expr[][],
    subproofs: LlProof[],
  ) => {
    if (branches.length !== subproofs.length) throw new TlaZenonError("Zenon: List.fold_left2");
    return branches.reduce((current, branch, position) => {
      const negation = branch[0];
      if (branch.length !== 1 || negation.kind !== "not")
        throw new TlaZenonError("Zenon: a branch that isn't one negation");
      const formula = negation.args[0];
      line(indent, `have ${hname(formula)}: "${expr(current, formula)}"`);
      const next = printIs(current, formula);
      line(indent, "proof (rule zenon_nnpp)\n");
      line(indent + 1, `assume ${hname(negation)}: "${expr(next, negation)}"`);
      printTree(indent + 1, printIs(next, negation), subproofs[position]);
      line(indent, "qed\n");
      return next;
    }, dict);
  };

  const getNegatedNames = (branches: Expr[][]) =>
    branches
      .map((branch) => {
        const negation = branch[0];
        if (branch.length !== 1 || negation.kind !== "not")
          throw new TlaZenonError("Zenon: a branch that isn't one negation");
        return `${hname(negation.args[0])} `;
      })
      .join("");

  const printExtension = (
    indent: number,
    dict: number,
    proof: LlProof,
    rule: Extract<LlProof["rule"], { kind: "extension" }>,
  ) => {
    const args = rule.args;
    const conclusions = rule.conclusions;
    const branches = rule.branches;
    const malformed = () => new TlaZenonError(`Zenon: a malformed ${rule.name} rule`);
    switch (rule.name) {
      case "zenon_case": {
        if (args.length !== 1 || conclusions.length !== 1) throw malformed();
        const isOther = getLastBranchIsOther(branches);
        const conclusionName = hname(conclusions[0]);
        line(indent, "show FALSE\n");
        line(
          indent,
          `proof (rule zenon_case${isOther ? "other" : ""}${branches.length - 1} [of "${expr(dict, args[0])}", OF ${conclusionName}])\n`,
        );
        return printBranches(indent, dict, branches, proof.subproofs);
      }
      case "zenon_stringequal": {
        if (args.length !== 2 || conclusions.length !== 1 || branches.length !== 0)
          throw malformed();
        const conclusion = conclusions[0];
        const negation = exprs.enot(conclusion);
        line(indent, `have ${hname(negation)}: "${expr(dict, negation)}"\n`);
        line(indent, "by (simp only: zenon_sa_1 zenon_sa_2,\n");
        line(indent, "    ((rule zenon_sa_diff_2)+)?,\n");
        line(indent, "    (rule zenon_sa_diff_3, auto)?,\n");
        line(indent, "    (rule zenon_sa_diff_1, auto)?,\n");
        line(indent, "    (rule zenon_sa_diff_0a)?, (rule zenon_sa_diff_0b)?)\n");
        line(indent, "show FALSE\n");
        const conclusionName = hname(conclusion);
        line(indent, `by (rule notE [OF ${hname(negation)} ${conclusionName}])\n`);
        return;
      }
      case "zenon_stringdiffll":
      case "zenon_stringdifflr":
      case "zenon_stringdiffrl":
      case "zenon_stringdiffrr": {
        const hypothesis = branches[0]?.[0];
        if (
          args.length !== 4 ||
          conclusions.length !== 2 ||
          branches.length !== 1 ||
          branches[0].length !== 1 ||
          hypothesis === undefined
        )
          throw malformed();
        const subproof = getSingle(proof);
        const difference = exprs.enot(equal(args[1], args[3]));
        line(indent, `have ${hname(difference)}: "${expr(dict, difference)}"\n`);
        line(indent, "by auto\n");
        line(indent, `have ${hname(hypothesis)}: "${expr(dict, hypothesis)}"`);
        const next = printIs(dict, hypothesis);
        const secondName = hname(conclusions[1]);
        const firstName = hname(conclusions[0]);
        line(
          indent,
          `by (rule ${rule.name} [OF ${hname(difference)} ${firstName} ${secondName}])\n`,
        );
        return printTree(increment(indent), next, subproof);
      }
      case "zenon_tuple_eq_match":
      case "zenon_record_eq_match": {
        if (args.length !== 0 || conclusions.length !== 1 || branches.length !== 1)
          throw malformed();
        const conclusion = conclusions[0];
        return printHaves(
          indent,
          dict,
          branches[0],
          getSingle(proof),
          () => `using ${hname(conclusion)} by auto\n`,
        );
      }
      case "zenon_tuple_eq_mismatch":
      case "zenon_record_eq_mismatch":
        if (args.length !== 1 || conclusions.length !== 1 || branches.length !== 0)
          throw malformed();
        line(indent, "show FALSE\n");
        line(indent, `using ${hname(args[0])} by auto\n`);
        return;
      case "zenon_tuple_access":
      case "zenon_tuple_len":
      case "zenon_record_domain": {
        const hypothesis = branches[0]?.[0];
        if (
          args.length !== 3 ||
          conclusions.length !== 1 ||
          branches.length !== 1 ||
          branches[0].length !== 1 ||
          hypothesis === undefined
        )
          throw malformed();
        const subproof = getSingle(proof);
        const equation = equal(args[1], args[2]);
        line(indent, `have ${hname(equation)}: "${expr(dict, equation)}"`);
        const afterEquation = printIs(dict, equation);
        line(indent, "by auto\n");
        line(indent, `have ${hname(hypothesis)}: "${expr(afterEquation, hypothesis)}"`);
        const next = printIs(afterEquation, hypothesis);
        const conclusionName = hname(conclusions[0]);
        const equationName = hname(equation);
        line(
          indent,
          `by (rule subst [where P="${expr(dict, args[0])}", OF ${equationName} ${conclusionName}])\n`,
        );
        return printTree(indent, next, subproof);
      }
      case "zenon_record_access": {
        const hypothesis = branches[0]?.[0];
        const old = args[1];
        if (
          args.length !== 3 ||
          conclusions.length !== 1 ||
          branches.length !== 1 ||
          branches[0].length !== 1 ||
          hypothesis === undefined
        )
          throw malformed();
        const isApplication =
          old.kind === "app" && old.symbol === "TLA.fapply" && old.args.length === 2;
        const record = isApplication ? old.args[0] : undefined;
        const field = isApplication ? old.args[1] : undefined;
        if (record?.kind !== "app" || record.symbol !== "TLA.record" || field === undefined)
          throw malformed();
        const subproof = getSingle(proof);
        const fieldPosition = record.args.indexOf(field);
        if (fieldPosition === -1) throw new TlaZenonError("Zenon: list_indexq");
        const position = Math.floor(fieldPosition / 2) + 1;
        const length = Math.floor(record.args.length / 2);
        const inDomain = exprs.eapp("TLA.in", [field, exprs.eapp("TLA.DOMAIN", [record])]);
        const equation = equal(old, args[2]);
        const both = exprs.eand(inDomain, equation);
        line(indent, `have ${hname(both)}: "${expr(dict, both)}"`);
        const afterBoth = printIs(dict, both);
        line(
          indent,
          position === 1
            ? "by ((rule zenon_recfield_1)+, rule zenon_recfield_2b)\n"
            : `by (${"rule zenon_recfield_1, ".repeat(Math.max(0, length - position))}rule zenon_recfield_2, ((rule zenon_recfield_3)+)?, rule zenon_recfield_3b, auto)\n`,
        );
        line(indent, `have ${hname(equation)}: "${expr(afterBoth, equation)}"`);
        const afterEquation = printIs(afterBoth, equation);
        line(indent, `by (rule conjD2 [OF ${hname(both)}])\n`);
        line(indent, `have ${hname(hypothesis)}: "${expr(afterEquation, hypothesis)}"`);
        const next = printIs(afterEquation, hypothesis);
        const conclusionName = hname(conclusions[0]);
        const equationName = hname(equation);
        line(
          indent,
          `by (rule subst [where P="${expr(next, args[0])}", OF ${equationName} ${conclusionName}])\n`,
        );
        return printTree(indent, next, subproof);
      }
      case "zenon_in_product":
      case "zenon_in_recordset": {
        const hypotheses = branches[0] ?? [];
        if (
          args.length !== 2 ||
          conclusions.length !== 1 ||
          branches.length !== 1 ||
          hypotheses.length < 2
        )
          throw malformed();
        const subproof = getSingle(proof);
        const conclusion = conclusions[0];
        const element = args[0];
        const set = args[1];
        const isProduct = rule.name === "zenon_in_product";
        const afterElement = printLet(dict, indent, element);
        const afterSet = isProduct ? printLet(afterElement, indent, set) : afterElement;
        const printSimple = (formula: Expr) => {
          if (!subproof.conclusions.includes(formula)) return;
          const conclusionName = hname(conclusion);
          line(
            indent,
            `have ${hname(formula)}: "${expr(afterSet, formula)}" using ${conclusionName} by auto\n`,
          );
        };
        printSimple(hypotheses[0]);
        printSimple(hypotheses[1]);
        const one = exprs.eapp("TLA.fapply", [exprs.evar("TLA.Succ"), exprs.evar("0")]);
        const succ = (number: Expr) => exprs.eapp("TLA.fapply", [exprs.evar("TLA.Succ"), number]);
        if (isProduct) {
          const isSequence = exprs.eapp("TLA.isASeq", [set]);
          line(indent, `have ${hname(isSequence)}: "${expr(afterSet, isSequence)}" by auto\n`);
          const final = hypotheses.slice(2).reduce(
            (state: [number, Expr], formula): [number, Expr] => {
              const current = state[0];
              const index = state[1];
              if (!subproof.conclusions.includes(formula)) return [current, succ(index)];
              const inLength = exprs.eapp("TLA.in", [
                index,
                exprs.eapp("arith.natrange", [one, exprs.eapp("TLA.Len", [set])]),
              ]);
              line(indent, `have ${hname(inLength)}: "${expr(current, inLength)}" by auto\n`);
              const component = exprs.eapp("TLA.in", [
                exprs.eapp("TLA.fapply", [element, index]),
                exprs.eapp("TLA.fapply", [set, index]),
              ]);
              line(indent, `have ${hname(component)}: "${expr(current, component)}"`);
              const afterComponent = printIs(current, component);
              const inLengthName = hname(inLength);
              const isSequenceName = hname(isSequence);
              line(
                indent,
                `by (rule zenon_in_product_i [OF ${hname(conclusion)} ${isSequenceName} ${inLengthName}])\n`,
              );
              line(indent, `have ${hname(formula)}: "${expr(afterComponent, formula)}"`);
              const afterFormula = printIs(afterComponent, formula);
              line(indent, `using ${hname(component)} by auto\n`);
              return [afterFormula, succ(index)];
            },
            [afterSet, one],
          );
          return printTree(indent, final[0], subproof);
        }
        if (set.kind !== "app" || set.symbol !== "TLA.recordset") throw malformed();
        const fields = getPairs(set.args);
        const domains = exprs.eapp(
          "TLA.tuple",
          fields.map((pair) => pair[0]),
        );
        const ranges = exprs.eapp(
          "TLA.tuple",
          fields.map((pair) => pair[1]),
        );
        const afterDomains = printLet(afterSet, indent, domains);
        const afterRanges = printLet(afterDomains, indent, ranges);
        const final = hypotheses.slice(2).reduce(
          (state: [number, Expr], formula): [number, Expr] => {
            const current = state[0];
            const index = state[1];
            if (!subproof.conclusions.includes(formula)) return [current, succ(index)];
            const inDomain = exprs.eapp("TLA.in", [index, exprs.eapp("TLA.DOMAIN", [domains])]);
            line(indent, `have ${hname(inDomain)}: "${expr(current, inDomain)}" by auto\n`);
            const component = exprs.eapp("TLA.in", [
              exprs.eapp("TLA.fapply", [element, exprs.eapp("TLA.fapply", [domains, index])]),
              exprs.eapp("TLA.fapply", [ranges, index]),
            ]);
            line(indent, `have ${hname(component)}: "${expr(current, component)}"`);
            const afterComponent = printIs(current, component);
            const inDomainName = hname(inDomain);
            line(
              indent,
              `by (rule zenon_in_recordset_field [OF ${hname(conclusion)} ${inDomainName}])\n`,
            );
            line(indent, `have ${hname(formula)}: "${expr(afterComponent, formula)}"`);
            const afterFormula = printIs(afterComponent, formula);
            line(indent, `using ${hname(component)} by auto\n`);
            return [afterFormula, succ(index)];
          },
          [afterRanges, one],
        );
        return printTree(indent, final[0], subproof);
      }
      case "zenon_notin_product": {
        if (args.length !== 2 || conclusions.length !== 1) throw malformed();
        const final = printNegatedHaves(
          indent,
          printLet(dict, indent, args[0]),
          branches,
          proof.subproofs,
        );
        line(indent, `show FALSE using ${hname(conclusions[0])} `);
        write(getNegatedNames(branches));
        write(`inProductI[where s="${expr(final, args[1])}"] `);
        write("by auto\n");
        return;
      }
      case "zenon_notin_recordset": {
        if (args.length !== 2 || conclusions.length !== 1) throw malformed();
        printNegatedHaves(indent, printLet(dict, indent, args[0]), branches, proof.subproofs);
        line(indent, `show FALSE by (rule notE [OF ${hname(conclusions[0])}],\n`);
        line(indent, `               rule zenon_inrecordsetI${branches.length - 2} [OF `);
        write(getNegatedNames(branches));
        write("])\n");
        return;
      }
      case "zenon_tuple_notisaseq":
      case "zenon_record_notisafcn":
        if (args.length !== 0 || conclusions.length !== 1 || branches.length !== 0)
          throw malformed();
        line(indent, `show FALSE using ${hname(conclusions[0])} by auto\n`);
        return;
      case "zenon_record_neq_match":
        line(indent, "sorry\n");
        return;
      case "zenon_neq_record":
      case "zenon_record_neq":
        if (args.length !== 2 || conclusions.length !== 1 || branches.length < 2) throw malformed();
        line(indent, "sorry\n");
        return;
    }
    if (branches.length === 0) {
      line(indent, "show FALSE\n");
      line(
        indent,
        `by (rule ${rule.name} [of ${printArgs(dict, args)}, OF ${printNames(conclusions)}])\n`,
      );
      return;
    }
    if (branches.length === 1)
      return printHaves(
        indent,
        dict,
        branches[0],
        getSingle(proof),
        (next, position) =>
          `by (rule ${rule.name}_${position} [of ${printArgs(next, args)}, OF ${printNames(conclusions)}])\n`,
      );
    line(indent, "show FALSE\n");
    line(
      indent,
      `proof (rule ${rule.name} [of ${printArgs(dict, args)}, OF ${printNames(conclusions)}])\n`,
    );
    printBranches(indent, dict, branches, proof.subproofs);
  };

  const printLemma = (indent: number, dict: number, lemma: Lemma) => {
    if (getLimitFailure(context.limits) !== undefined) return;
    const params = lemma.params.flatMap((param) => {
      if (param[1].kind === "var") return [param[1].symbol];
      if (param[1].kind === "tau") return [];
      throw new TlaZenonError("Zenon: a lemma parameter that is neither a variable nor a tau");
    });
    const conclusions = lemma.proof.conclusions;
    line(indent, `have ${lemma.name}: "`);
    write(params.map((param) => `!!${param}. `).join(""));
    write(conclusions.map((conclusion) => `${expr(dict, conclusion)} ==> `).join(""));
    write('FALSE"');
    const patterns: string[] = [];
    const afterPatterns = conclusions.reduce((current, conclusion) => {
      const pattern = makePattern(current, conclusion);
      patterns.push(pattern[0]);
      return pattern[1];
    }, dict);
    write(
      patterns.every((pattern) => pattern === "_")
        ? "\n"
        : ` (is "${patterns.map((pattern) => `${pattern} ==> `).join("")}FALSE")\n`,
    );
    line(indent, "proof -\n");
    for (const param of params) line(increment(indent), `fix "${param}"\n`);
    printTree(
      increment(indent),
      printSequent(increment(indent), afterPatterns, conclusions),
      lemma.proof,
    );
    line(indent, "qed\n");
  };

  // Zenon's p_theorem.
  const theorem = lemmas[lemmas.length - 1];
  const hypotheses = context.phrases.flatMap((phrase) => (phrase.kind === "hyp" ? [phrase] : []));
  const negatedGoal =
    hypotheses.find((phrase) => phrase.name === GOAL_NAME)?.formula ?? exprs.enot(FALSE);
  if (negatedGoal.kind !== "not") throw new TlaZenonError("Zenon: a goal that isn't negated");
  const goal = negatedGoal.args[0];
  const assumptions = theorem.proof.conclusions.filter((formula) => formula !== negatedGoal);
  const realNames = new Map<number, string>();
  for (const phrase of hypotheses)
    if (phrase.name !== "") realNames.set(getNumber(phrase.formula), phrase.name);
  write("(* PROOF-FOUND *)\n(* BEGIN-PROOF *)\n");
  line(0, "proof (rule zenon_nnpp)\n");
  const naryRules = new Map<string, string>();
  const collectNaryRules = (tree: LlProof) => {
    const rule = tree.rule;
    if (rule.kind === "extension" && rule.name === "zenon_case") {
      const arity = rule.branches.length - 1;
      const isOther = getLastBranchIsOther(rule.branches);
      if (arity > 5)
        naryRules.set(
          `0 ${String(arity).padStart(9, "0")} ${isOther ? 1 : 0}`,
          printCaseLemma(arity, isOther),
        );
    }
    if (rule.kind === "extension" && rule.name === "zenon_notin_recordset") {
      const arity = rule.branches.length - 2;
      if (arity > 7) naryRules.set(`1 ${String(arity).padStart(9, "0")}`, printRecordLemma(arity));
    }
    tree.subproofs.forEach(collectNaryRules);
  };
  [theorem, ...lemmas.slice(0, -1)].forEach((lemma) => collectNaryRules(lemma.proof));
  for (const key of [...naryRules.keys()].sort()) write(naryRules.get(key) ?? "");
  const indent = increment(0);
  const dict = assumptions.reduce((current, formula) => {
    line(indent, `have ${hname(formula)}:"${expr(current, formula)}"`);
    const next = printIs(current, formula);
    const realName = realNames.get(getNumber(formula));
    line(indent, realName === undefined ? "by fact\n" : `using ${realName} by blast\n`);
    return next;
  }, 0);
  for (const lemma of lemmas.slice(0, -1)) printLemma(indent, dict, lemma);
  printTree(indent, printSequent(indent, dict, [exprs.enot(goal)]), theorem.proof);
  line(0, "qed\n");
  write("(* END-PROOF *)\n");
  return getLimitFailure(context.limits) === undefined ? output.join("") : undefined;
};
