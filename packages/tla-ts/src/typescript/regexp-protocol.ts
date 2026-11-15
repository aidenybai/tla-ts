import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Frame, getChanged, type Path, throwTypeError, translateJoined } from "./actions";
import { type Context, getUndefined, skipCasts } from "./context";
import { getConversionFunctions, runToPrimitive } from "./conversions";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { getBuiltIn, getBuiltInKey, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { bind, callValue, getMethods, loopStates, withHeap } from "./protocols";
import { apply, boolean, field, identifier, ifExpression, number, string, tuple } from "./tla";

// A method's steps, from the receiver and the string that it converts its argument to.
interface Protocol {
  (
    site: ts.Node,
    receiver: Expression,
    text: Expression,
    path: Path,
    context: Context,
    frame: Frame,
    continueWith: (path: Path, value: Expression) => Formula,
  ): Formula;
}

export interface RegExpProtocolCall {
  method: string;
  protocol: Protocol;
  // What the call reads the method from: the receiver, or RegExp.prototype for its call.
  owner: ts.Expression;
  receiver: ts.Expression;
  values: readonly ts.Expression[];
}

// A call of a regexp's method under a well-known symbol, as rx[Symbol.search](s) where the script
// writes an exec that it may call, or of RegExp.prototype's, as
// RegExp.prototype[Symbol.search].call(rx, s), whose receiver may be any object.
export const getRegExpProtocolCall = (
  node: ts.Node,
  context: Context,
): RegExpProtocolCall | undefined => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const callee = skipCasts(node.expression);
  const isCall = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
  const key = getBuiltInKey(isCall ? callee.expression : callee, context);
  const method = key?.name.startsWith("@@") === true ? key.name.slice(2) : undefined;
  const protocol = method === undefined ? undefined : PROTOCOLS.get(method);
  if (key === undefined || method === undefined || protocol === undefined) return undefined;
  const owner = skipCasts(key.owner);
  const receiver = isCall ? node.arguments.at(0) : key.owner;
  const isTaken = isCall
    ? ts.isPropertyAccessExpression(owner) &&
      owner.name.text === "prototype" &&
      getBuiltIn(owner.expression, context) === "RegExp"
    : context.checker.getTypeAtLocation(owner).getSymbol()?.name === "RegExp" &&
      getExecMethods(node, context).length > 0;
  return isTaken && receiver !== undefined && !node.arguments.some(ts.isSpreadElement)
    ? {
        method,
        protocol,
        owner: key.owner,
        receiver,
        values: isCall ? node.arguments.slice(1) : node.arguments,
      }
    : undefined;
};

// ToString of a value, which runs a script's toString or Symbol.toPrimitive on an object, and
// throws a TypeError on a symbol.
const toText = (
  site: ts.Node,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, text: Expression) => Formula,
) =>
  runToPrimitive(site, value, "string", path, context, frame, (after, primitive) =>
    ifThenElse(
      useJavaScript("IsSymbol", [primitive], context),
      throwTypeError(after, site, context, frame),
      bind(after, "text", useJavaScript("StringOf", [primitive], context), context, continueWith),
    ),
  );

// Set(R, "lastIndex", value, true), which throws a TypeError where the write fails.
const setLastIndex = (
  site: ts.Node,
  receiver: Expression,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) => {
  const heap = getHeap(path.scope, site, context);
  return ifThenElse(
    useJavaScript("CanPut", [heap, receiver, string("lastIndex")], context),
    bind(
      path,
      "heap",
      useJavaScript("SetProperty", [heap, receiver, string("lastIndex"), value], context),
      context,
      (written, changed) => continueWith(withHeap(written, changed, context)),
    ),
    throwTypeError(path, site, context, frame),
  );
};

// The exec functions that a script writes, which RegExpExec may call.
const getExecMethods = (site: ts.Node, context: Context) => getMethods(site, "exec", context);

// RegExpExec(R, S): it calls R's exec where that's callable, which must give an object or null,
// and else runs RegExpBuiltinExec on a regexp, and throws a TypeError on anything else.
const regExpExec = (
  site: ts.Node,
  receiver: Expression,
  text: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, result: Expression) => Formula,
): Formula =>
  joinProtocol(
    site,
    path,
    context,
    (after, result) => continueWith(after, result ?? getUndefined(context)),
    (next) => {
      const heap = getHeap(path.scope, site, context);
      const builtIn = (current: Path) =>
        ifThenElse(
          useJavaScript("IsRegExpIn", [getHeap(current.scope, site, context), receiver], context),
          bind(
            current,
            "exec",
            useJavaScript(
              "RegExpBuiltinExecIn",
              [
                getHeap(current.scope, site, context),
                receiver,
                text,
                translateBuiltInValue("Array.prototype", site, context),
              ],
              context,
            ),
            context,
            (bound, ran) => {
              const after = withHeap(bound, field(ran, "heap"), context);
              return ifThenElse(
                field(ran, "isThrown"),
                throwTypeError(after, site, context, frame),
                next(after, field(ran, "value")),
              );
            },
          ),
          ifThenElse(
            useJavaScript(
              "LacksRegExpMatcher",
              [getHeap(current.scope, site, context), receiver],
              context,
            ),
            throwTypeError(current, site, context, frame),
            leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't run RegExp.prototype.exec on this receiver"),
              ]),
            ),
          ),
        );
      return bind(
        path,
        "exec",
        useJavaScript("Get", [heap, receiver, string("exec")], context),
        context,
        (read, exec) =>
          ifThenElse(
            apply("=", [exec, translateBuiltInValue("RegExp.prototype.exec", site, context)]),
            builtIn(read),
            ifThenElse(
              apply("=", [
                useJavaScript("TypeOfIn", [getHeap(read.scope, site, context), exec], context),
                string("function"),
              ]),
              callValue(
                site,
                getExecMethods(site, context),
                exec,
                receiver,
                [text],
                read,
                context,
                frame,
                () =>
                  leaf(
                    apply("Assert", [
                      boolean(false),
                      string("tla-ts can't tell which function this call runs"),
                    ]),
                  ),
                (after, result) =>
                  bind(after, "result", result, context, (bound, held) =>
                    ifThenElse(
                      apply("\\/", [
                        apply("=", [held, identifier("Null")]),
                        useJavaScript(
                          "IsObjectIn",
                          [getHeap(bound.scope, site, context), held],
                          context,
                        ),
                      ]),
                      next(bound, held),
                      throwTypeError(bound, site, context, frame),
                    ),
                  ),
              ),
              builtIn(read),
            ),
          ),
      );
    },
  );

// The symbols that a protocol call may change: the heap, and what the functions it may call change,
// which a join or a loop carries.
const getProtocolChanged = (site: ts.Node, path: Path, context: Context) => [
  ...new Set([
    ...getChanged(site, path, context),
    ...[...getExecMethods(site, context), ...getConversionFunctions(site, context)].flatMap(
      (called) => getChanged(called, path, context),
    ),
    ...[...path.mutable].filter((symbol) => symbol === context.heap),
  ]),
];

// Joins the branches of a protocol's step, carrying what the protocol may change.
const joinProtocol = (
  site: ts.Node,
  path: Path,
  context: Context,
  continueWith: (path: Path, value?: Expression) => Formula,
  translateWith: (next: (inner: Path, value?: Expression) => Formula) => Formula,
) =>
  translateJoined(
    site,
    path,
    context,
    continueWith,
    translateWith,
    getProtocolChanged(site, path, context),
  );

// RegExp.prototype[@@search](string): it sets lastIndex to 0 while RegExpExec runs, where it isn't
// already, puts it back where exec changed it, and gives the result's index, or -1.
const search = (
  site: ts.Node,
  receiver: Expression,
  text: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
) => {
  const getLastIndex = (current: Path) =>
    useJavaScript(
      "Get",
      [getHeap(current.scope, site, context), receiver, string("lastIndex")],
      context,
    );
  const isSame = (left: Expression, right: Expression) =>
    useJavaScript("SameValue", [left, right], context);
  return bind(path, "previous", getLastIndex(path), context, (read, previous) =>
    joinProtocol(
      site,
      read,
      context,
      (reset) =>
        regExpExec(site, receiver, text, reset, context, frame, (ran, result) =>
          bind(ran, "current", getLastIndex(ran), context, (after, current) =>
            joinProtocol(
              site,
              after,
              context,
              (restored) =>
                continueWith(
                  restored,
                  ifExpression(
                    apply("=", [result, identifier("Null")]),
                    number(-1),
                    useJavaScript(
                      "Get",
                      [getHeap(restored.scope, site, context), result, string("index")],
                      context,
                    ),
                  ),
                ),
              (next) =>
                ifThenElse(
                  isSame(current, previous),
                  next(after),
                  setLastIndex(site, receiver, previous, after, context, frame, next),
                ),
            ),
          ),
        ),
      (next) =>
        ifThenElse(
          isSame(previous, number(0)),
          next(read),
          setLastIndex(site, receiver, number(0), read, context, frame, next),
        ),
    ),
  );
};

// ToString(Get(R, "flags")), where RegExp.prototype's flags getter reads each flag through Get.
const getFlags = (
  site: ts.Node,
  receiver: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, flags: Expression) => Formula,
) => {
  translateBuiltInValue("get RegExp.prototype.flags", site, context);
  return bind(
    path,
    "flags",
    useJavaScript("RegExpFlagsValue", [getHeap(path.scope, site, context), receiver], context),
    context,
    (read, flags) => toText(site, flags, read, context, frame, continueWith),
  );
};

const hasFlag = (flags: Expression, flag: string, context: Context) =>
  useJavaScript("HasFlag", [flags, string(flag)], context);

// RegExp.prototype[@@match](string): RegExpExec's result where the flags have no g, and else the
// array of the text of each match, from lastIndex 0, which steps past an empty match, or null.
const match = (
  site: ts.Node,
  receiver: Expression,
  text: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
) =>
  getFlags(site, receiver, path, context, frame, (read, flags) =>
    joinProtocol(
      site,
      read,
      context,
      (after, value) => continueWith(after, value ?? getUndefined(context)),
      (next) => {
        const isFullUnicode = apply("\\/", [
          hasFlag(flags, "u", context),
          hasFlag(flags, "v", context),
        ]);
        const global = setLastIndex(site, receiver, number(0), read, context, frame, (reset) =>
          loopStates(
            site,
            tuple([]),
            getProtocolChanged(site, reset, context),
            reset,
            context,
            frame,
            (current, matches, inner, again, stop) =>
              regExpExec(site, receiver, text, current, context, inner, (ran, result) =>
                ifThenElse(
                  apply("=", [result, identifier("Null")]),
                  stop(ran, matches),
                  bind(
                    ran,
                    "matched",
                    useJavaScript(
                      "Get",
                      [getHeap(ran.scope, site, context), result, string("0")],
                      context,
                    ),
                    context,
                    (got, matched) =>
                      toText(site, matched, got, context, inner, (converted, matchText) => {
                        const gathered = apply("Append", [matches, matchText]);
                        return ifThenElse(
                          apply("=", [matchText, string("")]),
                          bind(
                            converted,
                            "lastIndex",
                            useJavaScript(
                              "ToLength",
                              [
                                useJavaScript(
                                  "Get",
                                  [
                                    getHeap(converted.scope, site, context),
                                    receiver,
                                    string("lastIndex"),
                                  ],
                                  context,
                                ),
                              ],
                              context,
                            ),
                            context,
                            (indexed, lastIndex) =>
                              setLastIndex(
                                site,
                                receiver,
                                useJavaScript(
                                  "AdvanceStringIndex",
                                  [text, lastIndex, isFullUnicode],
                                  context,
                                ),
                                indexed,
                                context,
                                inner,
                                (advanced) => again(advanced, gathered),
                              ),
                          ),
                          again(converted, gathered),
                        );
                      }),
                  ),
                ),
              ),
            (after, matches) =>
              ifThenElse(
                apply("=", [matches, tuple([])]),
                next(after, identifier("Null")),
                bind(
                  after,
                  "heap",
                  useJavaScript(
                    "Allocate",
                    [
                      getHeap(after.scope, site, context),
                      useJavaScript(
                        "ArrayObject",
                        [translateBuiltInValue("Array.prototype", site, context), matches],
                        context,
                      ),
                    ],
                    context,
                  ),
                  context,
                  (allocated, heap) =>
                    next(
                      withHeap(allocated, heap, context),
                      useJavaScript("Allocated", [heap], context),
                    ),
                ),
              ),
          ),
        );
        return ifThenElse(
          hasFlag(flags, "g", context),
          global,
          regExpExec(site, receiver, text, read, context, frame, next),
        );
      },
    ),
  );

const PROTOCOLS = new Map<string, Protocol>([
  ["search", search],
  ["match", match],
]);

// Runs a regexp's method under a well-known symbol as its steps in the spec do, where the call reads
// the built-in method, on a receiver that must be an object, with the string that ToString makes
// of the first argument.
export const runRegExpProtocolCall = (
  site: ts.CallExpression,
  call: RegExpProtocolCall,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
) => {
  context.builtIns.add("RegExp.prototype");
  const argument = call.values.at(0);
  const heap = getHeap(path.scope, site, context);
  const read = useJavaScript(
    "Get",
    [
      heap,
      translateExpression(call.owner, path.scope, context),
      useJavaScript("WellKnownSymbol", [string(call.method)], context),
    ],
    context,
  );
  return ifThenElse(
    useJavaScript(
      "SameValue",
      [read, translateBuiltInValue(`RegExp.prototype.@@${call.method}`, site, context)],
      context,
    ),
    bind(
      path,
      "receiver",
      translateExpression(call.receiver, path.scope, context),
      context,
      (evaluated, receiver) =>
        bind(
          evaluated,
          "argument",
          argument === undefined
            ? getUndefined(context)
            : translateExpression(argument, evaluated.scope, context),
          context,
          (given, value) =>
            ifThenElse(
              useJavaScript("IsObjectIn", [getHeap(given.scope, site, context), receiver], context),
              toText(site, value, given, context, frame, (converted, text) =>
                call.protocol(site, receiver, text, converted, context, frame, continueWith),
              ),
              throwTypeError(given, site, context, frame),
            ),
        ),
    ),
    leaf(
      apply("Assert", [boolean(false), string("tla-ts can't tell which function this call runs")]),
    ),
  );
};
