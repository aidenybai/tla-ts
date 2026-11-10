/*---
description: Ported from TypeScript's tests/cases/compiler/unusedFunctionsinNamespaces3.ts.
outcome: success
source: tests/cases/compiler/unusedFunctionsinNamespaces3.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace Validation {
    var function1 = function(param1:string) {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
