import { type AstManager, OP_ITE, SORT_BOOL } from "./ast";
import { runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";
import { RewriterTpl } from "./rewriter-tpl";

// blast_term_ite_simplifier::rw_cfg, without the max_inflation and max_steps that no parameter of
// the tactic sets.
class BlastTermIteRewriter extends RewriterTpl {
  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (decl === OP_ITE) return -1;
    const index = args.findIndex(
      (arg) => manager.sorts[arg] !== SORT_BOOL && manager.getOp(arg) === OP_ITE,
    );
    if (index === -1) return -1;
    const [condition, thenBranch, elseBranch] = manager.getArgs(args[index]);
    const thenApp = manager.mkApp(decl, args.with(index, thenBranch), sort);
    if (thenBranch === elseBranch) {
      manager.incRef(thenApp);
      return { expr: thenApp, depth: 1 };
    }
    const elseApp = manager.mkApp(decl, args.with(index, elseBranch), sort);
    const result = manager.mkApp(OP_ITE, [condition, thenApp, elseApp], manager.sorts[thenApp]);
    manager.incRef(result);
    return { expr: result, depth: 3 };
  }
}

export const blastTermIte = (manager: AstManager, goal: Goal) =>
  runSimplifier(goal, false, (state) => {
    const rewriter = new BlastTermIteRewriter(manager);
    return {
      reduce: () => state.rewriteEach((form) => rewriter.rewrite(form)),
      release: () => rewriter.release(),
    };
  });
