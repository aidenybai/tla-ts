/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck1.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck1.ts
---*/
//@target: ES6
function* g1(): Iterator<string> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
