/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping10.ts.
outcome: success
source: tests/cases/compiler/contextualTyping10.ts
---*/
// @target: es2015
class foo { public bar:{id:number;}[] = [{id:1}, {id:2}]; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
