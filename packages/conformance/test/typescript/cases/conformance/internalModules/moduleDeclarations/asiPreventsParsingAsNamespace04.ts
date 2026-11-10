/*---
description: Ported from TypeScript's tests/cases/conformance/internalModules/moduleDeclarations/asiPreventsParsingAsNamespace04.ts.
outcome: success
source: tests/cases/conformance/internalModules/moduleDeclarations/asiPreventsParsingAsNamespace04.ts
---*/
// @target: es2015

let module = 10;
module in {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
