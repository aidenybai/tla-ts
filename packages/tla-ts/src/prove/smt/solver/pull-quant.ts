// Ported from Z3 (src/ast/normal_forms/pull_quant.cpp), MIT license, see z3-license.txt. Pulls
// the universal quantifiers nested in a formula in Skolem normal form to the top, so the model
// finder sees one flat quantifier.
import { KIND_QUANTIFIER, OP_AND, OP_NOT, OP_OR, type AstManager, type SmtSymbol } from "./ast";
import { mkNot } from "./ast-util";
import { type Rewrite, RewriterTpl, VarShifter } from "./rewriter-tpl";

// rewriter_tpl with pull_quant's rw_cfg.
export class PullQuant extends RewriterTpl {
  // rw_cfg::m_shift.
  private varShifter: VarShifter;

  constructor(manager: AstManager) {
    super(manager);
    this.varShifter = new VarShifter(manager);
  }

  // pull_quant1_core for an application of not, and or or. The result comes with a reference.
  private pullFromApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (manager.funcDecls[decl].op === OP_NOT) {
      const child = args[0];
      if (manager.kinds[child] !== KIND_QUANTIFIER) return -1;
      const data = manager.getQuantifier(child);
      const result = manager.mkQuantifier({
        ...data,
        isForall: !data.isForall,
        body: mkNot(manager, data.body),
      });
      manager.incRef(result);
      return result;
    }
    let isForall: boolean | undefined;
    // The variables in reverse, the last variable of the first quantifier first. A name that repeats
    // becomes a fresh one.
    const sorts: number[] = [];
    const names: SmtSymbol[] = [];
    let weight = Number.POSITIVE_INFINITY;
    let qid = "";
    for (const child of args) {
      if (manager.kinds[child] !== KIND_QUANTIFIER) continue;
      const data = manager.getQuantifier(child);
      if (isForall === undefined) isForall = data.isForall;
      else if (isForall !== data.isForall) return -1;
      if (sorts.length === 0) qid = data.qid;
      weight = Math.min(weight, data.weight);
      for (let index = data.sorts.length - 1; index >= 0; index--) {
        const name = data.names[index];
        sorts.push(data.sorts[index]);
        names.push(
          names.includes(name)
            ? manager.mkFreshVarName(typeof name === "number" ? null : name)
            : name,
        );
      }
    }
    if (isForall === undefined) return -1;
    const numDecls = sorts.length;
    let shiftAmount = 0;
    // new_adjusted_children, which holds each shifted child.
    const adjusted = args.map((child) => {
      if (manager.kinds[child] !== KIND_QUANTIFIER)
        return this.varShifter.shift(child, 0, numDecls, 0);
      const data = manager.getQuantifier(child);
      const shifted = this.varShifter.shift(
        data.body,
        data.sorts.length,
        numDecls - data.sorts.length,
        shiftAmount,
      );
      shiftAmount += data.sorts.length;
      return shifted;
    });
    const result = manager.mkQuantifier({
      isForall,
      sorts: sorts.reverse(),
      names: names.reverse(),
      body: manager.mkApp(decl, adjusted, sort),
      patterns: [],
      weight,
      qid,
    });
    manager.incRef(result);
    for (const child of adjusted) manager.decRef(child);
    return result;
  }

  reduceApp(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    if (op === OP_NOT && manager.isNot(args[0])) {
      const expr = manager.args[args[0]][0];
      manager.incRef(expr);
      return { expr, depth: 1 };
    }
    if (op !== OP_OR && op !== OP_AND && op !== OP_NOT) return -1;
    return this.pullFromApp(decl, args, sort);
  }

  reduceQuantifier(expr: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (!data.isForall) {
      const result = manager.mkNot(
        manager.mkQuantifier({ ...data, isForall: true, body: mkNot(manager, body) }),
      );
      manager.incRef(result);
      return result;
    }
    if (manager.kinds[body] !== KIND_QUANTIFIER || !manager.getQuantifier(body).isForall) return -1;
    const nested = manager.getQuantifier(body);
    const result = manager.mkQuantifier({
      isForall: true,
      sorts: [...data.sorts, ...nested.sorts],
      names: [...data.names, ...nested.names],
      body: nested.body,
      patterns: [],
      weight: Math.min(data.weight, nested.weight),
      qid: data.qid,
    });
    manager.incRef(result);
    return result;
  }

  // ~rw: the configuration's shifter goes first, then the rewriter.
  release() {
    this.varShifter.release();
    super.release();
  }
}

// pull_quant's operator(), with a pull_quant of its own. The result comes with a reference, which
// the caller releases.
export const pullQuant = (manager: AstManager, expr: number) => {
  const pull = new PullQuant(manager);
  const result = pull.rewrite(expr);
  pull.release();
  return result;
};
