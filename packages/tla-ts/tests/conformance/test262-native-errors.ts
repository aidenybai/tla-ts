// test262's harness/nativeErrors.js, typed so that tla-ts can compile it.
/* oxlint-disable no-unused-vars */

type AnyErrorConstructor =
  | ErrorConstructor
  | AggregateErrorConstructor
  | SuppressedErrorConstructor;

const nativeErrors = [
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,
];

const allErrorConstructors: AnyErrorConstructor[] = nativeErrors.slice();
if (typeof AggregateError !== "undefined") {
  allErrorConstructors.push(AggregateError);
}
if (typeof SuppressedError !== "undefined") {
  allErrorConstructors.push(SuppressedError);
}

function makeNativeError(Ctor: AnyErrorConstructor, useNew?: boolean) {
  if (typeof AggregateError !== "undefined" && Ctor === AggregateError) {
    return useNew
      ? new AggregateError([new Error("inner")], "msg")
      : AggregateError([new Error("inner")], "msg");
  }
  if (typeof SuppressedError !== "undefined" && Ctor === SuppressedError) {
    return useNew
      ? new SuppressedError(new Error("inner"), new Error("suppressed"), "msg")
      : SuppressedError(new Error("inner"), new Error("suppressed"), "msg");
  }
  const errorConstructor = Ctor as ErrorConstructor;
  return useNew ? new errorConstructor("msg") : errorConstructor("msg");
}
