/*---
description: Ported from TypeScript's tests/cases/compiler/stringLiteralPropertyNameWithLineContinuation1.ts.
outcome: success
source: tests/cases/compiler/stringLiteralPropertyNameWithLineContinuation1.ts
---*/
// @target: es2015
var x = {'text\
':'hello'}
x.text = "bar"

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
