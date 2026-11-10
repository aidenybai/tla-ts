/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping29.ts.
outcome: success
source: tests/cases/compiler/contextualTyping29.ts
---*/
// @target: es2015
function foo(param:number[]){}; foo([1, 3]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
