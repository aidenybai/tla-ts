/*---
description: Ported from TypeScript's tests/cases/compiler/indexer3.ts.
outcome: success
source: tests/cases/compiler/indexer3.ts
---*/
// @target: es2015
var dateMap: { [x: string]: Date; } = {}
var r: Date = dateMap["hello"] // result type includes indexer using BCT

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
