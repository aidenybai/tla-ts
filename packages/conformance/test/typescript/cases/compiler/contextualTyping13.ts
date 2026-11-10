/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping13.ts.
outcome: success
source: tests/cases/compiler/contextualTyping13.ts
---*/
// @target: es2015
var foo:(a:number)=>number = function(a){return a};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
