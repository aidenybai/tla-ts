/*---
description: Ported from TypeScript's tests/cases/compiler/keywordField.ts.
outcome: success
source: tests/cases/compiler/keywordField.ts
---*/
// @target: es2015
var obj:any = {};

obj.if = 1;

var a = { if: "test" }

var n = a.if

var q = a["if"];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
