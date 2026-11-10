/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnIfStatement1.ts.
outcome: success
source: tests/cases/compiler/commentOnIfStatement1.ts
---*/
// @target: es2015
// @removeComments: false

// Test
if (true) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
