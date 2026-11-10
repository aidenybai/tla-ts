/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/functionDeclarations/asyncFunctionDeclaration1_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/functionDeclarations/asyncFunctionDeclaration1_es6.ts
---*/
// @target: ES6
// @noEmitHelpers: true
async function foo(): Promise<void> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
