/*---
description: Ported from TypeScript's tests/cases/conformance/async/es5/functionDeclarations/asyncFunctionDeclaration14_es5.ts.
outcome: success
source: tests/cases/conformance/async/es5/functionDeclarations/asyncFunctionDeclaration14_es5.ts
---*/
// @target: ES5, ES2015
// @lib: es5,es2015.promise
// @noEmitHelpers: true
async function foo(): Promise<void> {
  return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
