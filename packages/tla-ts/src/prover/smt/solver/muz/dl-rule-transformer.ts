// Ported from Z3 (src/muz/base/dl_rule_transformer.cpp, src/muz/transforms/dl_transforms.cpp), MIT
// license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import type { DatalogContext } from "./dl-context";
import { MkBitBlast } from "./dl-mk-bit-blast";
import { MkCoiFilter } from "./dl-mk-coi-filter";
import { MkElimTermIte } from "./dl-mk-elim-term-ite";
import { MkInterpTailSimplifier } from "./dl-mk-interp-tail-simplifier";
import { MkRuleInliner } from "./dl-mk-rule-inliner";
import { MkSubsumptionChecker } from "./dl-mk-subsumption-checker";
import { RuleSet } from "./dl-rule-set";

export interface RuleTransformerPlugin {
  readonly priority: number;
  readonly canDestratifyNegation?: boolean;
  apply(source: RuleSet): RuleSet | undefined;
}

export const removeDuplicateTails = (tail: number[], isNegated: boolean[]) => {
  const seen = [new Set<number>(), new Set<number>()];
  let index = 0;
  while (index < tail.length) {
    const set = seen[isNegated[index] ? 1 : 0];
    if (!set.has(tail[index])) {
      set.add(tail[index]);
      index++;
      continue;
    }
    if (index !== tail.length - 1) {
      tail[index] = tail[tail.length - 1];
      isNegated[index] = isNegated[isNegated.length - 1];
    }
    tail.pop();
    isNegated.pop();
  }
};

// Plugins with the same priority keep the order they were registered in.
export const transformRules = (context: DatalogContext, plugins: RuleTransformerPlugin[]) => {
  const ordered = plugins
    .map((plugin, index) => ({ plugin, index }))
    .sort(
      (first, second) =>
        second.plugin.priority - first.plugin.priority || first.index - second.index,
    )
    .map((entry) => entry.plugin);
  let isModified = false;
  let rules = RuleSet.copy(context.ruleSet);
  for (const plugin of ordered) {
    context.manager.limit.checkpoint();
    const result = plugin.apply(rules);
    if (result === undefined) continue;
    if (plugin.canDestratifyNegation === true && !result.isClosed() && !result.close()) continue;
    isModified = true;
    rules = result;
    rules.ensureClosed();
  }
  if (!isModified) return;
  context.ruleSet.replaceRules(rules);
  context.ruleSet.ensureClosed();
};

class MkGuard implements RuleTransformerPlugin {
  constructor(
    readonly priority: number,
    private isEnabled: boolean,
    private name: string,
  ) {}

  apply() {
    if (this.isEnabled) throw new SmtUnsupportedError(`the Horn transformation ${this.name}`);
    return undefined;
  }
}

export const applyDefaultTransformation = (context: DatalogContext) =>
  context.withoutBindingVariables(() => {
    const params = context.params;
    context.ensureClosed();
    const isSubsuming = params.getBool("datalog.subsumption", true);
    if (
      params.getBool("xform.instantiate_arrays", false) ||
      params.getBool("xform.transform_arrays", false) ||
      params.getBool("xform.quantify_arrays", false) ||
      params.getBool("xform.magic", false)
    )
      throw new SmtUnsupportedError("the Horn array and magic set transformations");
    const plugins: RuleTransformerPlugin[] = [
      new MkCoiFilter(context),
      new MkInterpTailSimplifier(context),
      new MkGuard(
        37000,
        params.getBool("xform.instantiate_quantifiers", false),
        "instantiate_quantifiers",
      ),
    ];
    if (isSubsuming) plugins.push(new MkSubsumptionChecker(context, 35005));
    plugins.push(
      new MkRuleInliner(context, 35000),
      new MkCoiFilter(context, 34990),
      new MkInterpTailSimplifier(context, 34980),
    );
    if (isSubsuming) plugins.push(new MkSubsumptionChecker(context, 34975));
    plugins.push(
      new MkRuleInliner(context, 34970),
      new MkCoiFilter(context, 34960),
      new MkInterpTailSimplifier(context, 34950),
    );
    if (isSubsuming)
      plugins.push(
        new MkSubsumptionChecker(context, 34940),
        new MkRuleInliner(context, 34930),
        new MkSubsumptionChecker(context, 34920),
        new MkRuleInliner(context, 34910),
        new MkSubsumptionChecker(context, 34900),
        new MkRuleInliner(context, 34890),
        new MkSubsumptionChecker(context, 34880),
      );
    else plugins.push(new MkRuleInliner(context, 34930));
    plugins.push(
      new MkBitBlast(context, 35000),
      new MkGuard(36030, params.getBool("xform.scale", false), "scale"),
      new MkGuard(35999, params.getBool("xform.array_blast", false), "array_blast"),
      new MkElimTermIte(context, 35010),
    );
    transformRules(context, plugins);
  });
