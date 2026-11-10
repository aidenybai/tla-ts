/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck13.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck13.ts
---*/
//@target: ES6
function* g(): IterableIterator<number, string> {
    yield 0;
    return "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
