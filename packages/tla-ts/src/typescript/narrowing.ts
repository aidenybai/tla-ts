import ts from "@typescript/typescript6";
import { skipCasts } from "./context";

// What a walk of a function asks about its nodes. A read that getDeclared gives a type for is one
// that another function may assign.
export interface NarrowingQueries {
  checker: ts.TypeChecker;
  getDeclared: (node: ts.Expression) => ts.Type | undefined;
  getReference: (node: ts.Expression) => string | undefined;
  isInlined: (node: ts.Node) => boolean;
  // Whether reading or writing a property of an object may run a getter, a setter, or a proxy's
  // trap.
  isAccessed: (receiver: ts.Expression) => boolean;
  // Whether converting a value to a primitive may run its valueOf or toString.
  isConverted: (operand: ts.Expression) => boolean;
}

// The references that TypeScript's narrowing holds for at a point: those that the function
// assigned, or read where TypeScript knew only their declared type, with nothing since that may
// run another function's code. Undefined is a point that nothing reaches.
type Fresh = ReadonlySet<string> | undefined;

interface Outcome {
  isTrue: Fresh;
  isFalse: Fresh;
}

// Where a break, a continue, or a return goes.
interface Target {
  kind: "function" | "loop" | "switch" | "block";
  label: string | undefined;
  finallyDepth: number;
  breaks: Fresh[];
  continues: Fresh[];
  returns: Fresh[];
}

const NOTHING: ReadonlySet<string> = new Set();

const join = (states: readonly Fresh[]): Fresh => {
  const reached = states.filter((state) => state !== undefined);
  return reached.length === 0
    ? undefined
    : new Set([...reached[0]].filter((key) => reached.every((state) => state.has(key))));
};

const isSame = (left: Fresh, right: Fresh) =>
  left === undefined || right === undefined
    ? left === right
    : left.size === right.size && [...left].every((key) => right.has(key));

const CONVERTING_OPERATORS = new Set([
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.LessThanLessThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.CaretToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
]);

const LOGICAL_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

// Whether each read of a reference that another function may assign keeps TypeScript's narrowing
// in a function: a walk of its control flow, through what a call runs where it's written, that a
// call, new, a getter or setter, a tagged template, yield, await, delete, an iterator, or a
// conversion to a primitive ends, as each may run another function's code.
export const getKeptReads = (root: ts.Node, queries: NarrowingQueries) => {
  const kept = new Map<ts.Node, boolean>();
  const targets: Target[] = [];
  let finallyDepth = 0;
  const run = (state: Fresh) => (state === undefined ? undefined : NOTHING);
  const add = (state: Fresh, key: string | undefined) =>
    state === undefined || key === undefined ? state : new Set([...state, key]);
  const read = (node: ts.Expression, state: Fresh) => {
    const declared = queries.getDeclared(node);
    if (state === undefined || declared === undefined) return state;
    const key = queries.getReference(node);
    kept.set(node, key !== undefined && state.has(key));
    // Where TypeScript knows no more than the declared type, what narrows the read comes later.
    return queries.checker.isTypeAssignableTo(declared, queries.checker.getTypeAtLocation(node))
      ? add(state, key)
      : state;
  };
  const getTarget = (label: ts.Identifier | undefined, isContinue: boolean) =>
    targets.findLast((target) =>
      label === undefined
        ? target.kind === "loop" || (!isContinue && target.kind === "switch")
        : target.label === label.text,
    );
  const leave = (state: Fresh, target: Target | undefined) =>
    target === undefined || target.finallyDepth === finallyDepth ? state : run(state);
  const assign = (target: ts.Expression, state: Fresh): Fresh => {
    if (state === undefined) return undefined;
    const inner = skipCasts(target);
    if (ts.isArrayLiteralExpression(inner)) {
      return inner.elements.reduce<Fresh>(
        (current, element) => assign(element, current),
        run(state),
      );
    }
    if (ts.isObjectLiteralExpression(inner)) {
      return inner.properties.reduce<Fresh>(
        (current, property) =>
          ts.isPropertyAssignment(property)
            ? assign(
                property.initializer,
                ts.isComputedPropertyName(property.name)
                  ? walk(property.name.expression, current)
                  : current,
              )
            : ts.isShorthandPropertyAssignment(property)
              ? add(
                  walk(property.objectAssignmentInitializer, current),
                  queries.getReference(property.name),
                )
              : ts.isSpreadAssignment(property)
                ? assign(property.expression, current)
                : current,
        state,
      );
    }
    if (ts.isSpreadElement(inner)) return assign(inner.expression, state);
    if (ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      return assign(inner.left, walk(inner.right, state));
    }
    if (ts.isPropertyAccessExpression(inner) || ts.isElementAccessExpression(inner)) {
      return queries.isAccessed(inner.expression)
        ? run(state)
        : add(state, queries.getReference(inner));
    }
    return add(state, queries.getReference(inner));
  };
  // The receiver and the key of an assignment's target run before its value.
  const walkTarget = (target: ts.Expression, state: Fresh) => {
    const inner = skipCasts(target);
    return ts.isPropertyAccessExpression(inner)
      ? walk(inner.expression, state)
      : ts.isElementAccessExpression(inner)
        ? walk(inner.argumentExpression, walk(inner.expression, state))
        : state;
  };
  const bind = (name: ts.BindingName, state: Fresh, isAssigned: boolean): Fresh => {
    if (ts.isIdentifier(name)) {
      return isAssigned ? add(state, queries.getReference(name)) : state;
    }
    const start = ts.isArrayBindingPattern(name) ? run(state) : state;
    return name.elements.reduce<Fresh>(
      (current, element) =>
        ts.isOmittedExpression(element)
          ? current
          : bind(
              element.name,
              walk(
                element.initializer,
                element.propertyName !== undefined &&
                  ts.isComputedPropertyName(element.propertyName)
                  ? walk(element.propertyName.expression, current)
                  : current,
              ),
              true,
            ),
      start,
    );
  };
  const declare = (list: ts.VariableDeclarationList, state: Fresh) =>
    list.declarations.reduce<Fresh>(
      (current, declaration) =>
        bind(
          declaration.name,
          walk(declaration.initializer, current),
          declaration.initializer !== undefined || (list.flags & ts.NodeFlags.BlockScoped) !== 0,
        ),
      state,
    );
  const walkArguments = (items: readonly ts.Expression[] | undefined, state: Fresh) =>
    (items ?? []).reduce<Fresh>((current, argument) => walk(argument, current), state);
  const walkCall = (node: ts.CallExpression, state: Fresh) => {
    const callee = skipCasts(node.expression);
    if (
      (ts.isFunctionExpression(callee) || ts.isArrowFunction(callee)) &&
      queries.isInlined(callee)
    ) {
      return walkBody(callee, walkArguments(node.arguments, state));
    }
    const before = walk(node.expression, state);
    const called = run(walkArguments(node.arguments, before));
    return node.questionDotToken === undefined ? called : join([before, called]);
  };
  // A function's parameters and body, from where a call enters it to where it returns.
  const walkBody = (node: ts.FunctionLikeDeclaration, state: Fresh) => {
    const entered = node.parameters.reduce<Fresh>(
      (current, parameter) => bind(parameter.name, walk(parameter.initializer, current), false),
      state,
    );
    const target = push("function", undefined);
    const end =
      node.body === undefined || !ts.isBlock(node.body)
        ? walk(node.body, entered)
        : walkStatements(node.body.statements, entered);
    targets.pop();
    return join([end, ...target.returns]);
  };
  // A condition, which reaches where it's true and where it's false through what && and || ran.
  const test = (node: ts.Expression | undefined, state: Fresh): Outcome => {
    const inner = node === undefined ? undefined : skipCasts(node);
    if (
      inner !== undefined &&
      ts.isPrefixUnaryExpression(inner) &&
      inner.operator === ts.SyntaxKind.ExclamationToken
    ) {
      const operand = test(inner.operand, state);
      return { isTrue: operand.isFalse, isFalse: operand.isTrue };
    }
    const kind =
      inner !== undefined && ts.isBinaryExpression(inner) ? inner.operatorToken.kind : undefined;
    if (
      inner !== undefined &&
      ts.isBinaryExpression(inner) &&
      (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken)
    ) {
      const left = test(inner.left, state);
      const isAnd = kind === ts.SyntaxKind.AmpersandAmpersandToken;
      const right = test(inner.right, isAnd ? left.isTrue : left.isFalse);
      return isAnd
        ? { isTrue: right.isTrue, isFalse: join([left.isFalse, right.isFalse]) }
        : { isTrue: join([left.isTrue, right.isTrue]), isFalse: right.isFalse };
    }
    const value = walk(inner, state);
    return { isTrue: value, isFalse: value };
  };
  const walk = (node: ts.Expression | undefined, state: Fresh): Fresh => {
    if (node === undefined || state === undefined) return state;
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return state;
    if (ts.isClassExpression(node)) return run(state);
    if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
      return walk(node.expression, state);
    }
    if (
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isSatisfiesExpression(node)
    ) {
      return walk(node.expression, state);
    }
    if (ts.isIdentifier(node)) return read(node, state);
    if (ts.isPropertyAccessExpression(node)) {
      const receiver = walk(node.expression, state);
      const accessed = queries.isAccessed(node.expression) ? run(receiver) : receiver;
      const value = read(node, accessed);
      return node.questionDotToken === undefined ? value : join([receiver, value]);
    }
    if (ts.isElementAccessExpression(node)) {
      const receiver = walk(node.expression, state);
      const key = walk(node.argumentExpression, receiver);
      const accessed =
        queries.isAccessed(node.expression) || queries.isConverted(node.argumentExpression)
          ? run(key)
          : key;
      const value = read(node, accessed);
      return node.questionDotToken === undefined ? value : join([receiver, value]);
    }
    if (ts.isCallExpression(node)) return walkCall(node, state);
    if (ts.isNewExpression(node)) {
      return run(walkArguments(node.arguments, walk(node.expression, state)));
    }
    if (ts.isTaggedTemplateExpression(node)) {
      return run(walk(node.template, walk(node.tag, state)));
    }
    if (ts.isTemplateExpression(node)) {
      return node.templateSpans.reduce<Fresh>((current, span) => {
        const value = walk(span.expression, current);
        return queries.isConverted(span.expression) ? run(value) : value;
      }, state);
    }
    if (
      ts.isYieldExpression(node) ||
      ts.isAwaitExpression(node) ||
      ts.isDeleteExpression(node) ||
      ts.isSpreadElement(node)
    ) {
      return run(walk(node.expression, state));
    }
    if (ts.isConditionalExpression(node)) {
      const condition = test(node.condition, state);
      return join([walk(node.whenTrue, condition.isTrue), walk(node.whenFalse, condition.isFalse)]);
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const operand = walk(node.operand, state);
      const isChanged =
        node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken;
      const converted =
        node.operator !== ts.SyntaxKind.ExclamationToken && queries.isConverted(node.operand)
          ? run(operand)
          : operand;
      return isChanged ? assign(node.operand, converted) : converted;
    }
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      if (kind === ts.SyntaxKind.EqualsToken) {
        return assign(node.left, walk(node.right, walkTarget(node.left, state)));
      }
      const left = walk(node.left, state);
      if (LOGICAL_OPERATORS.has(kind)) {
        const right = walk(node.right, left);
        const isAssigned =
          kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
        return join([left, isAssigned ? assign(node.left, right) : right]);
      }
      const right = walk(node.right, left);
      const isConverting =
        kind === ts.SyntaxKind.InstanceOfKeyword ||
        (kind === ts.SyntaxKind.InKeyword &&
          (queries.isConverted(node.left) || queries.isAccessed(node.right))) ||
        (CONVERTING_OPERATORS.has(kind) &&
          (queries.isConverted(node.left) || queries.isConverted(node.right)));
      const converted = isConverting ? run(right) : right;
      return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment
        ? assign(node.left, converted)
        : converted;
    }
    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.reduce<Fresh>(
        (current, property) =>
          ts.isPropertyAssignment(property)
            ? walk(
                property.initializer,
                ts.isComputedPropertyName(property.name)
                  ? walk(property.name.expression, current)
                  : current,
              )
            : ts.isShorthandPropertyAssignment(property)
              ? walk(property.name, current)
              : ts.isSpreadAssignment(property)
                ? queries.isAccessed(property.expression)
                  ? run(walk(property.expression, current))
                  : walk(property.expression, current)
                : ts.isComputedPropertyName(property.name)
                  ? walk(property.name.expression, current)
                  : current,
        state,
      );
    }
    const children: ts.Node[] = [];
    ts.forEachChild(node, (child) => {
      children.push(child);
    });
    return children.reduce<Fresh>(
      (current, child) => (ts.isExpression(child) ? walk(child, current) : current),
      state,
    );
  };
  const push = (kind: Target["kind"], label: string | undefined) => {
    const target: Target = { kind, label, finallyDepth, breaks: [], continues: [], returns: [] };
    targets.push(target);
    return target;
  };
  // A loop runs its body until what reaches its start stops changing.
  const walkLoop = (
    entry: Fresh,
    label: string | undefined,
    iterate: (head: Fresh, target: Target) => { exit: Fresh; back: Fresh },
  ) => {
    const pass = (head: Fresh): { head: Fresh; exit: Fresh } => {
      const target = push("loop", label);
      const result = iterate(head, target);
      targets.pop();
      const next = join([entry, result.back]);
      return isSame(next, head)
        ? { head, exit: join([result.exit, ...target.breaks]) }
        : pass(next);
    };
    return pass(entry).exit;
  };
  const walkStatement = (node: ts.Statement, state: Fresh, label?: string): Fresh => {
    if (state === undefined) return undefined;
    if (ts.isBlock(node)) return walkStatements(node.statements, state);
    if (ts.isVariableStatement(node)) return declare(node.declarationList, state);
    if (ts.isExpressionStatement(node)) return walk(node.expression, state);
    if (ts.isIfStatement(node)) {
      const condition = test(node.expression, state);
      return join([
        walkStatement(node.thenStatement, condition.isTrue),
        node.elseStatement === undefined
          ? condition.isFalse
          : walkStatement(node.elseStatement, condition.isFalse),
      ]);
    }
    if (ts.isReturnStatement(node)) {
      const value = walk(node.expression, state);
      const target = targets.findLast((inner) => inner.kind === "function");
      target?.returns.push(leave(value, target));
      return undefined;
    }
    if (ts.isThrowStatement(node)) {
      walk(node.expression, state);
      return undefined;
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      const target = getTarget(node.label, ts.isContinueStatement(node));
      (ts.isContinueStatement(node) ? target?.continues : target?.breaks)?.push(
        leave(state, target),
      );
      return undefined;
    }
    if (ts.isLabeledStatement(node)) {
      if (ts.isIterationStatement(node.statement, false)) {
        return walkStatement(node.statement, state, node.label.text);
      }
      const target = push("block", node.label.text);
      const end = walkStatement(node.statement, state);
      targets.pop();
      return join([end, ...target.breaks]);
    }
    if (ts.isWhileStatement(node)) {
      return walkLoop(state, label, (head, target) => {
        const condition = test(node.expression, head);
        const end = walkStatement(node.statement, condition.isTrue);
        return { exit: condition.isFalse, back: join([end, ...target.continues]) };
      });
    }
    if (ts.isDoStatement(node)) {
      return walkLoop(state, label, (head, target) => {
        const end = walkStatement(node.statement, head);
        const condition = test(node.expression, join([end, ...target.continues]));
        return { exit: condition.isFalse, back: condition.isTrue };
      });
    }
    if (ts.isForStatement(node)) {
      const initialized =
        node.initializer !== undefined && ts.isVariableDeclarationList(node.initializer)
          ? declare(node.initializer, state)
          : walk(node.initializer, state);
      return walkLoop(initialized, label, (head, target) => {
        const condition = test(node.condition, head);
        const end = walkStatement(node.statement, condition.isTrue);
        return {
          exit: condition.isFalse,
          back: walk(node.incrementor, join([end, ...target.continues])),
        };
      });
    }
    if (ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      const iterated = walk(node.expression, state);
      return walkLoop(iterated, label, (head, target) => {
        const next = run(head);
        const bound = ts.isVariableDeclarationList(node.initializer)
          ? node.initializer.declarations.reduce<Fresh>(
              (current, declaration) => bind(declaration.name, current, true),
              next,
            )
          : assign(node.initializer, walkTarget(node.initializer, next));
        const end = walkStatement(node.statement, bound);
        return { exit: next, back: join([end, ...target.continues]) };
      });
    }
    if (ts.isSwitchStatement(node)) {
      const tested = node.caseBlock.clauses.reduce<Fresh>(
        (current, clause) => (ts.isCaseClause(clause) ? walk(clause.expression, current) : current),
        walk(node.expression, state),
      );
      const target = push("switch", label);
      const end = node.caseBlock.clauses.reduce<Fresh>(
        (fallen, clause) => walkStatements(clause.statements, join([tested, fallen])),
        undefined,
      );
      targets.pop();
      const isCovered = node.caseBlock.clauses.some(ts.isDefaultClause);
      return join([end, ...target.breaks, isCovered ? undefined : tested]);
    }
    if (ts.isTryStatement(node)) {
      finallyDepth += node.finallyBlock === undefined ? 0 : 1;
      const tried = walkStatement(node.tryBlock, state);
      const caught =
        node.catchClause === undefined ? undefined : walkStatement(node.catchClause.block, NOTHING);
      finallyDepth -= node.finallyBlock === undefined ? 0 : 1;
      const completed = join([tried, caught]);
      return node.finallyBlock === undefined || completed === undefined
        ? completed
        : walkStatement(node.finallyBlock, NOTHING);
    }
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isEmptyStatement(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isImportDeclaration(node) ||
      ts.isDebuggerStatement(node)
    ) {
      return state;
    }
    return run(state);
  };
  const walkStatements = (statements: readonly ts.Statement[], state: Fresh) =>
    statements.reduce<Fresh>((current, statement) => walkStatement(statement, current), state);
  if (ts.isSourceFile(root)) walkStatements(root.statements, NOTHING);
  if (
    ts.isFunctionDeclaration(root) ||
    ts.isFunctionExpression(root) ||
    ts.isArrowFunction(root) ||
    ts.isMethodDeclaration(root) ||
    ts.isConstructorDeclaration(root) ||
    ts.isGetAccessorDeclaration(root) ||
    ts.isSetAccessorDeclaration(root)
  ) {
    walkBody(root, NOTHING);
  }
  return kept;
};
