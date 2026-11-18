import { OP_AND, OP_NOT, OP_OR, SORT_BOOL, type AstManager } from "./ast";
import type { ProtoModel } from "./proto-model";
import { RefVector } from "./ref-vector";

// A dependency is a leaf, which holds an expression, or the join of two dependencies.
export interface Dependency {
  value: number;
  children: Dependency[];
}

export const mkDependencyLeaf = (value: number): Dependency => ({ value, children: [] });

export const joinDependencies = (
  first: Dependency | undefined,
  second: Dependency | undefined,
): Dependency | undefined =>
  first === undefined
    ? second
    : second === undefined || first === second
      ? first
      : { value: -1, children: [first, second] };

export const getDependencyValues = (dependency: Dependency | undefined) => {
  if (dependency === undefined) return [];
  const todo = [dependency];
  const marked = new Set(todo);
  const values: number[] = [];
  for (let head = 0; head < todo.length; head++) {
    const current = todo[head];
    if (current.children.length === 0) values.push(current.value);
    for (const child of current.children)
      if (!marked.has(child)) {
        marked.add(child);
        todo.push(child);
      }
  }
  return [...new Set(values)];
};

interface Polarized {
  expr: number;
  isPositive: boolean;
}

const PRECISE = 0;
export const UNDER = 1;
export const OVER = 2;
const UNDER_OVER = 3;

export const PRECISION_NAMES = ["precise", "under", "over", "under-over"];

const getPrecisionUnion = (first: number, second: number) =>
  first === PRECISE ? second : second === PRECISE || first === second ? first : UNDER_OVER;

// A definition of -1 hides the declaration.
export interface Definition {
  decl: number;
  def: number;
}

// Each list of converters holds a reference to its converters, as a model_converter_ref does.
interface HiddenDecl {
  decl: number;
  refs: number;
}

interface Definitions {
  definitions: Definition[];
  refs: number;
}

interface ModelConversion {
  convert: (model: ProtoModel) => ProtoModel;
  release: () => void;
  refs: number;
}

export const incConverterRefs = (converters: Goal["converters"]) => {
  for (const converter of converters) converter.refs++;
};

// concat_model_converter frees its second converter before its first, and
// generic_model_converter frees each entry's definition before its declaration.
export const decConverterRefs = (manager: AstManager, converters: Goal["converters"]) => {
  for (let index = converters.length - 1; index >= 0; index--) {
    const converter = converters[index];
    converter.refs--;
    if (converter.refs > 0) continue;
    if ("convert" in converter) converter.release();
    else if ("definitions" in converter)
      for (const definition of converter.definitions) {
        if (definition.def !== -1) manager.decRef(definition.def);
        manager.decDeclRef(definition.decl);
      }
    else manager.decDeclRef(converter.decl);
  }
};

export class Goal {
  readonly forms: RefVector;
  // Kept only while unsat cores are enabled.
  dependencies: (Dependency | undefined)[] = [];
  isInconsistent = false;
  depth = 0;
  precision = PRECISE;
  converters: (HiddenDecl | Definitions | ModelConversion)[] = [];
  model: ProtoModel | undefined;
  isProofsEnabled = false;
  isModelsEnabled = true;
  isCoresEnabled = false;
  // As in Z3, it isn't copied with the goal.
  reasonUnknown = "";

  constructor(readonly manager: AstManager) {
    this.forms = new RefVector(manager);
  }

  copy() {
    const copied = new Goal(this.manager);
    copied.copyFrom(this);
    return copied;
  }

  copyFrom(source: Goal) {
    if (source === this) return;
    this.forms.reset();
    for (const form of source.forms.items) this.forms.push(form);
    this.dependencies = [...source.dependencies];
    this.depth = Math.max(this.depth, source.depth);
    this.isInconsistent = source.isInconsistent;
    this.precision = getPrecisionUnion(source.precision, this.precision);
    incConverterRefs(source.converters);
    decConverterRefs(this.manager, this.converters);
    this.converters = source.converters;
    this.isProofsEnabled = source.isProofsEnabled;
    this.isModelsEnabled = source.isModelsEnabled;
    this.isCoresEnabled = source.isCoresEnabled;
  }

  reset() {
    this.forms.reset();
    this.dependencies = [];
    this.isInconsistent = false;
  }

  resetAll() {
    this.reset();
    this.depth = 0;
    this.precision = PRECISE;
  }

  releaseConverters() {
    decConverterRefs(this.manager, this.converters);
    this.converters = [];
  }

  updatePrecision(precision: number) {
    this.precision = getPrecisionUnion(this.precision, precision);
  }

  addConverter(decl: number) {
    this.manager.incDeclRef(decl);
    this.converters = [...this.converters, { decl, refs: 1 }];
  }

  addDefinitions(definitions: Definition[]) {
    for (const definition of definitions) {
      this.manager.incDeclRef(definition.decl);
      if (definition.def !== -1) this.manager.incRef(definition.def);
    }
    this.converters = [...this.converters, { definitions, refs: 1 }];
  }

  addModelConversion(convert: (model: ProtoModel) => ProtoModel, release: () => void) {
    this.converters = [...this.converters, { convert, release, refs: 1 }];
  }

  getDependency(index: number) {
    return this.dependencies[index];
  }

  isDecidedSat() {
    return this.forms.size === 0 && (this.precision === PRECISE || this.precision === UNDER);
  }

  isDecidedUnsat() {
    return this.isInconsistent && (this.precision === PRECISE || this.precision === OVER);
  }

  isDecided() {
    return this.isDecidedSat() || this.isDecidedUnsat();
  }

  private pushBack(form: number, dependency: Dependency | undefined) {
    const manager = this.manager;
    if (manager.isTrue(form)) return;
    if (manager.isFalse(form)) {
      this.forms.reset();
      this.dependencies = [];
      this.isInconsistent = true;
    }
    this.forms.push(form);
    if (this.isCoresEnabled) this.dependencies.push(dependency);
  }

  // The formula comes with a reference, and so does the result. The negations it creates are held
  // until it returns.
  private quickProcess(form: number, isSavingFirst: boolean, dependency: Dependency | undefined) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (
      op !== OP_AND &&
      !(manager.isNot(form) && manager.getOp(manager.getArg(form, 0)) === OP_OR)
    ) {
      if (!isSavingFirst) this.pushBack(form, dependency);
      return form;
    }
    let first = form;
    let isSaving = isSavingFirst;
    const created = new RefVector(manager);
    const todo: Polarized[] = [{ expr: form, isPositive: true }];
    for (let item = todo.pop(); item !== undefined && !this.isInconsistent; item = todo.pop()) {
      const itemOp = manager.getOp(item.expr);
      if ((item.isPositive && itemOp === OP_AND) || (!item.isPositive && itemOp === OP_OR))
        for (let index = manager.getNumArgs(item.expr) - 1; index >= 0; index--)
          todo.push({ expr: manager.getArg(item.expr, index), isPositive: item.isPositive });
      else if (manager.isNot(item.expr))
        todo.push({ expr: manager.getArg(item.expr, 0), isPositive: !item.isPositive });
      else {
        const leaf = item.isPositive ? item.expr : manager.mkApp(OP_NOT, [item.expr], SORT_BOOL);
        if (!item.isPositive) created.push(leaf);
        if (isSaving) {
          manager.incRef(leaf);
          manager.decRef(first);
          first = leaf;
          isSaving = false;
        } else this.pushBack(leaf, dependency);
      }
    }
    created.reset();
    return first;
  }

  assert(form: number, dependency?: Dependency) {
    const manager = this.manager;
    manager.incRef(form);
    if (!this.isInconsistent) {
      manager.incRef(form);
      manager.decRef(this.quickProcess(form, false, dependency));
    }
    manager.decRef(form);
  }

  // When the first conjunct is false, Z3 adds the whole formula (goal.cpp:312), where this adds false.
  update(index: number, form: number, dependency?: Dependency) {
    const manager = this.manager;
    if (this.isInconsistent) return;
    manager.incRef(form);
    const first = this.quickProcess(form, true, dependency);
    if (!this.isInconsistent) {
      if (manager.isFalse(first)) this.pushBack(first, dependency);
      else {
        this.forms.set(index, first);
        if (this.isCoresEnabled) this.dependencies[index] = dependency;
      }
    }
    manager.decRef(first);
  }

  private shrink(size: number) {
    while (this.forms.size > size) this.forms.pop();
    this.dependencies.length = Math.min(this.dependencies.length, size);
  }

  elimTrue() {
    const manager = this.manager;
    let kept = 0;
    for (const [index, form] of [...this.forms.items].entries()) {
      if (manager.isTrue(form)) continue;
      if (index !== kept) this.move(index, kept, form);
      kept++;
    }
    this.shrink(kept);
  }

  private move(from: number, to: number, form: number) {
    this.forms.set(to, form);
    if (this.isCoresEnabled) this.dependencies[to] = this.dependencies[from];
  }

  // The marks hold the literals until it returns.
  elimRedundancies() {
    const manager = this.manager;
    if (this.isInconsistent) return;
    const negatives = new RefVector(manager);
    const positives = new RefVector(manager);
    let kept = 0;
    for (const [index, form] of [...this.forms.items].entries()) {
      if (manager.isTrue(form)) continue;
      const isNegated = manager.isNot(form);
      const atom = isNegated ? manager.getArg(form, 0) : form;
      const same = isNegated ? negatives : positives;
      if (same.items.includes(atom)) continue;
      if ((isNegated ? positives : negatives).items.includes(atom)) {
        const complement = this.forms.items.findIndex((other) =>
          isNegated ? other === atom : manager.isNot(other) && manager.getArg(other, 0) === atom,
        );
        this.pushBack(
          manager.falseExpr,
          joinDependencies(this.dependencies[complement], this.dependencies[index]),
        );
        break;
      }
      same.push(atom);
      if (index !== kept) this.move(index, kept, form);
      kept++;
    }
    if (!this.isInconsistent) this.shrink(kept);
    positives.reset();
    negatives.reset();
  }
}
