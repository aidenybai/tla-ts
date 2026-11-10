/*---
description: Ported from TypeScript's tests/cases/conformance/types/tuple/tupleElementTypes4.ts.
outcome: success
source: tests/cases/conformance/types/tuple/tupleElementTypes4.ts
---*/
// @target: es2015
function f([a, b] = [0, undefined]) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
