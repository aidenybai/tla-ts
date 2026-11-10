/*---
description: Ported from TypeScript's tests/cases/compiler/reservedWords.ts.
outcome: success
source: tests/cases/compiler/reservedWords.ts
---*/
// @target: es2015
var obj = {
    if: 0,
    debugger: 2,
    break: 3,
    function: 4
}

//This compiles.

var obj2 = {
    if: 0,
    while: 1,
    debugger: 2,
    break: 3,
    function: 4
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
