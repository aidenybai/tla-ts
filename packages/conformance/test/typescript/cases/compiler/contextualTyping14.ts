/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping14.ts.
outcome: success
source: tests/cases/compiler/contextualTyping14.ts
---*/
// @target: es2015
class foo { public bar:(a:number)=>number = function(a){return a}; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
