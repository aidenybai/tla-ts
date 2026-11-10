/*---
description: Ported from TypeScript's tests/cases/compiler/unknownPropertiesAreAssignableToObjectUnion.ts.
outcome: success
source: tests/cases/compiler/unknownPropertiesAreAssignableToObjectUnion.ts
---*/
// @target: es2015
// @strictNullChecks: true
const x: Object | string = { x: 0 };
const y: Object | undefined = { x: 0 };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
