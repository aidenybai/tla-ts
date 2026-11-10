/*---
description: Ported from TypeScript's tests/cases/compiler/inferredNonidentifierTypesGetQuotes.ts.
outcome: success
source: tests/cases/compiler/inferredNonidentifierTypesGetQuotes.ts
---*/
// @target: es2015
// @declaration: true
var x = [{ "a-b": "string" }, {}];

var y = [{ ["a-b"]: "string" }, {}];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
