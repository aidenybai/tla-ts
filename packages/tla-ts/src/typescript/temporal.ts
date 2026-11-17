import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  allocateAll,
  bindOnce,
  type Frame,
  type Path,
  throwError,
  throwTypeError,
} from "./actions";
import { type Context, findNodes, getSymbol, skipCasts, getValueDeclaration } from "./context";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getAllocated, getHeap, getOrigin } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { apply, boolean, field, identifier, string, tuple } from "./tla";

const TEMPORAL_KINDS = new Set([
  "Duration",
  "Instant",
  "PlainDate",
  "PlainTime",
  "PlainDateTime",
  "PlainYearMonth",
  "PlainMonthDay",
  "ZonedDateTime",
]);

// The functions of each Temporal class that tla-ts runs: its constructor, its own functions, and
// its prototype's methods, each with the kind of object that it makes, or "" for none.
interface TemporalFunctions {
  made: string;
  statics: Map<string, string>;
  methods: Map<string, string>;
}

const TEMPORAL_FUNCTIONS = new Map<string, TemporalFunctions>([
  [
    "Duration",
    {
      made: "Duration",
      statics: new Map([
        ["from", "Duration"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["with", "Duration"],
        ["negated", "Duration"],
        ["abs", "Duration"],
        ["add", "Duration"],
        ["subtract", "Duration"],
        ["round", "Duration"],
        ["total", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
      ]),
    },
  ],
  [
    "PlainTime",
    {
      made: "PlainTime",
      statics: new Map([
        ["from", "PlainTime"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["add", "PlainTime"],
        ["subtract", "PlainTime"],
        ["with", "PlainTime"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["round", "PlainTime"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
      ]),
    },
  ],
  [
    "PlainDate",
    {
      made: "PlainDate",
      statics: new Map([
        ["from", "PlainDate"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["add", "PlainDate"],
        ["subtract", "PlainDate"],
        ["with", "PlainDate"],
        ["withCalendar", "PlainDate"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["equals", ""],
        ["toPlainDateTime", "PlainDateTime"],
        ["toPlainYearMonth", "PlainYearMonth"],
        ["toPlainMonthDay", "PlainMonthDay"],
        ["toZonedDateTime", "ZonedDateTime"],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
      ]),
    },
  ],
  [
    "PlainDateTime",
    {
      made: "PlainDateTime",
      statics: new Map([
        ["from", "PlainDateTime"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["add", "PlainDateTime"],
        ["subtract", "PlainDateTime"],
        ["with", "PlainDateTime"],
        ["withPlainTime", "PlainDateTime"],
        ["withCalendar", "PlainDateTime"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["round", "PlainDateTime"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
        ["toPlainDate", "PlainDate"],
        ["toPlainTime", "PlainTime"],
        ["toZonedDateTime", "ZonedDateTime"],
      ]),
    },
  ],
  [
    "Instant",
    {
      made: "Instant",
      statics: new Map([
        ["from", "Instant"],
        ["fromEpochMilliseconds", "Instant"],
        ["fromEpochNanoseconds", "Instant"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["add", "Instant"],
        ["subtract", "Instant"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["round", "Instant"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
        ["toZonedDateTimeISO", "ZonedDateTime"],
      ]),
    },
  ],
  [
    "PlainYearMonth",
    {
      made: "PlainYearMonth",
      statics: new Map([
        ["from", "PlainYearMonth"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["with", "PlainYearMonth"],
        ["add", "PlainYearMonth"],
        ["subtract", "PlainYearMonth"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
        ["toPlainDate", "PlainDate"],
      ]),
    },
  ],
  [
    "PlainMonthDay",
    {
      made: "PlainMonthDay",
      statics: new Map([["from", "PlainMonthDay"]]),
      methods: new Map([
        ["with", "PlainMonthDay"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
        ["toPlainDate", "PlainDate"],
      ]),
    },
  ],
  [
    "ZonedDateTime",
    {
      made: "ZonedDateTime",
      statics: new Map([
        ["from", "ZonedDateTime"],
        ["compare", ""],
      ]),
      methods: new Map([
        ["with", "ZonedDateTime"],
        ["withPlainTime", "ZonedDateTime"],
        ["withTimeZone", "ZonedDateTime"],
        ["withCalendar", "ZonedDateTime"],
        ["add", "ZonedDateTime"],
        ["subtract", "ZonedDateTime"],
        ["until", "Duration"],
        ["since", "Duration"],
        ["round", "ZonedDateTime"],
        ["equals", ""],
        ["toString", ""],
        ["toJSON", ""],
        ["valueOf", ""],
        ["startOfDay", "ZonedDateTime"],
        ["getTimeZoneTransition", ""],
        ["toInstant", "Instant"],
        ["toPlainDate", "PlainDate"],
        ["toPlainTime", "PlainTime"],
        ["toPlainDateTime", "PlainDateTime"],
      ]),
    },
  ],
]);

export interface TemporalCall {
  kind: string;
  // "new" for the constructor, and otherwise the function's name.
  method: string;
  isStatic: boolean;
  // The kind of object that the call makes, or "".
  made: string;
  callee: ts.Expression;
  receiver?: ts.Expression;
  values: readonly ts.Expression[];
  // Whether Function.prototype.call runs the method, on any receiver.
  isCalled?: boolean;
}

// The Temporal class that an expression names, such as Duration for Temporal.Duration.
export const getTemporalClass = (node: ts.Expression, context: Context) => {
  const inner = skipCasts(node);
  return ts.isPropertyAccessExpression(inner) &&
    getBuiltIn(inner.expression, context) === "Temporal" &&
    TEMPORAL_KINDS.has(inner.name.text)
    ? inner.name.text
    : undefined;
};

// The kind of Temporal object that a type is, such as Duration for Temporal.Duration.
export const getTemporalKind = (type: ts.Type) => {
  const symbol = type.getSymbol();
  const declarations = symbol?.declarations ?? [];
  return symbol !== undefined &&
    TEMPORAL_KINDS.has(symbol.name) &&
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile &&
        ts.findAncestor(declaration, ts.isModuleDeclaration)?.name.getText() === "Temporal",
    )
    ? symbol.name
    : undefined;
};

// The arguments of a call, with each spread of an array literal, or of a const that holds one and
// that only spreads read, written out, or undefined where a spread is of anything else.
const getArguments = (values: readonly ts.Expression[], context: Context) => {
  const expanded = values.map((value) => {
    if (!ts.isSpreadElement(value)) return [value];
    const spread = skipCasts(value.expression);
    const symbol = ts.isIdentifier(spread) ? getSymbol(spread, context.checker) : undefined;
    const declaration = getValueDeclaration(symbol, context);
    const isOnlySpread =
      symbol !== undefined &&
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      (declaration.parent.flags & ts.NodeFlags.Const) !== 0 &&
      findNodes(
        value.getSourceFile(),
        (node): node is ts.Identifier =>
          ts.isIdentifier(node) &&
          node !== declaration.name &&
          getSymbol(node, context.checker) === symbol,
      ).every((reference) => ts.isSpreadElement(reference.parent));
    const literal = ts.isArrayLiteralExpression(spread)
      ? spread
      : isOnlySpread && declaration.initializer !== undefined
        ? skipCasts(declaration.initializer)
        : undefined;
    return literal !== undefined &&
      ts.isArrayLiteralExpression(literal) &&
      !literal.elements.some(
        (element) => ts.isSpreadElement(element) || ts.isOmittedExpression(element),
      )
      ? [...literal.elements]
      : undefined;
  });
  return expanded.every((value) => value !== undefined) ? expanded.flat() : undefined;
};

// The kind of Temporal class whose constructor a type is, such as Duration for
// Temporal.DurationConstructor.
export const getTemporalConstructorKind = (type: ts.Type) => {
  const symbol = type.getSymbol();
  const kind = symbol?.name.replace(/Constructor$/, "");
  const declarations = symbol?.declarations ?? [];
  return kind !== undefined &&
    symbol?.name.endsWith("Constructor") === true &&
    TEMPORAL_KINDS.has(kind) &&
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile &&
        ts.findAncestor(declaration, ts.isModuleDeclaration)?.name.getText() === "Temporal",
    )
    ? kind
    : undefined;
};

// new of a Temporal class, a call of one of its functions, or a call of its prototype's method on
// a value of its type, which tla-ts runs as a statement, as it may throw.
export const getTemporalCall = (node: ts.Node, context: Context): TemporalCall | undefined => {
  if (context.heap === undefined) return undefined;
  if (ts.isNewExpression(node)) {
    const kind = getTemporalClass(node.expression, context);
    const functions = kind === undefined ? undefined : TEMPORAL_FUNCTIONS.get(kind);
    const values = getArguments(node.arguments ?? [], context);
    return kind !== undefined && functions !== undefined && values !== undefined
      ? {
          kind,
          method: "new",
          isStatic: true,
          made: functions.made,
          callee: node.expression,
          values,
        }
      : undefined;
  }
  if (!ts.isCallExpression(node) || node.arguments.some(ts.isSpreadElement)) return undefined;
  const callee = skipCasts(node.expression);
  if (!ts.isPropertyAccessExpression(callee)) return undefined;
  const method = callee.name.text;
  const owner = getTemporalClass(callee.expression, context);
  const made = owner === undefined ? undefined : TEMPORAL_FUNCTIONS.get(owner)?.statics.get(method);
  if (owner !== undefined && made !== undefined) {
    return { kind: owner, method, isStatic: true, made, callee, values: node.arguments };
  }
  // A prototype's method that call runs on any receiver, as a name that holds it may.
  const target = method === "call" ? getOrigin(callee.expression, context) : undefined;
  const targetKind =
    target !== undefined &&
    ts.isPropertyAccessExpression(target) &&
    ts.isPropertyAccessExpression(target.expression) &&
    target.expression.name.text === "prototype"
      ? getTemporalClass(target.expression.expression, context)
      : undefined;
  const targetMade =
    target !== undefined && ts.isPropertyAccessExpression(target) && targetKind !== undefined
      ? TEMPORAL_FUNCTIONS.get(targetKind)?.methods.get(target.name.text)
      : undefined;
  if (
    target !== undefined &&
    ts.isPropertyAccessExpression(target) &&
    targetKind !== undefined &&
    targetMade !== undefined &&
    node.arguments.length > 0
  ) {
    return {
      kind: targetKind,
      method: target.name.text,
      isStatic: false,
      made: targetMade,
      callee: callee.expression,
      receiver: node.arguments[0],
      values: node.arguments.slice(1),
      isCalled: true,
    };
  }
  const kind = getTemporalKind(context.checker.getTypeAtLocation(callee.expression));
  const madeByMethod =
    kind === undefined ? undefined : TEMPORAL_FUNCTIONS.get(kind)?.methods.get(method);
  return kind !== undefined && madeByMethod !== undefined
    ? {
        kind,
        method,
        isStatic: false,
        made: madeByMethod,
        callee,
        receiver: callee.expression,
        values: node.arguments,
      }
    : undefined;
};

// Runs a Temporal call, which throws the error that it gives, where the script still holds the
// built-in function that it names.
export const translateTemporalCall = (
  node: ts.Expression,
  call: TemporalCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const allocations = getAllocated(node, context).filter(
    (inner) => inner !== node && !path.scope.allocated.has(inner),
  );
  if (allocations.length > 0) {
    return allocateAll(allocations, path, context, (allocated) =>
      translateTemporalCall(node, call, allocated, context, frame, continueWith),
    );
  }
  const heap = getHeap(path.scope, node, context);
  const values = tuple(call.values.map((value) => translateExpression(value, path.scope, context)));
  const prototype =
    call.made === ""
      ? identifier("Undefined")
      : translateBuiltInValue(`Temporal.${call.made}.prototype`, node, context);
  const functionPath =
    call.method === "new"
      ? `Temporal.${call.kind}`
      : call.isStatic
        ? `Temporal.${call.kind}.${call.method}`
        : `Temporal.${call.kind}.prototype.${call.method}`;
  const receiverName = context.names.getFresh("receiver");
  const receiver = identifier(receiverName);
  const changeName = context.names.getFresh("change");
  const change = identifier(changeName);
  const kind = string(call.kind);
  const operation =
    call.method === "new"
      ? useJavaScript("TemporalNew", [heap, kind, values, prototype], context)
      : call.isStatic
        ? useJavaScript(
            "TemporalStatic",
            [heap, kind, string(call.method), values, prototype],
            context,
          )
        : useJavaScript(
            "TemporalMethod",
            [heap, kind, string(call.method), receiver, values, prototype],
            context,
          );
  const heapSymbol = context.heap;
  const run = bindOnce(
    path,
    changeName,
    operation,
    ifThenElse(
      apply("=", [field(change, "error"), string("")]),
      continueWith(
        heapSymbol === undefined
          ? path
          : {
              ...path,
              scope: {
                ...path.scope,
                bindings: new Map([...path.scope.bindings, [heapSymbol, field(change, "heap")]]),
              },
            },
        field(change, "value"),
      ),
      ifThenElse(
        apply("=", [field(change, "error"), string("RangeError")]),
        throwError("RangeError", path, node, context, frame),
        throwTypeError(path, node, context, frame),
      ),
    ),
  );
  const builtIn = useJavaScript(":>", [identifier("Ref"), string(functionPath)], context);
  const isHeld =
    call.receiver === undefined || call.isCalled === true
      ? apply("/\\", [
          useJavaScript(
            "SameValue",
            [translateExpression(call.callee, path.scope, context), builtIn],
            context,
          ),
          call.isCalled === true
            ? useJavaScript(
                "HoldsBuiltIn",
                [
                  heap,
                  translateBuiltInValue("Function.prototype", node, context),
                  string("call"),
                  string("Function.prototype.call"),
                ],
                context,
              )
            : boolean(true),
        ])
      : useJavaScript(
          "SameValue",
          [useJavaScript("Get", [heap, receiver, string(call.method)], context), builtIn],
          context,
        );
  const checked = ifThenElse(
    isHeld,
    run,
    leaf(
      apply("Assert", [
        boolean(false),
        string(`tla-ts can't call ${functionPath} where a script replaced it`),
      ]),
    ),
  );
  return call.receiver === undefined
    ? checked
    : bindOnce(
        path,
        receiverName,
        translateExpression(call.receiver, path.scope, context),
        checked,
      );
};
