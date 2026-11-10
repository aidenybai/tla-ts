/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck10.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck10.ts
---*/
//@target: ES6
function* g(): IterableIterator<any> {
    return;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
