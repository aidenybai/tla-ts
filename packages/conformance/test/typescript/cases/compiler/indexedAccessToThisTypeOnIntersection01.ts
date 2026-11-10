/*---
description: Ported from TypeScript's tests/cases/compiler/indexedAccessToThisTypeOnIntersection01.ts.
outcome: success
source: tests/cases/compiler/indexedAccessToThisTypeOnIntersection01.ts
---*/
// @target: es2015
interface A {
  a: string;
  getA: this['a'];
}

type T = (A & { a: number })['getA'];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
