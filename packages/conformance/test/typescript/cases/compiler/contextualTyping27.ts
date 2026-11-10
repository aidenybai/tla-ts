/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping27.ts.
outcome: success
source: tests/cases/compiler/contextualTyping27.ts
---*/
// @target: es2015
function foo(param:{id:number;}){}; foo(<{id:number;}>({}));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
