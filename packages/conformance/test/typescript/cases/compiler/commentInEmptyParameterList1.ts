/*---
description: Ported from TypeScript's tests/cases/compiler/commentInEmptyParameterList1.ts.
outcome: success
source: tests/cases/compiler/commentInEmptyParameterList1.ts
---*/
// @target: es2015
// @removeComments: false
function foo(/** nothing */) {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
