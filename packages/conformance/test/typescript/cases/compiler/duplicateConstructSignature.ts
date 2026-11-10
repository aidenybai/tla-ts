/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateConstructSignature.ts.
outcome: success
source: tests/cases/compiler/duplicateConstructSignature.ts
---*/
// @target: es2015
interface I {
    (): number;
    (): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
