/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck14.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck14.ts
---*/
//@target: ES6
function* g() {
    yield 0;
    return "";
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
