/*---
description: Ported from TypeScript's tests/cases/compiler/unusedClassesinModule1.ts.
outcome: success
source: tests/cases/compiler/unusedClassesinModule1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

namespace A {
    class Calculator {
        public handelChar() {
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
