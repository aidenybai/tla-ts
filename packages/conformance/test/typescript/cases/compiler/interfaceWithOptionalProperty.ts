/*---
description: Ported from TypeScript's tests/cases/compiler/interfaceWithOptionalProperty.ts.
outcome: success
source: tests/cases/compiler/interfaceWithOptionalProperty.ts
---*/
// @target: es2015
// @declaration: true

interface I {
    x?: number;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
