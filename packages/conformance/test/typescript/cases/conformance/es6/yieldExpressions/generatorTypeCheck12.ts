/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck12.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck12.ts
---*/
//@target: ES6
function* g(): IterableIterator<number, string> {
    return "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
