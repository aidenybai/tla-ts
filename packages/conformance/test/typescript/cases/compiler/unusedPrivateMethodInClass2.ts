/*---
description: Ported from TypeScript's tests/cases/compiler/unusedPrivateMethodInClass2.ts.
outcome: success
source: tests/cases/compiler/unusedPrivateMethodInClass2.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    private function1() {
        var y = 10;
    }

    private function2() {
        var y = 10;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
