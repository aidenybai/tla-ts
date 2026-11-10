/*---
description: Ported from TypeScript's tests/cases/compiler/unusedPrivateMethodInClass4.ts.
outcome: success
source: tests/cases/compiler/unusedPrivateMethodInClass4.ts
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

    public function3() {
        var y = 10;
        this.function2();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
