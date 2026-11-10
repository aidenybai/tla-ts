/*---
description: Ported from TypeScript's tests/cases/compiler/parameterReferenceInInitializer2.ts.
outcome: success
source: tests/cases/compiler/parameterReferenceInInitializer2.ts
---*/
// @target: es2015
function Example(x = function(x: any) { return x; }) { // Error: parameter 'x' cannot be 
                                                       // referenced in its initializer
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
