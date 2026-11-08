// Ported from Z3 (src/smt/theory_datatype.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_DATATYPE,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_DT_UPDATE_FIELD,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
} from "./ast";
import type { Context } from "./context";
import {
  getAccessorConstructor,
  getConstructorAccessors,
  getConstructorIndex,
  getConstructorIs,
  getDatatypeConstructors,
  getNonRecConstructor,
  getNumConstructors,
  getRecognizerConstructor,
  isRecursiveDatatype,
} from "./datatype-decl-plugin";
import { type Enode, TheoryJustification } from "./enode";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type BoolVar, type Literal, mkLiteral, negate, TRUE_LITERAL } from "./literal";
import type { ProtoModel } from "./proto-model";
import { type DependentValue, FC_CONTINUE, FC_DONE, Theory } from "./theory";

const NULL_THEORY = -1;

export class TheoryDatatype extends Theory {
  readonly name = "datatype";
  private finds: number[] = [];
  private sizes: number[] = [];
  private constructors: (Enode | null)[] = [];
  private recognizers: (Enode | null)[][] = [];
  private trail: (() => void)[] = [];
  private trailLimits: number[] = [];
  private toUnmark: Enode[] = [];
  private toUnmark2: Enode[] = [];
  private usedEqs: Enode[] = [];
  private parents = new Map<Enode, Enode>();
  private stackNodes: Enode[] = [];
  private stackIsEnter: boolean[] = [];
  private model: ProtoModel | null = null;

  constructor(context: Context) {
    super(context, FAMILY_DATATYPE);
  }

  private getOp(node: Enode) {
    return this.manager.funcDecls[node.decl].op;
  }

  private isConstructor(node: Enode) {
    return this.getOp(node) === OP_DT_CONSTRUCTOR;
  }

  private isRecognizer(node: Enode) {
    const op = this.getOp(node);
    return op === OP_DT_RECOGNISER || op === OP_DT_IS;
  }

  private isUpdateField(node: Enode) {
    return this.getOp(node) === OP_DT_UPDATE_FIELD;
  }

  private isDatatype(sort: number) {
    return this.manager.isDatatypeSort(sort);
  }

  private getSort(node: Enode) {
    return this.manager.sorts[node.owner];
  }

  private find(thVar: number) {
    let current = thVar;
    while (this.finds[current] !== current) current = this.finds[current];
    return current;
  }

  private merge(inputFirst: number, inputSecond: number) {
    const firstRoot = this.find(inputFirst);
    const secondRoot = this.find(inputSecond);
    if (firstRoot === secondRoot) return;
    const isSwapped = this.sizes[firstRoot] > this.sizes[secondRoot];
    const joining = isSwapped ? secondRoot : firstRoot;
    const root = isSwapped ? firstRoot : secondRoot;
    this.mergeEh(root, joining);
    this.finds[joining] = root;
    this.sizes[root] += this.sizes[joining];
    this.trail.push(() => {
      this.sizes[root] -= this.sizes[joining];
      this.finds[joining] = joining;
    });
  }

  private getInternalizedEnode(expr: number) {
    const node = this.context.getEnode(expr);
    if (node === undefined) throw new SmtInvariantError("the term was not internalized");
    return node;
  }

  private getNodeAssignment(node: Enode) {
    return this.context.getBoolVarAssignment(this.context.getBoolVar(node.owner));
  }

  private mkEq(first: number, second: number, isGateContext: boolean): Literal {
    if (first === second) return TRUE_LITERAL;
    const eq = this.context.mkEqAtom(first, second);
    this.context.internalize(eq, isGateContext);
    return this.context.getLiteral(eq);
  }

  private mkLiteral(expr: number) {
    const context = this.context;
    if (!context.isEInternalized(expr)) context.internalize(expr, false);
    const literal = context.getLiteral(expr);
    context.markLiteralAsRelevant(literal);
    return literal;
  }

  private mkVar(node: Enode) {
    const manager = this.manager;
    const thVar = this.varEnodes.length;
    this.varEnodes.push(node);
    this.finds.push(thVar);
    this.sizes.push(1);
    this.constructors.push(null);
    this.recognizers.push([]);
    this.context.attachThVar(node, this, thVar);
    const sort = this.getSort(node);
    if (this.isConstructor(node)) {
      this.constructors[thVar] = node;
      this.assertAccessorAxioms(node);
    } else if (this.isUpdateField(node)) this.assertUpdateFieldAxioms(node);
    else if (this.isDatatype(sort)) {
      if (getNumConstructors(manager, sort) === 1)
        this.assertIsConstructorAxiom(node, getDatatypeConstructors(manager, sort)[0], null);
      else if (manager.getSortSize(sort) !== SORT_SIZE_INFINITE) this.mkSplit(thVar);
    }
    return thVar;
  }

  private assertEqAxiom(lhs: Enode, rhs: number, antecedent: Literal | null) {
    const context = this.context;
    context.internalize(rhs, false);
    const rhsNode = this.getInternalizedEnode(rhs);
    if (antecedent === null) {
      context.pushEq(lhs, rhsNode, { kind: "axiom" });
      return;
    }
    if (context.getAssignment(antecedent) !== L_TRUE) {
      const eq = this.mkEq(lhs.owner, rhs, true);
      context.markLiteralAsRelevant(eq);
      context.markLiteralAsRelevant(antecedent);
      context.mkThAxiom([eq, negate(antecedent)]);
      return;
    }
    // The equality goes back to this theory, so the justification belongs to none.
    const justification = new TheoryJustification(NULL_THEORY, [antecedent], []);
    context.pushEq(lhs, rhsNode, { kind: "justification", justification });
  }

  private assertIsConstructorAxiom(node: Enode, constructor: number, antecedent: Literal | null) {
    const manager = this.manager;
    const expr = node.owner;
    const args = getConstructorAccessors(manager, constructor).map((accessor) =>
      manager.mkApp(accessor, [expr], manager.funcDecls[accessor].range),
    );
    this.assertEqAxiom(node, manager.mkApp(constructor, args, manager.sorts[expr]), antecedent);
  }

  private assertAccessorAxioms(node: Enode) {
    const manager = this.manager;
    getConstructorAccessors(manager, node.decl).forEach((accessor, index) => {
      const accessorApp = manager.mkApp(accessor, [node.owner], manager.funcDecls[accessor].range);
      this.assertEqAxiom(node.getArg(index), accessorApp, null);
    });
  }

  private signRecognizerConflict(constructor: Enode, recognizer: Enode) {
    const literal = negate(mkLiteral(this.context.getBoolVar(recognizer.owner)));
    this.clearMark();
    this.context.setConflict(
      new TheoryJustification(this.id, [literal], [constructor, recognizer.getArg(0)]),
      null,
    );
  }

  private assertUpdateFieldAxioms(node: Enode) {
    const context = this.context;
    const manager = this.manager;
    const own = node.owner;
    const record = manager.getArg(own, 0);
    const field = manager.funcDecls[node.decl].parameters[0];
    const constructor = getAccessorConstructor(manager, field);
    const recognizer = getConstructorIs(manager, constructor);
    const recognizerApp = manager.mkApp(recognizer, [record], SORT_BOOL);
    context.internalize(recognizerApp, false);
    const isConstructor = mkLiteral(context.getBoolVar(recognizerApp));
    for (const accessor of getConstructorAccessors(manager, constructor)) {
      const range = manager.funcDecls[accessor].range;
      const accessorApp = accessor === field ? -1 : manager.mkApp(accessor, [record], range);
      if (accessorApp !== -1) context.internalize(accessorApp, false);
      const arg = accessorApp === -1 ? node.getArg(1) : this.getInternalizedEnode(accessorApp);
      this.assertEqAxiom(arg, manager.mkApp(accessor, [own], range), isConstructor);
    }
    this.assertEqAxiom(node, record, negate(isConstructor));
    const isConstructorApp = manager.mkApp(recognizer, [own], SORT_BOOL);
    context.internalize(isConstructorApp, false);
    const literals = [negate(isConstructor), mkLiteral(context.getBoolVar(isConstructorApp))];
    context.markLiteralAsRelevant(literals[0]);
    context.markLiteralAsRelevant(literals[1]);
    context.mkThAxiom(literals);
  }

  internalizeAtom(atom: number) {
    return this.internalizeTerm(atom);
  }

  internalizeTerm(term: number) {
    const context = this.context;
    const manager = this.manager;
    const numArgs = manager.getNumArgs(term);
    const isBool = manager.isBool(term);
    for (let index = 0; index < numArgs; index++)
      context.internalize(manager.getArg(term, index), false);
    if (context.isEInternalized(term)) return true;
    const node = context.mkEnode(term, false, isBool, true);
    if (isBool) context.setVarTheory(context.mkBoolVar(term), this.id);
    if (this.isConstructor(node) || this.isUpdateField(node)) {
      for (let index = 0; index < numArgs; index++) {
        const arg = node.getArg(index);
        const sort = this.getSort(arg);
        if (manager.isArraySort(sort) && this.isDatatype(manager.getArrayRange(sort)))
          throw new SmtUnsupportedError("datatypes nested in arrays");
        if (!this.isDatatype(sort) || this.isAttachedToVar(arg)) continue;
        this.mkVar(arg);
      }
      this.mkVar(node);
    } else {
      const arg = node.getArg(0);
      if (!this.isAttachedToVar(arg)) this.mkVar(arg);
    }
    if (this.isRecognizer(node) && !context.relevancy.isEnabled)
      this.addRecognizer(node.getArg(0).getThVar(this.id), node);
    return true;
  }

  applySortCnstr(node: Enode, sort: number) {
    const manager = this.manager;
    if (
      !this.isAttachedToVar(node) &&
      (this.context.qmanager.hasQuantifiers() ||
        (this.isDatatype(sort) && manager.hasNestedRecDatatype) ||
        (this.isDatatype(sort) && manager.getSortSize(sort) !== SORT_SIZE_INFINITE))
    )
      this.mkVar(node);
  }

  newEqEh(first: number, second: number) {
    this.merge(first, second);
  }

  useDiseqs() {
    return false;
  }

  newDiseqEh() {}

  assignEh(boolVar: BoolVar, isTrue: boolean) {
    const manager = this.manager;
    const node = this.context.getEnode(this.context.boolVar2Expr[boolVar]);
    if (node === undefined || !this.isRecognizer(node)) return;
    const arg = node.getArg(0);
    const thVar = this.find(arg.getThVar(this.id));
    const constructor = this.constructors[thVar];
    const recognized = getRecognizerConstructor(manager, node.decl);
    if (isTrue) {
      if (constructor !== null && constructor.decl === recognized) return;
      this.assertIsConstructorAxiom(arg, recognized, mkLiteral(boolVar));
      return;
    }
    if (constructor === null) this.propagateRecognizer(thVar, node);
    else if (constructor.decl === recognized) this.signRecognizerConflict(constructor, node);
  }

  relevantEh(expr: number) {
    const node = this.context.getEnode(expr);
    if (node === undefined || !this.isRecognizer(node)) return;
    this.addRecognizer(node.getArg(0).getThVar(this.id), node);
  }

  pushScopeEh() {
    super.pushScopeEh();
    this.trailLimits.push(this.trail.length);
  }

  popScopeEh(numScopes: number) {
    const newLevel = this.trailLimits.length - numScopes;
    const limit = this.trailLimits[newLevel];
    for (let index = this.trail.length - 1; index >= limit; index--) this.trail[index]();
    this.trail.length = limit;
    this.trailLimits.length = newLevel;
    const numOldVars = this.getOldNumVars(numScopes);
    this.finds.length = numOldVars;
    this.sizes.length = numOldVars;
    this.constructors.length = numOldVars;
    this.recognizers.length = numOldVars;
    super.popScopeEh(numScopes);
  }

  finalCheckEh() {
    const manager = this.manager;
    this.usedEqs.length = 0;
    this.stackNodes.length = 0;
    this.stackIsEnter.length = 0;
    this.parents.clear();
    let result = FC_DONE;
    for (let thVar = 0; thVar < this.getNumVars(); thVar++) {
      if (thVar !== this.find(thVar)) continue;
      const node = this.getEnode(thVar);
      const sort = this.getSort(node);
      if (!this.isDatatype(sort)) continue;
      if (isRecursiveDatatype(manager, sort) && !node.root.isMarked2 && this.occursCheck(node)) {
        this.clearMark();
        return FC_CONTINUE;
      }
      if (this.constructors[thVar] === null) {
        this.clearMark();
        this.mkSplit(thVar);
        result = FC_CONTINUE;
      }
    }
    this.clearMark();
    return result;
  }

  private clearMark() {
    for (const node of this.toUnmark) node.isMarked = false;
    for (const node of this.toUnmark2) node.isMarked2 = false;
    this.toUnmark.length = 0;
    this.toUnmark2.length = 0;
  }

  private markOnStack(node: Enode) {
    node.root.isMarked = true;
    this.toUnmark.push(node.root);
  }

  private markCycleFree(node: Enode) {
    node.root.isMarked2 = true;
    this.toUnmark2.push(node.root);
  }

  private pushStack(node: Enode) {
    this.stackNodes.push(node, node);
    this.stackIsEnter.push(false, true);
  }

  private getConstructorOf(node: Enode) {
    const thVar = node.root.getThVar(this.id);
    return thVar < 0 ? null : this.constructors[this.find(thVar)];
  }

  private explainIsChild(parent: Enode, child: Enode) {
    const parentConstructor = this.getConstructorOf(parent);
    if (parentConstructor === null) return;
    if (parent !== parentConstructor) this.usedEqs.push(parent, parentConstructor);
    for (let index = 0; index < parentConstructor.numArgs; index++) {
      const arg = parentConstructor.getArg(index);
      if (arg.root === child.root && arg !== child) this.usedEqs.push(arg, child);
    }
  }

  private explainOccurs(inputApp: Enode, root: Enode) {
    this.explainIsChild(inputApp, root);
    let app = inputApp;
    while (app.root !== root.root) {
      const parent = this.parents.get(app.root);
      if (parent === undefined) break;
      this.explainIsChild(parent, app);
      app = parent;
    }
    if (app !== root) this.usedEqs.push(app, root);
  }

  private enterOccursCheck(app: Enode) {
    const thVar = app.root.getThVar(this.id);
    if (thVar < 0) return false;
    const parent = this.constructors[this.find(thVar)];
    if (parent === null) return false;
    this.markOnStack(parent);
    for (let index = 0; index < parent.numArgs; index++) {
      const arg = parent.getArg(index);
      if (arg.root.isMarked2) continue;
      if (arg.root.isMarked) {
        this.explainOccurs(parent, arg);
        return true;
      }
      if (this.isDatatype(this.getSort(arg))) {
        this.parents.set(arg.root, parent);
        this.pushStack(arg);
      }
    }
    return false;
  }

  private occursCheck(node: Enode) {
    let isCycle = false;
    this.pushStack(node);
    while (!isCycle && this.stackNodes.length > 0) {
      const app = this.stackNodes.pop() ?? node;
      const isEnter = this.stackIsEnter.pop();
      if (app.root.isMarked2) continue;
      if (isEnter) isCycle = this.enterOccursCheck(app);
      else this.markCycleFree(app);
    }
    if (!isCycle) return false;
    this.clearMark();
    this.context.setConflict(new TheoryJustification(this.id, [], [...this.usedEqs]), null);
    return true;
  }

  includeFuncInterp(decl: number) {
    const manager = this.manager;
    if (manager.funcDecls[decl].op !== OP_DT_ACCESSOR) return false;
    const constructor = getAccessorConstructor(manager, decl);
    return this.context.enodesOf(decl).some((app) => {
      const argConstructor = this.getConstructorOf(app.getArg(0));
      return argConstructor !== null && argConstructor.decl !== constructor;
    });
  }

  initModel(model: ProtoModel) {
    this.model = model;
  }

  mkValue(node: Enode): number | DependentValue | undefined {
    const thVar = node.getThVar(this.id);
    const constructor = thVar < 0 ? null : this.constructors[this.find(thVar)];
    if (constructor === null) return this.model?.getSomeValue(this.getSort(node));
    const dependencies: Enode[] = [];
    for (let index = 0; index < constructor.numArgs; index++)
      dependencies.push(constructor.getArg(index));
    const manager = this.manager;
    return {
      dependencies,
      mkValue: (values) =>
        manager.mkApp(constructor.decl, values, manager.funcDecls[constructor.decl].range),
    };
  }

  private mergeEh(first: number, second: number) {
    const manager = this.manager;
    const firstConstructor = this.constructors[first];
    const secondConstructor = this.constructors[second];
    if (secondConstructor !== null) {
      if (firstConstructor !== null && firstConstructor.decl !== secondConstructor.decl)
        this.context.setConflict(
          new TheoryJustification(this.id, [], [firstConstructor, secondConstructor]),
          null,
        );
      if (firstConstructor === null) {
        this.trail.push(() => {
          this.constructors[first] = null;
        });
        const recognizers = this.recognizers[first];
        if (recognizers.length > 0) {
          const recognizer = recognizers[getConstructorIndex(manager, secondConstructor.decl)];
          if (recognizer !== null && this.getNodeAssignment(recognizer) === L_FALSE) {
            this.signRecognizerConflict(secondConstructor, recognizer);
            return;
          }
        }
        this.constructors[first] = secondConstructor;
      }
    }
    for (const recognizer of this.recognizers[second])
      if (recognizer !== null) this.addRecognizer(first, recognizer);
  }

  private addRecognizer(inputVar: number, recognizer: Enode) {
    const manager = this.manager;
    const thVar = this.find(inputVar);
    const sort = manager.funcDecls[recognizer.decl].domain[0];
    if (this.recognizers[thVar].length === 0) {
      const empty = Array.from({ length: getNumConstructors(manager, sort) }, () => null);
      this.recognizers[thVar] = empty;
      this.trail.push(() => {
        if (this.recognizers[thVar] === empty) this.recognizers[thVar] = [];
      });
    }
    const recognizers = this.recognizers[thVar];
    const index = getConstructorIndex(manager, getRecognizerConstructor(manager, recognizer.decl));
    if (recognizers[index] !== null) return;
    const value = this.getNodeAssignment(recognizer);
    if (value === L_TRUE) return;
    const constructor = this.constructors[thVar];
    if (value === L_FALSE && constructor !== null) {
      if (constructor.decl === getRecognizerConstructor(manager, recognizer.decl))
        this.signRecognizerConflict(constructor, recognizer);
      return;
    }
    recognizers[index] = recognizer;
    this.trail.push(() => {
      recognizers[index] = null;
    });
    if (value === L_FALSE) this.propagateRecognizer(thVar, recognizer);
  }

  private propagateRecognizer(thVar: number, recognizer: Enode) {
    const context = this.context;
    const manager = this.manager;
    const node = this.getEnode(thVar);
    const sort = this.getSort(node);
    if (this.recognizers[thVar].length === 0)
      this.addRecognizer(recognizer.getArg(0).getThVar(this.id), recognizer);
    const recognizers = this.recognizers[thVar];
    const literals: Literal[] = [];
    const eqs: Enode[] = [];
    let numUnassigned = 0;
    let unassignedIndex = -1;
    for (let index = 0; index < recognizers.length; index++) {
      const current = recognizers[index];
      const value = current === null ? L_UNDEF : this.getNodeAssignment(current);
      if (current !== null && value === L_TRUE) return;
      if (current !== null && value === L_FALSE) {
        literals.push(mkLiteral(context.getBoolVar(current.owner), true));
        if (node !== current.getArg(0)) eqs.push(node, current.getArg(0));
        continue;
      }
      if (numUnassigned === 0) unassignedIndex = index;
      numUnassigned++;
    }
    if (numUnassigned === 0) {
      context.setConflict(new TheoryJustification(this.id, literals, eqs), null);
      return;
    }
    if (numUnassigned > 1) {
      if (manager.getSortSize(sort) !== SORT_SIZE_INFINITE) this.mkSplit(thVar);
      return;
    }
    const unassigned = recognizers[unassignedIndex];
    const consequent =
      unassigned === null
        ? this.mkLiteral(
            manager.mkApp(
              getConstructorIs(manager, getDatatypeConstructors(manager, sort)[unassignedIndex]),
              [node.owner],
              SORT_BOOL,
            ),
          )
        : mkLiteral(context.getBoolVar(unassigned.owner));
    context.markLiteralAsRelevant(consequent);
    context.assign(consequent, new TheoryJustification(this.id, literals, eqs));
  }

  private mkSplit(inputVar: number) {
    const context = this.context;
    const manager = this.manager;
    const thVar = this.find(inputVar);
    const node = this.getEnode(thVar);
    const sort = this.getSort(node);
    const nonRecConstructor = getNonRecConstructor(manager, sort);
    const recognizers = this.recognizers[thVar];
    const getRecognizerDecl = () => {
      if (recognizers.length === 0) return getConstructorIs(manager, nonRecConstructor);
      const recognizer = recognizers[getConstructorIndex(manager, nonRecConstructor)];
      if (recognizer === null) return getConstructorIs(manager, nonRecConstructor);
      if (!context.isRelevant(recognizer.owner)) {
        context.markAsRelevant(recognizer.owner);
        return -1;
      }
      if (this.getNodeAssignment(recognizer) !== L_FALSE) return -1;
      for (let index = 0; index < recognizers.length; index++) {
        const current = recognizers[index];
        if (current === null)
          return getConstructorIs(manager, getDatatypeConstructors(manager, sort)[index]);
        if (!context.isRelevant(current.owner)) {
          context.markAsRelevant(current.owner);
          return -1;
        }
        if (this.getNodeAssignment(current) !== L_FALSE) return -1;
      }
      return -1;
    };
    const recognizerDecl = getRecognizerDecl();
    if (recognizerDecl === -1) return;
    const recognizerApp = manager.mkApp(recognizerDecl, [node.owner], SORT_BOOL);
    context.internalize(recognizerApp, false);
    const boolVar = context.getBoolVar(recognizerApp);
    context.setTrueFirstFlag(boolVar);
    context.markAsRelevant(recognizerApp);
  }
}
