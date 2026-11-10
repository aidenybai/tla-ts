/*---
description: Ported from TypeScript's tests/cases/conformance/async/es2017/asyncArrowFunction/asyncArrowFunction1_es2017.ts.
outcome: success
source: tests/cases/conformance/async/es2017/asyncArrowFunction/asyncArrowFunction1_es2017.ts
---*/
// @target: es2017
// @noEmitHelpers: true

var foo = async (): Promise<void> => {
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
