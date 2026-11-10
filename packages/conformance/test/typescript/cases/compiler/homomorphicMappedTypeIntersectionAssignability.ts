/*---
description: Ported from TypeScript's tests/cases/compiler/homomorphicMappedTypeIntersectionAssignability.ts.
outcome: success
source: tests/cases/compiler/homomorphicMappedTypeIntersectionAssignability.ts
---*/
// @target: es2015
// @strict: true
function f<TType>(
    a: { weak?: string } & Readonly<TType> & { name: "ok" },
    b: Readonly<TType & { name: string }>,
    c: Readonly<TType> & { name: string }) {
    c = a; // Works
    b = a; // Should also work
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
