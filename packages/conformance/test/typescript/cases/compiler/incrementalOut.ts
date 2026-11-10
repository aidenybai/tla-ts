/*---
description: Ported from TypeScript's tests/cases/compiler/incrementalOut.ts.
outcome: success
source: tests/cases/compiler/incrementalOut.ts
---*/
// @target: es2015
// @incremental: true
// @outFile: output.js

const x = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
