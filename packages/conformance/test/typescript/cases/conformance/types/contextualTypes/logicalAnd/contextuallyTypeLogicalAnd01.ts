/*---
description: Ported from TypeScript's tests/cases/conformance/types/contextualTypes/logicalAnd/contextuallyTypeLogicalAnd01.ts.
outcome: success
source: tests/cases/conformance/types/contextualTypes/logicalAnd/contextuallyTypeLogicalAnd01.ts
---*/
// @target: es2015
// @noImplicitAny: true

let x: (a: string) => string;
let y = true;

x = y && (a => a);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
