/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck33.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck33.ts
---*/
//@target: ES6
function* g() {
    yield 0;
    function* g2() {
        yield "";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
