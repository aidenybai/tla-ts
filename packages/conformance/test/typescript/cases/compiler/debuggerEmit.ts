/*---
description: Ported from TypeScript's tests/cases/compiler/debuggerEmit.ts.
outcome: success
source: tests/cases/compiler/debuggerEmit.ts
---*/
// @target: es2015
var x = function () { debugger; }
x();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
