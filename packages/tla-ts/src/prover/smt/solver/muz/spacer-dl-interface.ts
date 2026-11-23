import { SmtUnsupportedError } from "../../../../errors";
import { L_FALSE } from "../lbool";
import { ProtoModel } from "../proto-model";
import type { DatalogContext, Engine, ModelConverter } from "./dl-context";
import { MkSlice } from "./dl-mk-slice";
import { RuleSet } from "./dl-rule-set";
import { applyDefaultTransformation, transformRules } from "./dl-rule-transformer";
import { SpacerContext } from "./spacer-context";

// Each query gets a fresh spacer context, where Z3 keeps the lemmas of a previous query whose
// rules subsume the new ones.
export class SpacerDlInterface implements Engine {
  private spacer: SpacerContext | undefined;
  private modelConverters: readonly ModelConverter[] = [];

  constructor(private context: DatalogContext) {}

  query(query: number) {
    const context = this.context;
    const params = context.params;
    context.ensureOpened();
    const oldRules = RuleSet.copy(context.getRules());
    context.ruleManager.mkQuery(query, context.getRules());
    applyDefaultTransformation(context);
    if (params.getBool("xform.slice", true)) transformRules(context, [new MkSlice(context)]);
    if (params.getUint("xform.unfold_rules", 0) > 0)
      throw new SmtUnsupportedError("fp.xform.unfold_rules");
    const rules = context.getRules();
    if (rules.outputPredicates.size === 0) return L_FALSE;
    const queryPred = rules.getOutputPredicate();
    const spacerRules = new RuleSet(context);
    spacerRules.replaceRules(rules);
    spacerRules.close();
    context.recordTransformedRules();
    context.reopen();
    context.replaceRules(oldRules);
    context.manager.limit.checkpoint();
    const spacer = new SpacerContext(context);
    this.spacer = spacer;
    this.modelConverters = context.modelConverters ?? [];
    spacer.setQuery(queryPred);
    spacer.updateRules(spacerRules);
    if (spacerRules.rules.length === 0) return L_FALSE;
    return spacer.solve(params.getUint("spacer.min_level", 0));
  }

  getModel() {
    return this.modelConverters.reduceRight(
      (model, convert) => convert(model),
      this.spacer?.getModel() ?? new ProtoModel(this.context.manager),
    );
  }
}
