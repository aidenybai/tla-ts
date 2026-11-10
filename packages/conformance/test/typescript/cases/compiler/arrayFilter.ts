/*---
description: Ported from TypeScript's tests/cases/compiler/arrayFilter.ts.
outcome: success
source: tests/cases/compiler/arrayFilter.ts
---*/
// @target: es2015
var foo = [
    { name: 'bar' },
    { name: null },
    { name: 'baz' }
]

foo.filter(x => x.name); //should accepted all possible types not only boolean!

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
