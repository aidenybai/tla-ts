// Ported from Z3 (src/smt/mam.cpp), MIT license, see z3-license.txt. Matching of quantifier
// patterns against the E-graph. Z3 compiles patterns into code trees for an abstract machine; this
// port keeps Z3's triggering scheme (candidates from new relevant terms, and the inverted path
// index with approximate label sets for merges) and matches each candidate with a backtracking
// search that follows the same rules: nested applications match congruence roots in the class of
// the argument, and the other patterns of a multi-pattern join over relevant terms.
import { AstManager, KIND_VAR } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";

export interface Trigger {
  quantifier: number;
  patterns: number[];
  firstIndex: number;
  numDecls: number;
}

interface Path {
  label: number;
  argIndex: number;
  groundArgIndex: number;
  groundArg: Enode | null;
  patternIndex: number;
  child: Path | null;
}

export type OnMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) => void;

const getLabelHash = (decl: number) => (Math.imul(decl + 17, 0x9e3779b1) >>> 27) & 31;

const isEqualPath = (first: Path | null, second: Path | null): boolean => {
  let left = first;
  let right = second;
  while (left !== null && right !== null) {
    if (
      left.label !== right.label ||
      left.argIndex !== right.argIndex ||
      left.patternIndex !== right.patternIndex ||
      (left.child === null) !== (right.child === null)
    )
      return false;
    left = left.child;
    right = right.child;
  }
  return left === null && right === null;
};

export class Mam {
  private triggers = new Map<number, Trigger[]>();
  private candidates = new Map<number, Enode[]>();
  private newPatterns: Trigger[] = [];
  private pc = new Map<number, Path[]>();
  private pp = new Map<number, Path[][]>();
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
    return this.candidates.size > 0 || this.newPatterns.length > 0;
  }

  private pushToList<Key>(map: Map<Key, Path[]>, key: Key, path: Path) {
    const list = map.get(key);
    if (list === undefined) {
      map.set(key, [path]);
      this.context.pushTrail(() => map.delete(key));
    } else {
      list.push(path);
      this.context.pushTrail(() => list.pop());
    }
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

  private updatePc(firstHash: number, secondHash: number, path: Path) {
    this.pushToList(this.pc, firstHash * 32 + secondHash, path);
  }

  private updatePp(inputFirstHash: number, inputSecondHash: number, inputFirst: Path, inputSecond: Path) {
    const isSwapped = inputFirstHash > inputSecondHash;
    const firstHash = isSwapped ? inputSecondHash : inputFirstHash;
    const secondHash = isSwapped ? inputFirstHash : inputSecondHash;
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const key = firstHash * 32 + secondHash;
    let entry = this.pp.get(key);
    if (entry === undefined) {
      entry = [[], []];
      this.pp.set(key, entry);
      this.context.pushTrail(() => this.pp.delete(key));
    }
    const lists = entry;
    const pushPath = (list: Path[], path: Path) => {
      list.push(path);
      this.context.pushTrail(() => list.pop());
    };
    if (firstHash === secondHash) {
      pushPath(lists[0], first);
      if (!isEqualPath(first, second)) pushPath(lists[0], second);
    } else {
      pushPath(lists[0], first);
      pushPath(lists[1], second);
    }
  }

  private getGroundEnode(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    return context.getEnode(expr) ?? null;
  }

  private updateFilters(pattern: number, parentPath: Path | null, patternIndex: number, varPaths: Path[][]) {
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
          this.updatePp(getLabelHash(existing.label), getLabelHash(path.label), existing, path);
        }
        if (!isFound) paths.push(path);
        continue;
      }
      if (manager.isGround(child)) {
        const node = this.getGroundEnode(child);
        if (node === null) continue;
        this.updatePlbls(label);
        if (node.lblHash === -1) node.lblHash = (Math.imul(node.owner + 7, 0x85ebca6b) >>> 27) & 31;
        this.updatePc(getLabelHash(label), node.lblHash, path);
        continue;
      }
      const childLabel = manager.decls[child];
      this.updatePlbls(label);
      this.updateClbls(childLabel);
      this.updatePc(getLabelHash(label), getLabelHash(childLabel), path);
      this.updateFilters(child, path, patternIndex, varPaths);
    }
  }

  addPattern(quantifier: number, patterns: number[]) {
    const manager = this.manager;
    if (patterns.every((pattern) => manager.isGround(pattern))) return;
    if (patterns.some((pattern) => manager.hasQuantifierFlags[pattern])) return;
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const varPaths: Path[][] = Array.from({ length: numDecls }, () => []);
    patterns.forEach((pattern, index) => this.updateFilters(pattern, null, index, varPaths));
    for (const pattern of patterns) {
      if (manager.isGround(pattern)) {
        const node = this.getGroundEnode(pattern);
        if (node !== null) this.context.markAsRelevant(node.owner);
      }
    }
    this.newPatterns.push({ quantifier, patterns, firstIndex: 0, numDecls });
    patterns.forEach((pattern, firstIndex) => {
      if (manager.isGround(pattern)) return;
      const label = manager.decls[pattern];
      const trigger = { quantifier, patterns, firstIndex, numDecls };
      const list = this.triggers.get(label);
      if (list === undefined) {
        this.triggers.set(label, [trigger]);
        this.context.pushTrail(() => this.triggers.delete(label));
      } else {
        list.push(trigger);
        this.context.pushTrail(() => list.pop());
      }
    });
  }

  private addCandidate(node: Enode) {
    if (!this.triggers.has(node.decl)) return;
    const list = this.candidates.get(node.decl);
    if (list === undefined) this.candidates.set(node.decl, [node]);
    else list.push(node);
  }

  relevantEh(node: Enode, isLazy: boolean) {
    if (node.lblHash !== -1) this.updateLbls(node, node.lblHash);
    if (node.args.length === 0) return;
    const hash = getLabelHash(node.decl);
    if (this.clbls.has(node.decl)) this.updateLbls(node, hash);
    if (this.plbls.has(node.decl)) this.updateChildrenPlbls(node, hash);
    if (!isLazy) this.addCandidate(node);
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

  private collectParents(start: Enode, paths: Path[] | undefined) {
    if (paths === undefined) return;
    const context = this.context;
    for (const path of paths) {
      let todo = [start];
      for (let step: Path | null = path; step !== null && todo.length > 0; step = step.child) {
        const next: Enode[] = [];
        const visited = new Set<Enode>();
        for (const node of todo) {
          const child = node.root;
          for (const parent of child.parents) {
            if (parent.isEq || parent.decl !== step.label || visited.has(parent)) continue;
            if (parent.cg !== parent && this.isEqModMerge(parent.cg, parent.root)) continue;
            if (!context.isRelevant(parent.owner)) continue;
            if (parent.args[step.argIndex].root !== child) continue;
            if (step.groundArg !== null && !this.isEqModMerge(step.groundArg, parent.args[step.groundArgIndex]))
              continue;
            visited.add(parent);
            if (step.child === null) this.addCandidate(parent);
            else if (!next.includes(parent.root)) next.push(parent.root);
          }
        }
        todo = next;
      }
    }
  }

  private forEachBit(mask: number, callback: (bit: number) => void) {
    for (let bit = 0; bit < 32; bit++) if ((mask & (1 << bit)) !== 0) callback(bit);
  }

  private processPc(r1: Enode, r2: Enode) {
    const plbls = r1.plbls;
    const clbls = r2.lbls;
    if (plbls === 0 || clbls === 0) return;
    this.forEachBit(plbls, (parentHash) =>
      this.forEachBit(clbls, (childHash) => this.collectParents(r1, this.pc.get(parentHash * 32 + childHash))),
    );
  }

  private processPp(r1: Enode, r2: Enode) {
    const plbls1 = r1.plbls;
    const plbls2 = r2.plbls;
    if (plbls1 === 0 || plbls2 === 0) return;
    this.forEachBit(plbls1, (firstHash) =>
      this.forEachBit(plbls2, (secondHash) => {
        const isSwapped = firstHash > secondHash;
        const lowHash = isSwapped ? secondHash : firstHash;
        const highHash = isSwapped ? firstHash : secondHash;
        const lowRoot = isSwapped ? r2 : r1;
        const highRoot = isSwapped ? r1 : r2;
        const entry = this.pp.get(lowHash * 32 + highHash);
        if (entry === undefined) return;
        if (lowRoot.parents.length <= highRoot.parents.length) this.collectParents(lowRoot, entry[0]);
        else this.collectParents(highRoot, lowHash === highHash ? entry[0] : entry[1]);
      }),
    );
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
    const candidates = this.candidates;
    this.candidates = new Map();
    for (const entry of candidates) {
      const triggers = this.triggers.get(entry[0]);
      if (triggers === undefined) continue;
      const seen = new Set<Enode>();
      for (const node of entry[1]) {
        if (seen.has(node) || !node.isCgr()) continue;
        seen.add(node);
        for (const trigger of triggers) this.matchTrigger(trigger, node);
        if (this.context.isInconsistent() || this.context.checkCanceled()) {
          this.candidates.clear();
          return;
        }
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
    for (const entry of byLabel)
      for (const node of [...this.context.enodesOf(entry[0])])
        if (this.context.isRelevant(node.owner)) for (const trigger of entry[1]) this.matchTrigger(trigger, node);
  }

  rematch() {
    for (const entry of this.triggers)
      for (const node of [...this.context.enodesOf(entry[0])])
        if (this.context.isRelevant(node.owner))
          for (const trigger of [...entry[1]]) this.matchTrigger(trigger, node);
  }

  popScope() {
    this.candidates.clear();
    this.newPatterns = [];
  }

  private matchTrigger(trigger: Trigger, candidate: Enode) {
    const manager = this.manager;
    const context = this.context;
    const patterns = trigger.patterns;
    const first = patterns[trigger.firstIndex];
    if (candidate.decl !== manager.decls[first] || candidate.args.length !== manager.args[first].length) return;
    const numDecls = trigger.numDecls;
    const bindings: (Enode | null)[] = new Array<Enode | null>(numDecls).fill(null);
    const generations: number[] = [context.getGeneration(candidate)];

    const matchTerm = (pattern: number, node: Enode, next: () => void) => {
      if (manager.kinds[pattern] === KIND_VAR) {
        const slot = numDecls - 1 - manager.values[pattern];
        const bound = bindings[slot];
        if (bound === null) {
          bindings[slot] = node;
          next();
          bindings[slot] = null;
        } else if (bound.root === node.root) next();
        return;
      }
      if (manager.isGround(pattern)) {
        const ground = context.getEnode(pattern);
        if (ground !== undefined && ground.root === node.root) next();
        return;
      }
      const decl = manager.decls[pattern];
      const patternArgs = manager.args[pattern];
      const root = node.root;
      let member = root;
      do {
        if (member.decl === decl && member.isCgr() && member.args.length === patternArgs.length) {
          generations.push(context.getGeneration(member));
          matchArgs(patternArgs, member.args, 0, next);
          generations.pop();
        }
        member = member.next;
      } while (member !== root);
    };

    const matchArgs = (patternArgs: number[], nodeArgs: Enode[], index: number, next: () => void) => {
      if (index === patternArgs.length) {
        next();
        return;
      }
      matchTerm(patternArgs[index], nodeArgs[index], () => matchArgs(patternArgs, nodeArgs, index + 1, next));
    };

    const join = (patternIndex: number) => {
      if (patternIndex === patterns.length) {
        let maxGeneration = 0;
        for (const generation of generations) maxGeneration = Math.max(maxGeneration, generation);
        const result: Enode[] = [];
        for (const binding of bindings) if (binding !== null) result.push(binding);
        if (result.length === numDecls) this.onMatch(trigger.quantifier, result, maxGeneration);
        return;
      }
      if (patternIndex === trigger.firstIndex) {
        join(patternIndex + 1);
        return;
      }
      const pattern = patterns[patternIndex];
      if (manager.isGround(pattern)) {
        if (context.getEnode(pattern) !== undefined) join(patternIndex + 1);
        return;
      }
      const decl = manager.decls[pattern];
      const patternArgs = manager.args[pattern];
      for (const node of [...context.enodesOf(decl)]) {
        if (!node.isCgr() || node.args.length !== patternArgs.length || !context.isRelevant(node.owner))
          continue;
        generations.push(context.getGeneration(node));
        matchArgs(patternArgs, node.args, 0, () => join(patternIndex + 1));
        generations.pop();
      }
    };

    matchArgs(manager.args[first], candidate.args, 0, () => join(0));
  }
}
