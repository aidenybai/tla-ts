/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping6.ts.
outcome: success
source: tests/cases/compiler/contextualTyping6.ts
---*/
// @target: es2015
var foo:{id:number;}[] = [{id:1}, {id:2}];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
