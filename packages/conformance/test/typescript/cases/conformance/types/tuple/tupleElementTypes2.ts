/*---
description: Ported from TypeScript's tests/cases/conformance/types/tuple/tupleElementTypes2.ts.
outcome: success
source: tests/cases/conformance/types/tuple/tupleElementTypes2.ts
---*/
// @target: es2015
function f([a, b]: [number, any]) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
