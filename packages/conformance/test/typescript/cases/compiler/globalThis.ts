/*---
description: Ported from TypeScript's tests/cases/compiler/globalThis.ts.
outcome: success
source: tests/cases/compiler/globalThis.ts
---*/
// @target: es2015
var __e = Math.E;  // should not generate 'this.Math.E'

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
