// Ported from Z3 (src/muz/spacer/spacer_manager.cpp, src/muz/spacer/spacer_sym_mux.cpp), MIT
// license, see z3-license.txt.
import { type AstManager, getSymbolName, KIND_APP } from "../ast";
import { RewriterTpl } from "../rewriter-tpl";
import { pin } from "./spacer-util";

interface MuxEntry {
  main: number;
  variants: number[];
}

class ShiftRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private shift: (decl: number) => number | undefined,
  ) {
    super(manager);
  }

  getSubst(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP) return undefined;
    const target = this.shift(manager.decls[expr]);
    if (target === undefined) return undefined;
    return pin(manager, manager.mkApp(target, manager.getArgs(expr), manager.sorts[expr]));
  }
}

// The n (index 0) and o (index i + 1) variants of the predicate signatures and spacer's own
// constants. Z3's manager hash-conses the declarations by name, so the variants are kept here.
export class SpacerManager {
  private decls = new Map<string, number>();
  private entries = new Map<number, MuxEntry>();
  private muxes = new Map<number, { entry: MuxEntry; index: number }>();

  constructor(readonly manager: AstManager) {}

  mkFuncDecl(name: string, domain: number[], range: number) {
    const key = `${name}|${domain.join(",")}|${range}`;
    const existing = this.decls.get(key);
    if (existing !== undefined) return existing;
    const decl = this.manager.mkFuncDecl(name, domain, range);
    this.manager.incDeclRef(decl);
    this.decls.set(key, decl);
    return decl;
  }

  mkConst(name: string, sort: number) {
    return pin(this.manager, this.manager.mkApp(this.mkFuncDecl(name, [], sort), [], sort));
  }

  constOf(decl: number) {
    return pin(this.manager, this.manager.mkApp(decl, [], this.manager.funcDecls[decl].range));
  }

  private mkVariant(decl: number, index: number) {
    const funcDecl = this.manager.funcDecls[decl];
    const name = `${getSymbolName(funcDecl.name)}_${index === 0 ? "n" : String(index - 1)}`;
    return this.mkFuncDecl(name, funcDecl.domain, funcDecl.range);
  }

  private ensureCapacity(entry: MuxEntry, size: number) {
    while (entry.variants.length < size) {
      const index = entry.variants.length;
      const variant = this.mkVariant(entry.main, index);
      entry.variants.push(variant);
      this.muxes.set(variant, { entry, index });
    }
  }

  private findByDecl(decl: number, index: number) {
    let entry = this.entries.get(decl);
    if (entry === undefined) {
      entry = { main: decl, variants: [] };
      this.entries.set(decl, entry);
      this.ensureCapacity(entry, 2);
    }
    this.ensureCapacity(entry, index + 1);
    return entry.variants[index];
  }

  getOPred(decl: number, index: number) {
    return this.findByDecl(decl, index + 1);
  }

  getNPred(decl: number) {
    return this.findByDecl(decl, 0);
  }

  private shiftDecl(decl: number, target: number) {
    const mux = this.muxes.get(decl);
    if (mux === undefined) return undefined;
    this.ensureCapacity(mux.entry, target + 1);
    return mux.entry.variants[target];
  }

  o2n(decl: number) {
    return this.shiftDecl(decl, 0) ?? decl;
  }

  o2o(decl: number, targetIndex: number) {
    return this.shiftDecl(decl, targetIndex + 1) ?? decl;
  }

  n2o(decl: number, oIndex: number) {
    return this.shiftDecl(decl, oIndex + 1) ?? decl;
  }

  private shiftExpr(expr: number, sourceIndex: number, targetIndex: number) {
    if (sourceIndex === targetIndex) return expr;
    const rewriter = new ShiftRewriter(this.manager, (decl) => {
      const mux = this.muxes.get(decl);
      return mux === undefined || mux.index !== sourceIndex
        ? undefined
        : this.shiftDecl(decl, targetIndex);
    });
    const result = rewriter.rewrite(pin(this.manager, expr));
    rewriter.release();
    return result;
  }

  formulaO2n(expr: number, oIndex: number) {
    return this.shiftExpr(expr, oIndex + 1, 0);
  }

  formulaN2o(expr: number, oIndex: number) {
    return this.shiftExpr(expr, 0, oIndex + 1);
  }
}
