/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck42.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck42.ts
---*/
//@target: ES6
function* g() {
    let x = {
        [yield 0]() {

        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
