/*---
description: Ported from TypeScript's tests/cases/compiler/voidConstructor.ts.
outcome: success
source: tests/cases/compiler/voidConstructor.ts
---*/
// @target: es2015
var foo:{ new ( ): void; }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
