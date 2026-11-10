/*---
description: Ported from TypeScript's tests/cases/compiler/inferentialTypingWithFunctionType2.ts.
outcome: success
source: tests/cases/compiler/inferentialTypingWithFunctionType2.ts
---*/
// @target: es2015
function identity<A>(a: A): A {
    return a;
}
var x = [1, 2, 3].map(identity)[0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
