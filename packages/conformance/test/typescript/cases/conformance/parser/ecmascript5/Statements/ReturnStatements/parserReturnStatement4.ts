/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Statements/ReturnStatements/parserReturnStatement4.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Statements/ReturnStatements/parserReturnStatement4.ts
---*/
// @target: es2015
var v = { get foo() { return } };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
