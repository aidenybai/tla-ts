/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping18.ts.
outcome: success
source: tests/cases/compiler/contextualTyping18.ts
---*/
// @target: es2015
var foo: {id:number;} = <{id:number;}>({ }); foo = {id: 5};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
