/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck49.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck49.ts
---*/
//@target: ES6
//@noImplicitAny: true

function* g() {
    yield 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
