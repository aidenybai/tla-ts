/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping22.ts.
outcome: success
source: tests/cases/compiler/contextualTyping22.ts
---*/
// @target: es2015
var foo:(a:number)=>number = function(a){return a}; foo = function(b){return b};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
