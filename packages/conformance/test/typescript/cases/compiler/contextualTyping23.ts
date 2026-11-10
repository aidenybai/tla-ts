/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping23.ts.
outcome: success
source: tests/cases/compiler/contextualTyping23.ts
---*/
// @target: es2015
var foo:(a:{():number; (i:number):number; })=>number; foo = function(a){return 5};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
