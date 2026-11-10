/*---
description: Ported from TypeScript's tests/cases/compiler/nestedObjectRest.ts.
outcome: success
source: tests/cases/compiler/nestedObjectRest.ts
---*/
// @target: es2017

// https://github.com/microsoft/TypeScript/issues/43400
var x, y;

[{ ...x }] = [{ abc: 1 }];
for ([{ ...y }] of [[{ abc: 1 }]]) ;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
