/*---
description: Ported from TypeScript's tests/cases/compiler/commentsOnReturnStatement1.ts.
outcome: success
source: tests/cases/compiler/commentsOnReturnStatement1.ts
---*/
// @target: es2015
// @removeComments: false
class DebugClass {
    public static debugFunc() {
        // Start Debugger Test Code
        var i = 0;

        // End Debugger Test Code
        return true;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
