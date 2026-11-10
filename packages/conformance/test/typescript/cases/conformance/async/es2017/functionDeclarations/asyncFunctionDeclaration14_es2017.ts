/*---
description: Ported from TypeScript's tests/cases/conformance/async/es2017/functionDeclarations/asyncFunctionDeclaration14_es2017.ts.
outcome: success
source: tests/cases/conformance/async/es2017/functionDeclarations/asyncFunctionDeclaration14_es2017.ts
---*/
// @target: es2017
// @noEmitHelpers: true
async function foo(): Promise<void> {
  return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
