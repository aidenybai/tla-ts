/*---
description: Ported from TypeScript's tests/cases/compiler/genericCallOnMemberReturningClosedOverObject.ts.
outcome: success
source: tests/cases/compiler/genericCallOnMemberReturningClosedOverObject.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// https://github.com/microsoft/TypeScript/issues/11584

function example<T1>() {
  let x = {
    foo: <T2>(t2: T2) => x,
    bar: (t1: T1) => x,
  };
  return x;
}

example<number>().foo("hello").bar(1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
