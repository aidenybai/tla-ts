/*---
description: Ported from TypeScript's tests/cases/conformance/functions/functionOverloadCompatibilityWithVoid02.ts.
outcome: success
source: tests/cases/conformance/functions/functionOverloadCompatibilityWithVoid02.ts
---*/
// @target: es2015
function f(x: string): void;
function f(x: string): number {
    return 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
