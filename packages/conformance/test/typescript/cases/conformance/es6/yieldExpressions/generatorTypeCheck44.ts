/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck44.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck44.ts
---*/
//@target: ES6
function* g() {
    let x = {
        get [yield 0]() {
            return 0;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
