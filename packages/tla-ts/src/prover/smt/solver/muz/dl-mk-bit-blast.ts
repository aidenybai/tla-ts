// Ported from Z3 (src/muz/transforms/dl_mk_bit_blast.cpp), MIT license, see z3-license.txt.
import { type AstManager, FAMILY_USER, getSymbolName, OP_MKBV, SORT_BOOL } from "../ast";
import { BitBlasterRewriter } from "../bit-blast-tactic";
import { type Rewrite, RewriterTpl } from "../rewriter-tpl";
import type { DatalogContext } from "./dl-context";
import { MkInterpTailSimplifier } from "./dl-mk-interp-tail-simplifier";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

class ExpandMkbv extends RewriterTpl {
  source: RuleSet | undefined;
  target: RuleSet | undefined;
  private pred2blast = new Map<number, number>();

  constructor(
    manager: AstManager,
    private context: DatalogContext,
  ) {
    super(manager);
  }

  reduceApp(decl: number, args: number[], _sort: number): number | Rewrite {
    const manager = this.manager;
    const source = this.source as RuleSet;
    const target = this.target as RuleSet;
    if (args.length === 0) {
      if (source.isOutputPredicate(decl)) target.setOutputPredicate(decl);
      return -1;
    }
    if (!args.every((arg) => manager.getOp(arg) === OP_MKBV)) return -1;
    const bits = args.flatMap((arg) => manager.getArgs(arg));
    if (manager.funcDecls[decl].family !== FAMILY_USER) return -1;
    let blasted = this.pred2blast.get(decl);
    if (blasted === undefined) {
      blasted = this.context.mkFreshHeadPredicate(
        getSymbolName(manager.funcDecls[decl].name),
        "bv",
        bits.map((bit) => manager.sorts[bit]),
      );
      this.pred2blast.set(decl, blasted);
      target.inheritPredicate(source, decl, blasted);
    }
    const result = manager.mkApp(blasted, bits, SORT_BOOL);
    manager.incRef(result);
    return result;
  }
}

export class MkBitBlast implements RuleTransformerPlugin {
  private simplifier: MkInterpTailSimplifier;
  private expander: ExpandMkbv;

  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {
    this.simplifier = new MkInterpTailSimplifier(context);
    this.expander = new ExpandMkbv(context.manager, context);
  }

  apply(source: RuleSet) {
    const context = this.context;
    const manager = context.manager;
    if (!context.params.getBool("xform.bit_blast", false)) return undefined;
    const blaster = new BitBlasterRewriter(manager, {
      isBlastingMul: true,
      isBlastingAdd: true,
      isBlastingQuant: true,
      isBlastingFull: true,
    });
    const result = new RuleSet(context);
    this.expander.source = source;
    this.expander.target = result;
    for (const rule of source.rules) {
      const fml = context.ruleManager.toFormula(rule);
      const blasted = blaster.rewrite(
        context.ruleManager.toFormula(this.simplifier.transformRule(rule) ?? rule),
      );
      const expanded = this.expander.rewrite(blasted);
      if (expanded !== fml) context.ruleManager.mkRule(expanded, result, rule.name);
      else {
        result.addRule(rule);
        if (source.isOutputPredicate(rule.getDecl(manager)))
          result.setOutputPredicate(rule.getDecl(manager));
      }
    }
    for (const predicate of source.outputPredicates)
      if (
        source.getPredicateRules(predicate).length === 0 ||
        result.getPredicateRules(predicate).length > 0
      )
        result.setOutputPredicate(predicate);
    blaster.cleanup();
    blaster.releaseCfg();
    blaster.release();
    return result;
  }
}
