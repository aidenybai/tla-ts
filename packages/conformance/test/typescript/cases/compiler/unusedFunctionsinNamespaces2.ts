/*---
description: Ported from TypeScript's tests/cases/compiler/unusedFunctionsinNamespaces2.ts.
outcome: success
source: tests/cases/compiler/unusedFunctionsinNamespaces2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace Validation {
    var function1 = function() {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
