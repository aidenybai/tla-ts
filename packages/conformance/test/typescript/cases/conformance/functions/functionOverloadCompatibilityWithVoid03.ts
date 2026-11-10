/*---
description: Ported from TypeScript's tests/cases/conformance/functions/functionOverloadCompatibilityWithVoid03.ts.
outcome: success
source: tests/cases/conformance/functions/functionOverloadCompatibilityWithVoid03.ts
---*/
// @target: es2015
function f(x: string): void;
function f(x: string): void {
    return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
