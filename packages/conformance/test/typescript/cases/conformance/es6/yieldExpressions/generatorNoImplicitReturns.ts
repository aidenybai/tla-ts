/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorNoImplicitReturns.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorNoImplicitReturns.ts
---*/
// @target: esnext 
// @noImplicitReturns: true 
// @strictNullChecks: false 
 
function* testGenerator () { 
  if (Math.random() > 0.5) { 
      return; 
  } 
  yield 'hello'; 
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
