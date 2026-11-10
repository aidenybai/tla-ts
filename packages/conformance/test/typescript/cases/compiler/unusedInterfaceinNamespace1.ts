/*---
description: Ported from TypeScript's tests/cases/compiler/unusedInterfaceinNamespace1.ts.
outcome: success
source: tests/cases/compiler/unusedInterfaceinNamespace1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace Validation {
    interface i1 {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
