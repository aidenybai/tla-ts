// Ported from Z3 (src/sat/smt/dt_solver.h, src/sat/smt/dt_solver.cpp), MIT license, see
// z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { mkArrayApp } from "../array-decl-plugin";
import {
  FAMILY_ARRAY,
  OP_ARRAY_DEFAULT,
  OP_DT_ACCESSOR,
  OP_DT_CONSTRUCTOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_DT_UPDATE_FIELD,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
} from "../ast";
import {
  getAccessorConstructor,
  getConstructorAccessors,
  getConstructorIndex,
  getConstructorIs,
  getDatatypeConstructors,
  getDatatypeDef,
  getNonRecConstructor,
  getNumConstructors,
  getRecognizerConstructor,
  isRecursiveDatatype,
} from "../datatype-decl-plugin";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { NULL_LITERAL } from "../sat/clause";
import { CR_CONTINUE, CR_DONE } from "../sat/solver";
import { ArraySolver } from "./array-solver";
import { type Enode, NULL_THEORY_VAR, type ThEq } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { UnionFind } from "../lp/union-find";
import { addDependency, type Dependencies, ThSolver } from "./th-solver";

const ENTER = 0;
const EXIT = 1;

interface VarData {
  constructor: Enode | null;
  readonly recognizers: (Enode | null)[];
}

export class DtSolver extends ThSolver {
  private readonly find: UnionFind;
  private varData: VarData[] = [];
  private toUnmark1: Enode[] = [];
  private toUnmark2: Enode[] = [];
  private usedEqs: [Enode, Enode][] = [];
  private dfs: [number, Enode][] = [];
  private parents = new Map<Enode, Enode>();

  constructor(ctx: EufSolver, id: number) {
    super(ctx, "datatype", id);
    this.find = new UnionFind(ctx.trail);
    this.find.handler = { mergeEh: (first, second) => this.mergeEh(first, second) };
  }

  private isOp(expr: number, op: number) {
    return this.manager.getOp(expr) === op;
  }

  private isConstructor(expr: number) {
    return this.isOp(expr, OP_DT_CONSTRUCTOR);
  }

  private isRecognizer(expr: number) {
    return this.isOp(expr, OP_DT_RECOGNISER) || this.isOp(expr, OP_DT_IS);
  }

  private isUpdateField(expr: number) {
    return this.isOp(expr, OP_DT_UPDATE_FIELD);
  }

  private isDatatypeSort(sort: number) {
    return this.manager.isDatatypeSort(sort);
  }

  private isDatatype(expr: number) {
    return this.isDatatypeSort(this.manager.sorts[expr]);
  }

  private isArrayOfDatatypes(sort: number) {
    const manager = this.manager;
    return manager.isArraySort(sort) && this.isDatatypeSort(manager.getArrayRange(sort));
  }

  private isSeqOfDatatypes(sort: number) {
    const manager = this.manager;
    return manager.isSeqSort(sort) && this.isDatatypeSort(manager.getSortParameters(sort)[0]);
  }

  private isEnumSort(sort: number) {
    return (
      getDatatypeDef(this.manager, sort)?.constructors.every(
        (constructor) => constructor.accessors.length === 0,
      ) ?? false
    );
  }

  private value(node: Enode) {
    return this.s.value(2 * node.boolVar);
  }

  private mkApp(decl: number, args: number[]) {
    const manager = this.manager;
    return manager.mkApp(decl, args, manager.funcDecls[decl].range);
  }

  private clearMark() {
    for (const node of this.toUnmark1) node.isMarked1 = false;
    for (const node of this.toUnmark2) node.isMarked2 = false;
    this.toUnmark1 = [];
    this.toUnmark2 = [];
  }

  private ocMarkOnStack(node: Enode) {
    const root = node.root;
    root.isMarked1 = true;
    this.toUnmark1.push(root);
  }

  private ocMarkCycleFree(node: Enode) {
    const root = node.root;
    root.isMarked2 = true;
    this.toUnmark2.push(root);
  }

  private ocPushStack(node: Enode) {
    this.dfs.push([EXIT, node], [ENTER, node]);
  }

  private assertEqAxiom(first: Enode, second: number, antecedent = NULL_LITERAL) {
    if (antecedent === NULL_LITERAL) {
      this.addUnit(this.eqInternalize(first.owner, second));
      return;
    }
    if (this.s.value(antecedent) === L_TRUE) {
      const secondNode = this.eInternalize(second);
      if (first.root !== secondNode.root) this.propagateEq([antecedent], [], first, secondNode);
      return;
    }
    this.addClause([antecedent ^ 1, this.eqInternalize(first.owner, second)]);
  }

  private assertIsConstructorAxiom(node: Enode, constructor: number, antecedent = NULL_LITERAL) {
    const args = getConstructorAccessors(this.manager, constructor).map((accessor) =>
      this.mkApp(accessor, [node.owner]),
    );
    this.assertEqAxiom(node, this.mkApp(constructor, args), antecedent);
  }

  private assertAccessorAxioms(node: Enode) {
    getConstructorAccessors(this.manager, node.decl).forEach((accessor, index) =>
      this.assertEqAxiom(node.getArg(index), this.mkApp(accessor, [node.owner])),
    );
  }

  private signRecognizerConflict(constructor: Enode, recognizer: Enode) {
    const lit = 2 * recognizer.boolVar;
    this.clearMark();
    this.setConflict([lit ^ 1], [[constructor, recognizer.getArg(0)]]);
  }

  private assertUpdateFieldAxioms(node: Enode) {
    const manager = this.manager;
    const own = node.owner;
    const record = node.getArg(0).owner;
    const field = manager.funcDecls[node.decl].parameters[0];
    const constructor = getAccessorConstructor(manager, field);
    const recognizer = getConstructorIs(manager, constructor);
    const isConstructor = this.mkLiteral(manager.mkApp(recognizer, [record], SORT_BOOL));
    for (const accessor of getConstructorAccessors(manager, constructor)) {
      const arg =
        accessor === field ? node.getArg(1) : this.eInternalize(this.mkApp(accessor, [record]));
      this.assertEqAxiom(arg, this.mkApp(accessor, [own]), isConstructor);
    }
    this.assertEqAxiom(node, record, isConstructor ^ 1);
    const isOwnConstructor = this.mkLiteral(manager.mkApp(recognizer, [own], SORT_BOOL));
    this.addClause([isConstructor ^ 1, isOwnConstructor]);
  }

  override mkVar(node: Enode) {
    if (this.isAttachedToVar(node)) return node.getThVar(this.id);
    const manager = this.manager;
    const thVar = super.mkVar(node);
    this.find.mkVar();
    const data: VarData = { constructor: null, recognizers: [] };
    this.varData.push(data);
    this.ctx.egraph.addThVar(node, thVar, this.id);
    const expr = node.owner;
    if (this.isConstructor(expr)) {
      data.constructor = node;
      this.assertAccessorAxioms(node);
    } else if (this.isUpdateField(expr)) this.assertUpdateFieldAxioms(node);
    else if (!this.isRecognizer(expr)) {
      const sort = manager.sorts[expr];
      if (getNumConstructors(manager, sort) === 1)
        this.assertIsConstructorAxiom(node, getDatatypeConstructors(manager, sort)[0]);
      else if (manager.getSortSize(sort) !== SORT_SIZE_INFINITE) this.mkSplit(thVar);
    }
    return thVar;
  }

  private mkSplit(inputVar: number) {
    const manager = this.manager;
    const thVar = this.find.find(inputVar);
    const node = this.var2enodeOf(thVar);
    const sort = manager.sorts[node.owner];
    if (this.isEnumSort(sort)) {
      this.mkEnumSplit(thVar);
      return;
    }
    const nonRecConstructor = getNonRecConstructor(manager, sort);
    const index = getConstructorIndex(manager, nonRecConstructor);
    const recognizer = this.varData[thVar].recognizers[index] ?? null;
    if (recognizer === null && manager.funcDecls[nonRecConstructor].domain.length === 0) {
      const eq = this.eqInternalize(node.owner, this.mkApp(nonRecConstructor, []));
      this.s.setPhaseLiteral(eq);
      if (this.s.value(eq) === L_FALSE) this.mkEnumSplit(thVar);
    } else if (recognizer === null) this.mkRecognizerConstructorLiteral(nonRecConstructor, node);
    else if (this.value(recognizer) === L_FALSE) this.mkEnumSplit(thVar);
  }

  private mkRecognizerConstructorLiteral(constructor: number, node: Enode) {
    const recognizer = getConstructorIs(this.manager, constructor);
    const lit = this.mkLiteral(this.manager.mkApp(recognizer, [node.owner], SORT_BOOL));
    this.s.setPhaseLiteral(lit);
    return lit;
  }

  private mkEnumSplit(thVar: number) {
    const manager = this.manager;
    const node = this.var2enodeOf(thVar);
    const data = this.varData[thVar];
    const constructors = getDatatypeConstructors(manager, manager.sorts[node.owner]);
    const size = constructors.length;
    const start = this.random();
    const lits: number[] = [];
    for (let index = 0; index < size; index++) {
      const position = (index + start) % size;
      const constructor = constructors[position];
      if (manager.funcDecls[constructor].domain.length > 0) {
        const current = data.recognizers[position] ?? null;
        if (current !== null && this.value(current) !== L_FALSE) return;
        const lit = this.mkRecognizerConstructorLiteral(constructor, node);
        if (current === null) return;
        if (this.s.value(lit) !== L_FALSE) return;
        lits.push(lit ^ 1);
        continue;
      }
      const lit = this.eqInternalize(node.owner, this.mkApp(constructor, []));
      const value = this.s.value(lit);
      if (value === L_UNDEF) {
        this.s.setPhaseLiteral(lit);
        return;
      }
      if (value === L_TRUE) return;
      lits.push(lit ^ 1);
    }
    this.setConflict(lits, []);
  }

  override applySortCnstr(node: Enode) {
    this.forcePush();
    if (!this.isAttachedToVar(node)) this.mkVar(node);
  }

  override newEqEh(eq: ThEq) {
    this.forcePush();
    this.find.merge(eq.v1, eq.v2);
  }

  override asserted(lit: number) {
    this.forcePush();
    const manager = this.manager;
    const node = this.boolVar2enode(lit >> 1);
    if (node === undefined || !this.isRecognizer(node.owner)) return;
    const arg = node.getArg(0);
    const thVar = this.find.find(arg.getThVar(this.id));
    const data = this.varData[thVar];
    const constructor = getRecognizerConstructor(manager, node.decl);
    if ((lit & 1) === 0) {
      if (data.constructor !== null && data.constructor.decl === constructor) return;
      this.assertIsConstructorAxiom(arg, constructor, lit);
    } else if (data.constructor === null) this.propagateRecognizer(thVar, node);
    else if (data.constructor.decl === constructor)
      this.signRecognizerConflict(data.constructor, node);
  }

  private addRecognizer(inputVar: number, recognizer: Enode) {
    const manager = this.manager;
    const thVar = this.find.find(inputVar);
    const data = this.varData[thVar];
    const sort = manager.funcDecls[recognizer.decl].domain[0];
    if (data.recognizers.length === 0)
      for (let index = 0; index < getNumConstructors(manager, sort); index++)
        data.recognizers.push(null);
    const constructor = getRecognizerConstructor(manager, recognizer.decl);
    const index = getConstructorIndex(manager, constructor);
    if (data.recognizers[index] !== null) return;
    const value = this.value(recognizer);
    if (value === L_TRUE) return;
    if (value === L_FALSE && data.constructor !== null) {
      if (data.constructor.decl === constructor)
        this.signRecognizerConflict(data.constructor, recognizer);
      return;
    }
    this.ctx.trail.push(() => {
      data.recognizers[index] = null;
    });
    data.recognizers[index] = recognizer;
    if (value === L_FALSE) this.propagateRecognizer(thVar, recognizer);
  }

  private propagateRecognizer(thVar: number, recognizer: Enode) {
    const manager = this.manager;
    const node = this.var2enodeOf(thVar);
    const sort = manager.sorts[node.owner];
    const data = this.varData[thVar];
    if (data.recognizers.length === 0) {
      this.addRecognizer(thVar, recognizer);
      return;
    }
    const lits: number[] = [];
    const eqs: [Enode, Enode][] = [];
    let numUnassigned = 0;
    let unassignedIndex = -1;
    for (let index = 0; index < data.recognizers.length; index++) {
      const current = data.recognizers[index];
      if (current !== null && this.value(current) === L_TRUE) return;
      if (current !== null && this.value(current) === L_FALSE) {
        lits.push(2 * current.boolVar + 1);
        if (node !== current.getArg(0)) eqs.push([node, current.getArg(0)]);
        continue;
      }
      if (numUnassigned === 0) unassignedIndex = index;
      numUnassigned++;
    }
    if (numUnassigned === 0) {
      this.setConflict(lits, eqs);
      return;
    }
    if (numUnassigned === 1) {
      const current = data.recognizers[unassignedIndex];
      const consequent =
        current !== null
          ? 2 * current.boolVar
          : this.mkLiteral(
              manager.mkApp(
                getConstructorIs(manager, getDatatypeConstructors(manager, sort)[unassignedIndex]),
                [node.owner],
                SORT_BOOL,
              ),
            );
      this.propagateLit(lits, eqs, consequent);
      return;
    }
    if (manager.getSortSize(sort) !== SORT_SIZE_INFINITE) this.mkSplit(thVar);
  }

  private mergeEh(first: number, second: number) {
    const manager = this.manager;
    const firstData = this.varData[first];
    const secondData = this.varData[second];
    const firstConstructor = firstData.constructor;
    const secondConstructor = secondData.constructor;
    if (
      firstConstructor !== null &&
      secondConstructor !== null &&
      firstConstructor.decl !== secondConstructor.decl
    )
      this.setConflict([], [[firstConstructor, secondConstructor]]);
    else if (secondConstructor !== null && firstConstructor === null) {
      this.ctx.trail.push(() => {
        firstData.constructor = null;
      });
      if (firstData.recognizers.length > 0) {
        const recognizer =
          firstData.recognizers[getConstructorIndex(manager, secondConstructor.decl)];
        if (recognizer !== null && this.value(recognizer) === L_FALSE) {
          this.signRecognizerConflict(secondConstructor, recognizer);
          return;
        }
      }
      firstData.constructor = secondConstructor;
    }
    for (const recognizer of secondData.recognizers)
      if (recognizer !== null) this.addRecognizer(first, recognizer);
  }

  private getArrayArgs(node: Enode) {
    const arrays = this.ctx.fid2solver(FAMILY_ARRAY);
    const nodes = arrays instanceof ArraySolver ? [...arrays.parentSelects(node)] : [];
    const arrayDefault = this.ctx.getEnode(
      mkArrayApp(this.manager, OP_ARRAY_DEFAULT, [node.owner]),
    );
    if (arrayDefault !== undefined) nodes.push(arrayDefault);
    return nodes;
  }

  private ocGetConstructor(app: Enode) {
    const thVar = app.root.getThVar(this.id);
    if (thVar === NULL_THEORY_VAR) return null;
    return this.varData[this.find.find(thVar)].constructor;
  }

  private explainIsChild(parent: Enode, child: Enode) {
    const parentConstructor = this.ocGetConstructor(parent) as Enode;
    if (parent !== parentConstructor) this.usedEqs.push([parent, parentConstructor]);
    const add = (arg: Enode) => {
      if (arg.root !== child.root) return;
      if (arg !== child) this.usedEqs.push([arg, child]);
    };
    for (const arg of parentConstructor.args) {
      add(arg);
      const sort = this.manager.sorts[arg.owner];
      if (this.isArrayOfDatatypes(sort))
        for (const arrayArg of this.getArrayArgs(arg)) add(arrayArg);
      if (this.isSeqOfDatatypes(sort))
        throw new SmtUnsupportedError("sat.euf datatypes in sequences");
    }
  }

  private occursCheckExplain(inputApp: Enode, root: Enode) {
    this.explainIsChild(inputApp, root);
    let app = inputApp;
    while (app.root !== root.root) {
      const parentApp = this.parents.get(app.root) as Enode;
      this.explainIsChild(parentApp, app);
      app = parentApp;
    }
    if (app !== root) this.usedEqs.push([app, root]);
  }

  private occursCheckEnter(inputApp: Enode) {
    const app = inputApp.root;
    const thVar = app.getThVar(this.id);
    if (thVar === NULL_THEORY_VAR) return false;
    const parent = this.varData[this.find.find(thVar)].constructor;
    if (parent === null) return false;
    this.ocMarkOnStack(parent);
    const processArg = (arg: Enode) => {
      if (arg.root.isMarked2) return false;
      if (arg.root.isMarked1) {
        this.occursCheckExplain(parent, arg);
        return true;
      }
      if (this.isDatatype(arg.owner)) {
        this.parents.set(arg.root, parent);
        this.ocPushStack(arg);
      }
      return false;
    };
    for (const arg of parent.args) {
      if (arg.root.isMarked2) continue;
      if (arg.root.isMarked1) {
        this.occursCheckExplain(parent, arg);
        return true;
      }
      const sort = this.manager.sorts[arg.owner];
      if (this.isDatatypeSort(sort)) {
        this.parents.set(arg.root, parent);
        this.ocPushStack(arg);
      } else if (this.isSeqOfDatatypes(sort))
        throw new SmtUnsupportedError("sat.euf datatypes in sequences");
      else if (this.isArrayOfDatatypes(sort))
        for (const arrayArg of this.getArrayArgs(arg)) if (processArg(arrayArg)) return true;
    }
    return false;
  }

  private occursCheck(node: Enode) {
    let isCyclic = false;
    this.ocPushStack(node);
    while (!isCyclic && this.dfs.length > 0) {
      const [op, app] = this.dfs.pop() as [number, Enode];
      if (app.root.isMarked2) continue;
      if (op === ENTER) isCyclic = this.occursCheckEnter(app);
      else this.ocMarkCycleFree(app);
    }
    if (isCyclic) {
      this.clearMark();
      this.setConflict([], this.usedEqs);
    }
    return isCyclic;
  }

  override check() {
    this.forcePush();
    const manager = this.manager;
    const numVars = this.numVars;
    this.usedEqs = [];
    this.dfs = [];
    this.parents.clear();
    const start = this.random();
    let result = CR_DONE;
    for (let index = 0; index < numVars; index++) {
      const thVar = (index + start) % numVars;
      if (thVar !== this.find.find(thVar)) continue;
      const node = this.var2enodeOf(thVar);
      if (!this.isDatatype(node.owner)) continue;
      if (
        isRecursiveDatatype(manager, manager.sorts[node.owner]) &&
        !node.root.isMarked2 &&
        this.occursCheck(node)
      ) {
        this.clearMark();
        return CR_CONTINUE;
      }
      if (this.varData[thVar].constructor !== null) continue;
      this.clearMark();
      this.mkSplit(thVar);
      result = CR_CONTINUE;
    }
    this.clearMark();
    return result;
  }

  protected override popCore(numScopes: number) {
    super.popCore(numScopes);
    this.varData.length = this.numVars;
  }

  override addValue(node: Enode, model: ProtoModel, values: (number | undefined)[]) {
    const thVar = node.getThVar(this.id);
    if (thVar === NULL_THEORY_VAR) {
      values[node.root.owner] = model.getFreshValue(this.manager.sorts[node.owner]) ?? undefined;
      return;
    }
    const constructor = this.varData[this.find.find(thVar)].constructor as Enode;
    values[node.root.owner] = this.mkApp(
      constructor.decl,
      constructor.args.map((arg) => values[arg.root.owner] as number),
    );
  }

  override addDep(node: Enode, deps: Dependencies) {
    if (!this.isDatatype(node.owner)) return false;
    const thVar = node.getThVar(this.id);
    if (thVar === NULL_THEORY_VAR) return false;
    const constructor = this.varData[this.find.find(thVar)].constructor as Enode;
    if (constructor.numArgs === 0) deps.set(node, null);
    for (const arg of constructor.args) addDependency(deps, node, arg.root);
    return true;
  }

  override includeFuncInterp(decl: number) {
    const manager = this.manager;
    if (manager.funcDecls[decl].op !== OP_DT_ACCESSOR) return false;
    const constructor = getAccessorConstructor(manager, decl);
    for (const app of this.ctx.egraph.enodesOf(decl)) {
      const appConstructor = this.ocGetConstructor(app.getArg(0));
      if (
        appConstructor !== null &&
        this.isConstructor(appConstructor.owner) &&
        appConstructor.decl !== constructor
      )
        return true;
    }
    return false;
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    if (!this.visitRec(expr, isSign, isRoot)) return NULL_LITERAL;
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.visitRec(expr, false, false);
  }

  protected override visit(expr: number) {
    if (this.visited(expr)) return true;
    const manager = this.manager;
    if (!manager.isApp(expr) || manager.getFamily(expr) !== this.id) {
      this.ctx.internalizeTerm(expr);
      if (this.isDatatype(expr)) this.mkVar(this.expr2enode(expr) as Enode);
      return true;
    }
    this.stack.push({ expr, index: 0 });
    return false;
  }

  protected override visited(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected override postVisit(expr: number) {
    const node = this.expr2enode(expr) ?? this.mkEnode(expr);
    if (this.isConstructor(expr) || this.isUpdateField(expr)) {
      for (const arg of node.args) {
        const sort = this.manager.sorts[arg.owner];
        if (this.isDatatypeSort(sort)) this.mkVar(arg);
        else if (this.isArrayOfDatatypes(sort))
          this.mkVar(this.eInternalize(mkArrayApp(this.manager, OP_ARRAY_DEFAULT, [arg.owner])));
      }
      this.mkVar(node);
    } else if (this.isRecognizer(expr)) {
      this.mkVar(node);
      this.addRecognizer(this.mkVar(node.getArg(0)), node);
    } else {
      this.mkVar(node.getArg(0));
      if (this.isDatatype(expr)) this.mkVar(node);
    }
    return true;
  }

  override getPhase() {
    return L_TRUE;
  }

  override isSelfPropagating() {
    return true;
  }
}
