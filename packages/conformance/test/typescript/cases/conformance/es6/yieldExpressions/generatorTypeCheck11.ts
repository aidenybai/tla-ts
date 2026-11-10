/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck11.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck11.ts
---*/
//@target: ES6
function* g(): IterableIterator<number, number> {
    return 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
