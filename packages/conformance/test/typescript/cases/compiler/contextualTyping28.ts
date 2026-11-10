/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping28.ts.
outcome: success
source: tests/cases/compiler/contextualTyping28.ts
---*/
// @target: es2015
function foo(param:number[]){}; foo([1]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
