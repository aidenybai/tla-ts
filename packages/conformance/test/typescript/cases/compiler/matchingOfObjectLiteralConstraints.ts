/*---
description: Ported from TypeScript's tests/cases/compiler/matchingOfObjectLiteralConstraints.ts.
outcome: success
source: tests/cases/compiler/matchingOfObjectLiteralConstraints.ts
---*/
// @target: es2015
function foo2<T, U extends { y: T; }>(x: U, z: T) { }
foo2({ y: "foo" }, "foo");

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
