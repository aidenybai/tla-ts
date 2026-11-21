import { OP_ITE, SORT_BOOL } from "./ast";
import { RewriterTpl } from "./rewriter-tpl";

export class NgPushAppIteRw extends RewriterTpl {
  isRewritingPatterns() {
    return false;
  }

  private isTarget(decl: number, args: number[]) {
    const manager = this.manager;
    if (manager.funcDecls[decl].op === OP_ITE) return false;
    let hasTermIte = false;
    for (let index = 0; index < args.length; index++)
      if (manager.getOp(args[index]) === OP_ITE && manager.sorts[args[index]] !== SORT_BOOL) {
        if (hasTermIte) return false;
        hasTermIte = true;
      }
    if (!hasTermIte) return false;
    for (let index = 0; index < args.length; index++)
      if (!manager.isGroundApp(args[index])) return true;
    return false;
  }

  reduceApp(decl: number, args: number[], sort: number) {
    const manager = this.manager;
    if (!this.isTarget(decl, args)) return -1;
    let index = 0;
    while (manager.getOp(args[index]) !== OP_ITE) index++;
    const ite = args[index];
    const expr = manager.withTemporaries(() => {
      const thenApp = manager.mkApp(decl, args.with(index, manager.getArg(ite, 1)), sort);
      const elseApp = manager.mkApp(decl, args.with(index, manager.getArg(ite, 2)), sort);
      return manager.mkApp(OP_ITE, [manager.getArg(ite, 0), thenApp, elseApp], sort);
    });
    return { expr, depth: 2 };
  }
}
