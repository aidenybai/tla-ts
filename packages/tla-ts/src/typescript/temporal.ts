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
import { type Context, skipCasts } from "./context";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getAllocated, getHeap } from "./heap";
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

// new of a Temporal class, a call of one of its functions, or a call of its prototype's method on
// a value of its type, which tla-ts runs as a statement, as it may throw.
export const getTemporalCall = (node: ts.Node, context: Context): TemporalCall | undefined => {
  if (context.heap === undefined) return undefined;
  if (ts.isNewExpression(node)) {
    const kind = getTemporalClass(node.expression, context);
    const functions = kind === undefined ? undefined : TEMPORAL_FUNCTIONS.get(kind);
    return kind !== undefined &&
      functions !== undefined &&
      !(node.arguments ?? []).some(ts.isSpreadElement)
      ? {
          kind,
          method: "new",
          isStatic: true,
          made: functions.made,
          callee: node.expression,
          values: node.arguments ?? [],
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
    call.receiver === undefined
      ? useJavaScript(
          "SameValue",
          [translateExpression(call.callee, path.scope, context), builtIn],
          context,
        )
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
