/*---
description: Ported from TypeScript's tests/cases/conformance/esnext/logicalAssignment/logicalAssignment11.ts.
outcome: success
source: tests/cases/conformance/esnext/logicalAssignment/logicalAssignment11.ts
---*/
// @strict: true
// @target: esnext, es2020, es2015

let x: string | undefined;

let d: string | undefined;
d ?? (d = x ?? "x")
d.length;

let e: string | undefined;
e ??= x ?? "x"
e.length

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
