/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/Statements/BreakStatements/parser_breakInIterationOrSwitchStatement2.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/Statements/BreakStatements/parser_breakInIterationOrSwitchStatement2.ts
---*/
// @target: es2015
do {
  break;
}
while (true);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
