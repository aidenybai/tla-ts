/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping3.ts.
outcome: success
source: tests/cases/compiler/contextualTyping3.ts
---*/
// @target: es2015
class foo { public bar:{id:number;} = {id:5}; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
