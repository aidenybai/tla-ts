/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck48.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck48.ts
---*/
//@target: ES6
//@noImplicitAny: true

function* g() {
    yield;
}

function* h() {
    yield undefined;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
