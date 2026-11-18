// A generator's body as a state machine. ESCore keeps a generator object's [[GeneratorState]] and
// the frames that resume its body in the object's slots, and GeneratorResume runs the frames from
// where the body suspended. tla-ts specializes those frames at compile time: each place where the
// body can suspend, or a loop that yields can start an iteration, is a resume point, and the frames'
// values are the locals that the body binds there. The generator object keeps the point and those
// locals on the heap, beside its state, and one recursive operator runs the body from any point to
// the next yield or to its end. A call that steps the generator calls it, so that a loop can step a
// generator as often as it runs, instead of each step copying the body's code.
import ts from "@typescript/typescript6";
import { type Expression, type OperatorDefinition, getReferencedName } from "../ast";
import { forEachChild } from "../instances";
import { TlaTypeScriptError } from "../errors";
import {
  type Frame,
  type Path,
  type Suspension,
  type Thrown,
  allocate,
  bindOnce,
  getBody,
  getCast,
  getCalledReach,
  getReturnType,
  inlineValues,
  isPrimitiveReturn,
  getChanged,
  hasCall,
  isSameExpression,
  throwTypeError,
  translateExpressionStatement,
  translateStatements,
} from "./actions";
import {
  type Context,
  type FunctionNode,
  findNodes,
  getArgumentsOwner,
  getSymbol,
  getUndefined,
  isAsyncGenerator,
  skipCasts,
} from "./context";
import { ARRAY_ITERATOR_REPLACED, holdsArrayIteration } from "./collections";
import { translateCondition } from "./expressions";
import { type Formula, ifThenElse, leaf, letIn, render } from "./formula";
import { useJavaScript } from "./javascript";
import type { Receiver, Scope } from "./scope";
import { getThrownMessage } from "./shared-calls";
import {
  apply,
  boolean,
  call,
  define,
  field,
  identifier,
  ifExpression,
  index,
  number,
  record,
  string,
  tuple,
} from "./tla";

export interface Machine {
  // The operator that runs the body for a next, a return, or a throw, from where it suspended. A
  // generator's takes the generator object, and a helper's has its object built in.
  step: string;
  isHelper?: boolean;
  // The values from outside the body that it reads or changes, the heap first, which a step takes
  // and gives back.
  outer: readonly ts.Symbol[];
}

// Runs a loop of a body that yields, from the path where it starts, as a jump to the loop's head.
export interface MachineLoop {
  (
    loop: ts.IterationStatement,
    path: Path,
    frame: Frame,
    continueWith: (path: Path) => Formula,
  ): Formula;
}

// Passes the steps of a yield* on to the state machine of the generator that it delegates to.
export interface MachineDelegate {
  (
    yielded: ts.YieldExpression,
    inner: Suspension,
    path: Path,
    frame: Frame,
    continueWith: (path: Path, value: Expression) => Formula,
  ): Formula;
}

// The values that a resume point saves: the body's locals, and what the statement that suspended
// already evaluated.
interface Layout {
  locals: readonly ts.Symbol[];
  results: readonly ts.Expression[];
  allocated: readonly ts.Node[];
}

interface Head {
  point: number;
  layout: Layout;
}

// The most resume points of a body that tla-ts runs as a state machine.
const POINT_LIMIT = 256;

const STEP_METHODS = new Set(["next", "return", "throw"]);

const unsupported = (node: ts.Node) =>
  new TlaTypeScriptError("tla-ts can't run this generator as a state machine", node);

const getOuterExpression = (node: ts.Node): ts.Node =>
  ts.isParenthesizedExpression(node.parent) ||
  ts.isAsExpression(node.parent) ||
  ts.isNonNullExpression(node.parent) ||
  ts.isTypeAssertionExpression(node.parent) ||
  ts.isSatisfiesExpression(node.parent)
    ? getOuterExpression(node.parent)
    : node;

// Whether an expression is an object of a state machine that a call of one of its methods steps, that
// a for-of whose body doesn't suspend iterates, that a helper that a state machine runs wraps, or
// that a sync generator's yield* delegates to.
const isStepped = (node: ts.Node, context: Context, methods: ReadonlySet<string>) => {
  const outer = getOuterExpression(node);
  const parent = outer.parent;
  const callee = ts.isPropertyAccessExpression(parent) ? getOuterExpression(parent) : undefined;
  const called = callee?.parent;
  return (
    (ts.isPropertyAccessExpression(parent) &&
      parent.expression === outer &&
      called !== undefined &&
      ts.isCallExpression(called) &&
      called.expression === callee &&
      (methods.has(parent.name.text) || isMachineHelper(called, context))) ||
    (ts.isForOfStatement(parent) &&
      parent.expression === outer &&
      parent.awaitModifier === undefined &&
      !isSuspending(parent.initializer) &&
      !isSuspending(parent.statement)) ||
    (ts.isYieldExpression(parent) &&
      parent.asteriskToken !== undefined &&
      parent.expression === outer &&
      isSyncGeneratorBody(parent, context))
  );
};

// Whether a node is in the body of a sync generator that a state machine may run, whose yield*
// steps a generator with its next.
const isSyncGeneratorBody = (node: ts.Node, context: Context) => {
  const owner = ts.findAncestor(node.parent, ts.isFunctionLike);
  return (
    owner !== undefined &&
    (ts.isFunctionDeclaration(owner) ||
      ts.isFunctionExpression(owner) ||
      ts.isMethodDeclaration(owner)) &&
    owner.asteriskToken !== undefined &&
    isMachineBody(owner, context)
  );
};

// Whether a sync generator's body is one that a state machine can run: one that makes no functions,
// so that its locals are values, and doesn't read its arguments object.
const isMachineBody = (callee: FunctionNode, context: Context) =>
  !isAsyncGenerator(callee) &&
  callee.body !== undefined &&
  ts.isBlock(callee.body) &&
  findNodes(
    callee.body,
    (inner): inner is ts.Node => ts.isFunctionLike(inner) || ts.isClassLike(inner),
  ).length === 0 &&
  findNodes(callee, ts.isIdentifier).every(
    (identifier) => getArgumentsOwner(identifier, context.checker) !== callee,
  );

// Whether code yields or awaits outside the functions that it makes, which a loop's operator can't,
// as an await using does where it disposes.
const isSuspending = (node: ts.Node): boolean =>
  ts.isYieldExpression(node) ||
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (ts.isVariableDeclarationList(node) &&
    (node.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.AwaitUsing) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, isSuspending) ?? false));

// Whether the object that a call makes only meets the code that steps a state machine: the call is
// stepped, or it initializes a variable that only such code in the same function reads.
const isMachineUse = (
  node: ts.Node,
  context: Context,
  methods: ReadonlySet<string> = STEP_METHODS,
) => {
  if (!ts.isCallExpression(node)) return false;
  if (isStepped(node, context, methods)) return true;
  const outer = getOuterExpression(node);
  const parent = outer.parent;
  const name =
    ts.isVariableDeclaration(parent) && parent.initializer === outer
      ? parent.name
      : isAssignment(parent) && parent.right === outer
        ? parent.left
        : undefined;
  if (name === undefined || !ts.isIdentifier(name)) return false;
  const symbol = getSymbol(name, context.checker);
  const owner = ts.findAncestor(parent, ts.isFunctionLike);
  // A declaration's name isn't a use, but a declaration's initializer that reads the variable is.
  const references = findNodes(name.getSourceFile(), ts.isIdentifier).filter(
    (identifier) =>
      !(ts.isVariableDeclaration(identifier.parent) && identifier.parent.name === identifier) &&
      getSymbol(identifier, context.checker) === symbol,
  );
  // A variable may also take another object that a call makes, whose own call decides how it runs.
  return (
    symbol !== undefined &&
    references.some((reference) => isStepped(reference, context, methods)) &&
    references.every(
      (reference) =>
        ts.findAncestor(reference, ts.isFunctionLike) === owner &&
        (isStepped(reference, context, methods) ||
          (isAssignment(reference.parent) &&
            reference.parent.left === reference &&
            ts.isCallExpression(getCast(reference.parent.right)))),
    )
  );
};

const isAssignment = (node: ts.Node): node is ts.BinaryExpression =>
  ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken;

// Whether tla-ts runs the generator that a call makes as a state machine: a sync generator whose
// body makes no functions, so that its locals are values, and whose object only meets code that
// steps it as one, such as a loop of the iterator protocol that made it.
export const isMachineGenerator = (
  node: ts.Node,
  callee: FunctionNode,
  isLooped: boolean,
  context: Context,
) =>
  context.heap !== undefined &&
  isMachineBody(callee, context) &&
  (isLooped || isMachineUse(node, context));

// Whether a loop's own statements are the only code around it in the body that runs more than once
// for a path, so that each time the translation reaches it, what follows it is the same.
const isSimplyNested = (loop: ts.Node, callee: FunctionNode): boolean => {
  const parent = loop.parent;
  if (parent === callee.body) return true;
  return (
    (ts.isBlock(parent) ||
      ts.isIfStatement(parent) ||
      ts.isWhileStatement(parent) ||
      ts.isDoStatement(parent) ||
      ts.isForStatement(parent) ||
      ts.isLabeledStatement(parent) ||
      ts.isCaseClause(parent) ||
      ts.isDefaultClause(parent) ||
      ts.isCaseBlock(parent) ||
      ts.isSwitchStatement(parent) ||
      ts.isCatchClause(parent) ||
      (ts.isTryStatement(parent) && parent.finallyBlock !== loop)) &&
    isSimplyNested(parent, callee)
  );
};

const isSameEntries = <K, V>(
  left: ReadonlyMap<K, V> | undefined,
  right: ReadonlyMap<K, V> | undefined,
) =>
  (left?.size ?? 0) === (right?.size ?? 0) &&
  [...(left ?? [])].every((entry) => right?.get(entry[0]) === entry[1]);

// Gathers the names that an expression binds anywhere in it, and those that it reads where it
// doesn't bind them.
const collectNames = (
  expression: Expression,
  bound: ReadonlySet<string>,
  binders: Set<string>,
  free: Set<string>,
) => {
  const name = getReferencedName(expression);
  if (name !== undefined && !bound.has(name)) free.add(name);
  forEachChild(expression, (child, childBound) => {
    childBound.forEach((inner) => binders.add(inner));
    collectNames(
      child,
      childBound.length === 0 ? bound : new Set([...bound, ...childBound]),
      binders,
      free,
    );
  });
};

const isDeclaredIn = (symbol: ts.Symbol, code: ts.Node) =>
  (symbol.declarations ?? []).some(
    (declaration) => ts.findAncestor(declaration, (ancestor) => ancestor === code) !== undefined,
  );

// The names that a function's code reads or writes, with those that the functions it may call read,
// and the values that it changes.
const getReferenced = (code: FunctionNode, made: Path, context: Context) =>
  new Set([
    ...findNodes(code, ts.isIdentifier).flatMap(
      (identifier) => getSymbol(identifier, context.checker) ?? [],
    ),
    ...(code.body === undefined ? [] : getCalledReach(code.body, context)).flatMap((declaration) =>
      ts.isVariableDeclaration(declaration) ||
      ts.isParameter(declaration) ||
      ts.isBindingElement(declaration)
        ? (getSymbol(declaration.name, context.checker) ?? [])
        : [],
    ),
    ...getChanged(code, made, context),
  ]);

// The values from outside some code that it reads or changes, the heap first, which its state
// machine's steps take and give back. Code that reads a let before its declaration ran doesn't run
// as one.
const getOuter = (
  referenced: ReadonlySet<ts.Symbol>,
  isOwn: (symbol: ts.Symbol) => boolean,
  made: Path,
  heap: ts.Symbol,
  node: ts.Node,
) => {
  if ([...referenced].some((symbol) => !isOwn(symbol) && made.scope.uninitialized.has(symbol))) {
    throw unsupported(node);
  }
  return [
    heap,
    ...[...made.mutable].filter(
      (symbol) =>
        symbol !== heap &&
        !isOwn(symbol) &&
        referenced.has(symbol) &&
        made.scope.bindings.has(symbol),
    ),
  ];
};

const getSlot = (state: string, point: Expression, locals: Expression) =>
  record("Record", [
    { name: "state", value: string(state) },
    { name: "point", value: point },
    { name: "locals", value: locals },
  ]);

const COMPLETED = getSlot("completed", number(0), tuple([]));

// Translates a generator's body as the operators of its state machine, from the path where its call
// made the object, with the scope that binds its parameters. Each step passes the values outside
// the body that the body reads or changes, and gives how the body stopped, "yield", "return", or
// "throw", with its value, the message of a throw that nothing catches, and those values.
export const makeMachine = (
  node: ts.Node,
  callee: FunctionNode,
  made: Path,
  start: Scope,
  context: Context,
  frame: Frame,
): { machine: Machine; definitions: OperatorDefinition[]; locals: Expression } => {
  const heap = context.heap;
  const body = callee.body;
  if (heap === undefined || body === undefined) throw unsupported(node);
  const isOwn = (symbol: ts.Symbol) => isDeclaredIn(symbol, callee);
  const referenced = getReferenced(callee, made, context);
  const outer = getOuter(referenced, isOwn, made, heap, node);
  const own = [...referenced].filter(
    (symbol) =>
      isOwn(symbol) &&
      (symbol.declarations ?? []).some(
        (declaration) =>
          ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration),
      ),
  );
  const selfName = context.names.getFresh("self");
  const ref = identifier(selfName);
  const resumeName = context.names.getFresh("Resume");
  const stepName = context.names.getFresh("Step");
  const pointName = context.names.getFresh("point");
  const modeName = context.names.getFresh("mode");
  const sentName = context.names.getFresh("sent");
  const savedName = context.names.getFresh("saved");
  const outerNames = outer.map((symbol) => {
    const binding = made.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const mode = identifier(modeName);
  const sent = identifier(sentName);
  // The machines that the body makes, whose operators each arm can call.
  const hoisted: OperatorDefinition[] = [];
  const base: Path = {
    ...made,
    hoisted,
    isMachine: true,
    isLooping: true,
    isLast: false,
    tasks: undefined,
    generators: new Map([...made.generators].filter((entry) => entry[1].machine !== undefined)),
    scope: {
      ...start,
      bindings: new Map([
        ...start.bindings,
        ...outer.map((symbol, position): [ts.Symbol, Expression] => [
          symbol,
          identifier(outerNames[position]),
        ]),
      ]),
    },
  };
  const getOuterValues = (current: Path) =>
    outer.map((symbol) => {
      const value = current.scope.bindings.get(symbol);
      if (value === undefined) throw unsupported(node);
      return value;
    });
  const end = (
    current: Path,
    kind: string,
    value: Expression,
    message: Expression,
    slot: Expression,
  ) => {
    const values = getOuterValues(current);
    return leaf(
      tuple([
        string(kind),
        value,
        message,
        useJavaScript("SetMachine", [values[0], ref, slot], context),
        ...values.slice(1),
      ]),
    );
  };
  const complete = (current: Path, kind: string, value: Expression, message = string("")) =>
    end(current, kind, value, message, COMPLETED);
  // A resume point restores only what its path can tell apart from the body's start: the locals,
  // and what the statement that suspended evaluated before it did.
  const getLayout = (captured: Path): Layout => {
    const scope = captured.scope;
    if (
      captured.tasks !== undefined ||
      captured.disposal !== base.disposal ||
      // A generator that the code made since the body started steps only where a state machine
      // runs it, which keeps where it is on the heap.
      [...captured.generators.values()].some((suspension) => suspension.machine === undefined) ||
      (scope.destructured ?? []).length > 0 ||
      !isSameEntries(scope.read, base.scope.read) ||
      !isSameEntries(scope.initialReads, base.scope.initialReads) ||
      !isSameEntries(scope.arrowReceivers, base.scope.arrowReceivers) ||
      !isSameEntries(scope.activations, base.scope.activations) ||
      scope.receiver !== base.scope.receiver
    ) {
      throw unsupported(node);
    }
    return {
      locals: own.filter((symbol) => scope.bindings.has(symbol)),
      results: [...scope.results]
        .filter((entry) => base.scope.results.get(entry[0]) !== entry[1])
        .map((entry) => entry[0]),
      allocated: [...scope.allocated]
        .filter((entry) => base.scope.allocated.get(entry[0]) !== entry[1])
        .map((entry) => entry[0]),
    };
  };
  // The values that each code that goes to a resume point saves, from the arm that it runs in,
  // which the names that the point's code keeps from that arm may extend.
  const saves = new Map<number, { arm: number; elements: Expression[] }[]>();
  const sizes = new Map<number, number>();
  const arming = { current: 0 };
  const save = (current: Path, layout: Layout, point: number) => {
    const elements = [
      ...layout.locals.map((symbol) => current.scope.bindings.get(symbol) ?? getUndefined(context)),
      ...layout.results.map((key) => current.scope.results.get(key) ?? getUndefined(context)),
      ...layout.allocated.map((key) => current.scope.allocated.get(key) ?? getUndefined(context)),
    ];
    saves.set(point, [...(saves.get(point) ?? []), { arm: arming.current, elements }]);
    sizes.set(point, elements.length);
    return tuple(elements);
  };
  // Runs code from a resume point, with names of its own for the values that the point saved and
  // that the step passed, so that code that an arm keeps from another can't read them unnoticed.
  const resumeFrom = (
    captured: Path,
    layout: Layout,
    run: (path: Path, sent: Expression) => Formula,
  ): Formula => {
    const keys = [...layout.locals, ...layout.results, ...layout.allocated];
    const names = keys.map((key) =>
      context.names.getFresh("escapedName" in key ? key.name : "saved"),
    );
    const passedNames = [sentName, ...outerNames].map((name) => context.names.getFresh(name));
    const getSaved = (position: number) => identifier(names[position]);
    const resultsAt = layout.locals.length;
    const allocatedAt = resultsAt + layout.results.length;
    return letIn(
      [
        ...names.map((name, position) =>
          define(name, [], index(identifier(savedName), [number(position + 1)])),
        ),
        ...[sentName, ...outerNames].map((name, position) =>
          define(passedNames[position], [], identifier(name)),
        ),
      ],
      run(
        {
          ...captured,
          isMachine: true,
          isLooping: true,
          isLast: false,
          tasks: undefined,
          generators: base.generators,
          scope: {
            ...captured.scope,
            bindings: new Map([
              ...base.scope.bindings,
              ...outer.map((symbol, position): [ts.Symbol, Expression] => [
                symbol,
                identifier(passedNames[position + 1]),
              ]),
              ...layout.locals.map((symbol, position): [ts.Symbol, Expression] => [
                symbol,
                getSaved(position),
              ]),
            ]),
            results: new Map([
              ...base.scope.results,
              ...layout.results.map((key, position): [ts.Expression, Expression] => [
                key,
                getSaved(resultsAt + position),
              ]),
            ]),
            allocated: new Map([
              ...base.scope.allocated,
              ...layout.allocated.map((key, position): [ts.Node, Expression] => [
                key,
                getSaved(allocatedAt + position),
              ]),
            ]),
          },
        },
        identifier(passedNames[0]),
      ),
    );
  };
  const arms: { point: number; translate: () => Formula }[] = [];
  const addArm = (translate: () => Formula) => {
    const point = arms.length + 1;
    if (point > POINT_LIMIT) throw unsupported(node);
    arms.push({ point, translate });
    return point;
  };
  const heads = new Map<ts.Node, Head>();
  const jump = (current: Path, head: Head) =>
    leaf(
      call(resumeName, [
        ref,
        number(head.point),
        string("next"),
        getUndefined(context),
        save(current, head.layout, head.point),
        ...getOuterValues(current),
      ]),
    );
  // A loop that yields starts each iteration at its head, a resume point that the code before it
  // and the end of each iteration jump to, so that it runs as often as its condition holds.
  const loopTo: MachineLoop = (loop, current, loopFrame, continueWith) => {
    const known = heads.get(loop);
    if (known !== undefined) return jump(current, known);
    const condition = ts.isForStatement(loop)
      ? loop.condition
      : ts.isWhileStatement(loop) || ts.isDoStatement(loop)
        ? loop.expression
        : undefined;
    const incrementor = ts.isForStatement(loop) ? loop.incrementor : undefined;
    if (
      !(ts.isWhileStatement(loop) || ts.isDoStatement(loop) || ts.isForStatement(loop)) ||
      !isSimplyNested(loop, callee) ||
      (condition !== undefined && hasCall(condition, context)) ||
      [condition, incrementor].some(
        (part) => part !== undefined && findNodes(part, ts.isYieldExpression).length > 0,
      )
    ) {
      throw unsupported(loop);
    }
    const layout = getLayout(current);
    const head = { point: arms.length + 1, layout };
    heads.set(loop, head);
    addArm(() => {
      const again = (after: Path) => jump(after, head);
      const test = (after: Path, whenTrue: (path: Path) => Formula) =>
        condition === undefined
          ? whenTrue(after)
          : ifThenElse(
              translateCondition(condition, after.scope, context),
              whenTrue(after),
              continueWith(after),
            );
      const advance = (after: Path) =>
        incrementor === undefined
          ? again(after)
          : allocate(incrementor, after, context, (inner) =>
              translateExpressionStatement(incrementor, inner, context, iterationFrame, again),
            );
      const next = ts.isDoStatement(loop) ? (after: Path) => test(after, again) : advance;
      const iterationFrame: Frame = { ...loopFrame, next, continueTo: next, breakTo: continueWith };
      const runBody = (after: Path) =>
        translateStatements([loop.statement], after, context, iterationFrame);
      return resumeFrom(current, layout, (resumed) =>
        ts.isDoStatement(loop) ? runBody(resumed) : test(resumed, runBody),
      );
    });
    return jump(current, head);
  };
  // A yield* of another state machine passes each step on to it, from a resume point of its own that
  // keeps the inner generator, as ESCore's YieldStarLoop passes on what it received: a next's value,
  // a throw, or a return, until the inner generator completes.
  const delegateTo: MachineDelegate = (yielded, inner, current, delegateFrame, continueWith) => {
    const withInner = (after: Path, value?: Expression): Path => ({
      ...after,
      scope: {
        ...after.scope,
        results: new Map(
          value === undefined
            ? [...after.scope.results].filter((entry) => entry[0] !== yielded)
            : [...after.scope.results, [yielded, value]],
        ),
      },
    });
    const kept = withInner(current, inner.ref);
    const layout = getLayout(kept);
    const head: Head = { point: arms.length + 1, layout };
    addArm(() =>
      resumeFrom(kept, layout, (resumed, sent) =>
        stepMachine(
          yielded,
          inner,
          mode,
          sent,
          resumed,
          context,
          {
            throwTo: (after, thrown) =>
              delegateFrame.throwTo === undefined
                ? leaf(thrown.uncaught)
                : delegateFrame.throwTo(withInner(after), thrown),
          },
          (stepped, kind, value) =>
            ifThenElse(
              apply("=", [kind, string("yield")]),
              end(
                stepped,
                "yield",
                value,
                string(""),
                getSlot("suspendedYield", number(head.point), save(stepped, layout, head.point)),
              ),
              ifThenElse(
                apply("=", [mode, string("return")]),
                delegateFrame.exit(withInner(stepped), value),
                continueWith(withInner(stepped), value),
              ),
            ),
          resumed.scope.results.get(yielded),
        ),
      ),
    );
    return jump(kept, head);
  };
  const bodyFrame: Frame = {
    next: (current) => complete(current, "return", getUndefined(context)),
    exit: (current, value) => complete(current, "return", value ?? getUndefined(context)),
    breakTo: undefined,
    continueTo: undefined,
    throwTo: (current, thrown: Thrown) =>
      complete(current, "throw", thrown.value, getThrownMessage(thrown, node)),
    yieldTo: (current, value, rest, throwRest, yieldMode) => {
      if (yieldMode?.isResult === true) throw unsupported(node);
      const layout = getLayout(current);
      const abortRest = yieldMode?.abortRest;
      const point = addArm(() =>
        resumeFrom(current, layout, (resumed, sent) =>
          ifThenElse(
            apply("=", [mode, string("next")]),
            rest(resumed, sent),
            ifThenElse(
              apply("=", [mode, string("throw")]),
              throwRest(resumed, sent),
              abortRest !== undefined
                ? abortRest(resumed, "return", sent)
                : yieldMode?.isGuarded === true
                  ? leaf(
                      apply("Assert", [
                        boolean(false),
                        string(
                          "tla-ts can't close a generator that suspended in yield* or a helper",
                        ),
                      ]),
                    )
                  : complete(resumed, "return", sent),
            ),
          ),
        ),
      );
      return end(
        current,
        "yield",
        value ?? getUndefined(context),
        string(""),
        getSlot("suspendedYield", number(point), save(current, layout, point)),
      );
    },
    awaitTo: undefined,
    inlining: new Set([...frame.inlining, callee]),
    loopTo,
    delegateTo,
  };
  // The body starts from the parameters that the call bound, which the object keeps.
  const startLayout = getLayout(base);
  const startFormula = resumeFrom(base, startLayout, (entered) =>
    translateStatements(getBody(callee, entered.scope, context), entered, context, bodyFrame),
  );
  // Translating an arm may add the arms of the points that it reaches.
  const formulas: Formula[] = [startFormula];
  for (let position = 0; position < arms.length; position++) {
    arming.current = arms[position].point;
    formulas.push(arms[position].translate());
  }
  // The names that each arm binds, and those that it reads where it doesn't bind them.
  const getNames = (rendered: readonly Expression[]) =>
    rendered.map((arm) => {
      const binders = new Set<string>();
      const free = new Set<string>();
      collectNames(arm, new Set(), binders, free);
      return { binders, free };
    });
  const firstNames = getNames(formulas.map(render));
  const bound = new Set(firstNames.flatMap((names) => [...names.binders]));
  // An arm may keep code from the arm that went to its point, such as an operand that a statement
  // evaluated before it yielded, which reads names that arm bound. The point saves their values
  // too, as ESCore's frames keep the values of the steps that wait on a yield, and the arm binds the
  // names again. A name that the arm that goes there doesn't bind itself it keeps the same way.
  const kept = new Map<number, string[]>();
  const keep = (point: number, name: string): void => {
    if (point === 0 || firstNames[point].binders.has(name)) throw unsupported(node);
    if ((kept.get(point) ?? []).includes(name)) return;
    kept.set(point, [...(kept.get(point) ?? []), name]);
    (saves.get(point) ?? []).forEach((saved) => {
      if (!firstNames[saved.arm].binders.has(name)) keep(saved.arm, name);
    });
  };
  firstNames.forEach((names, point) =>
    [...names.free].filter((name) => bound.has(name)).forEach((name) => keep(point, name)),
  );
  kept.forEach((names, point) =>
    (saves.get(point) ?? []).forEach((saved) =>
      saved.elements.push(...names.map((name) => identifier(name))),
    ),
  );
  const rendered = formulas.map((formula, point) =>
    render(
      letIn(
        (kept.get(point) ?? []).map((name, offset) =>
          define(
            name,
            [],
            index(identifier(savedName), [number((sizes.get(point) ?? 0) + offset + 1)]),
          ),
        ),
        formula,
      ),
    ),
  );
  // Each arm runs on its own, so it can't read what another arm defines and its point doesn't keep,
  // such as the operator of a statement whose paths join after a yield.
  const binders = new Set<string>();
  const reads = [...rendered, ...hoisted.map((definition) => definition.body)].map((arm) => {
    const free = new Set<string>();
    collectNames(arm, new Set(), binders, free);
    return free;
  });
  if (reads.some((free) => [...free].some((name) => binders.has(name)))) throw unsupported(node);
  const started = rendered[0];
  const translated = rendered.slice(1);
  const dispatched = arms.reduceRight<Formula>(
    (rest, arm, position) =>
      ifThenElse(
        apply("=", [identifier(pointName), number(arm.point)]),
        leaf(translated[position]),
        rest,
      ),
    leaf(started),
  );
  const carried = tuple([
    mode,
    sent,
    identifier(savedName),
    ...outerNames.map((name) => identifier(name)),
  ]);
  const resume: OperatorDefinition = {
    ...define(
      resumeName,
      [selfName, pointName, modeName, sentName, savedName, ...outerNames].map((name) => ({
        name,
        arity: 0,
      })),
      // Each step evaluates what it carries, as a loop's iteration does.
      render(ifThenElse(apply("=", [carried, carried]), dispatched, leaf(boolean(false)))),
    ),
    isRecursive: true,
  };
  // GeneratorValidate throws where the body runs; a completed generator, or a return or a throw
  // before the body starts, completes without running it; otherwise the body runs from its point.
  const slotName = context.names.getFresh("slot");
  const slot = identifier(slotName);
  const outerParameters = outerNames.map((name) => identifier(name));
  const state = field(slot, "state");
  const stepped = letIn(
    [define(slotName, [], useJavaScript("MachineOf", [outerParameters[0], ref], context))],
    ifThenElse(
      apply("=", [state, string("executing")]),
      throwTypeError(base, node, context, {
        throwTo: (current, thrown) => {
          const values = getOuterValues(current);
          return leaf(
            tuple([string("throw"), thrown.value, getThrownMessage(thrown, node), ...values]),
          );
        },
      }),
      ifThenElse(
        apply("\\/", [
          apply("=", [state, string("completed")]),
          apply("/\\", [
            apply("=", [state, string("suspendedStart")]),
            apply("#", [mode, string("next")]),
          ]),
        ]),
        ifThenElse(
          apply("=", [mode, string("throw")]),
          complete(base, "throw", sent, string(node.getText())),
          complete(
            base,
            "return",
            ifExpression(apply("=", [mode, string("return")]), sent, getUndefined(context)),
          ),
        ),
        leaf(
          call(resumeName, [
            ref,
            field(slot, "point"),
            mode,
            sent,
            field(slot, "locals"),
            useJavaScript(
              "SetMachine",
              [
                outerParameters[0],
                ref,
                getSlot("executing", field(slot, "point"), field(slot, "locals")),
              ],
              context,
            ),
            ...outerParameters.slice(1),
          ]),
        ),
      ),
    ),
  );
  const step = define(
    stepName,
    [selfName, modeName, sentName, ...outerNames].map((name) => ({ name, arity: 0 })),
    render(stepped),
  );
  return {
    machine: { step: stepName, outer },
    definitions: [...hoisted, resume, step],
    locals: tuple(
      startLayout.locals.map((symbol) => start.bindings.get(symbol) ?? getUndefined(context)),
    ),
  };
};

// Steps the generator that a state machine runs, for its next, return, or throw with the value that
// the call sends, and continues with what the step gave: "yield" or "return", and its value. What
// the body throws goes to the frame.
export const stepMachine = (
  node: ts.Node,
  suspension: Suspension,
  method: string | Expression,
  argument: Expression | undefined,
  path: Path,
  context: Context,
  frame: Pick<Frame, "throwTo">,
  continueWith: (path: Path, kind: Expression, value: Expression) => Formula,
  // The generator object, where a resume point keeps it rather than the suspension.
  ref = suspension.ref,
): Formula => {
  const machine = suspension.machine;
  if (machine === undefined) throw unsupported(node);
  const values = machine.outer.map((symbol) => {
    const value = path.scope.bindings.get(symbol);
    if (value === undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't resume a generator away from the call whose locals it shares",
        node,
      );
    }
    return value;
  });
  const result = context.names.getFresh("stepped");
  const getResult = (position: number) => index(identifier(result), [number(position)]);
  const after: Path = {
    ...path,
    isAssigned: path.isAssigned || machine.outer.some((symbol) => context.variables.has(symbol)),
    scope: {
      ...path.scope,
      bindings: new Map([
        ...path.scope.bindings,
        ...machine.outer.map((symbol, position): [ts.Symbol, Expression] => [
          symbol,
          getResult(position + 4),
        ]),
      ]),
    },
  };
  const kind = getResult(1);
  const value = getResult(2);
  const throwTo = frame.throwTo;
  const uncaught = apply("Assert", [boolean(false), getResult(3)]);
  return bindOnce(
    path,
    result,
    call(machine.step, [
      ...(machine.isHelper === true ? [] : [ref]),
      typeof method === "string" ? string(method) : method,
      argument ?? getUndefined(context),
      ...values,
    ]),
    ifThenElse(
      apply("=", [kind, string("throw")]),
      throwTo === undefined ? leaf(uncaught) : throwTo(after, { value, uncaught }),
      continueWith(after, kind, value),
    ),
  );
};

// The suspension of the state machine that a receiver holds, where tla-ts can tell which.
export const getMachine = (receiver: Expression, path: Path) =>
  [...path.generators.values()].find(
    (suspension) => suspension.machine !== undefined && isSameExpression(suspension.ref, receiver),
  );

const HELPER_METHODS = new Set(["map", "filter", "flatMap", "take", "drop"]);

const HELPER_STEP_METHODS = new Set(["next", "return"]);

// Whether a helper's call passes what a state machine runs it with: a function that the call writes
// in place, whose body makes no functions, or a number literal for take or drop.
const isMachineArgument = (method: string, argument: ts.Expression | undefined) => {
  const inner = argument && skipCasts(argument);
  if (inner === undefined) return false;
  if (method === "take" || method === "drop") {
    return ts.isNumericLiteral(inner) && Number(inner.text) <= 2 ** 31 - 1;
  }
  return (
    (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner)) &&
    findNodes(
      inner.body,
      (node): node is ts.Node => ts.isFunctionLike(node) || ts.isClassLike(node),
    ).length === 0
  );
};

// Whether a call of Iterator.prototype's map, filter, flatMap, take, or drop makes a helper that a
// state machine runs, where what it wraps is one too or an array's iterator.
export const isMachineHelper = (node: ts.CallExpression, context: Context): boolean =>
  context.heap !== undefined &&
  ts.isPropertyAccessExpression(node.expression) &&
  HELPER_METHODS.has(node.expression.name.text) &&
  node.arguments.length === 1 &&
  isMachineArgument(node.expression.name.text, node.arguments[0]) &&
  isMachineUse(node, context, HELPER_STEP_METHODS);

// Translates an iterator helper as the operators of its state machine, as ESCore's HelperStep runs
// a helper from the slots that say where its closure stopped: the counter that it passes its
// callback, how many values take or drop has left, and for flatMap the values of the iterable that
// the mapper gave and the position in them, or 0 outside one.
export const makeHelperMachine = (
  node: ts.CallExpression,
  method: string,
  callback: FunctionNode | undefined,
  callbackReceiver: Receiver | undefined,
  limit: number | undefined,
  // What the helper steps: an array's iterator, which keeps where it is on the heap, or the object
  // of another state machine, with its suspension.
  iterator: Expression,
  sourceMachine: Suspension | undefined,
  ref: Expression,
  made: Path,
  context: Context,
  frame: Frame,
): { machine: Machine; definitions: OperatorDefinition[] } => {
  const heap = context.heap;
  if (heap === undefined) throw unsupported(node);
  const isOwn = (symbol: ts.Symbol) => callback !== undefined && isDeclaredIn(symbol, callback);
  const referenced = new Set([
    ...(callback === undefined ? [] : getReferenced(callback, made, context)),
    ...(sourceMachine?.machine?.outer ?? []),
  ]);
  const outer = getOuter(referenced, isOwn, made, heap, node);
  // A mapper's arrays are what flatMap flattens; a primitive throws.
  const returned = callback === undefined ? undefined : getReturnType(callback, context);
  const isFlattened =
    returned !== undefined &&
    (returned.isUnion() ? returned.types : [returned]).every(
      (member) => context.checker.isArrayType(member) || context.checker.isTupleType(member),
    );
  if (
    method === "flatMap" &&
    callback !== undefined &&
    !isFlattened &&
    !isPrimitiveReturn(callback, context)
  ) {
    throw unsupported(node);
  }
  const pullName = context.names.getFresh("Pull");
  const stepName = context.names.getFresh("Step");
  const counterName = context.names.getFresh("counter");
  const remainingName = context.names.getFresh("remaining");
  const innerName = context.names.getFresh("inner");
  const positionName = context.names.getFresh("position");
  const modeName = context.names.getFresh("mode");
  const sentName = context.names.getFresh("sent");
  const outerNames = outer.map((symbol) => {
    const binding = made.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const counter = identifier(counterName);
  const remaining = identifier(remainingName);
  const inner = identifier(innerName);
  const position = identifier(positionName);
  const base: Path = {
    ...made,
    isMachine: true,
    isLooping: true,
    isLast: false,
    tasks: undefined,
    generators: new Map([...made.generators].filter((entry) => entry[1].machine !== undefined)),
    scope: {
      ...made.scope,
      bindings: new Map([
        ...made.scope.bindings,
        ...outer.map((symbol, offset): [ts.Symbol, Expression] => [
          symbol,
          identifier(outerNames[offset]),
        ]),
      ]),
    },
  };
  const getOuterValues = (current: Path) =>
    outer.map((symbol) => {
      const value = current.scope.bindings.get(symbol);
      if (value === undefined) throw unsupported(node);
      return value;
    });
  const end = (
    current: Path,
    kind: string,
    value: Expression,
    message: Expression,
    slot: Expression,
  ) => {
    const values = getOuterValues(current);
    return leaf(
      tuple([
        string(kind),
        value,
        message,
        useJavaScript("SetMachine", [values[0], ref, slot], context),
        ...values.slice(1),
      ]),
    );
  };
  const complete = (current: Path, kind: string, value: Expression, message = string("")) =>
    end(current, kind, value, message, COMPLETED);
  const finish = (current: Path) => complete(current, "return", getUndefined(context));
  const throwEnd = (current: Path, thrown: Thrown) =>
    complete(current, "throw", thrown.value, getThrownMessage(thrown, node));
  const give = (current: Path, value: Expression, locals: Expression[]) =>
    end(current, "yield", value, string(""), getSlot("suspendedYield", number(1), tuple(locals)));
  const pull = (current: Path, locals: Expression[]) =>
    leaf(call(pullName, [...locals, ...getOuterValues(current)]));
  const heapOf = (current: Path) => getOuterValues(current)[0];
  const withHeapValue = (current: Path, value: Expression): Path => ({
    ...current,
    scope: {
      ...current.scope,
      bindings: new Map([...current.scope.bindings, [heap, value]]),
    },
  });
  // A step of what the helper wraps, which gives whether it's done and its value.
  const stepSource = (
    current: Path,
    stepFrame: Pick<Frame, "throwTo">,
    continueWith: (path: Path, isDone: Expression, value: Expression) => Formula,
  ): Formula => {
    if (sourceMachine !== undefined) {
      return stepMachine(
        node,
        sourceMachine,
        "next",
        undefined,
        current,
        context,
        stepFrame,
        (stepped, kind, value) =>
          continueWith(stepped, apply("=", [kind, string("return")]), value),
      );
    }
    const stepped = context.names.getFresh("step");
    const step = identifier(stepped);
    return ifThenElse(
      useJavaScript("HoldsIteratorNext", [heapOf(current), iterator], context),
      bindOnce(
        current,
        stepped,
        useJavaScript("BuiltInIteratorStep", [heapOf(current), iterator], context),
        ifThenElse(
          field(step, "isThrown"),
          throwTypeError(current, node, context, stepFrame),
          continueWith(
            withHeapValue(current, field(step, "heap")),
            field(step, "isDone"),
            field(step, "value"),
          ),
        ),
      ),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't step an iterator whose next a script replaced"),
        ]),
      ),
    );
  };
  // IteratorClose of what the helper wraps, as its return closes it.
  const closeSource = (
    current: Path,
    closeFrame: Pick<Frame, "throwTo">,
    continueWith: (path: Path) => Formula,
  ): Formula => {
    if (sourceMachine !== undefined) {
      return stepMachine(
        node,
        sourceMachine,
        "return",
        undefined,
        current,
        context,
        closeFrame,
        (closed) => continueWith(closed),
      );
    }
    return ifThenElse(
      apply("=", [
        useJavaScript("Get", [heapOf(current), iterator, string("return")], context),
        getUndefined(context),
      ]),
      continueWith(current),
      leaf(
        apply("Assert", [
          boolean(false),
          string(
            "tla-ts can't close an array's or a string's iterator through a return that a script gives",
          ),
        ]),
      ),
    );
  };
  // A callback that throws closes what the helper wraps, and what the close throws loses to it.
  const callbackFrame: Frame = {
    ...frame,
    breakTo: undefined,
    continueTo: undefined,
    yieldTo: undefined,
    awaitTo: undefined,
    throwTo: (current, thrown) =>
      closeSource(current, { throwTo: (closed) => throwEnd(closed, thrown) }, (closed) =>
        throwEnd(closed, thrown),
      ),
  };
  const sourceFrame = { throwTo: throwEnd };
  const outerPhase = (current: Path): Formula => {
    const run = stepSource(current, sourceFrame, (stepped, isDone, value) => {
      const next = [apply("+", [counter, number(1)]), remaining, tuple([]), number(0)];
      if (method === "take") {
        return ifThenElse(
          isDone,
          finish(stepped),
          give(stepped, value, [counter, apply("-", [remaining, number(1)]), tuple([]), number(0)]),
        );
      }
      if (method === "drop") {
        return ifThenElse(
          isDone,
          finish(stepped),
          ifThenElse(
            apply(">", [remaining, number(0)]),
            pull(stepped, [counter, apply("-", [remaining, number(1)]), tuple([]), number(0)]),
            give(stepped, value, [counter, remaining, tuple([]), number(0)]),
          ),
        );
      }
      if (callback === undefined) throw unsupported(node);
      const elementName = context.names.getFresh("element");
      const element = identifier(elementName);
      const called = inlineValues(
        callback,
        [element, counter],
        callbackReceiver,
        stepped,
        context,
        callbackFrame,
        (done, result) => {
          const resultName = context.names.getFresh("result");
          const mapped = identifier(resultName);
          if (method === "map") {
            return bindOnce(
              done,
              resultName,
              result ?? getUndefined(context),
              give(done, mapped, next),
            );
          }
          if (method === "filter") {
            return bindOnce(
              done,
              resultName,
              result ?? getUndefined(context),
              ifThenElse(
                useJavaScript("ToBoolean", [mapped], context),
                give(done, element, next),
                pull(done, next),
              ),
            );
          }
          if (!isFlattened) return throwTypeError(done, node, context, callbackFrame);
          const values = ifExpression(
            useJavaScript("IsRef", [mapped], context),
            useJavaScript("ArrayLikeValues", [heapOf(done), mapped], context),
            mapped,
          );
          return bindOnce(
            done,
            resultName,
            result ?? getUndefined(context),
            ifThenElse(
              holdsArrayIteration(heapOf(done), node, context),
              pull(done, [counter, remaining, values, number(1)]),
              leaf(apply("Assert", [boolean(false), string(ARRAY_ITERATOR_REPLACED)])),
            ),
          );
        },
      );
      return ifThenElse(isDone, finish(stepped), bindOnce(stepped, elementName, value, called));
    });
    // take closes what it wraps once it has given its limit.
    return method === "take"
      ? ifThenElse(
          apply("=", [remaining, number(0)]),
          closeSource(current, sourceFrame, finish),
          run,
        )
      : run;
  };
  // flatMap gives the values of the mapper's iterable before it steps what it wraps again.
  const pulled =
    method === "flatMap"
      ? ifThenElse(
          apply("=", [position, number(0)]),
          outerPhase(base),
          ifThenElse(
            apply("<=", [position, apply("Len", [inner])]),
            give(base, index(inner, [position]), [
              counter,
              remaining,
              inner,
              apply("+", [position, number(1)]),
            ]),
            pull(base, [apply("+", [counter, number(1)]), remaining, tuple([]), number(0)]),
          ),
        )
      : outerPhase(base);
  const parameters = [counterName, remainingName, innerName, positionName, ...outerNames];
  const carried = tuple(parameters.map((name) => identifier(name)));
  const pullDefinition: OperatorDefinition = {
    ...define(
      pullName,
      parameters.map((name) => ({ name, arity: 0 })),
      render(ifThenElse(apply("=", [carried, carried]), pulled, leaf(boolean(false)))),
    ),
    isRecursive: true,
  };
  const slotName = context.names.getFresh("slot");
  const slot = identifier(slotName);
  const state = field(slot, "state");
  const locals = field(slot, "locals");
  const outerParameters = outerNames.map((name) => identifier(name));
  const mode = identifier(modeName);
  const executing = (current: Path) =>
    withHeapValue(
      current,
      useJavaScript(
        "SetMachine",
        [heapOf(current), ref, getSlot("executing", number(1), locals)],
        context,
      ),
    );
  // %IteratorHelperPrototype%'s next and return validate the helper as GeneratorValidate does. A
  // return completes it and closes what it wraps, unless it already completed.
  const stepped = letIn(
    [define(slotName, [], useJavaScript("MachineOf", [outerParameters[0], ref], context))],
    ifThenElse(
      apply("=", [state, string("executing")]),
      throwTypeError(base, node, context, {
        throwTo: (current, thrown) =>
          leaf(
            tuple([
              string("throw"),
              thrown.value,
              getThrownMessage(thrown, node),
              ...getOuterValues(current),
            ]),
          ),
      }),
      ifThenElse(
        apply("=", [state, string("completed")]),
        finish(base),
        ifThenElse(
          apply("=", [mode, string("return")]),
          closeSource(
            withHeapValue(
              base,
              useJavaScript("SetMachine", [heapOf(base), ref, COMPLETED], context),
            ),
            sourceFrame,
            finish,
          ),
          ifThenElse(
            apply("=", [state, string("suspendedStart")]),
            pull(executing(base), [number(0), number(limit ?? 0), tuple([]), number(0)]),
            pull(
              executing(base),
              [1, 2, 3, 4].map((offset) => index(locals, [number(offset)])),
            ),
          ),
        ),
      ),
    ),
  );
  const step = define(
    stepName,
    [modeName, sentName, ...outerNames].map((name) => ({ name, arity: 0 })),
    render(stepped),
  );
  return {
    machine: { step: stepName, outer, isHelper: true },
    definitions: [pullDefinition, step],
  };
};

// The state machines that a path holds, which keep where they suspended on the heap, so that a
// loop's iterations can step them.
export const getMachines = (path: Path) =>
  new Map([...path.generators].filter((entry) => entry[1].machine !== undefined));

// The values from outside the state machines whose objects a node names, which code that steps
// them reads and changes.
export const getSteppedOuter = (node: ts.Node, path: Path, context: Context) => {
  const machines = [...getMachines(path).values()];
  if (machines.length === 0) return [];
  return [
    ...new Set(
      findNodes(node, ts.isIdentifier).flatMap((identifier) => {
        const symbol = getSymbol(identifier, context.checker);
        const value = symbol && path.scope.bindings.get(symbol);
        return value === undefined
          ? []
          : machines
              .filter((suspension) => isSameExpression(suspension.ref, value))
              .flatMap((suspension) => suspension.machine?.outer ?? []);
      }),
    ),
  ];
};
