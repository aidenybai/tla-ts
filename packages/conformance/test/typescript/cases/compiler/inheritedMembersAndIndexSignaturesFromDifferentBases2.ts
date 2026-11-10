/*---
description: Ported from TypeScript's tests/cases/compiler/inheritedMembersAndIndexSignaturesFromDifferentBases2.ts.
outcome: success
source: tests/cases/compiler/inheritedMembersAndIndexSignaturesFromDifferentBases2.ts
---*/
// @target: es2015
// @strict: false
interface A<T> {
    [n: number]: T;
}

interface B {
    foo: number;
}

interface C extends B, A<string> { } // Should succeed

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
