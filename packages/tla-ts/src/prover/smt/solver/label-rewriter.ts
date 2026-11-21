import { OP_LABEL } from "./ast";
import { RewriterTpl } from "./rewriter-tpl";

export class LabelRewriter extends RewriterTpl {
  reduceApp(decl: number, args: number[]) {
    if (this.manager.funcDecls[decl].op !== OP_LABEL) return -1;
    this.manager.incRef(args[0]);
    return args[0];
  }
}
