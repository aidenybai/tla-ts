/*---
description: Ported from TypeScript's tests/cases/compiler/declareIdentifierAsBeginningOfStatementExpression01.ts.
outcome: success
source: tests/cases/compiler/declareIdentifierAsBeginningOfStatementExpression01.ts
---*/
// @target: es2015
class C {
}

var declare: any;

declare instanceof C;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
