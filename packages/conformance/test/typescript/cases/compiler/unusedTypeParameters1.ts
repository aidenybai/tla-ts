/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameters1.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameters1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter<typeparameter1> {

}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
