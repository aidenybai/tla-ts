import { setAt, shrink } from "./array";
import { KIND_APP, KIND_QUANTIFIER, OP_EQ, type AstManager } from "./ast";
import { type Dependency, type Goal, joinDependencies } from "./goal";
import { ObjMap } from "./hashtable";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

// Quantifier bodies are included and patterns excluded.
class SharedOccs {
  private readonly sharedById: (number | undefined)[] = [];

  constructor(private readonly manager: AstManager) {}

  has(expr: number) {
    return this.sharedById[this.manager.ids[expr]] === expr;
  }

  compute(forms: readonly number[]) {
    const manager = this.manager;
    this.reset();
    const visited = new Set<number>();
    const todo = [...forms];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) {
        if (!this.has(expr)) {
          manager.incRef(expr);
          setAt(this.sharedById, manager.ids[expr], expr);
        }
        continue;
      }
      visited.add(expr);
      if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
      else if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
    }
  }

  reset() {
    const manager = this.manager;
    const sharedById = this.sharedById;
    for (let id = 0; id < sharedById.length; id++) {
      const expr = sharedById[id];
      if (expr !== undefined) manager.decRef(expr);
    }
    shrink(sharedById, 0);
  }
}

// Its rewriter, substitution and shared occurrences live from one run until its cleanup.
export class PropagateValuesTactic {
  private rewriter: Rewriter | undefined;
  private readonly substitution: ObjMap<number>;
  private readonly dependencies = new Map<number, Dependency | undefined>();
  private readonly occs: SharedOccs;

  constructor(
    private readonly manager: AstManager,
    private readonly maxRounds = 4,
    private readonly options = TACTIC_REWRITER_OPTIONS,
  ) {
    this.substitution = new ObjMap((expr) => manager.hashes[expr]);
    this.occs = new SharedOccs(manager);
  }

  run(goal: Goal) {
    const manager = this.manager;
    goal.depth++;
    if (goal.isInconsistent || this.maxRounds === 0 || goal.isProofsEnabled) {
      goal.elimRedundancies();
      return;
    }
    this.releaseSubstitution();
    const rewriter = (this.rewriter ??= new Rewriter(manager, this.options));
    const substitution = this.substitution;
    const dependencies = this.dependencies;
    rewriter.setSubstitution(substitution, dependencies);
    const insert = (expr: number, value: number, dependency: Dependency | undefined) => {
      const previous = substitution.get(expr);
      if (previous === undefined) manager.incRef(expr);
      manager.incRef(value);
      if (previous !== undefined) manager.decRef(previous);
      substitution.set(expr, value);
      dependencies.set(expr, dependency);
    };
    const clear = () => {
      this.releaseSubstitution();
      rewriter.setSubstitution(substitution, dependencies);
    };
    const occs = this.occs;
    occs.compute(goal.forms.items);
    let isModified = false;
    const process = (index: number) => {
      const current = goal.forms.items[index];
      const isRewriting = substitution.size !== 0;
      const rewritten = isRewriting ? rewriter.rewrite(current) : current;
      if (rewritten !== current) isModified = true;
      const used = goal.isCoresEnabled ? rewriter.usedDependencies : undefined;
      const dependency = joinDependencies(goal.getDependency(index), used);
      // Forgetting the used dependencies drops the cache, whose results would hide them next time.
      if (used !== undefined) {
        rewriter.usedDependencies = undefined;
        rewriter.setSubstitution(substitution, dependencies);
      }
      goal.update(index, rewritten, dependency);
      if (isRewriting) manager.decRef(rewritten);
      if (occs.has(rewritten)) insert(rewritten, manager.trueExpr, dependency);
      if (manager.isNot(rewritten) && occs.has(manager.getArg(rewritten, 0)))
        insert(manager.getArg(rewritten, 0), manager.falseExpr, dependency);
      if (manager.getOp(rewritten) !== OP_EQ) return;
      if (manager.isValue(manager.getArg(rewritten, 0)) && occs.has(manager.getArg(rewritten, 1)))
        insert(manager.getArg(rewritten, 1), manager.getArg(rewritten, 0), dependency);
      else if (
        manager.isValue(manager.getArg(rewritten, 1)) &&
        occs.has(manager.getArg(rewritten, 0))
      )
        insert(manager.getArg(rewritten, 0), manager.getArg(rewritten, 1), dependency);
    };
    const maxRounds = this.maxRounds;
    rounds: for (let round = 0; round < maxRounds; round += 2) {
      const size = goal.forms.size;
      for (let index = 0; index < size; index++) {
        process(index);
        if (goal.isInconsistent) break rounds;
      }
      if (substitution.size === 0 && !isModified) break;
      if (round + 1 >= maxRounds) break;
      occs.compute(goal.forms.items);
      clear();
      for (let index = goal.forms.size - 1; index >= 0; index--) {
        process(index);
        if (goal.isInconsistent) break rounds;
      }
      if (!isModified) break;
      clear();
      isModified = false;
      occs.compute(goal.forms.items);
    }
    goal.elimRedundancies();
  }

  private releaseSubstitution() {
    const manager = this.manager;
    for (const [key, value] of this.substitution) {
      manager.decRef(key);
      manager.decRef(value);
    }
    this.substitution.clear();
    this.dependencies.clear();
  }

  cleanup() {
    this.rewriter?.release();
    this.rewriter = undefined;
    this.releaseSubstitution();
    this.occs.reset();
  }

  // The destructor frees the members in the reverse of the order cleanup does.
  release() {
    this.occs.reset();
    this.releaseSubstitution();
    this.rewriter?.release();
  }
}

export const propagateValues = (
  manager: AstManager,
  goal: Goal,
  maxRounds = 4,
  options = TACTIC_REWRITER_OPTIONS,
) => {
  const tactic = new PropagateValuesTactic(manager, maxRounds, options);
  tactic.run(goal);
  tactic.cleanup();
};
