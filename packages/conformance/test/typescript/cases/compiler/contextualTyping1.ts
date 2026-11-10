/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping1.ts.
outcome: success
source: tests/cases/compiler/contextualTyping1.ts
---*/
// @target: es2015
var foo: {id:number;} = {id:4};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
