/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping8.ts.
outcome: success
source: tests/cases/compiler/contextualTyping8.ts
---*/
// @target: es2015
var foo:{id:number;}[] = [<{id:number;}>({})];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
