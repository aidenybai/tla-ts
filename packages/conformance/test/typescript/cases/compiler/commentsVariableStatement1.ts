/*---
description: Ported from TypeScript's tests/cases/compiler/commentsVariableStatement1.ts.
outcome: success
source: tests/cases/compiler/commentsVariableStatement1.ts
---*/
// @target: es2015
// @declaration: true
// @removeComments: false

/** Comment */
var v = 1;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
