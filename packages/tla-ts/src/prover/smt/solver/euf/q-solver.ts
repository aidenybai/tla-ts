// Ported from Z3 (src/sat/smt/q_solver.h, src/sat/smt/q_solver.cpp), MIT license, see
// z3-license.txt.
import {
  KIND_QUANTIFIER,
  OP_AND,
  OP_EQ,
  OP_IMPLIES,
  OP_OR,
  QUANTIFIER_EXISTS,
  QUANTIFIER_FORALL,
  QUANTIFIER_LAMBDA,
  SORT_BOOL,
} from "../ast";
import { flattenAndVector, flattenOrVector, mkNot } from "../ast-util";
import { DerRewriter } from "../der";
import { simplifyInjAxiom } from "../inj-axiom";
import { L_FALSE, L_TRUE } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { pullQuant } from "../pull-quant";
import { containsDef } from "../recfun-decl-plugin";
import { RefVector } from "../ref-vector";
import { CR_CONTINUE, CR_DONE, CR_GIVEUP } from "../sat/solver";
import { VarSubst } from "../var-subst";
import type { Enode } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { Ematch } from "./q-ematch";
import { Mbqi } from "./q-mbi";
import { ThSolver } from "./th-solver";

// The family id Z3 gives "quant" when the q solver registers it.
export const FAMILY_QUANT = 15;

export class QSolver extends ThSolver {
  private flats = new Map<number, number>();
  readonly universal: number[] = [];
  readonly ematch: Ematch;
  readonly mbqi: Mbqi;
  private expanded: RefVector;
  private der: DerRewriter;

  constructor(ctx: EufSolver) {
    super(ctx, "quant", FAMILY_QUANT);
    this.mbqi = new Mbqi(ctx, this);
    this.ematch = new Ematch(ctx, this);
    this.expanded = new RefVector(ctx.manager);
    this.der = new DerRewriter(ctx.manager);
  }

  private isQuantifier(expr: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_QUANTIFIER &&
      manager.getQuantifier(expr).kind !== QUANTIFIER_LAMBDA
    );
  }

  private isForall(expr: number) {
    const manager = this.manager;
    return (
      manager.kinds[expr] === KIND_QUANTIFIER &&
      manager.getQuantifier(expr).kind === QUANTIFIER_FORALL
    );
  }

  asserted(lit: number) {
    const ctx = this.ctx;
    const manager = this.manager;
    const expr = this.boolVar2expr(lit >> 1) as number;
    if (!this.isQuantifier(expr)) return;
    const isSign = (lit & 1) === 1;
    if (isSign === this.isForall(expr)) {
      this.addClause([lit ^ 1, this.skolemize(expr)]);
      return;
    }
    let flat = this.flats.get(expr);
    if (flat === undefined) {
      if (this.expand(expr)) {
        for (const expanded of this.expanded.items)
          this.addClause([lit ^ 1, ctx.internalize(expanded, isSign, false)]);
        return;
      }
      flat = this.flatten(expr);
    }
    const body = manager.getQuantifier(flat).body;
    if (manager.isGroundApp(body)) {
      this.addClause([lit ^ 1, ctx.internalize(body, isSign, false)]);
      return;
    }
    this.universal.push(lit);
    ctx.trail.push(() => this.universal.pop());
    this.ematch.add(expr);
  }

  check() {
    if (this.ematch.run()) return CR_CONTINUE;
    const result = this.mbqi.run();
    if (result === L_TRUE) return CR_DONE;
    if (result === L_FALSE) return CR_CONTINUE;
    return CR_GIVEUP;
  }

  unitPropagate() {
    return this.ematch.unitPropagate();
  }

  mkVar(node: Enode) {
    const thVar = super.mkVar(node);
    this.ctx.egraph.addThVar(node, thVar, this.id);
    return thVar;
  }

  // instantiate: the literal of the body of q, or of its negation, with each bound variable
  // replaced by mkVar.
  private instantiate(
    quantifier: number,
    isNegated: boolean,
    mkVar: (flat: number, index: number) => number,
  ) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const q = isNegated
      ? manager.withTemporaries(() =>
          manager.mkQuantifier({
            ...data,
            kind: data.kind === QUANTIFIER_FORALL ? QUANTIFIER_EXISTS : QUANTIFIER_FORALL,
            body: manager.mkNot(data.body),
          }),
        )
      : quantifier;
    const flat = this.flatten(q);
    const flatData = manager.getQuantifier(flat);
    const vars = flatData.sorts.map((_sort, index) => mkVar(flat, index));
    const subst = new VarSubst(manager, true);
    const substituted = subst.apply(flatData.body, vars);
    subst.release();
    const body = this.rewrite(substituted);
    manager.decRef(substituted);
    const lit = this.mkLiteral(body);
    manager.decRef(body);
    if (isNegated) manager.decRef(q);
    return lit;
  }

  private skolemize(quantifier: number) {
    const manager = this.manager;
    return this.instantiate(quantifier, this.isForall(quantifier), (flat, index) => {
      const data = manager.getQuantifier(flat);
      return manager.mkFreshConst(data.names[index], data.sorts[index]);
    });
  }

  initSearch() {
    this.mbqi.initSearch();
  }

  internalize(expr: number, isSign: boolean) {
    const ctx = this.ctx;
    const lit = ctx.attachLit(2 * ctx.si.addBoolVar(expr), expr);
    this.mkVar(ctx.egraph.find(expr) as Enode);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.internalize(expr, false);
  }

  finalizeModel(model: ProtoModel) {
    this.mbqi.finalizeModel(model);
  }

  getAntecedents(_lit: number, data: unknown, antecedents: number[]) {
    this.ematch.getAntecedents(data, antecedents);
  }

  // flatten: q with its nested quantifiers pulled out, or its injectivity axiom refined.
  flatten(quantifier: number) {
    const manager = this.manager;
    const existing = this.flats.get(quantifier);
    if (existing !== undefined) return existing;
    const data = manager.getQuantifier(quantifier);
    const flat = (() => {
      if (!manager.hasQuantifierFlags[data.body]) return simplifyInjAxiom(manager, quantifier);
      if (data.kind === QUANTIFIER_FORALL) return pullQuant(manager, quantifier);
      return undefined;
    })();
    if (flat === undefined && !manager.hasQuantifierFlags[data.body]) return quantifier;
    const result = flat ?? quantifier;
    if (flat === undefined) manager.incRef(result);
    manager.incRef(quantifier);
    this.flats.set(quantifier, result);
    this.ctx.trail.push(() => {
      this.flats.delete(quantifier);
      manager.decRef(result);
      manager.decRef(quantifier);
    });
    return result;
  }

  // expand: whether rewriting q gives formulas to assert in place of q, left in this.expanded.
  // smt.q.lite is off by default, so qe-lite does not run.
  private expand(quantifier: number) {
    const manager = this.manager;
    const expanded = this.expanded;
    const simplified = this.rewrite(quantifier);
    let rewritten = this.der.rewrite(simplified);
    manager.decRef(simplified);
    expanded.reset();
    const isUpdated = quantifier !== rewritten;
    let q = quantifier;
    const finish = (result: boolean) => {
      manager.decRef(rewritten);
      return result;
    };
    if (isUpdated) {
      const again = this.rewrite(rewritten);
      manager.decRef(rewritten);
      rewritten = again;
      if (
        manager.kinds[rewritten] !== KIND_QUANTIFIER ||
        this.isForall(q) !== this.isForall(rewritten)
      ) {
        expanded.push(rewritten);
        return finish(true);
      }
      if (rewritten === q) return finish(false);
      q = rewritten;
    }
    const body = manager.getQuantifier(q).body;
    expanded.push(body);
    if (this.isForall(q)) flattenAndVector(manager, expanded);
    else flattenOrVector(manager, expanded);
    if (expanded.size === 1 && this.isForall(q) && !containsDef(manager, body)) {
      expanded.reset();
      expanded.push(body);
      flattenOrVector(manager, expanded);
      let first = -1;
      let second = -1;
      let splitIndex = 0;
      for (let index = expanded.size; index-- > 0;) {
        const split = this.split(expanded.items[index]);
        if (split === null) continue;
        if (first !== -1) {
          for (const part of split) manager.decRef(part);
          manager.decRef(first);
          manager.decRef(second);
          return finish(false);
        }
        first = split[0];
        second = split[1];
        splitIndex = index;
      }
      if (first === -1 && isUpdated) {
        expanded.reset();
        expanded.push(rewritten);
        return finish(true);
      }
      if (first === -1) return finish(false);
      expanded.set(splitIndex, first);
      manager.decRef(first);
      const firstOr = manager.mkOr([...expanded.items]);
      manager.incRef(firstOr);
      expanded.set(splitIndex, second);
      manager.decRef(second);
      const secondOr = manager.mkOr([...expanded.items]);
      manager.incRef(secondOr);
      expanded.reset();
      expanded.pushOwned(firstOr);
      expanded.pushOwned(secondOr);
    }
    if (expanded.size > 1) {
      const data = manager.getQuantifier(q);
      for (let index = expanded.size; index-- > 0;) {
        const updated = manager.withTemporaries(() =>
          manager.mkQuantifier({ ...data, body: expanded.items[index] }),
        );
        expanded.setOwned(index, this.rewrite(updated));
        manager.decRef(updated);
      }
      return finish(true);
    }
    if (expanded.size === 1 && isUpdated) {
      expanded.set(0, rewritten);
      this.flatten(rewritten);
      return finish(true);
    }
    return finish(false);
  }

  // split: the two halves of a disjunct over literals, owned by the caller.
  private split(arg: number): [number, number] | null {
    const manager = this.manager;
    const isNot = manager.isNot(arg);
    const inner = isNot ? manager.getArg(arg, 0) : -1;
    const isBinary = (expr: number, op: number) =>
      manager.getOp(expr) === op && manager.getNumArgs(expr) === 2;
    const isIff = (expr: number) =>
      isBinary(expr, OP_EQ) && manager.isBool(manager.getArg(expr, 0));
    const own = (expr: number) => {
      manager.incRef(expr);
      return expr;
    };
    if (
      isNot &&
      isBinary(inner, OP_OR) &&
      this.isLiteral(manager.getArg(inner, 0)) &&
      this.isLiteral(manager.getArg(inner, 1))
    )
      return [
        own(mkNot(manager, manager.getArg(inner, 0))),
        own(mkNot(manager, manager.getArg(inner, 1))),
      ];
    if (
      isIff(arg) &&
      this.isLiteral(manager.getArg(arg, 0)) &&
      this.isLiteral(manager.getArg(arg, 1))
    ) {
      const lhs = manager.getArg(arg, 0);
      const rhs = manager.getArg(arg, 1);
      return [
        own(manager.mkApp(OP_IMPLIES, [lhs, rhs], SORT_BOOL)),
        own(manager.mkApp(OP_IMPLIES, [rhs, lhs], SORT_BOOL)),
      ];
    }
    if (
      isBinary(arg, OP_AND) &&
      this.isLiteral(manager.getArg(arg, 0)) &&
      this.isLiteral(manager.getArg(arg, 1))
    )
      return [own(manager.getArg(arg, 0)), own(manager.getArg(arg, 1))];
    if (
      isNot &&
      isIff(inner) &&
      this.isLiteral(manager.getArg(inner, 0)) &&
      this.isLiteral(manager.getArg(inner, 1))
    ) {
      const lhs = manager.getArg(inner, 0);
      const rhs = manager.getArg(inner, 1);
      const notLhs = mkNot(manager, lhs);
      manager.incRef(notLhs);
      const result: [number, number] = [
        own(manager.mkOr([lhs, rhs])),
        own(manager.mkOr([notLhs, mkNot(manager, rhs)])),
      ];
      manager.decRef(notLhs);
      return result;
    }
    return null;
  }

  private isLiteral(input: number) {
    const manager = this.manager;
    const arg = manager.isNot(input) ? manager.getArg(input, 0) : input;
    const op = manager.getOp(arg);
    return (
      op !== OP_AND &&
      op !== OP_OR &&
      !(op === OP_EQ && manager.isBool(manager.getArg(arg, 0))) &&
      op !== OP_IMPLIES
    );
  }
}
