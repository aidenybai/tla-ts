/*---
description: Ported from TypeScript's tests/cases/compiler/ifStatementInternalComments.ts.
outcome: success
source: tests/cases/compiler/ifStatementInternalComments.ts
---*/
// @target: es2015
/*1*/ if /*2*/ ( /*3*/ true /*4*/ ) /*5*/ {}

/*1*/ if /*2*/ ( /*3*/ true /*4*/ ) /*5*/ {} /*6*/ else /*7*/  {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
