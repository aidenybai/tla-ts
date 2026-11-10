/*---
description: Ported from TypeScript's tests/cases/compiler/functionCall1.ts.
outcome: success
source: tests/cases/compiler/functionCall1.ts
---*/
// @target: es2015
function foo():any{return ""};
var x = foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
