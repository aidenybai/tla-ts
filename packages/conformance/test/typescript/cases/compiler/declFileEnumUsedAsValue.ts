/*---
description: Ported from TypeScript's tests/cases/compiler/declFileEnumUsedAsValue.ts.
outcome: success
source: tests/cases/compiler/declFileEnumUsedAsValue.ts
---*/
// @target: es2015
// @declaration: true

enum e {
    a,
    b,
    c
}
var x = e;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
