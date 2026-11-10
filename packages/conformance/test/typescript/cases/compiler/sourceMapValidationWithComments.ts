/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationWithComments.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationWithComments.ts
---*/
// @target: es2015
// @sourcemap: true
class DebugClass {

    public static debugFunc() {

        // Start Debugger Test Code
        var i = 0;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        i++;
        // End Debugger Test Code


        return true;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
