/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsInMethod3.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsInMethod3.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    public function1() {
        var x, y;
        y = 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
