/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping36.ts.
outcome: success
source: tests/cases/compiler/contextualTyping36.ts
---*/
// @target: es2015
var foo = <{ id: number; }[]>[{ id: 4 }, <{ id: number; }>({  })];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
