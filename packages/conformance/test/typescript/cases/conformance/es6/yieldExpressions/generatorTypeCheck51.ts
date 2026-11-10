/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck51.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck51.ts
---*/
//@target: ES6
//@noImplicitAny: true

function* g() {
    function* h() {
        yield 0;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
