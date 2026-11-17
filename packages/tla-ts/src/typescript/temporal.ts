import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  allocateAll,
  bindOnce,
  type Frame,
  type Path,
  throwError,
  throwTypeError,
  translateJoined,
} from "./actions";
import { getKeyedConversionFunctions, runToPrimitive } from "./conversions";
import { withHeap } from "./protocols";
import { type Context, getUndefined, skipCasts } from "./context";
import { concatenate, translateElements, translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getAllocated, getHeap, getOrigin } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { apply, boolean, field, functionFrom, identifier, string, tuple } from "./tla";

// The conversions that a Temporal function may ask a script's methods for, one after another.
const TEMPORAL_CONVERSIONS = 3;

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
    return kind !== undefined && functions !== undefined
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

// Whether an argument of a type may be an object that a Temporal function converts through its
// methods, or may hold one as a property that the function reads: any object but a Temporal one
// converts, and an object that an argument passes may be an options bag or a property bag.
const mayHoldConverted = (type: ts.Type, context: Context, isProperty: boolean): boolean => {
  if ((type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.NonPrimitive)) !== 0) {
    return true;
  }
  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((inner) => mayHoldConverted(inner, context, isProperty));
  }
  if ((type.flags & ts.TypeFlags.Object) === 0 || getTemporalKind(type) !== undefined) return false;
  return (
    isProperty ||
    type.getCallSignatures().length > 0 ||
    context.checker.getIndexInfosOfType(type).length > 0 ||
    type
      .getProperties()
      .some((property) =>
        mayHoldConverted(context.checker.getTypeOfSymbol(property), context, true),
      )
  );
};

// A Temporal call that converts an object through a script's methods: one whose arguments' types
// may hold an object other than a Temporal one, where each conversion method that the script gives
// is a function that no other function holds, whose call doesn't read another's locals.
export const isConvertingTemporalCall = (call: TemporalCall, node: ts.Node, context: Context) =>
  call.values.some((value) =>
    mayHoldConverted(context.checker.getTypeAtLocation(value), context, false),
  ) &&
  getKeyedConversionFunctions(node, context).every(
    (method) => ts.findAncestor(method.parent, ts.isFunctionLike) === undefined,
  );

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
  const values = translateElements(call.values, path.scope, context);
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
  const kind = string(call.kind);
  const getOperation = (read: Expression) =>
    call.method === "new"
      ? useJavaScript("TemporalNew", [read, kind, values, prototype], context)
      : call.isStatic
        ? useJavaScript(
            "TemporalStatic",
            [read, kind, string(call.method), values, prototype],
            context,
          )
        : useJavaScript(
            "TemporalMethod",
            [read, kind, string(call.method), receiver, values, prototype],
            context,
          );
  // The objects that the function reads, which a conversion that it asks for mustn't change, as
  // it reads them again once it has the conversion's primitive.
  const inputs = call.receiver === undefined ? values : concatenate([tuple([receiver]), values]);
  const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));
  const limit = isConvertingTemporalCall(call, node, context) ? TEMPORAL_CONVERSIONS : 0;
  // A conversion reads the methods that an object holds, or that getters it declares under their
  // keys give, and stops at a getter that a descriptor gives.
  // Each round runs the function with the answers to the conversions it asked for so far, and runs
  // the conversion that it asks for next through the object's methods, in the order the function
  // asks for them.
  const runRound = (
    current: Path,
    answers: Expression,
    count: number,
    next: (path: Path, value?: Expression) => Formula,
  ): Formula => {
    const roundName = context.names.getFresh("change");
    const round = identifier(roundName);
    const request = field(round, "request");
    const currentHeap = getHeap(current.scope, node, context);
    return bindOnce(
      current,
      roundName,
      getOperation(useJavaScript("TemporalHeap", [currentHeap, answers], context)),
      ifThenElse(
        apply("=", [field(round, "error"), string("")]),
        next(withHeap(current, field(round, "heap"), context), field(round, "value")),
        ifThenElse(
          apply("=", [field(round, "error"), string("pending")]),
          count >= limit
            ? stop(
                limit === 0
                  ? "tla-ts can't convert an object that a Temporal function reads here"
                  : `tla-ts can't run more than ${limit} conversions in a Temporal function`,
              )
            : translateJoined(
                node,
                current,
                context,
                (after, primitive) =>
                  ifThenElse(
                    useJavaScript(
                      "TemporalInputsKept",
                      [heap, getHeap(after.scope, node, context), inputs],
                      context,
                    ),
                    runRound(
                      after,
                      apply("@@", [
                        apply(":>", [
                          tuple([
                            field(request, "kind"),
                            field(request, "label"),
                            field(request, "value"),
                          ]),
                          primitive ?? getUndefined(context),
                        ]),
                        answers,
                      ]),
                      count + 1,
                      next,
                    ),
                    stop(
                      "tla-ts can't follow a Temporal function whose inputs a conversion changed",
                    ),
                  ),
                (converted) =>
                  ifThenElse(
                    apply("=", [field(request, "kind"), string("string")]),
                    runToPrimitive(
                      node,
                      field(request, "value"),
                      "string",
                      current,
                      context,
                      frame,
                      converted,
                      true,
                    ),
                    runToPrimitive(
                      node,
                      field(request, "value"),
                      "number",
                      current,
                      context,
                      frame,
                      converted,
                      true,
                    ),
                  ),
              ),
          ifThenElse(
            apply("=", [field(round, "error"), string("RangeError")]),
            throwError("RangeError", current, node, context, frame),
            throwTypeError(current, node, context, frame),
          ),
        ),
      ),
    );
  };
  const run = translateJoined(
    node,
    path,
    context,
    (after, value) => continueWith(after, value ?? getUndefined(context)),
    (next) => runRound(path, functionFrom([]), 0, next),
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
