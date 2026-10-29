// Ported from Z3 (src/smt/mam.cpp), MIT license, see z3-license.txt. Matching of quantifier
// patterns against the E-graph. Z3 compiles patterns into code trees for an abstract machine; this
// port keeps Z3's triggering scheme (candidates from new relevant terms, and the inverted path
// index with approximate label sets for merges) and matches each candidate with a backtracking
// search that follows the same rules: nested applications match congruence roots in the class of
// the argument, and the other patterns of a multi-pattern are joined like CONTINUE and GET_CGR.
import { AstManager, KIND_APP, KIND_VAR } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";

export interface Trigger {
  quantifier: number;
  patterns: number[];
  firstIndex: number;
  numDecls: number;
  steps: Step[];
}

// How a CONTINUE instruction finds candidates for an argument: the parents of a bound variable or a
// ground term (depth 1), or the parents of the parents of a bound variable (depth 2).
interface Joint {
  slot: number;
  ground: number;
  nestedDecl: number;
  nestedPosition: number;
}

// One pattern of a multi-pattern after the first. A filter step has all its variables bound and
// only looks up the congruent term.
interface Step {
  pattern: number;
  isFilter: boolean;
  joints: (Joint | null)[];
}

// A code tree: the triggers that start with the same label, and the terms waiting to be matched.
interface CodeTree {
  triggers: Trigger[];
  candidates: Enode[];
}

// A step from a term to its parent: the parent's label, the position of the term in it, and an
// optional ground argument the parent must also have.
interface Path {
  label: number;
  argIndex: number;
  groundArgIndex: number;
  groundArg: Enode | null;
  patternIndex: number;
  child: Path | null;
}

// The inverted path index shares the prefixes of paths. Siblings are alternatives for the same step,
// the first child is the next step, and a code receives the terms where a path ends.
interface PathTree {
  label: number;
  argIndex: number;
  groundArgIndex: number;
  groundArg: Enode | null;
  filter: number;
  code: CodeTree | null;
  firstChild: PathTree | null;
  sibling: PathTree | null;
}

export type OnMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) => void;

const getLabelHash = (decl: number) => (Math.imul(decl + 17, 0x9e3779b1) >>> 27) & 31;

const isEqualPath = (first: Path, second: Path): boolean => {
  let left = first;
  let right = second;
  for (;;) {
    if (
      left.label !== right.label ||
      left.argIndex !== right.argIndex ||
      left.patternIndex !== right.patternIndex ||
      (left.child === null) !== (right.child === null)
    )
      return false;
    if (left.child === null || right.child === null) return true;
    left = left.child;
    right = right.child;
  }
};

export class Mam {
  private trees = new Map<number, CodeTree>();
  private toMatch: CodeTree[] = [];
  private newPatterns: Trigger[] = [];
  private pc = new Map<number, PathTree>();
  private pp = new Map<number, (PathTree | null)[]>();
  private plbls = new Set<number>();
  private clbls = new Set<number>();
  private r1: Enode | null = null;
  private r2: Enode | null = null;

  constructor(
    private context: Context,
    private onMatch: OnMatch,
  ) {}

  private get manager(): AstManager {
    return this.context.manager;
  }

  hasWork() {
    return this.toMatch.length > 0 || this.newPatterns.length > 0;
  }

  private updateLbls(node: Enode, hash: number) {
    const root = node.root;
    const bit = 1 << hash;
    if ((root.lbls & bit) !== 0) return;
    const saved = root.lbls;
    this.context.pushTrail(() => {
      root.lbls = saved;
    });
    root.lbls |= bit;
  }

  private updateChildrenPlbls(node: Enode, hash: number) {
    const bit = 1 << hash;
    for (const arg of node.args) {
      const root = arg.root;
      if ((root.plbls & bit) !== 0) continue;
      const saved = root.plbls;
      this.context.pushTrail(() => {
        root.plbls = saved;
      });
      root.plbls |= bit;
    }
  }

  private updatePlbls(decl: number) {
    if (this.plbls.has(decl)) return;
    this.plbls.add(decl);
    this.context.pushTrail(() => this.plbls.delete(decl));
    const hash = getLabelHash(decl);
    for (const node of this.context.enodesOf(decl))
      if (this.context.isRelevant(node.owner)) this.updateChildrenPlbls(node, hash);
  }

  private updateClbls(decl: number) {
    if (this.clbls.has(decl)) return;
    this.clbls.add(decl);
    this.context.pushTrail(() => this.clbls.delete(decl));
    const hash = getLabelHash(decl);
    for (const node of this.context.enodesOf(decl))
      if (this.context.isRelevant(node.owner)) this.updateLbls(node, hash);
  }

  private addTrigger(tree: CodeTree, trigger: Trigger) {
    tree.triggers.push(trigger);
    this.context.pushTrail(() => tree.triggers.pop());
  }

  // mk_path_tree: a chain of path tree nodes whose last one has a code for the path's pattern.
  private mkPathTree(path: Path, triggers: Trigger[]): PathTree {
    const tree: PathTree = {
      label: path.label,
      argIndex: path.argIndex,
      groundArgIndex: path.groundArgIndex,
      groundArg: path.groundArg,
      filter: 1 << getLabelHash(path.label),
      code: null,
      firstChild: null,
      sibling: null,
    };
    if (path.child === null)
      tree.code = { triggers: [triggers[path.patternIndex]], candidates: [] };
    else tree.firstChild = this.mkPathTree(path.child, triggers);
    return tree;
  }

  // compiler::insert for path trees.
  private insertPath(head: PathTree, path: Path, triggers: Trigger[]) {
    let isLabelFound = false;
    let last = head;
    for (let tree: PathTree | null = head; tree !== null; tree = tree.sibling) {
      last = tree;
      if (tree.label !== path.label) continue;
      isLabelFound = true;
      if (
        tree.argIndex !== path.argIndex ||
        tree.groundArg !== path.groundArg ||
        tree.groundArgIndex !== path.groundArgIndex
      )
        continue;
      const found = tree;
      if (path.child !== null && found.firstChild !== null)
        this.insertPath(found.firstChild, path.child, triggers);
      else if (path.child !== null) {
        found.firstChild = this.mkPathTree(path.child, triggers);
        this.context.pushTrail(() => {
          found.firstChild = null;
        });
      } else if (found.code !== null) this.addTrigger(found.code, triggers[path.patternIndex]);
      else {
        found.code = { triggers: [triggers[path.patternIndex]], candidates: [] };
        this.context.pushTrail(() => {
          found.code = null;
        });
      }
      return;
    }
    const previous = last;
    previous.sibling = this.mkPathTree(path, triggers);
    this.context.pushTrail(() => {
      previous.sibling = null;
    });
    if (isLabelFound) return;
    const savedFilter = head.filter;
    head.filter |= 1 << getLabelHash(path.label);
    this.context.pushTrail(() => {
      head.filter = savedFilter;
    });
  }

  private updatePc(firstHash: number, secondHash: number, path: Path, triggers: Trigger[]) {
    const key = firstHash * 32 + secondHash;
    const existing = this.pc.get(key);
    if (existing !== undefined) {
      this.insertPath(existing, path, triggers);
      return;
    }
    this.pc.set(key, this.mkPathTree(path, triggers));
    this.context.pushTrail(() => this.pc.delete(key));
  }

  private insertPpPath(entry: (PathTree | null)[], index: number, path: Path, triggers: Trigger[]) {
    const existing = entry[index];
    if (existing !== null) {
      this.insertPath(existing, path, triggers);
      return;
    }
    entry[index] = this.mkPathTree(path, triggers);
    this.context.pushTrail(() => {
      entry[index] = null;
    });
  }

  private updatePp(
    inputFirstHash: number,
    inputSecondHash: number,
    inputFirst: Path,
    inputSecond: Path,
    triggers: Trigger[],
  ) {
    const isSwapped = inputFirstHash > inputSecondHash;
    const firstHash = isSwapped ? inputSecondHash : inputFirstHash;
    const secondHash = isSwapped ? inputFirstHash : inputSecondHash;
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const key = firstHash * 32 + secondHash;
    let entry = this.pp.get(key);
    if (entry === undefined) {
      entry = [null, null];
      this.pp.set(key, entry);
      this.context.pushTrail(() => this.pp.delete(key));
    }
    if (firstHash === secondHash) {
      this.insertPpPath(entry, 0, first, triggers);
      if (!isEqualPath(first, second)) this.insertPpPath(entry, 0, second, triggers);
      return;
    }
    this.insertPpPath(entry, 0, first, triggers);
    this.insertPpPath(entry, 1, second, triggers);
  }

  private getGroundEnode(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    return context.getEnode(expr) ?? null;
  }

  private updateFilters(
    pattern: number,
    parentPath: Path | null,
    patternIndex: number,
    varPaths: Path[][],
    triggers: Trigger[],
  ) {
    const manager = this.manager;
    const args = manager.args[pattern];
    const groundArgIndex = args.findIndex((arg) => manager.isGround(arg));
    const groundArg = groundArgIndex === -1 ? null : this.getGroundEnode(args[groundArgIndex]);
    const label = manager.decls[pattern];
    for (let index = 0; index < args.length; index++) {
      const child = args[index];
      const path: Path = {
        label,
        argIndex: index,
        groundArgIndex: groundArgIndex === -1 ? 0 : groundArgIndex,
        groundArg,
        patternIndex,
        child: parentPath,
      };
      if (manager.kinds[child] === KIND_VAR) {
        const paths = varPaths[manager.values[child]];
        let isFound = false;
        for (const existing of paths) {
          if (isEqualPath(path, existing)) isFound = true;
          this.updatePlbls(existing.label);
          this.updatePlbls(path.label);
          this.updatePp(
            getLabelHash(existing.label),
            getLabelHash(path.label),
            existing,
            path,
            triggers,
          );
        }
        if (!isFound) paths.push(path);
        continue;
      }
      if (manager.isGround(child)) {
        const node = this.getGroundEnode(child);
        if (node === null) continue;
        this.updatePlbls(label);
        if (node.lblHash === -1) node.lblHash = (Math.imul(node.owner + 7, 0x85ebca6b) >>> 27) & 31;
        this.updatePc(getLabelHash(label), node.lblHash, path, triggers);
        continue;
      }
      const childLabel = manager.decls[child];
      this.updatePlbls(label);
      this.updateClbls(childLabel);
      this.updatePc(getLabelHash(label), getLabelHash(childLabel), path, triggers);
      this.updateFilters(child, path, patternIndex, varPaths, triggers);
    }
  }

  // compiler::linearise_multi_pattern: the next pattern is the first one whose variables are all
  // bound, else the one with the most bound variables.
  private getSteps(patterns: number[], firstIndex: number, numDecls: number): Step[] {
    const manager = this.manager;
    const isBound = Array.from({ length: numDecls }, () => false);
    const bind = (term: number) => {
      if (manager.kinds[term] === KIND_VAR) isBound[numDecls - 1 - manager.values[term]] = true;
      else for (const arg of manager.args[term]) bind(arg);
    };
    const countBound = (term: number): { count: number; hasUnbound: boolean } => {
      if (manager.kinds[term] === KIND_VAR) {
        const isTermBound = isBound[numDecls - 1 - manager.values[term]];
        return { count: isTermBound ? 1 : 0, hasUnbound: !isTermBound };
      }
      let count = 0;
      let hasUnbound = false;
      for (const arg of manager.args[term]) {
        const inner = countBound(arg);
        count += inner.count;
        hasUnbound ||= inner.hasUnbound;
      }
      return { count, hasUnbound };
    };
    const getBoundSlot = (term: number) =>
      manager.kinds[term] === KIND_VAR && isBound[numDecls - 1 - manager.values[term]]
        ? numDecls - 1 - manager.values[term]
        : -1;
    bind(patterns[firstIndex]);
    const isProcessed = patterns.map((_pattern, index) => index === firstIndex);
    const steps: Step[] = [];
    for (let round = 1; round < patterns.length; round++) {
      let best = -1;
      let bestCount = 0;
      let isFilter = false;
      for (let index = 0; index < patterns.length; index++) {
        if (isProcessed[index]) continue;
        const counted = countBound(patterns[index]);
        if (!counted.hasUnbound) {
          best = index;
          isFilter = true;
          break;
        }
        if (best === -1 || counted.count > bestCount) {
          best = index;
          bestCount = counted.count;
        }
      }
      isProcessed[best] = true;
      const pattern = patterns[best];
      const args = manager.args[pattern];
      const hasDepth1 = args.some((arg) => getBoundSlot(arg) !== -1 || manager.isGround(arg));
      const joints = isFilter
        ? []
        : args.map((arg): Joint | null => {
            if (hasDepth1) {
              const slot = getBoundSlot(arg);
              if (slot !== -1) return { slot, ground: -1, nestedDecl: -1, nestedPosition: -1 };
              return manager.isGround(arg)
                ? { slot: -1, ground: arg, nestedDecl: -1, nestedPosition: -1 }
                : null;
            }
            if (manager.kinds[arg] !== KIND_APP) return null;
            const nestedPosition = manager.args[arg].findIndex(
              (innerArg) => getBoundSlot(innerArg) !== -1,
            );
            if (nestedPosition === -1) return null;
            return {
              slot: getBoundSlot(manager.args[arg][nestedPosition]),
              ground: -1,
              nestedDecl: manager.decls[arg],
              nestedPosition,
            };
          });
      steps.push({ pattern, isFilter, joints });
      bind(pattern);
    }
    return steps;
  }

  addPattern(quantifier: number, patterns: number[]) {
    const manager = this.manager;
    if (patterns.every((pattern) => manager.isGround(pattern))) return;
    if (patterns.some((pattern) => manager.hasQuantifierFlags[pattern])) return;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const triggers = patterns.map((_pattern, firstIndex) => ({
      quantifier,
      patterns,
      firstIndex,
      numDecls,
      steps: this.getSteps(patterns, firstIndex, numDecls),
    }));
    const varPaths: Path[][] = Array.from({ length: numDecls }, () => []);
    patterns.forEach((pattern, index) =>
      this.updateFilters(pattern, null, index, varPaths, triggers),
    );
    for (const pattern of patterns) {
      if (manager.isGround(pattern)) {
        const node = this.getGroundEnode(pattern);
        if (node !== null) this.context.markAsRelevant(node.owner);
      }
    }
    this.newPatterns.push(triggers[0]);
    patterns.forEach((pattern, firstIndex) => {
      if (manager.isGround(pattern)) return;
      const label = manager.decls[pattern];
      const tree = this.trees.get(label);
      if (tree !== undefined) {
        this.addTrigger(tree, triggers[firstIndex]);
        return;
      }
      this.trees.set(label, { triggers: [triggers[firstIndex]], candidates: [] });
      this.context.pushTrail(() => this.trees.delete(label));
    });
  }

  private addCandidateTo(tree: CodeTree, node: Enode) {
    if (tree.candidates.length === 0) this.toMatch.push(tree);
    tree.candidates.push(node);
  }

  relevantEh(node: Enode, isLazy: boolean) {
    if (node.lblHash !== -1) this.updateLbls(node, node.lblHash);
    if (node.args.length === 0) return;
    const hash = getLabelHash(node.decl);
    if (this.clbls.has(node.decl)) this.updateLbls(node, hash);
    if (this.plbls.has(node.decl)) this.updateChildrenPlbls(node, hash);
    const tree = this.trees.get(node.decl);
    if (!isLazy && tree !== undefined) this.addCandidateTo(tree, node);
  }

  private isEqModMerge(first: Enode, second: Enode) {
    const firstRoot = first.root;
    const secondRoot = second.root;
    return (
      firstRoot === secondRoot ||
      (firstRoot === this.r1 && secondRoot === this.r2) ||
      (firstRoot === this.r2 && secondRoot === this.r1)
    );
  }

  // collect_parents: walks the path tree level by level from the merged class, visiting each parent
  // once per level, and hands the terms where a path ends to that path's code.
  private collectParents(start: Enode, head: PathTree | null | undefined) {
    if (head === null || head === undefined) return;
    const context = this.context;
    const levels: PathTree[] = [head];
    const pending = new Map<PathTree, Enode[]>([[head, [start]]]);
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      const nodes = pending.get(level) ?? [];
      pending.delete(level);
      const filter = level.filter;
      const visitedParents = new Set<Enode>();
      const queuedRoots = new Set<Enode>();
      for (const node of nodes) {
        const child = node.root;
        if ((child.plbls & filter) === 0) continue;
        for (const parent of child.parents) {
          if (parent.isEq) continue;
          const label = parent.decl;
          const parentRoot = parent.root;
          if (
            (filter & (1 << getLabelHash(label))) === 0 ||
            visitedParents.has(parent) ||
            (parent.cg !== parent && this.isEqModMerge(parent.cg, parentRoot)) ||
            !context.isRelevant(parent.owner)
          )
            continue;
          for (let tree: PathTree | null = level; tree !== null; tree = tree.sibling) {
            if (
              tree.label !== label ||
              tree.argIndex >= parent.args.length ||
              parent.args[tree.argIndex].root !== child ||
              (tree.groundArg !== null &&
                !this.isEqModMerge(tree.groundArg, parent.args[tree.groundArgIndex]))
            )
              continue;
            if (tree.code !== null) this.addCandidateTo(tree.code, parent);
            const next = tree.firstChild;
            if (next === null) continue;
            let queue = pending.get(next);
            if (queue === undefined) {
              queue = [];
              pending.set(next, queue);
              levels.push(next);
            }
            if (!queuedRoots.has(parentRoot)) queue.push(parentRoot);
          }
          visitedParents.add(parent);
          queuedRoots.add(parentRoot);
        }
      }
    }
  }

  private processPc(r1: Enode, r2: Enode) {
    const plbls = r1.plbls;
    const clbls = r2.lbls;
    if (plbls === 0 || clbls === 0) return;
    for (let parentHash = 0; parentHash < 32; parentHash++) {
      if ((plbls & (1 << parentHash)) === 0) continue;
      if (this.context.checkCanceled()) return;
      for (let childHash = 0; childHash < 32; childHash++)
        if ((clbls & (1 << childHash)) !== 0)
          this.collectParents(r1, this.pc.get(parentHash * 32 + childHash));
    }
  }

  private processPp(r1: Enode, r2: Enode) {
    const plbls1 = r1.plbls;
    const plbls2 = r2.plbls;
    if (plbls1 === 0 || plbls2 === 0) return;
    for (let firstHash = 0; firstHash < 32; firstHash++) {
      if ((plbls1 & (1 << firstHash)) === 0) continue;
      if (this.context.checkCanceled()) return;
      for (let secondHash = 0; secondHash < 32; secondHash++) {
        if ((plbls2 & (1 << secondHash)) === 0) continue;
        const isSwapped = firstHash > secondHash;
        const lowHash = isSwapped ? secondHash : firstHash;
        const highHash = isSwapped ? firstHash : secondHash;
        const lowRoot = isSwapped ? r2 : r1;
        const highRoot = isSwapped ? r1 : r2;
        const entry = this.pp.get(lowHash * 32 + highHash);
        if (entry === undefined) continue;
        if (lowHash === highHash) {
          if (lowRoot.parents.length <= highRoot.parents.length)
            this.collectParents(lowRoot, entry[0]);
          else this.collectParents(highRoot, entry[0]);
        } else if (lowRoot.parents.length <= highRoot.parents.length)
          this.collectParents(lowRoot, entry[0]);
        else this.collectParents(highRoot, entry[1]);
      }
    }
  }

  addEqEh(r1: Enode, r2: Enode) {
    this.r1 = r1;
    this.r2 = r2;
    this.processPc(r1, r2);
    this.processPc(r2, r1);
    this.processPp(r1, r2);
    this.r1 = null;
    this.r2 = null;
  }

  match() {
    const toMatch = this.toMatch;
    this.toMatch = [];
    for (const tree of toMatch) {
      const candidates = tree.candidates;
      tree.candidates = [];
      const seen = new Set<Enode>();
      for (const node of candidates) {
        if (seen.has(node) || !node.isCgr()) continue;
        if (this.context.checkCanceled()) return;
        seen.add(node);
        for (const trigger of tree.triggers) this.matchTrigger(trigger, node);
      }
    }
    // match_new_patterns: one temporary tree per label, in the order the labels first appear.
    const byLabel = new Map<number, Trigger[]>();
    for (const trigger of this.newPatterns) {
      const label = this.manager.decls[trigger.patterns[0]];
      const list = byLabel.get(label);
      if (list === undefined) byLabel.set(label, [trigger]);
      else list.push(trigger);
    }
    this.newPatterns = [];
    for (const entry of byLabel) {
      if (this.context.checkCanceled()) return;
      for (const node of this.context.enodesOf(entry[0]))
        if (this.context.isRelevant(node.owner))
          for (const trigger of entry[1]) this.matchTrigger(trigger, node);
    }
  }

  // rematch: every code tree, in the order of their labels, against every relevant term.
  rematch() {
    const labels = [...this.trees.keys()].sort((left, right) => left - right);
    for (const label of labels) {
      const tree = this.trees.get(label);
      if (tree === undefined) continue;
      for (const node of this.context.enodesOf(label)) {
        if (this.context.checkCanceled()) return;
        if (this.context.isRelevant(node.owner))
          for (const trigger of tree.triggers) this.matchTrigger(trigger, node);
      }
    }
  }

  popScope() {
    for (const tree of this.toMatch) tree.candidates = [];
    this.toMatch = [];
    this.newPatterns = [];
  }

  // The state of the backtracking search: the terms left to match against nodes, the bindings in
  // declaration order, and the generations of the matched terms.
  private trigger: Trigger | null = null;
  private bindings: (Enode | null)[] = [];
  private generations: number[] = [];
  private goalPatterns: number[] = [];
  private goalNodes: Enode[] = [];
  private goalTop = 0;
  private stepIndex = 0;

  private matchTrigger(trigger: Trigger, candidate: Enode) {
    const manager = this.manager;
    const first = trigger.patterns[trigger.firstIndex];
    if (
      candidate.decl !== manager.decls[first] ||
      candidate.args.length !== manager.args[first].length
    )
      return;
    this.trigger = trigger;
    this.bindings = Array.from({ length: trigger.numDecls }, () => null);
    this.generations = [this.context.getGeneration(candidate)];
    this.goalTop = 0;
    this.stepIndex = 0;
    this.pushGoals(manager.args[first], candidate.args);
    this.run();
    this.trigger = null;
  }

  private pushGoals(patternArgs: number[], nodeArgs: Enode[]) {
    for (let index = patternArgs.length - 1; index >= 0; index--) {
      this.goalPatterns[this.goalTop] = patternArgs[index];
      this.goalNodes[this.goalTop] = nodeArgs[index];
      this.goalTop++;
    }
  }

  private run() {
    if (this.goalTop === 0) {
      this.runStep();
      return;
    }
    const manager = this.manager;
    this.goalTop--;
    const top = this.goalTop;
    const pattern = this.goalPatterns[top];
    const node = this.goalNodes[top];
    if (manager.kinds[pattern] === KIND_VAR) {
      const slot = this.bindings.length - 1 - manager.values[pattern];
      const bound = this.bindings[slot];
      if (bound === null) {
        this.bindings[slot] = node;
        this.run();
        this.bindings[slot] = null;
      } else if (bound.root === node.root) this.run();
    } else if (manager.isGround(pattern)) {
      const ground = this.context.getEnode(pattern);
      if (ground !== undefined && ground.root === node.root) this.run();
    } else {
      const decl = manager.decls[pattern];
      const patternArgs = manager.args[pattern];
      const root = node.root;
      let member = root;
      do {
        if (member.decl === decl && member.isCgr() && member.args.length === patternArgs.length) {
          this.generations.push(this.context.getGeneration(member));
          this.pushGoals(patternArgs, member.args);
          this.run();
          this.goalTop = top;
          this.generations.pop();
        }
        member = member.next;
      } while (member !== root);
    }
    this.goalPatterns[top] = pattern;
    this.goalNodes[top] = node;
    this.goalTop = top + 1;
  }

  private runStep() {
    const trigger = this.trigger;
    if (trigger === null) return;
    const context = this.context;
    if (this.stepIndex === trigger.steps.length) {
      let maxGeneration = 0;
      for (const generation of this.generations)
        maxGeneration = Math.max(maxGeneration, generation);
      const result: Enode[] = [];
      for (const binding of this.bindings) if (binding !== null) result.push(binding);
      if (result.length === trigger.numDecls)
        this.onMatch(trigger.quantifier, result, maxGeneration);
      return;
    }
    const step = trigger.steps[this.stepIndex];
    const savedGenerations = this.generations.length;
    this.stepIndex++;
    if (step.isFilter) {
      if (this.getFiltered(step.pattern) !== undefined) this.run();
    } else {
      const patternArgs = this.manager.args[step.pattern];
      for (const node of this.getCandidates(step)) {
        if (
          node.args.length !== patternArgs.length ||
          !node.isCgr() ||
          !context.isRelevant(node.owner)
        )
          continue;
        this.generations.push(context.getGeneration(node));
        this.pushGoals(patternArgs, node.args);
        this.run();
        this.goalTop = 0;
        this.generations.length = savedGenerations;
      }
    }
    this.stepIndex--;
    this.generations.length = savedGenerations;
  }

  private getJointRoot(joint: Joint) {
    return joint.ground !== -1
      ? this.context.getEnode(joint.ground)?.root
      : this.bindings[joint.slot]?.root;
  }

  private isRelevantParent(parent: Enode, decl: number, position: number, child: Enode) {
    return (
      parent.decl === decl &&
      position < parent.args.length &&
      this.context.isRelevant(parent.owner) &&
      parent.isCgr() &&
      parent.args[position].root === child
    );
  }

  // interpreter::mk_depth1_vector and mk_depth2_vector.
  private getJointCandidates(joint: Joint, decl: number, argIndex: number) {
    const root = this.getJointRoot(joint);
    const result: Enode[] = [];
    if (root === undefined) return result;
    if (joint.nestedDecl === -1) {
      for (const parent of root.parents)
        if (this.isRelevantParent(parent, decl, argIndex, root)) result.push(parent);
      return result;
    }
    for (const parent of root.parents) {
      if (!this.isRelevantParent(parent, joint.nestedDecl, joint.nestedPosition, root)) continue;
      const parentRoot = parent.root;
      for (const grandparent of parentRoot.parents)
        if (this.isRelevantParent(grandparent, decl, argIndex, parentRoot))
          result.push(grandparent);
    }
    return result;
  }

  // interpreter::init_continue: the smallest candidate vector among the joints.
  private getCandidates(step: Step) {
    const decl = this.manager.decls[step.pattern];
    const all = this.context.enodesOf(decl);
    for (const joint of step.joints) {
      if (joint === null || joint.nestedDecl !== -1) continue;
      const root = this.getJointRoot(joint);
      if (root === undefined || root.parents.length === 0) return [];
    }
    let best: Enode[] | null = null;
    for (let argIndex = 0; argIndex < step.joints.length; argIndex++) {
      const joint = step.joints[argIndex];
      if (joint === null) continue;
      const current = this.getJointCandidates(joint, decl, argIndex);
      if (current.length < all.length && (best === null || current.length < best.length)) {
        best = current;
        if (best.length === 0) return best;
      }
    }
    return best ?? [...all];
  }

  // compiler::gen_mp_filter: the congruent term of a pattern whose variables are all bound.
  private getFiltered(term: number): Enode | undefined {
    const manager = this.manager;
    const context = this.context;
    if (manager.kinds[term] === KIND_VAR)
      return this.bindings[this.bindings.length - 1 - manager.values[term]] ?? undefined;
    if (manager.isGround(term)) return context.getEnode(term);
    const args: Enode[] = [];
    for (const arg of manager.args[term]) {
      const node = this.getFiltered(arg);
      if (node === undefined) return undefined;
      args.push(node);
    }
    const found = context.findCongruent(manager.decls[term], args);
    if (found === undefined || !context.isRelevant(found.owner)) return undefined;
    this.generations.push(context.getGeneration(found));
    return found;
  }
}
