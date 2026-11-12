// Ported from Z3 (src/muz/transforms/dl_mk_elim_term_ite.cpp,
// src/ast/simplifiers/blast_term_ite_simplifier.h), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { type AstManager, KIND_APP, KIND_QUANTIFIER, OP_ITE, SORT_BOOL } from "../ast";
import { flattenAndVector, getNumExprs } from "../ast-util";
import { RefVector } from "../ref-vector";
import { type Rewrite, RewriterTpl } from "../rewriter-tpl";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

class BlastTermIte extends RewriterTpl {
  numFresh = 0;

  constructor(
    manager: AstManager,
    private maxInflation: number,
    private initTermSize: number,
  ) {
    super(manager);
  }

  reduceApp(decl: number, args: number[], sort: number): number | Rewrite {
    const manager = this.manager;
    if (decl === OP_ITE) return -1;
    if (this.initTermSize > 0 && this.maxInflation * this.initTermSize < this.numFresh) return -1;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (manager.sorts[arg] === SORT_BOOL || manager.getOp(arg) !== OP_ITE) continue;
      const thenArgs = [...args];
      thenArgs[index] = manager.getArg(arg, 1);
      const thenApp = manager.mkApp(decl, thenArgs, sort);
      if (manager.getArg(arg, 1) === manager.getArg(arg, 2)) {
        manager.incRef(thenApp);
        return { expr: thenApp, depth: 1 };
      }
      const elseArgs = [...args];
      elseArgs[index] = manager.getArg(arg, 2);
      const result = manager.mkApp(
        OP_ITE,
        [manager.getArg(arg, 0), thenApp, manager.mkApp(decl, elseArgs, sort)],
        sort,
      );
      manager.incRef(result);
      this.numFresh++;
      return { expr: result, depth: 3 };
    }
    return -1;
  }
}

// The result comes with a reference.
export const blastTermIte = (manager: AstManager, fml: number, maxInflation: number) => {
  const blaster = new BlastTermIte(manager, maxInflation, getNumExprs(manager, fml));
  const result = blaster.rewrite(fml);
  blaster.release();
  return result;
};

const hasTermIte = (manager: AstManager, root: number) => {
  const visited = new Set<number>();
  const todo = [root];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
    if (manager.kinds[expr] !== KIND_APP) continue;
    if (manager.getOp(expr) === OP_ITE && manager.sorts[expr] !== SORT_BOOL) return true;
    manager.pushArgs(expr, todo);
  }
  return false;
};

export class MkElimTermIte implements RuleTransformerPlugin {
  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {}

  private elim(rule: Rule, rules: RuleSet) {
    const context = this.context;
    const manager = context.manager;
    const conjs = new RefVector(manager);
    for (const literal of rule.tail.slice(rule.uninterpretedSize)) conjs.push(literal);
    flattenAndVector(manager, conjs);
    const body = manager.mkAnd(conjs.items);
    manager.incRef(body);
    conjs.reset();
    if (!hasTermIte(manager, body)) {
      rules.addRule(rule);
      return false;
    }
    const blasted = blastTermIte(
      manager,
      body,
      context.params.getUint("xform.elim_term_ite.inflation", 3),
    );
    const simplified = context.simplify(blasted);
    if (hasTermIte(manager, simplified))
      throw new SmtUnsupportedError("eliminating the term if-then-else of a Horn rule");
    conjs.push(simplified);
    flattenAndVector(manager, conjs);
    const tail = [
      ...rule.tail.slice(0, rule.uninterpretedSize),
      ...conjs.items.map((conj) => context.ruleManager.ensureApp(conj)),
    ];
    conjs.reset();
    rules.addRule(context.ruleManager.mk(rule.head, tail, [], rule.name, false));
    return true;
  }

  apply(source: RuleSet) {
    if (!this.context.params.getBool("xform.elim_term_ite", false)) return undefined;
    const rules = new RuleSet(this.context);
    rules.inheritPredicates(source);
    let isChanged = false;
    for (const rule of source.rules) if (this.elim(rule, rules)) isChanged = true;
    return isChanged ? rules : undefined;
  }
}
