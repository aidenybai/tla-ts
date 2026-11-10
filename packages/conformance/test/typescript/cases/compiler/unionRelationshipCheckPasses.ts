/*---
description: Ported from TypeScript's tests/cases/compiler/unionRelationshipCheckPasses.ts.
outcome: success
source: tests/cases/compiler/unionRelationshipCheckPasses.ts
---*/
// @target: es2015
// @strict: true
const item: { foo?: undefined } | { foo: number } = null as any as { foo?: number | undefined };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
