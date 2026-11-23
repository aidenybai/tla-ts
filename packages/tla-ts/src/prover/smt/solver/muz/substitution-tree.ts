import { SmtInvariantError } from "../../../../errors";
import { type AstManager, KIND_APP, KIND_VAR } from "../ast";
import type { Binding, Substitution } from "./substitution";

type Subst = [number, number];

export interface StVisitor {
  readonly subst: Substitution;
  visit(expr: number): boolean;
}

interface Leaf {
  kind: "leaf";
  expr: number;
}

interface Inner {
  kind: "inner";
  firstChild: Node;
}

const IN_OFFSET = 0;
const ST_OFFSET = 1;
const REG_OFFSET = 2;

class Node {
  subst: Subst[] = [];
  nextSibling: Node | undefined;

  constructor(public body: Leaf | Inner) {}
}

export class SubstitutionTree {
  private roots: (Node | undefined)[] = [];
  private registers: number[] = [];
  private nextRegister = 0;
  private usedRegs: boolean[] = [];
  private todo: number[] = [];
  private bstack: Node[] = [];
  private visitTodo: [Binding, Binding][] = [];

  constructor(private manager: AstManager) {}

  private nextReg() {
    for (;;) {
      const current = this.nextRegister;
      this.nextRegister++;
      if (current >= this.usedRegs.length || !this.usedRegs[current]) return current;
    }
  }

  private push(substs: Subst[], subst: Subst) {
    substs.push(subst);
    this.manager.incRef(subst[0]);
    this.manager.incRef(subst[1]);
  }

  private getRegValue(register: number) {
    return this.registers[register] ?? -1;
  }

  private setRegValue(register: number, expr: number) {
    while (this.registers.length <= register) this.registers.push(-1);
    this.registers[register] = expr;
  }

  private eraseRegFromTodo(register: number) {
    this.registers[register] = -1;
    this.todo.splice(this.todo.indexOf(register), 1);
  }

  private linearize(result: Subst[]) {
    const manager = this.manager;
    const newArgs: number[] = [];
    for (let index = 0; index < this.todo.length; index++) {
      const inputRegister = this.todo[index];
      const expr = this.getRegValue(inputRegister);
      const register = manager.mkVar(inputRegister, manager.sorts[expr]);
      if (manager.kinds[expr] === KIND_VAR) {
        this.push(result, [register, expr]);
        continue;
      }
      const numArgs = manager.getNumArgs(expr);
      let newApp = expr;
      if (numArgs !== 0) {
        for (let argIndex = 0; argIndex < numArgs; argIndex++) {
          const outputRegister = this.nextReg();
          this.setRegValue(outputRegister, manager.getArg(expr, argIndex));
          this.todo.push(outputRegister);
          newArgs.push(
            manager.mkVar(outputRegister, manager.sorts[this.getRegValue(outputRegister)]),
          );
        }
        newApp = manager.mkApp(manager.decls[expr], newArgs, manager.sorts[expr]);
        newArgs.length = 0;
      }
      this.push(result, [register, newApp]);
    }
  }

  private processArgs(input: number, output: number) {
    const manager = this.manager;
    const numArgs = manager.getNumArgs(output);
    for (let index = 0; index < numArgs; index++) {
      const outputRegister = manager.values[manager.getArg(output, index)];
      this.setRegValue(outputRegister, manager.getArg(input, index));
      this.todo.push(outputRegister);
    }
  }

  private resetRegisters(oldSize: number) {
    for (let index = oldSize; index < this.todo.length; index++)
      this.registers[this.todo[index]] = -1;
    this.todo.length = oldSize;
  }

  private isSameDecl(input: number, output: number) {
    const manager = this.manager;
    return (
      input !== -1 &&
      manager.kinds[input] === KIND_APP &&
      manager.decls[input] === manager.decls[output] &&
      (manager.getNumArgs(output) !== 0 || input === output)
    );
  }

  private getCompatibilityMeasure(substs: readonly Subst[]) {
    const manager = this.manager;
    const oldSize = this.todo.length;
    let measure = 0;
    for (const subst of substs) {
      const output = subst[1];
      const input = this.getRegValue(manager.values[subst[0]]);
      if (manager.kinds[output] === KIND_VAR) {
        if (output === input) measure += 1;
      } else if (this.isSameDecl(input, output)) {
        measure += 2;
        this.processArgs(input, output);
      }
    }
    this.resetRegisters(oldSize);
    return measure;
  }

  private findBestChild(root: Inner) {
    let bestChild: Node | undefined;
    let maxMeasure = 0;
    for (
      let child: Node | undefined = root.firstChild;
      child !== undefined;
      child = child.nextSibling
    ) {
      const measure = this.getCompatibilityMeasure(child.subst);
      if (measure > maxMeasure) {
        bestChild = child;
        maxMeasure = measure;
      }
    }
    return bestChild;
  }

  private resetCompiler() {
    this.todo.length = 0;
    this.usedRegs.length = 0;
    this.nextRegister = 1;
  }

  private mkNodeFor(newExpr: number) {
    const node = new Node({ kind: "leaf", expr: newExpr });
    this.linearize(node.subst);
    this.manager.incRef(newExpr);
    return node;
  }

  private markUsedReg(register: number) {
    while (this.usedRegs.length <= register) this.usedRegs.push(false);
    this.usedRegs[register] = true;
  }

  private markUsedRegs(substs: readonly Subst[]) {
    const manager = this.manager;
    for (const subst of substs) {
      this.markUsedReg(manager.values[subst[0]]);
      if (manager.kinds[subst[1]] !== KIND_APP) continue;
      for (const arg of manager.getArgs(subst[1])) this.markUsedReg(manager.values[arg]);
    }
  }

  insert(newExpr: number) {
    const manager = this.manager;
    this.resetCompiler();
    this.setRegValue(0, newExpr);
    this.todo.push(0);
    const id = manager.getDeclId(newExpr);
    const existing = this.roots[id];
    if (existing === undefined) {
      this.roots[id] = this.mkNodeFor(newExpr);
      this.resetRegisters(0);
      return;
    }
    let root = existing;
    for (;;) {
      const compatible: Subst[] = [];
      const incompatible: Subst[] = [];
      for (const subst of root.subst) {
        const register = manager.values[subst[0]];
        const output = subst[1];
        const input = this.getRegValue(register);
        if (manager.kinds[output] === KIND_VAR) {
          if (output === input) {
            this.eraseRegFromTodo(register);
            compatible.push(subst);
          } else incompatible.push(subst);
        } else if (this.isSameDecl(input, output)) {
          this.eraseRegFromTodo(register);
          compatible.push(subst);
          this.processArgs(input, output);
        } else incompatible.push(subst);
      }
      if (incompatible.length === 0) {
        if (this.todo.length === 0) {
          this.resetRegisters(0);
          return;
        }
        this.markUsedRegs(root.subst);
        const body = root.body;
        if (body.kind === "leaf")
          throw new SmtInvariantError("a substitution tree leaf with registers left to match");
        const bestChild = this.findBestChild(body);
        if (bestChild === undefined) {
          const node = this.mkNodeFor(newExpr);
          node.nextSibling = body.firstChild;
          body.firstChild = node;
          this.resetRegisters(0);
          return;
        }
        root = bestChild;
        continue;
      }
      this.markUsedRegs(compatible);
      root.subst = compatible;
      const node = this.mkNodeFor(newExpr);
      const incompatibleNode = new Node(root.body);
      incompatibleNode.subst = incompatible;
      incompatibleNode.nextSibling = node;
      root.body = { kind: "inner", firstChild: incompatibleNode };
      this.resetRegisters(0);
      return;
    }
  }

  private deleteNode(start: Node) {
    const manager = this.manager;
    const todo = [start];
    for (let node = todo.pop(); node !== undefined; node = todo.pop()) {
      for (const subst of node.subst) {
        manager.decRef(subst[0]);
        manager.decRef(subst[1]);
      }
      const body = node.body;
      if (body.kind === "leaf") manager.decRef(body.expr);
      else
        for (
          let child: Node | undefined = body.firstChild;
          child !== undefined;
          child = child.nextSibling
        )
          todo.push(child);
    }
  }

  reset() {
    for (const root of this.roots) if (root !== undefined) this.deleteNode(root);
    this.roots = [];
  }

  private backtrack(subst: Substitution) {
    while (this.bstack.length > 0) {
      subst.popScope();
      const node = this.bstack[this.bstack.length - 1];
      if (node.nextSibling !== undefined) {
        this.bstack[this.bstack.length - 1] = node.nextSibling;
        return true;
      }
      this.bstack.pop();
    }
    return false;
  }

  private find(subst: Substitution, start: Binding) {
    let binding = start;
    while (this.manager.kinds[binding.expr] === KIND_VAR) {
      const bound = subst.find(this.manager.values[binding.expr], binding.offset);
      if (bound === undefined) return binding;
      binding = bound;
    }
    return binding;
  }

  private unifyMatch(subst: Substitution, first: Binding, second: Binding) {
    const manager = this.manager;
    const todo = this.visitTodo;
    todo.length = 0;
    todo.push([first, second]);
    for (let entry = todo.pop(); entry !== undefined; entry = todo.pop()) {
      let left = this.find(subst, entry[0]);
      let right = this.find(subst, entry[1]);
      if (left.expr === right.expr && left.offset === right.offset) continue;
      const isLeftVar = manager.kinds[left.expr] === KIND_VAR;
      const isRightVar = manager.kinds[right.expr] === KIND_VAR;
      if (isLeftVar && isRightVar) {
        if (right.offset === REG_OFFSET) [left, right] = [right, left];
        subst.insertBinding(manager.values[left.expr], left.offset, right);
      } else if (isLeftVar) subst.insertBinding(manager.values[left.expr], left.offset, right);
      else if (isRightVar) subst.insertBinding(manager.values[right.expr], right.offset, left);
      else {
        const numArgs = manager.getNumArgs(left.expr);
        if (
          manager.decls[left.expr] !== manager.decls[right.expr] ||
          numArgs !== manager.getNumArgs(right.expr) ||
          (numArgs === 0 && left.expr !== right.expr)
        )
          return false;
        for (let index = numArgs - 1; index >= 0; index--)
          todo.push([
            { expr: manager.getArg(left.expr, index), offset: left.offset },
            { expr: manager.getArg(right.expr, index), offset: right.offset },
          ]);
      }
    }
    return true;
  }

  private visitSubsts(subst: Substitution, substs: readonly Subst[]) {
    const manager = this.manager;
    for (const entry of substs) {
      const output = entry[1];
      const outputOffset = manager.kinds[output] === KIND_VAR ? ST_OFFSET : REG_OFFSET;
      if (
        !this.unifyMatch(
          subst,
          { expr: entry[0], offset: REG_OFFSET },
          { expr: output, offset: outputOffset },
        )
      )
        return false;
    }
    return true;
  }

  private visitNode(expr: number, visitor: StVisitor, root: Node) {
    const subst = visitor.subst;
    this.bstack.length = 0;
    this.bstack.push(root);
    subst.pushScope();
    subst.insertBinding(0, REG_OFFSET, { expr, offset: IN_OFFSET });
    for (;;) {
      const node = this.bstack[this.bstack.length - 1];
      subst.pushScope();
      if (!this.visitSubsts(subst, node.subst)) {
        if (!this.backtrack(subst)) break;
        continue;
      }
      const body = node.body;
      if (body.kind === "inner") {
        this.bstack.push(body.firstChild);
        continue;
      }
      if (subst.isAcyclic() && !visitor.visit(body.expr)) {
        this.clearStack(subst);
        return false;
      }
      if (!this.backtrack(subst)) break;
    }
    this.clearStack(subst);
    return true;
  }

  private clearStack(subst: Substitution) {
    while (this.bstack.length > 0) {
      subst.popScope();
      this.bstack.pop();
    }
    subst.popScope();
  }

  unify(expr: number, visitor: StVisitor) {
    const root = this.roots[this.manager.getDeclId(expr)];
    if (root !== undefined) this.visitNode(expr, visitor, root);
  }
}
