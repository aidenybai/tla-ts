/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/parserParenthesizedVariableAndParenthesizedFunctionInTernary.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/parserParenthesizedVariableAndParenthesizedFunctionInTernary.ts
---*/
// @target: es2015
let a: any;
const c = true ? (a) : (function() {});
const d = true ? (a) : ((function() {}));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
