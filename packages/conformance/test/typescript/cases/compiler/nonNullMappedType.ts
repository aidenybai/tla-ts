/*---
description: Ported from TypeScript's tests/cases/compiler/nonNullMappedType.ts.
outcome: success
source: tests/cases/compiler/nonNullMappedType.ts
---*/
// @target: es2015
// @strict: true
function f<A extends string>(p0: { [key in A]: {} | undefined }, p1: A) {
    const v: {} = p0[p1]!;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
