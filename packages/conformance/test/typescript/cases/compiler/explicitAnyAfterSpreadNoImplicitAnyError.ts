/*---
description: Ported from TypeScript's tests/cases/compiler/explicitAnyAfterSpreadNoImplicitAnyError.ts.
outcome: success
source: tests/cases/compiler/explicitAnyAfterSpreadNoImplicitAnyError.ts
---*/
// @target: es2015
// @noImplicitAny: true
({ a: [], ...(null as any) });
let x: any;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
