/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping40.ts.
outcome: success
source: tests/cases/compiler/contextualTyping40.ts
---*/
// @target: es2015
var foo = <{():number; (i:number):number; }> function(){return 1;};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
