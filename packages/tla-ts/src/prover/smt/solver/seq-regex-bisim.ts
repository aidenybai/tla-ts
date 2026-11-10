// Ported from Z3 (src/ast/rewriter/seq_regex_bisim.cpp), MIT license, see z3-license.txt.
import { type AstManager, OP_RE_XOR } from "./ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { type ReInfoCache, isReBinary, isReEmpty, mkReEmpty } from "./seq-re-util";
import type { ReRewriter } from "./seq-re-rewriter";

const STEP_BOUND = 50000;

export class RegexBisim {
  private finds: number[] = [];
  private nodes = new Map<number, number>();
  private pinned: RefVector;
  private worklist: RefVector;
  private info: ReInfoCache;

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
  ) {
    this.info = re.info.clone();
    this.pinned = new RefVector(manager);
    this.worklist = new RefVector(manager);
  }

  release() {
    this.worklist.reset();
    this.pinned.reset();
    this.info.release();
  }

  private find(node: number) {
    let root = node;
    while (this.finds[root] !== root) root = this.finds[root];
    return root;
  }

  private getNode(regex: number) {
    const existing = this.nodes.get(regex);
    if (existing !== undefined) return existing;
    const node = this.finds.length;
    this.finds.push(node);
    this.nodes.set(regex, node);
    this.pinned.push(regex);
    return node;
  }

  private getNullability(regex: number) {
    const nullable = this.re.isNullable(regex);
    return this.manager.isTrue(nullable)
      ? L_TRUE
      : this.manager.isFalse(nullable)
        ? L_FALSE
        : L_UNDEF;
  }

  private isSupported(regex: number) {
    const manager = this.manager;
    return (
      manager.isReSort(manager.sorts[regex]) &&
      this.info.getInfo(regex).isKnown &&
      manager.isGround(regex)
    );
  }

  private isClassicalDistinguishing(leaf: number) {
    const manager = this.manager;
    if (isReBinary(manager, leaf, OP_RE_XOR)) {
      const first = this.info.getInfo(manager.getArg(leaf, 0));
      const second = this.info.getInfo(manager.getArg(leaf, 1));
      return (
        first.isKnown &&
        second.isKnown &&
        first.isClassical &&
        second.isClassical &&
        first.lo !== second.lo
      );
    }
    if (isReEmpty(manager, leaf)) return false;
    const info = this.info.getInfo(leaf);
    return info.isKnown && info.isClassical;
  }

  private mergeLeaf(leaf: number) {
    const manager = this.manager;
    const isXor = isReBinary(manager, leaf, OP_RE_XOR);
    const first = isXor ? manager.getArg(leaf, 0) : mkReEmpty(manager, manager.sorts[leaf]);
    const second = isXor ? manager.getArg(leaf, 1) : leaf;
    if (!isXor) this.pinned.push(first);
    const firstRoot = this.find(this.getNode(first));
    const secondRoot = this.find(this.getNode(second));
    if (firstRoot === secondRoot) return false;
    this.finds[firstRoot] = secondRoot;
    return true;
  }

  areEquivalent(first: number, second: number) {
    const manager = this.manager;
    if (!this.isSupported(first) || !this.isSupported(second)) return L_UNDEF;
    if (first === second) return L_TRUE;
    this.finds.length = 0;
    this.nodes.clear();
    this.pinned.reset();
    this.worklist.reset();
    const start = this.re.mkReXorSimplified(first, second);
    if (isReEmpty(manager, start)) return L_TRUE;
    const startNullability = this.getNullability(start);
    if (startNullability === L_TRUE) return L_FALSE;
    if (startNullability === L_UNDEF) return L_UNDEF;
    if (this.isClassicalDistinguishing(start)) return L_FALSE;
    if (!this.mergeLeaf(start)) return L_TRUE;
    this.worklist.push(start);
    const derive = this.re.getDerive();
    for (let steps = 1; this.worklist.size > 0; steps++) {
      if (steps > STEP_BOUND) return L_UNDEF;
      const regex = this.worklist.items[this.worklist.size - 1];
      manager.incRef(regex);
      this.worklist.pop();
      const cofactors = new RefVector(manager);
      derive.derivativeCofactors(regex, cofactors);
      const leaves = cofactors.items.filter((_, index) => index % 2 === 1);
      const status = this.areLeavesEquivalent(leaves);
      if (status === L_TRUE)
        for (const leaf of leaves) {
          if (!this.mergeLeaf(leaf)) continue;
          this.pinned.push(leaf);
          this.worklist.push(leaf);
        }
      cofactors.reset();
      manager.decRef(regex);
      if (status !== L_TRUE) return status;
    }
    return L_TRUE;
  }

  private areLeavesEquivalent(leaves: number[]) {
    for (const leaf of leaves) {
      const nullability = this.getNullability(leaf);
      if (nullability === L_TRUE) return L_FALSE;
      if (nullability === L_UNDEF) return L_UNDEF;
      if (this.isClassicalDistinguishing(leaf)) return L_FALSE;
    }
    return L_TRUE;
  }
}
