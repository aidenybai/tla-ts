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
import {
  apply,
  boolean,
  field,
  identifier,
  ifExpression,
  index,
  number,
  string,
  tuple,
} from "./tla";

// A method's steps, from the receiver, the string that it converts its first argument to, and the
// values of the others.
interface Protocol {
  (
    site: ts.Node,
    receiver: Expression,
    text: Expression,
    rest: readonly Expression[],
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
      (getExecMethods(node, context).length > 0 ||
        (method === "split" && getSpeciesMethods(node, context).length > 0));
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

const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));

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
            stop("tla-ts can't run RegExp.prototype.exec on this receiver"),
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
                () => stop("tla-ts can't tell which function this call runs"),
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
// which a join or a loop carries, once their declarations run.
const getProtocolChanged = (site: ts.Node, path: Path, context: Context) =>
  [
    ...new Set([
      ...getChanged(site, path, context),
      ...[
        ...getExecMethods(site, context),
        ...getSpeciesMethods(site, context),
        ...getConversionFunctions(site, context),
      ].flatMap((called) => getChanged(called, path, context)),
      ...[...path.mutable].filter((symbol) => symbol === context.heap),
    ]),
  ].filter((symbol) => !path.scope.uninitialized.has(symbol));

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
  _rest: readonly Expression[],
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
  _rest: readonly Expression[],
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
            (current, matches, inner, again, end) =>
              regExpExec(site, receiver, text, current, context, inner, (ran, result) =>
                ifThenElse(
                  apply("=", [result, identifier("Null")]),
                  end(ran, matches),
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

// The species constructors that a script writes, which @@split may construct.
const getSpeciesMethods = (site: ts.Node, context: Context) =>
  getMethods(site, "@@species", context).filter(
    (candidate) => ts.isFunctionExpression(candidate) || ts.isFunctionDeclaration(candidate),
  );

// SpeciesConstructor(R, %RegExp%): R's constructor's @@species, or RegExp where either is
// undefined, and a TypeError where the constructor isn't an object or the species isn't a
// constructor.
const speciesConstructor = (
  site: ts.Node,
  receiver: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, constructor: Expression) => Formula,
) => {
  const regExp = translateBuiltInValue("RegExp", site, context);
  return bind(
    path,
    "constructor",
    useJavaScript(
      "Get",
      [getHeap(path.scope, site, context), receiver, string("constructor")],
      context,
    ),
    context,
    (read, constructor) =>
      joinProtocol(
        site,
        read,
        context,
        (after, species) => continueWith(after, species ?? regExp),
        (next) =>
          ifThenElse(
            apply("=", [constructor, getUndefined(context)]),
            next(read, regExp),
            ifThenElse(
              useJavaScript(
                "IsObjectIn",
                [getHeap(read.scope, site, context), constructor],
                context,
              ),
              bind(
                read,
                "species",
                useJavaScript(
                  "Get",
                  [
                    getHeap(read.scope, site, context),
                    constructor,
                    useJavaScript("WellKnownSymbol", [string("species")], context),
                  ],
                  context,
                ),
                context,
                (got, species) =>
                  ifThenElse(
                    apply("\\/", [
                      apply("=", [species, getUndefined(context)]),
                      apply("=", [species, identifier("Null")]),
                    ]),
                    next(got, regExp),
                    ifThenElse(
                      useJavaScript(
                        "IsConstructor",
                        [getHeap(got.scope, site, context), species],
                        context,
                      ),
                      next(got, species),
                      throwTypeError(got, site, context, frame),
                    ),
                  ),
              ),
              throwTypeError(read, site, context, frame),
            ),
          ),
      ),
  );
};

// Construct(C, << R, flags >>): RegExp copies the regexp with the flags, and a function that the
// script writes runs with a new object of C's prototype as this, giving it, or the object that it
// returns.
const construct = (
  site: ts.Node,
  constructor: Expression,
  receiver: Expression,
  flags: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, splitter: Expression) => Formula,
) =>
  joinProtocol(
    site,
    path,
    context,
    (after, splitter) => continueWith(after, splitter ?? getUndefined(context)),
    (next) => {
      const heap = getHeap(path.scope, site, context);
      const copied = bind(
        path,
        "heap",
        useJavaScript(
          "RegExpSplitterIn",
          [heap, receiver, flags, translateBuiltInValue("RegExp.prototype", site, context)],
          context,
        ),
        context,
        (bound, made) =>
          next(withHeap(bound, made, context), useJavaScript("Allocated", [made], context)),
      );
      const prototype = useJavaScript(
        "PrototypeFromConstructor",
        [heap, constructor, translateBuiltInValue("Object.prototype", site, context)],
        context,
      );
      const called = bind(
        path,
        "heap",
        useJavaScript(
          "Allocate",
          [heap, useJavaScript("WithPrototype", [identifier("EmptyObject"), prototype], context)],
          context,
        ),
        context,
        (bound, made) => {
          const allocated = withHeap(bound, made, context);
          return bind(
            allocated,
            "instance",
            useJavaScript("Allocated", [made], context),
            context,
            (created, instance) =>
              callValue(
                site,
                getSpeciesMethods(site, context),
                constructor,
                instance,
                [receiver, flags],
                created,
                context,
                frame,
                () => stop("tla-ts can't tell which function this call runs"),
                (after, result) =>
                  bind(after, "result", result, context, (returned, held) =>
                    ifThenElse(
                      useJavaScript(
                        "IsObjectIn",
                        [getHeap(returned.scope, site, context), held],
                        context,
                      ),
                      next(returned, held),
                      next(returned, instance),
                    ),
                  ),
                constructor,
              ),
          );
        },
      );
      return ifThenElse(
        apply("=", [constructor, translateBuiltInValue("RegExp", site, context)]),
        copied,
        called,
      );
    },
  );

// RegExp.prototype[@@split](string, limit): it constructs a sticky splitter through the species
// constructor, and from each index execs it there, cutting the text where a match ends past the
// last cut and adding the match's captures, up to the limit's count of pieces.
const split = (
  site: ts.Node,
  receiver: Expression,
  text: Expression,
  rest: readonly Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
) =>
  joinProtocol(
    site,
    path,
    context,
    (after, value) => continueWith(after, value ?? getUndefined(context)),
    (next) =>
      speciesConstructor(site, receiver, path, context, frame, (found, constructor) =>
        getFlags(site, receiver, found, context, frame, (read, flags) => {
          const isUnicode = apply("\\/", [
            hasFlag(flags, "u", context),
            hasFlag(flags, "v", context),
          ]);
          const sticky = ifExpression(
            hasFlag(flags, "y", context),
            flags,
            apply("\\o", [flags, string("y")]),
          );
          return construct(
            site,
            constructor,
            receiver,
            sticky,
            read,
            context,
            frame,
            (made, splitter) => {
              const limit = rest.at(0) ?? getUndefined(context);
              const length = apply("Len", [text]);
              const empty = regExpExec(site, splitter, text, made, context, frame, (ran, result) =>
                next(
                  ran,
                  ifExpression(apply("=", [result, identifier("Null")]), tuple([text]), tuple([])),
                ),
              );
              const counted = bind(
                made,
                "count",
                useJavaScript("RegExpSplitCount", [limit], context),
                context,
                (bound, count) =>
                  ifThenElse(
                    apply("=", [count, number(0)]),
                    next(bound, tuple([])),
                    ifThenElse(
                      apply("=", [text, string("")]),
                      empty,
                      loopStates(
                        site,
                        tuple([number(0), number(0), tuple([])]),
                        getProtocolChanged(site, bound, context),
                        bound,
                        context,
                        frame,
                        (current, state, inner, again, end) => {
                          const start = index(state, [number(1)]);
                          const position = index(state, [number(2)]);
                          const pieces = index(state, [number(3)]);
                          const advance = (next: Path) =>
                            again(
                              next,
                              tuple([
                                start,
                                useJavaScript(
                                  "AdvanceStringIndex",
                                  [text, position, isUnicode],
                                  context,
                                ),
                                pieces,
                              ]),
                            );
                          return ifThenElse(
                            apply(">=", [position, length]),
                            end(
                              current,
                              apply("Append", [
                                pieces,
                                apply("SubSeq", [text, apply("+", [start, number(1)]), length]),
                              ]),
                            ),
                            setLastIndex(site, splitter, position, current, context, inner, (set) =>
                              regExpExec(site, splitter, text, set, context, inner, (ran, result) =>
                                ifThenElse(
                                  apply("=", [result, identifier("Null")]),
                                  advance(ran),
                                  bind(
                                    ran,
                                    "lastIndex",
                                    useJavaScript(
                                      "ToLength",
                                      [
                                        useJavaScript(
                                          "Get",
                                          [
                                            getHeap(ran.scope, site, context),
                                            splitter,
                                            string("lastIndex"),
                                          ],
                                          context,
                                        ),
                                      ],
                                      context,
                                    ),
                                    context,
                                    (indexed, lastIndex) =>
                                      bind(
                                        indexed,
                                        "matchEnd",
                                        ifExpression(
                                          apply(">", [lastIndex, length]),
                                          length,
                                          lastIndex,
                                        ),
                                        context,
                                        (ended, matchEnd) =>
                                          ifThenElse(
                                            apply("=", [matchEnd, start]),
                                            advance(ended),
                                            bind(
                                              ended,
                                              "cut",
                                              apply("Append", [
                                                pieces,
                                                apply("SubSeq", [
                                                  text,
                                                  apply("+", [start, number(1)]),
                                                  position,
                                                ]),
                                              ]),
                                              context,
                                              (cutting, cut) =>
                                                ifThenElse(
                                                  apply("=", [apply("Len", [cut]), count]),
                                                  end(cutting, cut),
                                                  bind(
                                                    cutting,
                                                    "captured",
                                                    useJavaScript(
                                                      "RegExpSplitCaptures",
                                                      [
                                                        getHeap(cutting.scope, site, context),
                                                        result,
                                                        cut,
                                                        count,
                                                      ],
                                                      context,
                                                    ),
                                                    context,
                                                    (capturing, captured) =>
                                                      ifThenElse(
                                                        apply("=", [
                                                          apply("Len", [captured]),
                                                          count,
                                                        ]),
                                                        end(capturing, captured),
                                                        again(
                                                          capturing,
                                                          tuple([matchEnd, matchEnd, captured]),
                                                        ),
                                                      ),
                                                  ),
                                                ),
                                            ),
                                          ),
                                      ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                        next,
                      ),
                    ),
                  ),
              );
              return ifThenElse(
                apply("\\/", [
                  apply("=", [limit, getUndefined(context)]),
                  apply("=", [useJavaScript("TypeOf", [limit], context), string("number")]),
                ]),
                counted,
                ifThenElse(
                  useJavaScript("IsSymbol", [limit], context),
                  throwTypeError(made, site, context, frame),
                  stop("tla-ts can't convert this limit to a number"),
                ),
              );
            },
          );
        }),
      ),
  );

const PROTOCOLS = new Map<string, Protocol>([
  ["search", search],
  ["match", match],
  ["split", split],
]);

// The values of a call's arguments, in order, the first undefined where the call passes none.
const bindArguments = (
  values: readonly ts.Expression[],
  path: Path,
  context: Context,
  bound: readonly Expression[],
  continueWith: (path: Path, values: readonly Expression[]) => Formula,
): Formula => {
  const value = values.at(bound.length);
  if (value === undefined) {
    return continueWith(path, bound.length === 0 ? [getUndefined(context)] : bound);
  }
  return bind(
    path,
    "argument",
    translateExpression(value, path.scope, context),
    context,
    (next, held) => bindArguments(values, next, context, [...bound, held], continueWith),
  );
};

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
        bindArguments(call.values, evaluated, context, [], (given, values) =>
          // Runs once as a loop does, so that the statements after the call follow each of its
          // throws once.
          loopStates(
            site,
            tuple([]),
            getProtocolChanged(site, given, context),
            given,
            context,
            frame,
            (current, _state, inner, _again, end) =>
              ifThenElse(
                useJavaScript(
                  "IsObjectIn",
                  [getHeap(current.scope, site, context), receiver],
                  context,
                ),
                toText(site, values[0], current, context, inner, (converted, text) =>
                  call.protocol(
                    site,
                    receiver,
                    text,
                    values.slice(1),
                    converted,
                    context,
                    inner,
                    end,
                  ),
                ),
                throwTypeError(current, site, context, inner),
              ),
            continueWith,
          ),
        ),
    ),
    stop("tla-ts can't tell which function this call runs"),
  );
};
