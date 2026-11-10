/*---
description: Ported from TypeScript's tests/cases/conformance/async/es5/asyncArrowFunction/asyncArrowFunction1_es5.ts.
outcome: success
source: tests/cases/conformance/async/es5/asyncArrowFunction/asyncArrowFunction1_es5.ts
---*/
// @target: ES5, ES2015
// @lib: es5,es2015.promise
// @noEmitHelpers: true

var foo = async (): Promise<void> => {
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
