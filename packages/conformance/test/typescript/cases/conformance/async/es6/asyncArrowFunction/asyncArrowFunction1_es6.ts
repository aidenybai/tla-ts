/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/asyncArrowFunction/asyncArrowFunction1_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/asyncArrowFunction/asyncArrowFunction1_es6.ts
---*/
// @target: ES6
// @noEmitHelpers: true

var foo = async (): Promise<void> => {
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
