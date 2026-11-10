/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowDestructuringParameters.ts.
outcome: success
source: tests/cases/compiler/controlFlowDestructuringParameters.ts
---*/
// @target: es2015
// Repro for #8376

// @strictNullChecks: true

[{ x: 1 }].map(
  ({ x }) => x
);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
