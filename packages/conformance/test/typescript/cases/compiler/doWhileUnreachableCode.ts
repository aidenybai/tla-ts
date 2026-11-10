/*---
description: Ported from TypeScript's tests/cases/compiler/doWhileUnreachableCode.ts.
outcome: success
source: tests/cases/compiler/doWhileUnreachableCode.ts
---*/
// @target: es2015
function test() {
    let foo = 0;
    testLoop: do {
        foo++;
        continue testLoop;
    } while (function() {
        var x = 1;
        return false;
    }());

    return foo;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
