/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Statements/BreakStatements/parser_breakTarget4.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Statements/BreakStatements/parser_breakTarget4.ts
---*/
// @target: es2015
// @allowUnusedLabels: true

target1:
target2:
while (true) {
  break target2;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
