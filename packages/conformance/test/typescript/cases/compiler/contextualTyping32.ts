/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping32.ts.
outcome: success
source: tests/cases/compiler/contextualTyping32.ts
---*/
// @target: es2015
function foo(param: {():number; (i:number):number; }[]) { }; foo([function(){return 1;}, function(){return 4}]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
