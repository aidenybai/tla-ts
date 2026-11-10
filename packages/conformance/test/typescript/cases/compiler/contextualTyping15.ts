/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTyping15.ts.
outcome: success
source: tests/cases/compiler/contextualTyping15.ts
---*/
// @target: es2015
class foo { public bar: { (): number; (i: number): number; } = function() { return 1 }; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
