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
} from "./context";
import { translateCondition } from "./expressions";
import { type Formula, ifThenElse, leaf, letIn, render } from "./formula";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
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
  // The operator that runs the body for a next, a return, or a throw, from where it suspended.
  step: string;
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

// Whether an expression is an object of a state machine that a call of one of its methods steps, or
// that a for-of whose body doesn't suspend iterates.
const isStepped = (node: ts.Node, methods: ReadonlySet<string>) => {
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
      methods.has(parent.name.text)) ||
    (ts.isForOfStatement(parent) &&
      parent.expression === outer &&
      parent.awaitModifier === undefined &&
      !isSuspending(parent.statement))
  );
};

// Whether code yields or awaits outside the functions that it makes, which a loop's operator can't.
const isSuspending = (node: ts.Node): boolean =>
  ts.isYieldExpression(node) ||
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, isSuspending) ?? false));

// Whether the object that a call makes only meets the code that steps a state machine: the call is
// stepped, or it initializes a variable that only such code in the same function reads.
const isMachineUse = (
  node: ts.Node,
  context: Context,
  methods: ReadonlySet<string> = STEP_METHODS,
) => {
  if (!ts.isCallExpression(node)) return false;
  if (isStepped(node, methods)) return true;
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
  const references = findNodes(name.getSourceFile(), ts.isIdentifier).filter(
    (identifier) =>
      !ts.isVariableDeclaration(identifier.parent) &&
      getSymbol(identifier, context.checker) === symbol,
  );
  // A variable may also take another object that a call makes, whose own call decides how it runs.
  return (
    symbol !== undefined &&
    references.some((reference) => isStepped(reference, methods)) &&
    references.every(
      (reference) =>
        ts.findAncestor(reference, ts.isFunctionLike) === owner &&
        (isStepped(reference, methods) ||
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
// steps it as one.
export const isMachineGenerator = (node: ts.Node, callee: FunctionNode, context: Context) =>
  context.heap !== undefined &&
  !isAsyncGenerator(callee) &&
  callee.body !== undefined &&
  ts.isBlock(callee.body) &&
  findNodes(
    callee.body,
    (inner): inner is ts.Node => ts.isFunctionLike(inner) || ts.isClassLike(inner),
  ).length === 0 &&
  findNodes(callee, ts.isIdentifier).every(
    (identifier) => getArgumentsOwner(identifier, context.checker) !== callee,
  ) &&
  isMachineUse(node, context);

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
  ref: Expression,
  made: Path,
  start: Scope,
  context: Context,
  frame: Frame,
): { machine: Machine; definitions: OperatorDefinition[] } => {
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
  const base: Path = {
    ...made,
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
      !isSameEntries(captured.generators, base.generators) ||
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
  const save = (current: Path, layout: Layout) =>
    tuple([
      ...layout.locals.map((symbol) => current.scope.bindings.get(symbol) ?? getUndefined(context)),
      ...layout.results.map((key) => current.scope.results.get(key) ?? getUndefined(context)),
      ...layout.allocated.map((key) => current.scope.allocated.get(key) ?? getUndefined(context)),
    ]);
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
        number(head.point),
        string("next"),
        getUndefined(context),
        save(current, head.layout),
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
        getSlot("suspendedYield", number(point), save(current, layout)),
      );
    },
    awaitTo: undefined,
    inlining: new Set([...frame.inlining, callee]),
    loopTo,
  };
  const started = render(
    resumeFrom(base, { locals: [], results: [], allocated: [] }, (entered) =>
      translateStatements(getBody(callee, entered.scope, context), entered, context, bodyFrame),
    ),
  );
  // Translating an arm may add the arms of the points that it reaches.
  const translated: Expression[] = [];
  for (let position = 0; position < arms.length; position++) {
    translated.push(render(arms[position].translate()));
  }
  // Each arm runs on its own, so it can't read what another arm defines, such as the operator of a
  // statement whose paths join after a yield.
  const binders = new Set<string>();
  const reads = [started, ...translated].map((arm) => {
    const free = new Set<string>();
    collectNames(arm, new Set(), binders, free);
    return free;
  });
  if (reads.some((free) => [...free].some((name) => binders.has(name)))) throw unsupported(node);
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
      [pointName, modeName, sentName, savedName, ...outerNames].map((name) => ({ name, arity: 0 })),
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
    [modeName, sentName, ...outerNames].map((name) => ({ name, arity: 0 })),
    render(stepped),
  );
  return { machine: { step: stepName, outer }, definitions: [resume, step] };
};

// Steps the generator that a state machine runs, for its next, return, or throw with the value that
// the call sends, and continues with what the step gave: "yield" or "return", and its value. What
// the body throws goes to the frame.
export const stepMachine = (
  node: ts.Node,
  suspension: Suspension,
  method: string,
  argument: Expression | undefined,
  path: Path,
  context: Context,
  frame: Pick<Frame, "throwTo">,
  continueWith: (path: Path, kind: Expression, value: Expression) => Formula,
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
    call(machine.step, [string(method), argument ?? getUndefined(context), ...values]),
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
