/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/functionDeclarations/asyncFunctionDeclaration14_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/functionDeclarations/asyncFunctionDeclaration14_es6.ts
---*/
// @target: ES6
// @noEmitHelpers: true
async function foo(): Promise<void> {
  return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
