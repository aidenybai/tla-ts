/*---
description: Ported from TypeScript's tests/cases/compiler/literalIntersectionYieldsLiteral.ts.
outcome: success
source: tests/cases/compiler/literalIntersectionYieldsLiteral.ts
---*/
// @target: es2015
const x: { type: string } & { type: "string" } = { type: "string" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
