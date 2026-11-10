/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/parserParenthesizedVariableAndFunctionInTernary.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/parserParenthesizedVariableAndFunctionInTernary.ts
---*/
// @target: es2015
let a: any;
const c = true ? (a) : function() {};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
