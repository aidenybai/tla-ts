/*---
description: Ported from TypeScript's tests/cases/compiler/contextuallyTypedGenericAssignment.ts.
outcome: success
source: tests/cases/compiler/contextuallyTypedGenericAssignment.ts
---*/
// @target: es2015
function foo<A extends any[]>(
    arg: <T extends { a: number }>(t: T, ...rest: A) => number
) { }

foo((t, u: number) => t.a)

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
