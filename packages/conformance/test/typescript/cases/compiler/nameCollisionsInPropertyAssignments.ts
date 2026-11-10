/*---
description: Ported from TypeScript's tests/cases/compiler/nameCollisionsInPropertyAssignments.ts.
outcome: success
source: tests/cases/compiler/nameCollisionsInPropertyAssignments.ts
---*/
// @target: es2015
var x = 1
var y = { x() { x++; } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
