/*---
description: Ported from TypeScript's tests/cases/conformance/types/intersection/contextualIntersectionType.ts.
outcome: success
source: tests/cases/conformance/types/intersection/contextualIntersectionType.ts
---*/
// @target: es2015
var x: { a: (s: string) => string } & { b: (n: number) => number };
x = {
    a: s => s,
    b: n => n
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
