/*---
description: Ported from TypeScript's tests/cases/compiler/contextualSignature_objectLiteralMethodMayReturnNever.ts.
outcome: success
source: tests/cases/compiler/contextualSignature_objectLiteralMethodMayReturnNever.ts
---*/
// @target: es2015
interface I { m(): number; }
const o: I = { m() { throw new Error("not implemented"); } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
