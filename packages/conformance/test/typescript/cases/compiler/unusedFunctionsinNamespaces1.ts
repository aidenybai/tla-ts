/*---
description: Ported from TypeScript's tests/cases/compiler/unusedFunctionsinNamespaces1.ts.
outcome: success
source: tests/cases/compiler/unusedFunctionsinNamespaces1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace Validation {
    function function1() {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
