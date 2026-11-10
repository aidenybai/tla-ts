/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsInMethod1.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsInMethod1.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    public function1() {
        var x = 10;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
