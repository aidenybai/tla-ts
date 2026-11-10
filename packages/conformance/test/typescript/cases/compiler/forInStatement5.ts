/*---
description: Ported from TypeScript's tests/cases/compiler/forInStatement5.ts.
outcome: success
source: tests/cases/compiler/forInStatement5.ts
---*/
// @target: es2015
// @strict: false
var a: string;
var expr: any;
for (a in expr) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
