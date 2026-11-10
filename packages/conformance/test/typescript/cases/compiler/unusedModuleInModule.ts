/*---
description: Ported from TypeScript's tests/cases/compiler/unusedModuleInModule.ts.
outcome: success
source: tests/cases/compiler/unusedModuleInModule.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace A {
    namespace B {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
