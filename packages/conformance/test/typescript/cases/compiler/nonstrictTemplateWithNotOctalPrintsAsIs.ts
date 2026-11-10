/*---
description: Ported from TypeScript's tests/cases/compiler/nonstrictTemplateWithNotOctalPrintsAsIs.ts.
outcome: success
source: tests/cases/compiler/nonstrictTemplateWithNotOctalPrintsAsIs.ts
---*/
// @target: es2015
// https://github.com/Microsoft/TypeScript/issues/21828
const d2 = `\\0041`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
