import { type AstManager, OP_ITE, SORT_BOOL } from "./ast";
import { runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";
import { RewriterTpl } from "./rewriter-tpl";

class BlastTermIteRewriter extends RewriterTpl {
  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (manager.funcDecls[decl].op === OP_ITE) return -1;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (manager.sorts[arg] === SORT_BOOL || manager.getOp(arg) !== OP_ITE) continue;
      const thenBranch = manager.getArg(arg, 1);
      const elseBranch = manager.getArg(arg, 2);
      const newArgs = [...args];
      newArgs[index] = thenBranch;
      const thenApp = manager.mkApp(decl, newArgs, sort);
      if (thenBranch === elseBranch) {
        manager.incRef(thenApp);
        return { expr: thenApp, depth: 1 };
      }
      newArgs[index] = elseBranch;
      const elseApp = manager.mkApp(decl, newArgs, sort);
      const result = manager.mkApp(
        OP_ITE,
        [manager.getArg(arg, 0), thenApp, elseApp],
        manager.sorts[thenApp],
      );
      manager.incRef(result);
      return { expr: result, depth: 3 };
    }
    return -1;
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
