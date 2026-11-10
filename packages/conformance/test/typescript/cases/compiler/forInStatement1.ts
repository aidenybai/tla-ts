/*---
description: Ported from TypeScript's tests/cases/compiler/forInStatement1.ts.
outcome: success
source: tests/cases/compiler/forInStatement1.ts
---*/
// @target: es2015
// @strict: false
var expr: any;
for (var a in expr) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
