/*---
description: Ported from TypeScript's tests/cases/compiler/overloadOnConstAsTypeAnnotation.ts.
outcome: success
source: tests/cases/compiler/overloadOnConstAsTypeAnnotation.ts
---*/
// @target: es2015
// @allowUnreachableCode: true

var f: (x: 'hi') => number = (x: 'hi') => { return 1; };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
