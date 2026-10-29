// Ported from Z3 (src/smt/smt_model_finder.cpp, src/ast/macros/quantifier_macro_info.cpp), MIT
// license, see z3-license.txt. The quantifier analyzer of the model finder, which collects how the
// variables of each quantifier occur, and the quantifier info where it records what it learns.
import {
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_NOT,
  OP_OR,
  OP_SUB,
  OP_XOR,
  FAMILY_BASIC,
  FAMILY_USER,
  SORT_INT,
  type AstManager,
} from "./ast";
import type { Context } from "./context";
import { collectMacroCandidates } from "./model-macro-solver";
import { pullQuant } from "./pull-quant";
import { Rewriter } from "./rewriter";
import { AufSolver, type Evaluate, InstantiationSet, Node } from "./auf-solver";

// smt_params' mbqi_force_template: macros of quantifiers with at least this weight are used even
// in the AUF fragment.
export const MBQI_FORCE_TEMPLATE = 10;

// qinfo: a bit of information about how a variable occurs in a quantifier.
type QInfo =
  | { kind: "f_var"; decl: number; argIndex: number; varIndex: number }
  | { kind: "f_var_plus_offset"; decl: number; argIndex: number; varIndex: number; offset: number }
  | { kind: "x_eq_y" | "x_neq_y" | "x_leq_y"; first: number; second: number }
  | { kind: "x_eq_t" | "x_neq_t" | "x_gle_t"; varIndex: number; term: number };

const isSameQInfo = (first: QInfo, second: QInfo) =>
  JSON.stringify(first) === JSON.stringify(second);

const mkVarPair = (kind: "x_eq_y" | "x_neq_y" | "x_leq_y", first: number, second: number): QInfo =>
  first > second ? { kind, first: second, second: first } : { kind, first, second };

// quantifier_info: what the analyzer learned about one quantifier.
export class QuantifierInfo {
  readonly flatQ: number;
  qinfos: QInfo[] = [];
  isAuf = true;
  hasXEqY = false;
  readonly ngDecls = new Set<number>();
  theOne: number | null = null;
  private uvarInstSets: (InstantiationSet | null)[] | null = null;
  readonly condMacros;

  constructor(
    private manager: AstManager,
    private context: Context,
    readonly quantifier: number,
  ) {
    this.flatQ = manager.hasQuantifierFlags[manager.getQuantifier(quantifier).body]
      ? pullQuant(manager, quantifier)
      : quantifier;
    this.condMacros = collectMacroCandidates(manager, this.flatQ);
  }

  insertQInfo(info: QInfo) {
    if (!this.qinfos.some((other) => isSameQInfo(other, info))) this.qinfos.push(info);
  }

  processAuf(solver: AufSolver) {
    const flatQ = this.flatQ;
    const numDecls = this.manager.getQuantifier(flatQ).sorts.length;
    for (let index = 0; index < numDecls; index++) solver.getUvar(flatQ, index);
    for (const info of this.qinfos) {
      switch (info.kind) {
        case "f_var":
          solver.getAFI(info.decl, info.argIndex).merge(solver.getUvar(flatQ, info.varIndex));
          break;
        case "f_var_plus_offset":
          solver.getAFI(info.decl, info.argIndex);
          solver.getUvar(flatQ, info.varIndex);
          break;
        case "x_eq_y": {
          const first = solver.getUvar(flatQ, info.first);
          const second = solver.getUvar(flatQ, info.second);
          first.insertAvoid(second);
          if (first !== second) second.insertAvoid(first);
          break;
        }
        case "x_neq_y":
          solver.getUvar(flatQ, info.first).merge(solver.getUvar(flatQ, info.second));
          break;
        case "x_leq_y": {
          const first = solver.getUvar(flatQ, info.first);
          first.merge(solver.getUvar(flatQ, info.second));
          first.setMonoProj();
          break;
        }
        case "x_eq_t":
          solver.getUvar(flatQ, info.varIndex).insertException(info.term);
          break;
        case "x_neq_t":
          solver.getUvar(flatQ, info.varIndex);
          break;
        case "x_gle_t":
          solver.getUvar(flatQ, info.varIndex).setMonoProj();
          break;
      }
    }
  }

  private populateFVar(node: Node, decl: number, argIndex: number) {
    const context = this.context;
    for (const enode of context.enodesOf(decl))
      if (context.isRelevant(enode.owner)) {
        const arg = enode.args[argIndex];
        node.insert(this.manager, arg.owner, arg.generation);
      }
  }

  populateInstSets(solver: AufSolver) {
    const manager = this.manager;
    const context = this.context;
    const flatQ = this.flatQ;
    const sorts = manager.getQuantifier(flatQ).sorts;
    for (const info of this.qinfos) {
      switch (info.kind) {
        case "f_var":
          this.populateFVar(solver.getAFI(info.decl, info.argIndex), info.decl, info.argIndex);
          break;
        case "f_var_plus_offset": {
          const aFI = solver.getAFI(info.decl, info.argIndex).getRoot();
          const sJ = solver.getUvar(flatQ, info.varIndex).getRoot();
          if (aFI === sJ) {
            // There is no finite fixpoint, so the arguments minus the offset join the set.
            for (const enode of context.enodesOf(info.decl))
              if (context.isRelevant(enode.owner)) {
                const arg = enode.args[info.argIndex];
                sJ.insert(
                  manager,
                  solver.rewriter.mkAppCore(OP_SUB, [arg.owner, info.offset], SORT_INT),
                  arg.generation,
                );
              }
          } else {
            this.populateFVar(aFI, info.decl, info.argIndex);
            if (aFI.isMonoProj()) sJ.setMonoProj();
            if (sJ.isMonoProj()) aFI.setMonoProj();
          }
          break;
        }
        case "x_eq_t": {
          const sort = sorts[sorts.length - info.varIndex - 1];
          if (manager.isUninterpretedSort(sort)) {
            // Every term of the sort joins the set, see Section 4.1 of the paper.
            const node = solver.getUvar(flatQ, info.varIndex);
            for (const enode of context.enodes)
              if (context.isRelevant(enode.owner) && manager.sorts[enode.owner] === sort)
                node.insert(manager, enode.owner, enode.generation);
          }
          break;
        }
        case "x_neq_t":
        case "x_gle_t":
          solver.getUvar(flatQ, info.varIndex).insert(manager, info.term, 0);
          break;
        default:
          break;
      }
    }
    // The second pass for the offsets: A_f_i - k is in S_j and S_j + k is in A_f_i.
    for (const info of this.qinfos) {
      if (info.kind !== "f_var_plus_offset") continue;
      const aFI = solver.getAFI(info.decl, info.argIndex).getRoot();
      const sJ = solver.getUvar(flatQ, info.varIndex).getRoot();
      if (aFI === sJ) continue;
      this.copyInstances(solver.rewriter, aFI, sJ, info.offset, false);
      this.copyInstances(solver.rewriter, sJ, aFI, info.offset, true);
    }
  }

  private copyInstances(rewriter: Rewriter, from: Node, to: Node, offset: number, isPlus: boolean) {
    for (const entry of from.getInstantiationSet().elems)
      to.insert(
        this.manager,
        rewriter.mkAppCore(isPlus ? OP_ADD : OP_SUB, [entry[0], offset], SORT_INT),
        entry[1],
      );
  }

  // populate_macro_based_inst_sets: the sets of a quantifier that a macro satisfies.
  getMacroBasedInstSet(varIndex: number, evaluate: Evaluate) {
    const theOne = this.theOne;
    if (theOne === null) return null;
    if (this.uvarInstSets === null) {
      const sets: (InstantiationSet | null)[] = [];
      for (const info of this.qinfos) {
        if (info.kind !== "f_var" || info.decl !== theOne) continue;
        const set = sets[info.varIndex] ?? new InstantiationSet(this.manager);
        sets[info.varIndex] = set;
        for (const enode of this.context.enodesOf(info.decl))
          if (this.context.isRelevant(enode.owner)) {
            const arg = enode.args[info.argIndex];
            set.insert(arg.owner, arg.generation);
          }
      }
      for (const set of sets) set?.mkInverse(evaluate);
      this.uvarInstSets = sets;
    }
    return this.uvarInstSets[varIndex] ?? null;
  }

  resetTheOne() {
    this.theOne = null;
    this.uvarInstSets = null;
  }
}

type Polarity = "pos" | "neg";

// quantifier_analyzer.
// One analyzer runs per quantifier and records what it learns in the quantifier's info.
export class QuantifierAnalyzer {
  private posCache = new Set<number>();
  private negCache = new Set<number>();
  private ftodo: [number, Polarity][] = [];
  private ttodo: number[] = [];

  constructor(
    private manager: AstManager,
    private rewriter: Rewriter,
    private info: QuantifierInfo,
  ) {}

  private isGround(expr: number) {
    return this.manager.isGround(expr);
  }

  private isVar(expr: number) {
    return this.manager.kinds[expr] === KIND_VAR;
  }

  // poly_rewriter::is_var_plus_ground.
  private isVarPlusGround(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD || this.isGround(expr)) return undefined;
    const args: number[] = [];
    let variable: number | undefined;
    let isInverted = false;
    let current = expr;
    for (let isStopped = false; !isStopped;) {
      let arg: number;
      if (manager.getOp(current) === OP_ADD) {
        arg = manager.args[current][0];
        current = manager.args[current][1];
      } else {
        arg = current;
        isStopped = true;
      }
      const negated = this.manager.getTimesMinusOneArg(arg);
      if (this.isGround(arg)) args.push(arg);
      else if (this.isVar(arg)) {
        if (variable !== undefined) return undefined;
        variable = arg;
      } else if (negated !== undefined && this.isVar(negated)) {
        if (variable !== undefined) return undefined;
        variable = negated;
        isInverted = true;
      } else return undefined;
    }
    if (variable === undefined) return undefined;
    const term = args.length === 1 ? args[0] : this.rewriter.mkAppCore(OP_ADD, args, SORT_INT);
    return { variable, term, isInverted };
  }

  private mkSub(first: number, second: number) {
    return this.rewriter.mkAppCore(OP_SUB, [first, second], SORT_INT);
  }

  private mkAdd(first: number, second: number) {
    return this.rewriter.mkAppCore(OP_ADD, [first, second], SORT_INT);
  }

  private isVarAndGround(lhs: number, rhs: number) {
    if (this.isVar(lhs) && this.isGround(rhs))
      return { variable: lhs, term: rhs, isInverted: false };
    if (this.isVar(rhs) && this.isGround(lhs))
      return { variable: rhs, term: lhs, isInverted: false };
    const left = this.isVarPlusGround(lhs);
    if (left !== undefined && this.isGround(rhs))
      return {
        variable: left.variable,
        term: left.isInverted ? this.mkSub(left.term, rhs) : this.mkSub(rhs, left.term),
        isInverted: left.isInverted,
      };
    const right = this.isVarPlusGround(rhs);
    if (right !== undefined && this.isGround(lhs))
      return {
        variable: right.variable,
        term: right.isInverted ? this.mkSub(right.term, lhs) : this.mkSub(lhs, right.term),
        isInverted: right.isInverted,
      };
    return undefined;
  }

  private isVarMinusVar(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD) return undefined;
    let first = manager.args[expr][0];
    let second = manager.args[expr][1];
    if (!this.isVar(first)) [first, second] = [second, first];
    if (!this.isVar(first)) return undefined;
    const negated = this.manager.getTimesMinusOneArg(second);
    if (negated === undefined || !this.isVar(negated)) return undefined;
    return [first, negated];
  }

  private isZero(expr: number) {
    return this.manager.isNumeral(expr) && this.manager.values[expr] === 0;
  }

  private isVarAndVar(lhs: number, rhs: number) {
    if (this.isVar(lhs) && this.isVar(rhs)) return [lhs, rhs];
    const left = this.isVarMinusVar(lhs);
    if (left !== undefined && this.isZero(rhs)) return left;
    const right = this.isVarMinusVar(rhs);
    if (right !== undefined && this.isZero(lhs)) return right;
    return undefined;
  }

  private isLeGe(expr: number) {
    const op = this.manager.getOp(expr);
    return op === OP_LE || op === OP_GE;
  }

  private isXGleTAtom(atom: number, isNegated: boolean) {
    const manager = this.manager;
    if (manager.kinds[atom] !== KIND_APP || !this.isLeGe(atom)) return undefined;
    const args = manager.args[atom];
    const found = this.isVarAndGround(args[0], args[1]);
    if (found === undefined) return undefined;
    if (isNegated) return { variable: found.variable, term: found.term };
    const isLe = (manager.getOp(atom) === OP_LE) !== found.isInverted;
    const one = manager.mkNumeral(1);
    return {
      variable: found.variable,
      term: isLe ? this.mkAdd(found.term, one) : this.mkSub(found.term, one),
    };
  }

  private visitFormula(expr: number, polarity: Polarity) {
    if (this.isGround(expr)) return;
    const cache = polarity === "pos" ? this.posCache : this.negCache;
    if (cache.has(expr)) return;
    this.ftodo.push([expr, polarity]);
    cache.add(expr);
  }

  private visitTerm(expr: number) {
    if (this.isGround(expr) || this.posCache.has(expr)) return;
    this.ttodo.push(expr);
    this.posCache.add(expr);
  }

  private processUApp(expr: number) {
    const manager = this.manager;
    const info = this.info;
    const decl = manager.decls[expr];
    manager.args[expr].forEach((arg, index) => {
      if (this.isVar(arg)) {
        info.insertQInfo({ kind: "f_var", decl, argIndex: index, varIndex: manager.values[arg] });
        return;
      }
      const found = this.isVarPlusGround(arg);
      if (found !== undefined && !found.isInverted) {
        info.insertQInfo({
          kind: "f_var_plus_offset",
          decl,
          argIndex: index,
          varIndex: manager.values[found.variable],
          offset: found.term,
        });
        return;
      }
      this.visitTerm(arg);
    });
  }

  private processApp(expr: number) {
    const manager = this.manager;
    const decl = manager.decls[expr];
    if (manager.funcDecls[decl].family !== FAMILY_BASIC) this.info.ngDecls.add(decl);
    if (manager.funcDecls[decl].family === FAMILY_USER) this.processUApp(expr);
    else for (const arg of manager.args[expr]) this.visitTerm(arg);
  }

  private processTermsOnStack() {
    const manager = this.manager;
    for (let current = this.ttodo.pop(); current !== undefined; current = this.ttodo.pop()) {
      if (manager.isBool(current)) {
        this.visitFormula(current, "pos");
        this.visitFormula(current, "neg");
        continue;
      }
      if (manager.kinds[current] === KIND_APP) this.processApp(current);
      else if (this.isVar(current)) this.info.isAuf = false;
    }
  }

  private processLiteral(atom: number, isNegated: boolean) {
    const manager = this.manager;
    const info = this.info;
    if (this.isVar(atom)) {
      info.insertQInfo({
        kind: "x_neq_t",
        varIndex: manager.values[atom],
        term: isNegated ? manager.trueExpr : manager.falseExpr,
      });
      return;
    }
    if (manager.kinds[atom] !== KIND_APP) return;
    const args = manager.args[atom];
    const isEq = manager.getOp(atom) === OP_EQ;
    const xEqT = isEq ? this.isVarAndGround(args[0], args[1]) : undefined;
    if (xEqT !== undefined) {
      info.insertQInfo({
        kind: isNegated ? "x_neq_t" : "x_eq_t",
        varIndex: manager.values[xEqT.variable],
        term: xEqT.term,
      });
      return;
    }
    const xEqY = isEq ? this.isVarAndVar(args[0], args[1]) : undefined;
    if (xEqY !== undefined) {
      if (isNegated)
        info.insertQInfo(mkVarPair("x_neq_y", manager.values[xEqY[0]], manager.values[xEqY[1]]));
      else {
        info.hasXEqY = true;
        info.insertQInfo(mkVarPair("x_eq_y", manager.values[xEqY[0]], manager.values[xEqY[1]]));
      }
      return;
    }
    const xLeY = isNegated && this.isLeGe(atom) ? this.isVarAndVar(args[0], args[1]) : undefined;
    if (xLeY !== undefined) {
      info.insertQInfo(mkVarPair("x_leq_y", manager.values[xLeY[0]], manager.values[xLeY[1]]));
      return;
    }
    const xGleT = this.isXGleTAtom(atom, isNegated);
    if (xGleT !== undefined) {
      info.insertQInfo({
        kind: "x_gle_t",
        varIndex: manager.values[xGleT.variable],
        term: xGleT.term,
      });
      return;
    }
    this.processApp(atom);
  }

  private processFormulasOnStack() {
    const manager = this.manager;
    for (let entry = this.ftodo.pop(); entry !== undefined; entry = this.ftodo.pop()) {
      const current = entry[0];
      const polarity = entry[1];
      const negated: Polarity = polarity === "pos" ? "neg" : "pos";
      if (manager.kinds[current] === KIND_VAR) {
        this.processLiteral(current, polarity === "neg");
        continue;
      }
      if (manager.kinds[current] !== KIND_APP) continue;
      const args = manager.args[current];
      if (manager.getFamily(current) !== FAMILY_BASIC || !manager.isBool(current)) {
        this.processLiteral(current, polarity === "neg");
        continue;
      }
      switch (manager.getOp(current)) {
        case OP_IMPLIES:
          this.processLiteral(args[0], negated === "neg");
          this.processLiteral(args[1], polarity === "neg");
          break;
        case OP_XOR:
          for (const arg of args) {
            this.visitFormula(arg, polarity);
            this.visitFormula(arg, negated);
          }
          break;
        case OP_OR:
        case OP_AND:
          for (const arg of args) this.visitFormula(arg, polarity);
          break;
        case OP_NOT:
          this.visitFormula(args[0], negated);
          break;
        case OP_ITE:
          this.visitFormula(args[0], polarity);
          this.visitFormula(args[0], negated);
          this.visitFormula(args[1], polarity);
          this.visitFormula(args[2], polarity);
          break;
        case OP_EQ:
          if (manager.isBool(args[0]))
            for (const arg of args) {
              this.visitFormula(arg, "pos");
              this.visitFormula(arg, "neg");
            }
          else this.processLiteral(current, polarity === "neg");
          break;
        default:
          this.processLiteral(current, polarity === "neg");
      }
    }
  }

  // is_clause: a disjunction of literals.
  private isLiteral(expr: number) {
    const manager = this.manager;
    const atom = manager.isNot(expr) ? manager.args[expr][0] : expr;
    if (manager.kinds[atom] !== KIND_APP) return manager.kinds[atom] === KIND_VAR;
    if (manager.getFamily(atom) !== FAMILY_BASIC) return true;
    const op = manager.getOp(atom);
    if (op === OP_EQ) return !manager.isBool(manager.args[atom][0]);
    return manager.args[atom].length === 0;
  }

  analyze() {
    const manager = this.manager;
    const body = manager.getQuantifier(this.info.flatQ).body;
    const literals = manager.getOp(body) === OP_OR ? manager.args[body] : [body];
    if (literals.every((literal) => this.isLiteral(literal))) {
      for (const literal of literals) {
        const isNegated = manager.isNot(literal);
        const atom = isNegated ? manager.args[literal][0] : literal;
        if (!this.isGround(atom)) this.processLiteral(atom, isNegated);
      }
    } else this.visitFormula(body, "pos");
    while (this.ftodo.length > 0 || this.ttodo.length > 0) {
      this.processFormulasOnStack();
      this.processTermsOnStack();
    }
  }
}
