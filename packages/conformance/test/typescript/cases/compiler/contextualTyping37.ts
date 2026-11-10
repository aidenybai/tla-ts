/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping37.ts.
outcome: success
source: tests/cases/compiler/contextualTyping37.ts
---*/
// @target: es2015
var foo = <{ id: number; }[]>[{ foo: "s" }, {  }];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
