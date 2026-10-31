// Ported from Z3 (src/smt/mam.cpp), MIT license, see z3-license.txt. Matching of quantifier
// patterns against the E-graph with Z3's matching abstract machine: the patterns are compiled into
// code trees, new relevant terms become candidates of the tree for their label, and the inverted
// path index with approximate label sets finds the candidates that a merge creates.
import { AstManager, KIND_VAR } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { hashU, mkMix } from "./hash";
import { type CodeTree, Compiler, hasHash, type LabelHasher } from "./mam-compiler";
import { Interpreter, type OnMatch } from "./mam-interpreter";
import { setAt, shrink } from "./array";

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
  filterHigh: number;
  code: CodeTree | null;
  firstChild: PathTree | null;
  sibling: PathTree | null;
  // The roots that collect_parents visits at this node, while it walks the tree.
  todo: Enode[] | null;
}

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

// A multi-pattern of a quantifier: the terms of one of its patterns.
interface MultiPattern {
  quantifier: number;
  patterns: number[];
}

export class Mam implements LabelHasher {
  private trees = new Map<number, CodeTree>();
  // m_shared_enodes: the ground terms of the patterns.
  private sharedEnodes = new Set<Enode>();
  private toMatch: CodeTree[] = [];
  private newPatterns: MultiPattern[] = [];
  private pc = new Map<number, PathTree>();
  private pp = new Map<number, (PathTree | null)[]>();
  private plbls = new Set<number>();
  private clbls = new Set<number>();
  private r1: Enode | null = null;
  private r2: Enode | null = null;
  // The nodes that collect_parents marks, to unmark at the end of each level.
  private visitedParents: Enode[] = [];
  private queuedRoots: Enode[] = [];
  private labelHashes: (number | undefined)[] = [];
  // m_trail_stack: the matcher undoes its changes with a trail of its own, which the quantifier
  // manager pops before the context pops its trail.
  private trail: (() => void)[] = [];
  private trailScopes: number[] = [];
  private compiler: Compiler;
  private interpreter: Interpreter;

  constructor(
    private context: Context,
    onMatch: OnMatch,
  ) {
    this.compiler = new Compiler(context.manager, context, this);
    this.interpreter = new Interpreter(context, onMatch);
  }

  private get manager(): AstManager {
    return this.context.manager;
  }

  // label_hasher: Bob Jenkins' mix of the small id of a declaration, in [0, 64).
  getLabelHash(decl: number) {
    const cached = this.labelHashes[decl];
    if (cached !== undefined) return cached;
    const hash = mkMix(17, 3, this.manager.funcDecls[decl].smallId) & 63;
    setAt(this.labelHashes, decl, hash);
    return hash;
  }

  // enode::set_lbl_hash: a ground term of a pattern hashes its id, and its root's labels take it.
  // The context's trail undoes both. Z3 pops it after the matcher's trail, so the labels of a root
  // can keep a hash that a merge undone by the matcher's trail added.
  private setLblHash(node: Enode) {
    const hash = hashU(this.manager.ids[node.owner]) & 63;
    node.lblHash = hash;
    this.context.pushTrail(() => {
      node.lblHash = -1;
    });
    const root = node.root;
    if (hasHash(root.lbls, root.lblsHigh, hash)) return;
    const low = root.lbls;
    const high = root.lblsHigh;
    this.context.pushTrail(() => {
      root.lbls = low;
      root.lblsHigh = high;
    });
    if (hash < 32) root.lbls |= 1 << hash;
    else root.lblsHigh |= 1 << hash;
  }

  private pushTrail(undo: () => void) {
    this.trail.push(undo);
  }

  getLblHash(node: Enode) {
    if (node.lblHash === -1) this.setLblHash(node);
    return node.lblHash;
  }

  hasWork() {
    return this.toMatch.length > 0 || this.newPatterns.length > 0;
  }

  private updateLbls(node: Enode, hash: number) {
    const root = node.root;
    if (hasHash(root.lbls, root.lblsHigh, hash)) return;
    const low = root.lbls;
    const high = root.lblsHigh;
    this.pushTrail(() => {
      root.lbls = low;
      root.lblsHigh = high;
    });
    if (hash < 32) root.lbls |= 1 << hash;
    else root.lblsHigh |= 1 << hash;
  }

  private updateChildrenPlbls(node: Enode, hash: number) {
    for (const arg of node.args) {
      const root = arg.root;
      if (hasHash(root.plbls, root.plblsHigh, hash)) continue;
      const low = root.plbls;
      const high = root.plblsHigh;
      this.pushTrail(() => {
        root.plbls = low;
        root.plblsHigh = high;
      });
      if (hash < 32) root.plbls |= 1 << hash;
      else root.plblsHigh |= 1 << hash;
    }
  }

  private updatePlbls(decl: number) {
    if (this.plbls.has(decl)) return;
    this.plbls.add(decl);
    this.pushTrail(() => this.plbls.delete(decl));
    const hash = this.getLabelHash(decl);
    for (const node of this.context.enodesOf(decl))
      if (this.context.isRelevant(node.owner)) this.updateChildrenPlbls(node, hash);
  }

  private updateClbls(decl: number) {
    if (this.clbls.has(decl)) return;
    this.clbls.add(decl);
    this.pushTrail(() => this.clbls.delete(decl));
    const hash = this.getLabelHash(decl);
    for (const node of this.context.enodesOf(decl))
      if (this.context.isRelevant(node.owner)) this.updateLbls(node, hash);
  }

  // mk_code: the code tree of a path, which runs each candidate once.
  private mkCode(mp: MultiPattern, patternIndex: number) {
    return this.compiler.mkTree(mp.quantifier, mp.patterns, patternIndex, true);
  }

  // mk_path_tree: a chain of path tree nodes whose last one has a code for the path's pattern.
  private mkPathTree(path: Path, mp: MultiPattern): PathTree {
    const tree: PathTree = {
      label: path.label,
      argIndex: path.argIndex,
      groundArgIndex: path.groundArgIndex,
      groundArg: path.groundArg,
      filter: 0,
      filterHigh: 0,
      code: null,
      firstChild: null,
      sibling: null,
      todo: null,
    };
    const hash = this.getLabelHash(path.label);
    if (hash < 32) tree.filter = 1 << hash;
    else tree.filterHigh = 1 << hash;
    if (path.child === null) tree.code = this.mkCode(mp, path.patternIndex);
    else tree.firstChild = this.mkPathTree(path.child, mp);
    return tree;
  }

  // compiler::insert for path trees.
  private insertPath(head: PathTree, path: Path, mp: MultiPattern) {
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
        this.insertPath(found.firstChild, path.child, mp);
      else if (path.child !== null) {
        found.firstChild = this.mkPathTree(path.child, mp);
        this.pushTrail(() => {
          found.firstChild = null;
        });
      } else if (found.code !== null)
        this.compiler.insert(found.code, mp.quantifier, mp.patterns, path.patternIndex, false);
      else {
        found.code = this.mkCode(mp, path.patternIndex);
        this.pushTrail(() => {
          found.code = null;
        });
      }
      return;
    }
    const previous = last;
    previous.sibling = this.mkPathTree(path, mp);
    this.pushTrail(() => {
      previous.sibling = null;
    });
    if (isLabelFound) return;
    const low = head.filter;
    const high = head.filterHigh;
    this.pushTrail(() => {
      head.filter = low;
      head.filterHigh = high;
    });
    const hash = this.getLabelHash(path.label);
    if (hash < 32) head.filter |= 1 << hash;
    else head.filterHigh |= 1 << hash;
  }

  private updatePc(firstHash: number, secondHash: number, path: Path, mp: MultiPattern) {
    const key = firstHash * 64 + secondHash;
    const existing = this.pc.get(key);
    if (existing !== undefined) {
      this.insertPath(existing, path, mp);
      return;
    }
    this.pc.set(key, this.mkPathTree(path, mp));
    this.pushTrail(() => this.pc.delete(key));
  }

  private insertPpPath(entry: (PathTree | null)[], index: number, path: Path, mp: MultiPattern) {
    const existing = entry[index];
    if (existing !== null) {
      this.insertPath(existing, path, mp);
      return;
    }
    entry[index] = this.mkPathTree(path, mp);
    this.pushTrail(() => {
      entry[index] = null;
    });
  }

  private updatePp(
    inputFirstHash: number,
    inputSecondHash: number,
    inputFirst: Path,
    inputSecond: Path,
    mp: MultiPattern,
  ) {
    const isSwapped = inputFirstHash > inputSecondHash;
    const firstHash = isSwapped ? inputSecondHash : inputFirstHash;
    const secondHash = isSwapped ? inputFirstHash : inputSecondHash;
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const key = firstHash * 64 + secondHash;
    let entry = this.pp.get(key);
    if (entry === undefined) {
      entry = [null, null];
      this.pp.set(key, entry);
      this.pushTrail(() => this.pp.delete(key));
    }
    if (firstHash === secondHash) {
      this.insertPpPath(entry, 0, first, mp);
      if (!isEqualPath(first, second)) this.insertPpPath(entry, 0, second, mp);
      return;
    }
    this.insertPpPath(entry, 0, first, mp);
    this.insertPpPath(entry, 1, second, mp);
  }

  getGroundEnode(expr: number, quantifier: number) {
    const context = this.context;
    if (!context.isEInternalized(expr))
      context.internalize(expr, false, context.qmanager.getGeneration(quantifier));
    return context.getEnode(expr) ?? null;
  }

  private updateFilters(
    pattern: number,
    parentPath: Path | null,
    patternIndex: number,
    varPaths: Path[][],
    mp: MultiPattern,
  ) {
    const manager = this.manager;
    const args = manager.args[pattern];
    const groundArgIndex = args.findIndex((arg) => manager.isGround(arg));
    const groundArg =
      groundArgIndex === -1 ? null : this.getGroundEnode(args[groundArgIndex], mp.quantifier);
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
            this.getLabelHash(existing.label),
            this.getLabelHash(path.label),
            existing,
            path,
            mp,
          );
        }
        if (!isFound) paths.push(path);
        continue;
      }
      if (manager.isGround(child)) {
        const node = this.getGroundEnode(child, mp.quantifier);
        if (node === null) continue;
        this.updatePlbls(label);
        this.updatePc(this.getLabelHash(label), this.getLblHash(node), path, mp);
        continue;
      }
      const childLabel = manager.decls[child];
      this.updatePlbls(label);
      this.updateClbls(childLabel);
      this.updatePc(this.getLabelHash(label), this.getLabelHash(childLabel), path, mp);
      this.updateFilters(child, path, patternIndex, varPaths, mp);
    }
  }

  addPattern(quantifier: number, patterns: number[]) {
    const manager = this.manager;
    if (patterns.every((pattern) => manager.isGround(pattern))) return;
    if (patterns.some((pattern) => manager.hasQuantifierFlags[pattern])) return;
    const mp = { quantifier, patterns };
    const numDecls = manager.getQuantifier(quantifier).sorts.length;
    const varPaths: Path[][] = Array.from({ length: numDecls }, () => []);
    patterns.forEach((pattern, index) => this.updateFilters(pattern, null, index, varPaths, mp));
    this.collectGroundExprs(quantifier, patterns);
    this.newPatterns.push(mp);
    // code_tree_map::add_pattern for each pattern as the first one.
    patterns.forEach((pattern, firstIndex) => {
      if (manager.isGround(pattern)) return;
      const label = manager.decls[pattern];
      const tree = this.trees.get(label);
      if (tree !== undefined) {
        if (tree.numArgs === manager.args[pattern].length)
          this.compiler.insert(tree, quantifier, patterns, firstIndex, false);
        return;
      }
      this.trees.set(label, this.compiler.mkTree(quantifier, patterns, firstIndex, false));
      this.pushTrail(() => this.trees.delete(label));
    });
  }

  // collect_ground_exprs: the ground patterns become relevant enodes, and the ground subterms of the
  // other patterns become enodes that theory combination treats as shared.
  private collectGroundExprs(quantifier: number, patterns: number[]) {
    const manager = this.manager;
    const todo: number[] = [];
    for (const pattern of patterns) {
      if (!manager.isGround(pattern)) {
        todo.push(pattern);
        continue;
      }
      const node = this.getGroundEnode(pattern, quantifier);
      if (node === null) continue;
      this.context.markAsRelevant(node.owner);
      this.addSharedEnode(node);
    }
    for (let term = todo.pop(); term !== undefined; term = todo.pop()) {
      if (manager.isGround(term)) {
        const node = this.getGroundEnode(term, quantifier);
        if (node !== null) this.addSharedEnode(node);
      } else
        for (const arg of manager.args[term]) if (manager.kinds[arg] !== KIND_VAR) todo.push(arg);
    }
  }

  private addSharedEnode(node: Enode) {
    if (this.sharedEnodes.has(node)) return;
    this.sharedEnodes.add(node);
    this.context.pushTrail(() => this.sharedEnodes.delete(node));
  }

  isShared(node: Enode) {
    return this.sharedEnodes.has(node);
  }

  // add_candidate, with compress_candidates, which keeps the first of each candidate once there are
  // many, as match does.
  private addCandidateTo(tree: CodeTree, node: Enode) {
    if (tree.candidates.length === 0) this.toMatch.push(tree);
    tree.candidates.push(node);
    if (tree.candidates.length < tree.candidateGcThreshold) return;
    tree.candidates = [...new Set(tree.candidates)];
    if (2 * tree.candidates.length > tree.candidateGcThreshold) tree.candidateGcThreshold *= 2;
  }

  relevantEh(node: Enode, isLazy: boolean) {
    if (node.lblHash !== -1) this.updateLbls(node, node.lblHash);
    if (node.args.length === 0) return;
    const hash = this.getLabelHash(node.decl);
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
  // once per level, and hands the terms where a path ends to that path's code. The mark of a parent
  // says it was visited at this level, and the second mark of a root says it is queued for the next.
  private collectParents(start: Enode, head: PathTree | null | undefined) {
    if (head === null || head === undefined) return;
    const context = this.context;
    const levels: PathTree[] = [head];
    const visitedParents = this.visitedParents;
    const queuedRoots = this.queuedRoots;
    head.todo = [start];
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      const nodes = level.todo ?? [];
      level.todo = null;
      const filter = level.filter;
      const filterHigh = level.filterHigh;
      for (const node of nodes) {
        const child = node.root;
        if ((child.plbls & filter) === 0 && (child.plblsHigh & filterHigh) === 0) continue;
        for (const parent of child.parents) {
          if (parent.isEq) continue;
          const label = parent.decl;
          const parentRoot = parent.root;
          if (
            !hasHash(filter, filterHigh, this.getLabelHash(label)) ||
            parent.isMarked ||
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
            if (next.todo === null) {
              next.todo = [];
              levels.push(next);
            }
            if (!parentRoot.isMarked2) next.todo.push(parentRoot);
          }
          parent.isMarked = true;
          visitedParents.push(parent);
          if (!parentRoot.isMarked2) {
            parentRoot.isMarked2 = true;
            queuedRoots.push(parentRoot);
          }
        }
      }
      for (const parent of visitedParents) parent.isMarked = false;
      for (const root of queuedRoots) root.isMarked2 = false;
      visitedParents.length = 0;
      queuedRoots.length = 0;
    }
  }

  private processPc(r1: Enode, r2: Enode) {
    if ((r1.plbls === 0 && r1.plblsHigh === 0) || (r2.lbls === 0 && r2.lblsHigh === 0)) return;
    for (let parentHash = 0; parentHash < 64; parentHash++) {
      if (!hasHash(r1.plbls, r1.plblsHigh, parentHash)) continue;
      if (this.context.checkCanceled()) return;
      for (let childHash = 0; childHash < 64; childHash++)
        if (hasHash(r2.lbls, r2.lblsHigh, childHash))
          this.collectParents(r1, this.pc.get(parentHash * 64 + childHash));
    }
  }

  private processPp(r1: Enode, r2: Enode) {
    if ((r1.plbls === 0 && r1.plblsHigh === 0) || (r2.plbls === 0 && r2.plblsHigh === 0)) return;
    for (let firstHash = 0; firstHash < 64; firstHash++) {
      if (!hasHash(r1.plbls, r1.plblsHigh, firstHash)) continue;
      if (this.context.checkCanceled()) return;
      for (let secondHash = 0; secondHash < 64; secondHash++) {
        if (!hasHash(r2.plbls, r2.plblsHigh, secondHash)) continue;
        const isSwapped = firstHash > secondHash;
        const lowHash = isSwapped ? secondHash : firstHash;
        const highHash = isSwapped ? firstHash : secondHash;
        const lowRoot = isSwapped ? r2 : r1;
        const highRoot = isSwapped ? r1 : r2;
        const entry = this.pp.get(lowHash * 64 + highHash);
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

  // add_eq_eh: r2's labels take r1's after the paths are followed.
  addEqEh(r1: Enode, r2: Enode) {
    this.r1 = r1;
    this.r2 = r2;
    this.processPc(r1, r2);
    this.processPc(r2, r1);
    this.processPp(r1, r2);
    this.r1 = null;
    this.r2 = null;
    const lbls = r2.lbls;
    const lblsHigh = r2.lblsHigh;
    const plbls = r2.plbls;
    const plblsHigh = r2.plblsHigh;
    this.pushTrail(() => {
      r2.lbls = lbls;
      r2.lblsHigh = lblsHigh;
      r2.plbls = plbls;
      r2.plblsHigh = plblsHigh;
    });
    r2.lbls |= r1.lbls;
    r2.lblsHigh |= r1.lblsHigh;
    r2.plbls |= r1.plbls;
    r2.plblsHigh |= r1.plblsHigh;
  }

  match() {
    for (const tree of this.toMatch) {
      if (!this.interpreter.execute(tree)) return;
      tree.candidates = [];
    }
    this.toMatch = [];
    if (this.newPatterns.length > 0) this.matchNewPatterns();
  }

  // match_new_patterns: one temporary tree per label, in the order the labels first appear, run
  // against the relevant terms with the label.
  private matchNewPatterns() {
    const context = this.context;
    const manager = this.manager;
    const tmpTrees = new Map<number, CodeTree>();
    for (const mp of this.newPatterns) {
      if (context.checkCanceled()) break;
      const label = manager.decls[mp.patterns[0]];
      if (context.enodesOf(label).length === 0) continue;
      const tree = tmpTrees.get(label);
      if (tree === undefined)
        tmpTrees.set(label, this.compiler.mkTree(mp.quantifier, mp.patterns, 0, false));
      else this.compiler.insert(tree, mp.quantifier, mp.patterns, 0, true);
    }
    for (const entry of tmpTrees) {
      const nodes = context.enodesOf(entry[0]);
      for (let index = 0; index < nodes.length; index++)
        if (context.isRelevant(nodes[index].owner))
          this.interpreter.executeCore(entry[1], nodes[index]);
    }
    this.newPatterns = [];
  }

  // rematch: every code tree, in the order of their labels' small ids, against every relevant term.
  rematch() {
    const context = this.context;
    const funcDecls = this.manager.funcDecls;
    const entries = [...this.trees].sort(
      (left, right) => funcDecls[left[0]].smallId - funcDecls[right[0]].smallId,
    );
    for (const entry of entries) {
      const tree = entry[1];
      const nodes = context.enodesOf(entry[0]);
      for (let index = 0; index < nodes.length; index++)
        if (context.isRelevant(nodes[index].owner))
          this.interpreter.executeCore(tree, nodes[index]);
    }
  }

  pushScope() {
    this.trailScopes.push(this.trail.length);
  }

  popScope(numScopes: number) {
    for (const tree of this.toMatch) tree.candidates = [];
    this.toMatch = [];
    this.newPatterns = [];
    const limit = this.trailScopes[this.trailScopes.length - numScopes];
    for (let index = this.trail.length - 1; index >= limit; index--) this.trail[index]();
    shrink(this.trail, limit);
    shrink(this.trailScopes, this.trailScopes.length - numScopes);
  }
}
