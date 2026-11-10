/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping35.ts.
outcome: success
source: tests/cases/compiler/contextualTyping35.ts
---*/
// @target: es2015
var foo = <{ id: number;}> {id:4, name: "as"};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
