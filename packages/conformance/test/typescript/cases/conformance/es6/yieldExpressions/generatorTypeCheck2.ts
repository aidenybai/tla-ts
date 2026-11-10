/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck2.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorTypeCheck2.ts
---*/
//@target: ES6
function* g1(): Iterable<string> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
