/*---
description: Ported from TypeScript's tests/cases/conformance/types/spread/spreadExcessProperty.ts.
outcome: success
source: tests/cases/conformance/types/spread/spreadExcessProperty.ts
---*/
// @target: es2015
type A = { a: string, b: string };
const extra1 = { a: "a", b: "b", extra: "extra" };
const a1: A = { ...extra1 }; // spread should not give excess property errors

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
